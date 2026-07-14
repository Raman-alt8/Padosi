// RideDetailPage.jsx
import { initials, freqLabel, genderLabel, vehicleTypesOf, modeOf } from "./rideHelpers";

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
      <path d="M12 21s-6.7-4.3-9.3-8.2C1 10 1.6 6.7 4.4 5.2 6.6 4 9.2 4.7 12 7.5 14.8 4.7 17.4 4 19.6 5.2c2.8 1.5 3.4 4.8 1.7 7.6C18.7 16.7 12 21 12 21z" />
    </svg>
  );
}

// ─── Ride Detail Page ─────────────────────────────────────────────────────
// Full-screen overlay opened by tapping a route card anywhere outside its
// interactive controls (see stopPropagation calls added to those controls
// in RideSharePage). Shows the same info as the card, uncramped, plus the
// same actions — it never reimplements accept/decline/edit/delete itself,
// just calls back up to RideSharePage's existing handlers, so there's one
// source of truth for what each action actually does.
//
// Props:
//   open, route, currentUser, dark
//   onClose()
//   onEdit(route)     — opens the post/edit form for this route
//   onDelete(id)
//   onAccept(route)   — opens RideAcceptPage (review or confirmed step)
//   onDecline(id)
//   onHideAccepted(id)
//   isWishlisted(type, id), toggleWishlist(entry), buildWishlistEntry(route)
export default function RideDetailPage({
  open,
  route,
  currentUser,
  dark,
  onClose,
  onEdit,
  onDelete,
  onAccept,
  onDecline,
  onHideAccepted,
  isWishlisted,
  toggleWishlist,
  buildWishlistEntry,
}) {
  if (!open || !route) return null;

  const isOwner   = route.poster_id === currentUser?.id;
  const mode      = modeOf(route);
  const vehicles  = vehicleTypesOf(route);
  const genderTag = genderLabel(route.gender_pref);
  const saved     = isWishlisted("ride", route.id);

  const vehicleTag = vehicles.length === 0
    ? { icon: "🚘", text: "Any vehicle" }
    : vehicles.length > 1
      ? { icon: "🚘", text: "Car & Bike" }
      : { icon: vehicles[0] === "car" ? "🚗" : "🏍️", text: vehicles[0] === "car" ? "Car" : "Bike" };

  const tags = mode === "partner"
    ? [
        { icon: "📅", text: freqLabel(route.freq) },
        { icon: "🕐", text: route.depart_time || "—" },
        { icon: "👥", text: `${route.seats} seat${route.seats > 1 ? "s" : ""}` },
        vehicleTag,
        { icon: "🚻", text: genderTag || "Any gender" },
      ]
    : [
        { icon: "📅", text: freqLabel(route.freq) },
        { icon: "🕐", text: route.depart_time || "—" },
        { icon: "🚻", text: genderTag || "Any gender" },
      ];

  return (
    <div className={`fixed inset-0 z-[5500] flex flex-col overflow-hidden ${dark ? "bg-black" : "bg-[#f6f7fb]"}`}>

      {/* Header */}
      <div className={`h-[80px] shrink-0 flex items-center justify-between px-6 border-b ${
        dark ? "bg-black border-white" : "bg-white border-[#eee]"
      }`}>
        <button
          onClick={onClose}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
            dark
              ? "bg-black border-white text-white hover:bg-white hover:text-black"
              : "bg-white border-[#ddd] text-[#333] hover:border-[#ff2d55] hover:text-[#ff2d55]"
          }`}
        >
          ← Back
        </button>
        <p className={`text-lg font-black ${dark ? "text-white" : "text-[#111]"}`}>Route Details</p>
        <button
          onClick={() => toggleWishlist(buildWishlistEntry(route))}
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          aria-pressed={saved}
          className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border transition-all active:scale-90 ${
            saved
              ? "bg-[#ff2d55] border-[#ff2d55] text-white"
              : dark
                ? "bg-black border-white/30 text-white/60 hover:text-[#ff2d55] hover:border-[#ff2d55]/50"
                : "bg-white border-[#eee] text-[#ccc] hover:text-[#ff2d55] hover:border-[#ff2d55]/40"
          }`}
        >
          <HeartIcon filled={saved} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        <div className="max-w-[560px] mx-auto flex flex-col gap-5">

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${
              mode === "ride"
                ? "border-blue-300 text-blue-600 bg-blue-50"
                : "border-emerald-300 text-emerald-600 bg-emerald-50"
            }`}>
              {mode === "ride" ? "🙋 Partner to share ride" : "🧑‍🤝‍🧑 Offering a ride"}
            </span>
            {isOwner && (
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border ${
                dark ? "border-white text-white bg-black" : "border-[#ff2d55] text-[#ff2d55] bg-[#fff0f3]"
              }`}>
                Your route
              </span>
            )}
            {route.isDemo && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border border-purple-300 text-purple-600 bg-purple-50">
                Sample
              </span>
            )}
          </div>

          <div className={`rounded-2xl border p-5 ${dark ? "bg-black border-white" : "bg-white border-[#eee]"}`}>
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 pt-1.5 flex-shrink-0">
                <span className={`w-3 h-3 rounded-full ${dark ? "bg-white" : "bg-[#ff2d55]"}`} />
                <span className={`w-0.5 h-8 ${dark ? "bg-white/30" : "bg-[#eee]"}`} />
                <span className={`w-3 h-3 rounded-full border-2 ${dark ? "border-white" : "border-[#ff2d55]"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-base font-bold ${dark ? "text-white" : "text-[#111]"}`}>{route.from_place}</p>
                <p className={`text-sm mt-4 ${dark ? "text-white/50" : "text-[#999]"}`}>{route.to_place}</p>
              </div>
              <span className={`text-lg font-black whitespace-nowrap ${dark ? "text-white" : "text-[#111]"}`}>
                {route.price > 0 ? `₹${route.price}` : "Free"}
                <span className={`text-xs font-normal ${dark ? "text-white/40" : "text-[#bbb]"}`}>/seat</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map(({ icon, text }, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold border ${
                  dark ? "border-white/40 text-white/70" : "border-[#eee] text-[#888] bg-[#f6f7fb]"
                }`}
              >
                {icon} {text}
              </span>
            ))}
          </div>

          <div>
            <p className={`text-xs font-bold mb-1.5 ${dark ? "text-white/50" : "text-[#999]"}`}>Details</p>
            <p className={`text-sm leading-relaxed ${dark ? "text-white/70" : "text-[#555]"}`}>
              {route.description || "No additional details."}
            </p>
          </div>

          <div className={`flex items-center gap-3 pt-4 border-t ${dark ? "border-white/20" : "border-[#eee]"}`}>
            <span className={`w-10 h-10 rounded-full border text-sm font-bold flex items-center justify-center ${
              dark ? "border-white text-white" : "border-[#ddd] text-[#555] bg-[#f6f7fb]"
            }`}>
              {initials(route.poster_name || "")}
            </span>
            <div>
              <p className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>{route.poster_name}</p>
              <p className={`text-xs ${dark ? "text-white/40" : "text-[#bbb]"}`}>Route poster</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions — mirrors the card footer logic, fixed to the bottom */}
      <div className={`shrink-0 px-6 py-4 border-t ${dark ? "bg-black border-white" : "bg-white border-[#eee]"}`}>
        <div className="max-w-[560px] mx-auto">
          {isOwner ? (
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(route)}
                className={`flex-1 text-sm py-2.5 rounded-xl font-bold cursor-pointer border transition-colors ${
                  dark ? "border-white text-white bg-black hover:bg-white hover:text-black" : "border-[#ddd] text-[#555] bg-white hover:border-[#ff2d55] hover:text-[#ff2d55]"
                }`}
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => { onDelete(route.id); onClose(); }}
                className={`flex-1 text-sm py-2.5 rounded-xl font-bold cursor-pointer border transition-colors ${
                  dark ? "border-white/40 text-white/50 bg-black hover:border-white hover:text-white" : "border-[#eee] text-[#bbb] bg-white hover:border-[#ddd] hover:text-[#999]"
                }`}
              >
                🗑️ Remove
              </button>
            </div>
          ) : route.my_response === "accepted" ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onAccept(route)}
                className={`w-full inline-flex items-center justify-center gap-2 text-sm font-bold py-3 px-3 rounded-xl border transition-colors ${
                  dark ? "bg-white/5 border-white/20 text-white/80 hover:border-white hover:text-white" : "bg-[#f0fff4] border-[#b2f5c8] text-[#27ae60] hover:border-[#27ae60]"
                }`}
              >
                ✅ Accepted — View contact &amp; chat
              </button>
              <button
                onClick={() => { onHideAccepted(route.id); onClose(); }}
                className={`text-xs font-semibold cursor-pointer self-center ${dark ? "text-white/40 hover:text-white" : "text-[#bbb] hover:text-[#777]"}`}
              >
                Remove from view
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => { onDecline(route.id); onClose(); }}
                className={`flex-1 text-sm py-3 rounded-xl font-bold cursor-pointer border transition-colors ${
                  dark ? "border-white/40 text-white/60 bg-black hover:border-white hover:text-white" : "border-[#eee] text-[#aaa] bg-white hover:border-[#ddd] hover:text-[#999]"
                }`}
              >
                ✕ Decline
              </button>
              <button
                onClick={() => onAccept(route)}
                className={`flex-1 text-sm py-3 rounded-xl font-bold cursor-pointer border transition-all hover:-translate-y-0.5 ${
                  dark ? "border-white bg-white text-black hover:shadow-[0_6px_20px_rgba(255,255,255,0.2)]" : "border-[#ff2d55] bg-[#ff2d55] text-white hover:bg-[#e0002b] hover:shadow-[0_6px_20px_rgba(255,45,85,0.25)]"
                }`}
              >
                ✓ Accept
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}