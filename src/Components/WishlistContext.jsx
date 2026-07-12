// WishlistContext.jsx
// Shared "saved items" store used by every section (rentals, tickets,
// services, ...) so a heart tapped on any card shows up in one place:
// WishlistPage, opened from the navbar heart.
//
// Lives in src/Components/, alongside Navbar.jsx, WishlistPage.jsx,
// BuyTicketPage.jsx, RentVehiclePage.jsx, PadosiListings.jsx, etc.
// Three files import from it:
//   - Components/Navbar.jsx       → import { useWishlist } from "./WishlistContext";
//   - Components/WishlistPage.jsx → import { useWishlist } from "./WishlistContext";
//   - src/Padosi.jsx (root App)   → import { useWishlist, WishlistProvider } from "./Components/WishlistContext";
// If you move this file, update those import paths to match its new location.
//
// ── Guest vs. account ───────────────────────────────────────────────────
// Two modes, decided entirely by the `currentUser` prop Padosi.jsx already
// tracks (via /api/me + login/signup/logout):
//
//   • Guest (currentUser is null) → wishlist lives in localStorage only,
//     in this browser, exactly as before. Nothing is sent to the server.
//   • Logged in (currentUser set) → wishlist lives in the account, via
//     /api/wishlist (see routes/wishlistRoutes.js). Every request there is
//     scoped to req.user.id server-side, so one account can never see or
//     touch another account's saved items — that guarantee is enforced on
//     the server, not here, so it holds no matter what this file does.
//
// The moment a guest logs in, whatever they saved as a guest is merged into
// their account (one POST per item — the backend's ON CONFLICT upsert makes
// this safe to run more than once) and local guest storage is cleared. So:
//   - guest items survive login and show up in the account's wishlist
//   - once merged, they belong to that account, not to "this browser"
//   - logging out afterward starts a clean, empty guest wishlist again —
//     the previous account's items never leak into the next guest session
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { api } from "../utils"; // adjust if WishlistContext.jsx isn't in src/Components/

const STORAGE_KEY = "padosi-wishlist"; // unchanged, so existing guest data isn't lost
const WishlistContext = createContext(null);

// A saved entry looks like:
// {
//   type:      "vehicle" | "ticket" | "service" | "ride",
//   id:        the listing's own id (string or number),
//   title:     main line,
//   subtitle:  secondary line (category / short description),
//   meta:      array of small info strings, e.g. ["📍 Sector 14", "3d ago"],
//   price:     number or null,
//   priceUnit: e.g. "/day", "/ticket", "",
//   image:     thumbnail url or null,
//   icon:      emoji fallback when there's no image,
//   badge:     small pill text, e.g. "Demo", "Hot",
//   isDemo:    bool — demo listings never hit the real API on the wishlist card,
//   raw:       the original listing object, for type-specific CTA behaviour,
//   savedAt:   Date.now() when it was added (or the server's saved_at once logged in),
// }
// `type` + `id` together are the unique key, so a ticket "12" and a vehicle
// "12" never collide.

function keyOf(type, id) {
  return `${type}:${String(id)}`;
}

function loadGuestItems() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveGuestItems(items) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage can fail (private browsing, quota, etc.) — the guest wishlist
    // just won't persist across reloads in that case, nothing else breaks.
  }
}

function clearGuestItems() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function upsert(list, entry) {
  const k = keyOf(entry.type, entry.id);
  const next = list.filter((it) => keyOf(it.type, it.id) !== k);
  next.unshift(entry);
  return next;
}

export function WishlistProvider({ children, currentUser, showToast }) {
  const [items, setItems] = useState(loadGuestItems);
  const [loading, setLoading] = useState(false);
  const prevUserId = useRef(undefined); // undefined = "haven't checked yet"

  const fetchAccountItems = useCallback(async () => {
    setLoading(true);
    try {
      const { items: serverItems } = await api("GET", "/api/wishlist");
      setItems(serverItems || []);
    } catch (err) {
      showToast?.(`⚠️ ${err.message || "Could not load your wishlist."}`);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Push every guest-saved item into the account, then wipe local guest
  // storage so it can't resurface in a later guest session on this browser.
  const mergeGuestIntoAccount = useCallback(async () => {
    const guestItems = loadGuestItems();
    if (guestItems.length === 0) return;
    await Promise.all(
      guestItems.map((entry) =>
        api("POST", "/api/wishlist", entry).catch((err) => {
          // One bad item shouldn't block the rest of the merge.
          console.error("Wishlist merge failed for", entry.type, entry.id, err);
        })
      )
    );
    clearGuestItems();
  }, []);

  useEffect(() => {
    const userId = currentUser?.id ?? null;
    const prev = prevUserId.current;

    if (userId != null) {
      if (prev == null) {
        // Was guest (or this is the very first check) → now logged in.
        (async () => {
          await mergeGuestIntoAccount();
          await fetchAccountItems();
        })();
      } else if (prev !== userId) {
        // Switched to a different account without a full page reload.
        fetchAccountItems();
      }
    } else if (prev != null) {
      // Was logged in, now logged out — back to (empty) guest storage.
      setItems(loadGuestItems());
    }
    // else: still anonymous, nothing to do — initial useState already covers it.

    prevUserId.current = userId;
  }, [currentUser?.id, mergeGuestIntoAccount, fetchAccountItems]);

  const removeWishlist = useCallback(
    async (type, id) => {
      const k = keyOf(type, id);
      let removedEntry = null;
      setItems((prev) => {
        removedEntry = prev.find((it) => keyOf(it.type, it.id) === k) || null;
        const next = prev.filter((it) => keyOf(it.type, it.id) !== k);
        if (!currentUser) saveGuestItems(next);
        return next;
      });

      if (currentUser) {
        try {
          await api("DELETE", `/api/wishlist/${type}/${id}`);
        } catch (err) {
          if (removedEntry) setItems((prev) => upsert(prev, removedEntry));
          showToast?.(`⚠️ ${err.message || "Could not remove item."}`);
        }
      }
    },
    [currentUser, showToast]
  );

  const addEntry = useCallback(
    async (entry) => {
      const withMeta = { ...entry, savedAt: Date.now() };
      setItems((prev) => upsert(prev, withMeta));

      if (currentUser) {
        try {
          const { item } = await api("POST", "/api/wishlist", entry);
          setItems((prev) => upsert(prev, item));
        } catch (err) {
          setItems((prev) => prev.filter((it) => keyOf(it.type, it.id) !== keyOf(entry.type, entry.id)));
          showToast?.(`⚠️ ${err.message || "Could not save item."}`);
        }
      } else {
        setItems((prev) => {
          saveGuestItems(prev);
          return prev;
        });
      }
    },
    [currentUser, showToast]
  );

  const isWishlisted = useCallback(
    (type, id) => items.some((it) => it.type === type && String(it.id) === String(id)),
    [items]
  );

  const toggleWishlist = useCallback(
    (entry) => {
      const already = items.some((it) => it.type === entry.type && String(it.id) === String(entry.id));
      return already ? removeWishlist(entry.type, entry.id) : addEntry(entry);
    },
    [items, removeWishlist, addEntry]
  );

  return (
    <WishlistContext.Provider value={{ items, loading, isWishlisted, toggleWishlist, removeWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}