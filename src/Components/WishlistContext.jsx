// WishlistContext.jsx
// Shared "saved items" store used by every section (rentals, tickets,
// services, ...) so a heart tapped on any card shows up in one place:
// WishlistPage, opened from the navbar heart.
//
// Lives in src/Components/, alongside Navbar.jsx, WishlistPage.jsx,
// BuyTicketPage.jsx, RentVehiclePage.jsx, PadosiListings.jsx, etc.
// Two files import from it:
//   - Components/Navbar.jsx     → import { useWishlist } from "./WishlistContext";
//   - Components/WishlistPage.jsx → import { useWishlist } from "./WishlistContext";
//   - src/Padosi.jsx (root App)  → import { useWishlist, WishlistProvider } from "./Components/WishlistContext";
// If you move this file, update those import paths to match its new location.
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "padosi-wishlist";
const WishlistContext = createContext(null);

function loadInitial() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// A saved entry looks like:
// {
//   type:      "vehicle" | "ticket" | "service",
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
//   savedAt:   Date.now() when it was added,
// }
// `type` + `id` together are the unique key, so a ticket "12" and a vehicle
// "12" never collide.
export function WishlistProvider({ children }) {
  const [items, setItems] = useState(loadInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage can fail (private browsing, quota, etc.) — the wishlist just
      // won't persist across reloads in that case, nothing else breaks.
    }
  }, [items]);

  const isWishlisted = useCallback(
    (type, id) => items.some((it) => it.type === type && String(it.id) === String(id)),
    [items]
  );

  const toggleWishlist = useCallback((entry) => {
    setItems((prev) => {
      const exists = prev.some((it) => it.type === entry.type && String(it.id) === String(entry.id));
      if (exists) {
        return prev.filter((it) => !(it.type === entry.type && String(it.id) === String(entry.id)));
      }
      return [{ ...entry, savedAt: Date.now() }, ...prev];
    });
  }, []);

  const removeWishlist = useCallback((type, id) => {
    setItems((prev) => prev.filter((it) => !(it.type === type && String(it.id) === String(id))));
  }, []);

  return (
    <WishlistContext.Provider value={{ items, isWishlisted, toggleWishlist, removeWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}