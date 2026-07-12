import { useState, useEffect, useCallback, useMemo } from "react";
import RidePostFormPage from "./RidePostFormPage";
import { useWishlist } from "./WishlistContext";

// Base URL for API calls — Vite exposes VITE_API_URL from .env
const API_BASE = import.meta.env.VITE_API_URL || "";

function initials(name = "") {
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// Simple line-style heart, filled + tinted when a route is saved. Same shape
// as the heart used on ServiceListingsAllPage/WishlistPage, for a consistent
// icon app-wide.
function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
      <path d="M12 21s-6.7-4.3-9.3-8.2C1 10 1.6 6.7 4.4 5.2 6.6 4 9.2 4.7 12 7.5 14.8 4.7 17.4 4 19.6 5.2c2.8 1.5 3.4 4.8 1.7 7.6C18.7 16.7 12 21 12 21z" />
    </svg>
  );
}

// ── Temporary showcase routes ────────────────────────────────────────────────
// Hardcoded example cards so the grid never looks empty while real routes are
// still trickling in. Same pattern as ServiceListingsAllPage's DEMO_LISTINGS:
// negative sentinel `id`s (-1, -2, ...) so they can never collide with a real
// route id from the server, `poster_id: "__demo__"` so they never match
// currentUser.id (even when logged out and currentUser.id is undefined),
// and `isDemo: true` purely for the "Sample" badge.
//
// They behave exactly like a real "someone else posted this" card: no
// isOwner match, so they fall into the normal Accept/Decline footer, and
// accepting one reveals poster contact info exactly like a real accepted
// route — except the accept/decline never reaches the server, since
// handleAccept/handleDecline short-circuit on negative ids below.
//
// To remove this showcase content later: delete this array, the demoAccepted/
// demoDeclined state, and the `demo` half of the `visibleRoutes` useMemo.
const DEMO_ROUTES = [
  {
    id: -1,
    isDemo: true,
    poster_id: "__demo__",
    poster_name: "Demo Rider",
    from_place: "Vaishali Nagar",
    to_place: "MI Road",
    freq: "5",
    depart_time: "08:30",
    seats: 3,
    price: 40,
    description: "Sample ride — post your own route to replace this.",
    poster_contact: { name: "Demo Rider", email: "demo1@example.com", phone: "+91 90000 00003" },
  },
  {
    id: -2,
    isDemo: true,
    poster_id: "__demo__",
    poster_name: "Demo Rider Two",
    from_place: "Malviya Nagar",
    to_place: "Sindhi Camp",
    freq: "7",
    depart_time: "18:00",
    seats: 2,
    price: 0,
    description: "Another sample route so you can see how ride cards look.",
    poster_contact: { name: "Demo Rider Two", email: "demo2@example.com", phone: "+91 90000 00004" },
  },
];

