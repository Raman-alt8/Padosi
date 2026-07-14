// RideDetailPage.jsx
import RouteMiniMap from "./RouteMiniMap";
import { initials, freqLabel, genderLabel, vehicleTypesOf, modeOf } from "./rideHelpers";

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
      <path d="M12 21s-6.7-4.3-9.3-8.2C1 10 1.6 6.7 4.4 5.2 6.6 4 9.2 4.7 12 7.5 14.8 4.7 17.4 4 19.6 5.2c2.8 1.5 3.4 4.8 1.7 7.6C18.7 16.7 12 21 12 21z" />
    </svg>
  );
}

// ─── Ride Detail Page ─────────────────────────────────────────────────────
// Full-screen overlay opened by tapping a route card. Same source of truth
// as before — every action just calls back up into RideSharePage's
// existing handlers — but visually reworked: a route mini-map up top, info
// laid out as labeled tiles instead of a pill row, and — the main gap this
// revision fixes — an actual "you're confirmed" banner when
// my_response==="accepted", instead of the accepted state only showing up
// as a different footer button. The footer's own accepted-state button was
// dropped since the banner's "View contact" button now covers that; the
// footer just keeps "Remove from view" so there's no duplicate CTA.
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
  const accepted  = route.my_response === "accepted";

  // Mode-driven accent — same blue/emerald split the card chips already
  // use, now also driving the top accent bar and the mini-map's pins.
  const modeAccent = mode === "ride" ? "#2563eb" : "#059669";

  const vehicleValue = vehicles.length === 0
    ? "Any vehicle"
    : vehicles.length > 1
      ? "Car & Bike"
      : vehicles[0] === "car" ? "Car" : "Bike";

  // Info tiles — same underlying fields as the card's tag row, but shown as
  // labeled tiles (icon + label + value) rather than compact pills, since
  // a detail page has the room to be legible rather than dense. Last tile
  // in each mode spans both columns so an odd count doesn't leave a gap.
  const infoTiles = mode === "partner"
    ? [
        { icon: "📅", label: "Frequency",  value: freqLabel(route.freq) },
        { icon: "🕐", label: "Departure",  value: route.depart_time || "—" },
        { icon: "👥", label: "Seats",      value: `${route.seats} seat${route.seats > 1 ? "s" : ""}` },
        { icon: "🚘", label: "Vehicle",    value: vehicleValue },
        { icon: "🚻", label: "Gender preference", value: genderTag || "Any gender", span2: true },
      ]
    : [
        { icon: "📅", label: "Frequency", value: freqLabel(route.freq) },
        { icon: "🕐", label: "Departure", value: route.depart_time || "—" },
        { icon: "🚻", label: "Gender preference", value: genderTag || "Any gender", span2: true },
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

      {/* Thin mode-accent bar — quick visual read of partner vs ride mode
          before you even reach the chip below. */}
      <div className="h-1 w-full shrink-0" style={{ background: `linear-gradient(90deg, ${modeAccent}, transparent)` }} />

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

          {/* Route mini-map */}
          <RouteMiniMap from={route.from_place} to={route.to_place} dark={dark} accent={modeAccent} />

          {/* Route + price strip — compact now that the map carries the
              visual weight; this just confirms the text and shows price. */}
          <div className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${dark ? "bg-black border-white" : "bg-white border-[#eee]"}`}>
            <div className="min-w-0">
              <p className={`text-sm font-bold truncate ${dark ? "text-white" : "text-[#111]"}`}>
                {route.from_place} <span className={dark ? "text-white/30" : "text-[#ccc]"}>→</span> {route.to_place}
              </p>
            </div>
            <span className={`text-lg font-black whitespace-nowrap ${dark ? "text-white" : "text-[#111]"}`}>
              {route.price > 0 ? `₹${route.price}` : "Free"}
              <span className={`text-xs font-normal ${dark ? "text-white/40" : "text-[#bbb]"}`}>/seat</span>
            </span>
          </div>

          {/* Accepted banner — the main fix: this is now the visual tell
              that you're confirmed on this route, not just a swapped
              footer button. Its own "View contact" button opens
              RideAcceptPage straight to the confirmed step. */}
          {accepted && (
            <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
              dark ? "bg-emerald-500/10 border-emerald-400/40" : "bg-emerald-50 border-emerald-200"
            }`}>
              <span className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg shrink-0">✓</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-black ${dark ? "text-emerald-300" : "text-emerald-700"}`}>
                  You're confirmed on this route
                </p>
                <p className={`text-xs mt-0.5 ${dark ? "text-emerald-400/70" : "text-emerald-600/80"}`}>
                  {route.accepted_seats ? `${route.accepted_seats} seat${route.accepted_seats > 1 ? "s" : ""} reserved` : "Reserved"} — contact details are ready.
                </p>
              </div>
              <button
                onClick={() => onAccept(route)}
                className={`shrink-0 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                  dark ? "bg-emerald-400 text-black hover:bg-emerald-300" : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                View contact
              </button>
            </div>
          )}

          {/* Info tiles */}
          <div className="grid grid-cols-2 gap-3">
            {infoTiles.map(({ icon, label, value, span2 }) => (
              <div
                key={label}
                className={`rounded-xl border p-3 ${span2 ? "col-span-2" : ""} ${
                  dark ? "border-white/15 bg-white/5" : "border-[#eee] bg-[#f9fafc]"
                }`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${dark ? "text-white/40" : "text-[#aaa]"}`}>
                  {label}
                </p>
                <p className={`text-sm font-bold flex items-center gap-1.5 ${dark ? "text-white" : "text-[#111]"}`}>
                  <span>{icon}</span> {value}
                </p>
              </div>
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

      {/* Actions */}
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
          ) : accepted ? (
            <button
              onClick={() => { onHideAccepted(route.id); onClose(); }}
              className={`w-full text-sm py-3 rounded-xl font-bold cursor-pointer border transition-colors ${
                dark ? "border-white/40 text-white/60 bg-black hover:border-white hover:text-white" : "border-[#eee] text-[#aaa] bg-white hover:border-[#ddd] hover:text-[#999]"
              }`}
            >
              Remove from view
            </button>
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