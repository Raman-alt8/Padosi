// RideCard.jsx
import { initials, freqLabel, genderLabel, vehicleTypesOf, modeOf } from "./rideHelpers";

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

// ─── Ride Card ────────────────────────────────────────────────────────────
// One route card in the grid. Owns its own tag/footer layout, but every
// action (wishlist toggle, accept, decline, edit, delete, hide-from-view,
// opening the detail overlay) is delegated back to the handler props
// RideSharePage passes in — same single source of truth those handlers
// always had when this JSX lived inline in the map().
//
// Props:
//   route             — the route object being rendered
//   currentUser       — { id, ... } or null, used to compute isOwner
//   dark              — boolean, theme flag
//   isWishlisted      — (type, id) => boolean, from useWishlist
//   toggleWishlist    — (entry) => void, from useWishlist
//   buildWishlistEntry— (route) => wishlist entry shape
//   onOpenDetail      — (route) => void — opens the full-screen detail view
//   onEdit            — (route) => void — opens the post/edit form
//   onDelete          — (routeId) => void
//   onAccept          — (route) => void — opens the accept overlay
//   onDecline         — (routeId) => void
//   onHideAccepted    — (routeId) => void
//   onViewResponses   — (route) => void — opens the poster-facing "who
//                        accepted this route" page
//
// The poster avatar/name in the footer fires "padosi:openProfile" (same
// event AccountDetailPage listens for at the App root), same pattern as the
// driver row in RideDetailPage — stopPropagation so it doesn't also trigger
// onOpenDetail underneath it.
export default function RideCard({
  route: r,
  currentUser,
  dark,
  isWishlisted,
  toggleWishlist,
  buildWishlistEntry,
  onOpenDetail,
  onEdit,
  onDelete,
  onAccept,
  onDecline,
  onHideAccepted,
  onViewResponses,
}) {
  const isOwner   = r.poster_id === currentUser?.id;
  const mode      = modeOf(r);
  const vehicles  = vehicleTypesOf(r);
  const genderTag = genderLabel(r.gender_pref);
  const saved     = isWishlisted("ride", r.id);

  // Only meaningful for the poster's own routes — how many people have
  // accepted so far. Drives the "N accepted" badge/button below and which
  // page tapping the card opens.
  const acceptedCount = isOwner ? (r.accepted_count || 0) : 0;

  // A card of the poster's own that has at least one acceptance gets a
  // distinct celebratory treatment (accent border/glow + top strip) so it
  // reads as "something happened here" at a glance in the grid, separate
  // from the plain "Your route" cards with no responses yet.
  const hasAccepted = isOwner && acceptedCount > 0;

  const vehicleTag = vehicles.length === 0
    ? { icon: "🚘", text: "Any vehicle" }
    : vehicles.length > 1
      ? { icon: "🚘", text: "Car & Bike" }
      : { icon: vehicles[0] === "car" ? "🚗" : "🏍️", text: vehicles[0] === "car" ? "Car" : "Bike" };

  const tags = mode === "partner"
    ? [
        { icon: "📅", text: freqLabel(r.freq) },
        { icon: "🕐", text: r.depart_time || "—" },
        { icon: "👥", text: `${r.seats} seat${r.seats > 1 ? "s" : ""}` },
        vehicleTag,
        { icon: "🚻", text: genderTag || "Any gender" },
      ]
    : [
        { icon: "📅", text: freqLabel(r.freq) },
        { icon: "🕐", text: r.depart_time || "—" },
        { icon: "🚻", text: genderTag || "Any gender" },
      ];

  // Tapping the card body always opens the normal read-only detail view.
  // The one exception is the explicit "N accepted — View responses" button
  // in the footer below, which stops propagation and calls onViewResponses
  // directly — so that's the only way into the responses page.
  const handleCardClick = () => {
    onOpenDetail(r);
  };

  const openPosterProfile = (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent("padosi:openProfile", { detail: { userId: r.poster_id } }));
  };

  return (
    <div
      onClick={handleCardClick}
      className={`relative overflow-hidden rounded-2xl border p-5 pt-4 flex flex-col gap-3.5 cursor-pointer hover:-translate-y-1 transition-all ${
        hasAccepted
          ? dark
            ? "bg-black border-white shadow-[0_6px_24px_rgba(255,255,255,0.14)] hover:shadow-[0_14px_36px_rgba(255,255,255,0.2)] ring-1 ring-white/40"
            : "bg-white border-[#b2f5c8] shadow-[0_6px_22px_rgba(39,174,96,0.16)] hover:shadow-[0_14px_34px_rgba(39,174,96,0.22)] ring-1 ring-[#b2f5c8]"
          : dark
            ? "bg-black border-white shadow-[0_6px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(255,255,255,0.1)]"
            : "bg-white border-[#eee] shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
      }`}
    >
      {/* Celebratory top strip — only for owner cards with an acceptance.
          Absolutely positioned, so it doesn't affect card height/layout. */}
      {hasAccepted && (
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          dark
            ? "bg-gradient-to-r from-white/20 via-white to-white/20"
            : "bg-gradient-to-r from-[#b2f5c8] via-[#27ae60] to-[#b2f5c8]"
        }`} />
      )}

      {/* Top-right stack */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); toggleWishlist(buildWishlistEntry(r)); }}
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
              onClick={(e) => { e.stopPropagation(); onHideAccepted(r.id); }}
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

        {isOwner && (
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border ${
            dark
              ? "border-white text-white bg-black/60"
              : "border-[#ff2d55] text-[#ff2d55] bg-[#fff0f3]"
          }`}>
            Your route
          </span>
        )}
        {isOwner && acceptedCount > 0 && (
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border ${
            dark
              ? "border-white/60 text-white bg-black/60"
              : "border-[#b2f5c8] text-[#27ae60] bg-[#f0fff4]"
          }`}>
            🎉 {acceptedCount} accepted
          </span>
        )}
        {r.isDemo && (
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border border-purple-300 text-purple-600 bg-purple-50">
            Sample
          </span>
        )}
      </div>

      <div className="pr-11">
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${
          mode === "ride"
            ? "border-blue-300 text-blue-600 bg-blue-50"
            : "border-emerald-300 text-emerald-600 bg-emerald-50"
        }`}>
          {mode === "ride" ? "🙋 Partner to share ride" : "🧑‍🤝‍🧑 Offering a ride"}
        </span>
      </div>

      <div className="flex items-center gap-2.5 pr-11">
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <span className={`w-2.5 h-2.5 rounded-full ${dark ? "bg-white" : "bg-[#ff2d55]"}`} />
          <span className={`w-0.5 h-5 ${dark ? "bg-white/30" : "bg-[#eee]"}`} />
          <span className={`w-2.5 h-2.5 rounded-full border-2 ${dark ? "border-white" : "border-[#ff2d55]"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${dark ? "text-white" : "text-[#111]"}`}>{r.from_place}</p>
          <p className={`text-xs mt-2 truncate ${dark ? "text-white/50" : "text-[#999]"}`}>{r.to_place}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map(({ icon, text }, i) => (
          <span
            key={i}
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

      <p className={`text-xs line-clamp-2 leading-relaxed min-h-[2.5rem] ${dark ? "text-white/50" : "text-[#999]"}`}>
        {r.description || "No additional details."}
      </p>

      {/* Footer */}
      <div className={`pt-3 border-t ${dark ? "border-white/20" : "border-[#eee]"}`}>

        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            onClick={openPosterProfile}
            aria-label={`View ${r.poster_name}'s profile`}
            className={`flex items-center gap-2 -m-1 p-1 rounded-full cursor-pointer transition-colors ${
              dark ? "hover:bg-white/10" : "hover:bg-black/5"
            }`}
          >
            <span className={`w-7 h-7 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${
              dark ? "border-white text-white" : "border-[#ddd] text-[#555] bg-[#f6f7fb]"
            }`}>
              {initials(r.poster_name || "")}
            </span>
            <span className={`text-xs font-semibold ${dark ? "text-white/70" : "text-[#777]"}`}>
              {r.poster_name}
            </span>
          </button>
          <span className={`text-sm font-black ${dark ? "text-white" : "text-[#111]"}`}>
            {r.price > 0 ? `₹${r.price}` : "Free"}
            <span className={`text-xs font-normal ${dark ? "text-white/40" : "text-[#bbb]"}`}>/seat</span>
          </span>
        </div>

        {isOwner ? (
          <div className="flex flex-col gap-2">
            {acceptedCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onViewResponses(r); }}
                className={`w-full inline-flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-3 rounded-xl border transition-colors ${
                  dark
                    ? "bg-white/5 border-white/20 text-white/80 hover:border-white hover:text-white"
                    : "bg-[#f0fff4] border-[#b2f5c8] text-[#27ae60] hover:border-[#27ae60]"
                }`}
              >
                🎉 {acceptedCount} accepted — View responses
              </button>
            )}
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(r); }}
                className={`flex-1 text-xs py-2 rounded-xl font-bold cursor-pointer border transition-colors ${
                  dark
                    ? "border-white text-white bg-black hover:bg-white hover:text-black"
                    : "border-[#ddd] text-[#555] bg-white hover:border-[#ff2d55] hover:text-[#ff2d55]"
                }`}
              >
                ✏️ Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
                className={`flex-1 text-xs py-2 rounded-xl font-bold cursor-pointer border transition-colors ${
                  dark
                    ? "border-white/40 text-white/50 bg-black hover:border-white hover:text-white"
                    : "border-[#eee] text-[#bbb] bg-white hover:border-[#ddd] hover:text-[#999]"
                }`}
              >
                🗑️ Remove
              </button>
            </div>
          </div>

        ) : r.my_response === "accepted" ? (
          <button
            onClick={(e) => { e.stopPropagation(); onAccept(r); }}
            className={`w-full inline-flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-3 rounded-xl border transition-colors ${
              dark
                ? "bg-white/5 border-white/20 text-white/80 hover:border-white hover:text-white"
                : "bg-[#f0fff4] border-[#b2f5c8] text-[#27ae60] hover:border-[#27ae60]"
            }`}
          >
            ✅ Accepted — View contact &amp; chat
          </button>

        ) : (
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onDecline(r.id); }}
              className={`flex-1 text-xs py-2.5 rounded-xl font-bold cursor-pointer border transition-colors ${
                dark
                  ? "border-white/40 text-white/60 bg-black hover:border-white hover:text-white"
                  : "border-[#eee] text-[#aaa] bg-white hover:border-[#ddd] hover:text-[#999]"
              }`}
            >
              ✕ Decline
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onAccept(r); }}
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
}