// ─── Ride Share Page ──────
// Opens when the window event "padosi:openRide" is dispatched.
// Props:
//   currentUser  — { id, ... } object from your auth state (or null)
//   showToast    — (msg: string) => void
//   dark         — boolean
export default function RideSharePage({ currentUser, showToast, dark }) {
  const [open, setOpen]           = useState(false);
  const [formOpen, setFormOpen]   = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [routes, setRoutes]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");

  // Shared wishlist store — same context every other listing page reads
  // from, so a heart tapped here shows up on WishlistPage instantly.
  const { isWishlisted, toggleWishlist } = useWishlist();

  // Locally-scoped, "this account only" state for demo cards — mirrors
  // ServiceListingsAllPage's declinedIndexes/acceptedIndexes. Declining a
  // demo card hides it just for this viewer; accepting one flips its footer
  // to show the (fake) poster contact info. Neither ever calls the API.
  const [demoDeclined, setDemoDeclined] = useState(() => new Set());
  const [demoAccepted, setDemoAccepted] = useState(() => new Set());

  // ── Open / close ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("padosi:openRide", handler);
    return () => window.removeEventListener("padosi:openRide", handler);
  }, []);

  // ── Fetch all routes from the API ───────────────────────────────────────────
  const fetchRoutes = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ride-routes`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load routes");
      const data = await res.json();
      setRoutes(data.routes || []);
    } catch (err) {
      console.error(err);
      showToast("⚠️ Could not load routes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentUser, showToast]);

  // Fetch whenever the page opens
  useEffect(() => {
    if (open) fetchRoutes();
  }, [open, fetchRoutes]);

  // If any routes come back with my_response='accepted' but no contact info yet,
  // re-fetch the contact so the panel shows correctly on reload. Demo routes
  // never enter `routes`, so they're untouched by this effect.
  useEffect(() => {
    routes.forEach(r => {
      if (r.my_response === "accepted" && !r.poster_contact) {
        fetch(`${API_BASE}/api/ride-routes/${r.id}/accept`, {
          method: "POST",
          credentials: "include",
        })
          .then(res => res.json())
          .then(data => {
            if (data.poster) {
              setRoutes(prev => prev.map(x =>
                x.id === r.id ? { ...x, poster_contact: data.poster } : x
              ));
            }
          })
          .catch(() => {});
      }
    });
  }, [routes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const openForm = (route = null) => {
    setEditingRoute(route);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingRoute(null);
  };

  const handleFormSaved = (route, isEdit) => {
    if (isEdit) {
      setRoutes(prev => prev.map(r => (r.id === route.id ? route : r)));
    } else {
      setRoutes(prev => [route, ...prev]);
    }
  };

  // ── Accept ──────────────────────────────────────────────────────────────────
  const handleAccept = async (routeId) => {
    // Demo card — flip local state only, never touch the API.
    if (routeId < 0) {
      setDemoAccepted(prev => new Set(prev).add(routeId));
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/ride-routes/${routeId}/accept`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { showToast(`⚠️ ${data.error}`); return; }
      setRoutes(prev => prev.map(r =>
        r.id === routeId
          ? { ...r, my_response: "accepted", poster_contact: data.poster }
          : r
      ));
    } catch (err) {
      console.error(err);
      showToast("⚠️ Network error. Please try again.");
    }
  };

  // ── Decline ─────────────────────────────────────────────────────────────────
  const handleDecline = async (routeId) => {
    // Demo card — hide locally only, never touch the API.
    if (routeId < 0) {
      setDemoDeclined(prev => new Set(prev).add(routeId));
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/ride-routes/${routeId}/decline`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) { const d = await res.json(); showToast(`⚠️ ${d.error}`); return; }
      setRoutes(prev => prev.filter(r => r.id !== routeId));
    } catch (err) {
      console.error(err);
      showToast("⚠️ Network error. Please try again.");
    }
  };

  // ── Hide an accepted route from this user's screen (local only) ─────────────
  const handleHideAccepted = (routeId) => {
    if (routeId < 0) {
      setDemoDeclined(prev => new Set(prev).add(routeId));
      return;
    }
    setRoutes(prev => prev.filter(r => r.id !== routeId));
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (routeId) => {
    if (routeId < 0) return; // demo card — nothing to delete
    try {
      const res = await fetch(`${API_BASE}/api/ride-routes/${routeId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(`⚠️ ${data.error || "Could not remove route."}`);
        return;
      }
      setRoutes(prev => prev.filter(r => r.id !== routeId));
      showToast("🗑️ Route removed");
    } catch (err) {
      console.error(err);
      showToast("⚠️ Network error. Please try again.");
    }
  };

  // ── Merge real + demo routes ─────────────────────────────────────────────────
  const visibleRoutes = useMemo(() => {
    const demo = DEMO_ROUTES
      .filter(d => !demoDeclined.has(d.id))
      .map(d => ({
        ...d,
        my_response: demoAccepted.has(d.id) ? "accepted" : undefined,
      }));
    // Demo cards pinned to the end so they never crowd out real routes.
    return [...routes, ...demo];
  }, [routes, demoDeclined, demoAccepted]);

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filtered = visibleRoutes.filter(r => {
    const q = search.toLowerCase();
    return !q
      || r.from_place.toLowerCase().includes(q)
      || r.to_place.toLowerCase().includes(q)
      || r.description.toLowerCase().includes(q);
  });

  // Builds the shared wishlist-entry shape (see WishlistContext.jsx's header
  // comment for the full field list) from a ride route. Real routes already
  // carry a stable `.id` from the API; demo routes use their negative
  // sentinel ids (-1, -2), so both key correctly without ever colliding.
  const buildWishlistEntry = (r) => ({
    type: "ride",
    id: r.id,
    title: `${r.from_place} → ${r.to_place}`,
    subtitle: r.poster_name ? `Posted by ${r.poster_name}` : undefined,
    meta: [
      `📅 ${r.freq === "7" ? "Daily" : `${r.freq}× a week`}`,
      `🕐 ${r.depart_time || "—"}`,
      `👥 ${r.seats} seat${r.seats > 1 ? "s" : ""}`,
    ],
    price: r.price > 0 ? r.price : null,
    priceUnit: "/seat",
    image: null,
    icon: "🛣️",
    badge: r.isDemo ? "Demo" : undefined,
    isDemo: !!r.isDemo,
    raw: r,
  });

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[5000] flex flex-col overflow-hidden ${dark ? "bg-black" : "bg-[#f6f7fb]"}`}>

      {/* ── Header — matches RentVehiclePage's real header exactly:
          h-[80px], shrink-0, sticky top-0, z-10, text-xl font-black title. ── */}
      <div className={`h-[80px] shrink-0 flex items-center justify-between px-6 sticky top-0 z-10 border-b ${
        dark ? "bg-black border-white" : "bg-white border-[#eee]"
      }`}>
        <button
          onClick={() => setOpen(false)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
            dark
              ? "bg-black border-white text-white hover:bg-white hover:text-black"
              : "bg-white border-[#ddd] text-[#333] hover:border-[#ff2d55] hover:text-[#ff2d55]"
          }`}
        >
          ← Back
        </button>
        <p className={`text-xl font-black ${dark ? "text-white" : "text-[#111]"}`}>
          Padosi{" "}
          <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>
            Ride Share
          </span>
        </p>
        <button
          onClick={() => {
            if (!currentUser) { showToast("👋 Please log in to post a route."); return; }
            openForm(null);
          }}
          className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold cursor-pointer border transition-all hover:-translate-y-0.5 ${
            dark
              ? "bg-white text-black border-white hover:shadow-[0_8px_24px_rgba(255,255,255,0.2)]"
              : "bg-[#ff2d55] text-white border-[#ff2d55] hover:shadow-[0_8px_24px_rgba(255,45,85,0.25)]"
          }`}
        >
          + Post a Route
        </button>
      </div>

      {/* ── Search ── */}
      <div className="px-6 py-4 max-w-[600px] mx-auto w-full">
        <div className="relative">
          <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm ${dark ? "text-white/40" : "text-[#bbb]"}`}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search routes, e.g. Vaishali to MI Road…"
            className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm focus:outline-none transition-colors ${
              dark
                ? "bg-black border-white text-white placeholder-white/40 focus:ring-1 focus:ring-white"
                : "bg-white border-[#ddd] text-[#111] placeholder-[#aaa] focus:border-[#ff2d55] shadow-sm"
            }`}
          />
        </div>
      </div>

      {/* ── Route Cards ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-10">
        {loading && (
          <div className="flex justify-center items-center py-20">
            <span className={`text-sm animate-pulse ${dark ? "text-white/40" : "text-[#bbb]"}`}>
              Loading routes…
            </span>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1200px] mx-auto">
            {filtered.length === 0 ? (
              <div className="col-span-3 text-center py-16 flex flex-col items-center gap-3">
                <span className="text-5xl">🛣️</span>
                <strong className={`text-base ${dark ? "text-white/40" : "text-[#bbb]"}`}>
                  {search ? "No routes match your search." : "No routes posted yet."}
                </strong>
                <span className={`text-sm ${dark ? "text-white/30" : "text-[#ccc]"}`}>
                  {search ? "Try a different keyword." : "Be the first — post your route!"}
                </span>
              </div>
            ) : filtered.map(r => {
              const isOwner   = r.poster_id === currentUser?.id;
              const freqLabel = r.freq === "7" ? "Daily" : `${r.freq}× a week`;
              const saved     = isWishlisted("ride", r.id);

              return (
                <div
                  key={r.id}
                  className={`relative rounded-2xl border p-5 flex flex-col gap-3.5 hover:-translate-y-1 transition-all ${
                    dark
                      ? "bg-black border-white shadow-[0_6px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(255,255,255,0.1)]"
                      : "bg-white border-[#eee] shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
                  }`}
                >
                  {/* Top-right controls: wishlist heart, plus the
                      "remove from view" close button (accepted routes only) */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                    <button
                      onClick={() => toggleWishlist(buildWishlistEntry(r))}
                      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
                      aria-pressed={saved}
                      title={saved ? "Remove from wishlist" : "Save to wishlist"}
                      className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border transition-all active:scale-90 ${
                        saved
                          ? "bg-[#ff2d55] border-[#ff2d55] text-white"
                          : dark
                            ? "bg-black/60 border-white/30 text-white/60 hover:text-[#ff2d55] hover:border-[#ff2d55]/50"
                            : "bg-white/90 border-[#eee] text-[#ccc] hover:text-[#ff2d55] hover:border-[#ff2d55]/40 shadow-sm"
                      }`}
                    >
                      <HeartIcon filled={saved} />
                    </button>

                    {!isOwner && r.my_response === "accepted" && (
                      <button
                        onClick={() => handleHideAccepted(r.id)}
                        aria-label="Remove this route from your view"
                        title="Remove from view"
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-colors ${
                          dark
                            ? "text-white/50 hover:text-white hover:bg-white/10"
                            : "text-[#bbb] hover:text-[#777] hover:bg-[#f0f0f0]"
                        }`}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Route from → to */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${dark ? "bg-white" : "bg-[#ff2d55]"}`} />
                      <span className={`w-0.5 h-5 ${dark ? "bg-white/30" : "bg-[#eee]"}`} />
                      <span className={`w-2.5 h-2.5 rounded-full border-2 ${dark ? "border-white" : "border-[#ff2d55]"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${dark ? "text-white" : "text-[#111]"}`}>{r.from_place}</p>
                      <p className={`text-xs mt-2 truncate ${dark ? "text-white/50" : "text-[#999]"}`}>{r.to_place}</p>
                    </div>
                    {isOwner && (
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 border ${
                        dark
                          ? "border-white text-white"
                          : "border-[#ff2d55] text-[#ff2d55] bg-[#fff0f3]"
                      }`}>
                        Your route
                      </span>
                    )}
                    {r.isDemo && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 border border-purple-300 text-purple-600 bg-purple-50">
                        Sample
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { icon: "📅", text: freqLabel },
                      { icon: "🕐", text: r.depart_time || "—" },
                      { icon: "👥", text: `${r.seats} seat${r.seats > 1 ? "s" : ""}` },
                    ].map(({ icon, text }) => (
                      <span
                        key={text}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border ${
                          dark
                            ? "border-white/40 text-white/70"
                            : "border-[#eee] text-[#888] bg-[#f6f7fb]"
                        }`}
                      >
                        {icon} {text}
                      </span>
                    ))}
                  </div>

                  {r.description && (
                    <p className={`text-xs line-clamp-2 leading-relaxed ${dark ? "text-white/50" : "text-[#999]"}`}>
                      {r.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div className={`pt-3 border-t ${dark ? "border-white/20" : "border-[#eee]"}`}>

                    {/* Poster row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-full border text-xs font-bold flex items-center justify-center ${
                          dark ? "border-white text-white" : "border-[#ddd] text-[#555] bg-[#f6f7fb]"
                        }`}>
                          {initials(r.poster_name || "")}
                        </span>
                        <span className={`text-xs font-semibold ${dark ? "text-white/70" : "text-[#777]"}`}>
                          {r.poster_name}
                        </span>
                      </div>
                      <span className={`text-sm font-black ${dark ? "text-white" : "text-[#111]"}`}>
                        {r.price > 0 ? `₹${r.price}` : "Free"}
                        <span className={`text-xs font-normal ${dark ? "text-white/40" : "text-[#bbb]"}`}>/seat</span>
                      </span>
                    </div>

                    {/* Actions */}
                    {isOwner ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openForm(r)}
                          className={`flex-1 text-xs py-2 rounded-xl font-bold cursor-pointer border transition-colors ${
                            dark
                              ? "border-white text-white bg-black hover:bg-white hover:text-black"
                              : "border-[#ddd] text-[#555] bg-white hover:border-[#ff2d55] hover:text-[#ff2d55]"
                          }`}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className={`flex-1 text-xs py-2 rounded-xl font-bold cursor-pointer border transition-colors ${
                            dark
                              ? "border-white/40 text-white/50 bg-black hover:border-white hover:text-white"
                              : "border-[#eee] text-[#bbb] bg-white hover:border-[#ddd] hover:text-[#999]"
                          }`}
                        >
                          🗑️ Remove
                        </button>
                      </div>

                    ) : r.my_response === "accepted" ? (
                      <div className={`rounded-xl p-3 border flex flex-col gap-2 ${
                        dark ? "bg-white/5 border-white/20" : "bg-[#f0fff4] border-[#b2f5c8]"
                      }`}>
                        <p className={`text-xs font-bold ${dark ? "text-white/60" : "text-[#27ae60]"}`}>
                          ✅ Accepted — contact the poster
                        </p>
                        <a
                          href={`mailto:${r.poster_contact?.email || ""}?subject=Ride Share — ${r.from_place} to ${r.to_place}`}
                          className={`inline-flex items-center justify-center gap-2 text-xs font-bold py-2 px-3 rounded-lg border transition-colors ${
                            dark
                              ? "border-white text-white hover:bg-white hover:text-black"
                              : "border-[#ddd] text-[#555] bg-white hover:border-[#ff2d55] hover:text-[#ff2d55]"
                          }`}
                        >
                          ✉️ Email {r.poster_contact?.name?.split(" ")[0] || "poster"}
                        </a>
                        {r.poster_contact?.phone && (
                          <a
                            href={`tel:${r.poster_contact.phone}`}
                            className={`inline-flex items-center justify-center gap-2 text-xs font-bold py-2 px-3 rounded-lg border transition-colors ${
                              dark
                                ? "border-white/40 text-white/70 hover:border-white hover:text-white"
                                : "border-[#ddd] text-[#555] bg-white hover:border-[#27ae60] hover:text-[#27ae60]"
                            }`}
                          >
                            📞 {r.poster_contact.phone}
                          </a>
                        )}
                      </div>

                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDecline(r.id)}
                          className={`flex-1 text-xs py-2.5 rounded-xl font-bold cursor-pointer border transition-colors ${
                            dark
                              ? "border-white/40 text-white/60 bg-black hover:border-white hover:text-white"
                              : "border-[#eee] text-[#aaa] bg-white hover:border-[#ddd] hover:text-[#999]"
                          }`}
                        >
                          ✕ Decline
                        </button>
                        <button
                          onClick={() => handleAccept(r.id)}
                          className={`flex-1 text-xs py-2.5 rounded-xl font-bold cursor-pointer border transition-all hover:-translate-y-0.5 ${
                            dark
                              ? "border-white bg-white text-black hover:shadow-[0_6px_20px_rgba(255,255,255,0.2)]"
                              : "border-[#ff2d55] bg-[#ff2d55] text-white hover:bg-[#e0002b] hover:shadow-[0_6px_20px_rgba(255,45,85,0.25)]"
                          }`}
                        >
                          ✓ Accept
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Post / Edit form (separate component) ── */}
      {formOpen && (
        <RidePostFormPage
          open={formOpen}
          editingRoute={editingRoute}
          dark={dark}
          showToast={showToast}
          onClose={closeForm}
          onSaved={handleFormSaved}
        />
      )}
    </div>
  );
}