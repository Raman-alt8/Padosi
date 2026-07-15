// RideDetailPage.jsx
import RouteMiniMap from "./RouteMiniMap";
import {
  IconArrowLeft, IconArrowRight, IconArrowDown, IconHeart,
  IconClock, IconUsers, IconUserRound, IconCar, IconBike,
  IconPencil, IconTrash, IconCheck,
} from "./RideIcons";
import { initials, freqLabel, genderLabel, vehicleTypesOf, modeOf } from "./rideHelpers";
import {
  accentText, accentDot, accentChipCls, accentSolidBtn, accentBannerCls,
  cardCls, tileCls, JourneyConnector,
} from "./";

// Mode-accent colors, card surfaces, and the JourneyConnector now live in
// ./rideVisuals so RideAcceptPage can share the exact same visual language
// instead of re-implementing its own version of each. See rideVisuals.jsx
// for the implementation notes that used to live here.

// ─── Ride Detail Page ─────────────────────────────────────────────────────
// Full-screen overlay opened by tapping a route card. Every action still
// calls back into RideSharePage's existing handlers — no props changed in
// this revision, only the internal layout/visuals — so RideSharePage.jsx
// needs zero changes to pick this up.
//
// Poster rating, ride count, joined date, verified-driver badge, and the
// estimated distance/duration line were all dropped — none of those fields
// are set by RidePostFormPage or exist in the ride_routes schema
// (db/migrations.js), so they'd always render empty anyway.
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
  const isRide    = mode === "ride";
  const vehicles  = vehicleTypesOf(route);
  const genderTag = genderLabel(route.gender_pref);
  const saved     = isWishlisted("ride", route.id);
  const accepted  = route.my_response === "accepted";

  const vehicleValue = vehicles.length === 0
    ? "Any vehicle"
    : vehicles.length > 1
      ? "Car & Bike"
      : vehicles[0] === "car" ? "Car" : "Bike";
  const VehicleIcon = vehicles.length === 1 && vehicles[0] === "bike" ? IconBike : IconCar;

  // Hero tile: frequency + departure combined into one larger, primary
  // fact — the point of this pass is that Departure reads roughly twice
  // the weight of the smaller facts below it, instead of every fact being
  // visually equal.
  const heroTile = { icon: IconClock, label: "Departure", value: route.depart_time || "—", sub: freqLabel(route.freq) };

  const smallTiles = mode === "partner"
    ? [
        { icon: IconUsers, label: "Seats", value: `${route.seats} seat${route.seats > 1 ? "s" : ""}` },
        { icon: VehicleIcon, label: "Vehicle", value: vehicleValue },
        { icon: IconUserRound, label: "Gender", value: genderTag || "Any gender" },
      ]
    : [
        { icon: IconUserRound, label: "Gender", value: genderTag || "Any gender" },
      ];

  const ctaLabel = mode === "partner" ? "Reserve Seat" : "Accept Ride";

  return (
    <div className={`fixed inset-0 z-[5500] flex flex-col overflow-hidden ${dark ? "bg-[#111111]" : "bg-[#f6f7fb]"}`}>

      {/* Header */}
      <div className={`h-[72px] shrink-0 flex items-center justify-between px-5 border-b ${
        dark ? "bg-[#111111] border-white/10" : "bg-white border-[#eee]"
      }`}>
        <button
          onClick={onClose}
          aria-label="Back"
          className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
            dark ? "text-white/70 hover:bg-white/10" : "text-[#333] hover:bg-black/5"
          }`}
        >
          <IconArrowLeft className="w-5 h-5" />
        </button>
        <p className={`text-base font-bold ${dark ? "text-white" : "text-[#111]"}`}>Ride Details</p>
        <button
          onClick={() => toggleWishlist(buildWishlistEntry(route))}
          aria-pressed={saved}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold cursor-pointer transition-all active:scale-95 ${
            saved
              ? "bg-[#ff2d55] text-white"
              : dark ? "text-white/60 hover:text-white" : "text-[#999] hover:text-[#ff2d55]"
          }`}
        >
          <IconHeart filled={saved} className="w-4 h-4" />
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        <div className="max-w-[560px] mx-auto flex flex-col">

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${accentChipCls(dark, isRide)}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${accentDot(isRide)}`} />
              {isRide ? "Partner to share ride" : "Offering a ride"}
            </span>
            {isOwner && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${dark ? "bg-white/10 text-white" : "bg-[#fff0f3] text-[#ff2d55]"}`}>
                Your route
              </span>
            )}
            {route.isDemo && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-600">
                Sample
              </span>
            )}
          </div>

          {/* ── Hero: the journey itself ── */}
          <div className="text-center py-2">
            <p className={`text-3xl sm:text-4xl font-black tracking-tight break-words ${dark ? "text-white" : "text-[#111]"}`}>
              {route.from_place}
            </p>
            <div className={`flex justify-center my-1.5 ${dark ? "text-white/25" : "text-[#ccc]"}`}>
              <IconArrowDown className="w-5 h-5" />
            </div>
            <p className={`text-3xl sm:text-4xl font-black tracking-tight break-words ${dark ? "text-white" : "text-[#111]"}`}>
              {route.to_place}
            </p>
            <p className={`mt-4 text-sm font-medium ${dark ? "text-white/50" : "text-[#999]"}`}>
              {freqLabel(route.freq)} · {route.depart_time || "—"}
            </p>
            <p className={`mt-1.5 text-2xl font-black ${accentText(dark, isRide)}`}>
              {route.price > 0 ? `₹${route.price}` : "Free"}
              <span className={`text-xs font-medium ml-1 ${dark ? "text-white/40" : "text-[#bbb]"}`}>/seat</span>
            </p>
          </div>

          <JourneyConnector height={40} dark={dark} isRide={isRide} />

          {/* ── Route preview map ── */}
          <RouteMiniMap from={route.from_place} to={route.to_place} dark={dark} mode={mode} />

          <JourneyConnector height={accepted ? 24 : 32} dark={dark} isRide={isRide} />

          {/* ── Accepted banner ── */}
          {accepted && (
            <>
              <div className={`rounded-2xl border-l-4 overflow-hidden ${accentBannerCls(dark, isRide)}`}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <IconCheck className={`w-5 h-5 shrink-0 ${accentText(dark, isRide)}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>Ride confirmed</p>
                    <p className={`text-xs mt-0.5 ${dark ? "text-white/60" : "text-[#666]"}`}>
                      {route.accepted_seats ? `${route.accepted_seats} seat${route.accepted_seats > 1 ? "s" : ""} reserved.` : "Your seat has been reserved."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onAccept(route)}
                  className={`w-full flex items-center justify-center gap-1.5 text-sm font-bold py-3 border-t cursor-pointer transition-colors ${
                    dark ? "border-white/10 text-white hover:bg-white/5" : "border-black/5 text-[#111] hover:bg-black/5"
                  }`}
                >
                  View contact <IconArrowRight className="w-4 h-4" />
                </button>
              </div>
              <JourneyConnector height={32} dark={dark} isRide={isRide} />
            </>
          )}

          {/* ── Trip details ── */}
          <p className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${accentText(dark, isRide)}`}>Trip Details</p>
          <div className={`rounded-2xl p-4 flex items-center gap-4 ${cardCls(dark)}`}>
            <heroTile.icon className={`w-7 h-7 shrink-0 ${accentText(dark, isRide)}`} />
            <div className="min-w-0">
              <p className={`text-[10px] font-medium uppercase tracking-wide ${dark ? "text-white/40" : "text-[#aaa]"}`}>{heroTile.label}</p>
              <p className={`text-xl font-extrabold ${dark ? "text-white" : "text-[#111]"}`}>{heroTile.value}</p>
              <p className={`text-xs font-medium mt-0.5 ${dark ? "text-white/50" : "text-[#999]"}`}>{heroTile.sub}</p>
            </div>
          </div>

          <div className={`grid gap-3 mt-3 ${smallTiles.length === 3 ? "grid-cols-3" : "grid-cols-1"}`}>
            {smallTiles.map(({ icon: Icon, label, value }) => (
              <div key={label} className={`rounded-xl p-3 flex flex-col gap-1.5 ${tileCls(dark)} ${smallTiles.length === 1 ? "max-w-[180px]" : ""}`}>
                <Icon className={`w-5 h-5 ${accentText(dark, isRide)}`} />
                <p className={`text-[10px] font-medium uppercase tracking-wide ${dark ? "text-white/40" : "text-[#aaa]"}`}>{label}</p>
                <p className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>{value}</p>
              </div>
            ))}
          </div>

          <JourneyConnector height={40} dark={dark} isRide={isRide} />

          {/* ── About ── */}
          <p className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${accentText(dark, isRide)}`}>About this ride</p>
          <div className={`rounded-2xl p-4 ${cardCls(dark)}`}>
            <p className={`text-sm leading-relaxed ${dark ? "text-white/75" : "text-[#555]"}`}>
              {route.description || "No additional details."}
            </p>
          </div>

          <JourneyConnector height={32} dark={dark} isRide={isRide} />

          {/* ── Driver ── */}
          <p className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${accentText(dark, isRide)}`}>Driver</p>
          <div className={`rounded-2xl p-4 flex items-center gap-3.5 ${cardCls(dark)}`}>
            <span className={`w-12 h-12 rounded-full text-sm font-bold flex items-center justify-center shrink-0 ${
              dark ? "bg-white/10 text-white" : "bg-[#f0f0f5] text-[#555]"
            }`}>
              {initials(route.poster_name || "")}
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>{route.poster_name}</p>
              <p className={`text-xs mt-0.5 ${dark ? "text-white/40" : "text-[#aaa]"}`}>Neighbourhood poster</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className={`shrink-0 px-5 py-4 border-t ${dark ? "bg-[#111111] border-white/10" : "bg-white border-[#eee]"}`}>
        <div className="max-w-[560px] mx-auto">
          {isOwner ? (
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(route)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 text-sm py-3 rounded-xl font-bold cursor-pointer transition-colors ${accentSolidBtn(dark, isRide)}`}
              >
                <IconPencil className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => { onDelete(route.id); onClose(); }}
                className={`px-4 inline-flex items-center justify-center gap-1.5 text-sm py-3 rounded-xl font-bold cursor-pointer transition-colors ${
                  dark ? "text-white/50 hover:text-white hover:bg-white/5" : "text-[#aaa] hover:text-[#777] hover:bg-black/5"
                }`}
              >
                <IconTrash className="w-4 h-4" /> Remove
              </button>
            </div>
          ) : accepted ? (
            <button
              onClick={() => { onHideAccepted(route.id); onClose(); }}
              className={`w-full text-center text-xs font-semibold cursor-pointer py-2 ${
                dark ? "text-white/40 hover:text-white" : "text-[#bbb] hover:text-[#777]"
              }`}
            >
              Remove from view
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { onDecline(route.id); onClose(); }}
                className={`self-center text-xs font-semibold cursor-pointer ${dark ? "text-white/40 hover:text-white" : "text-[#bbb] hover:text-[#777]"}`}
              >
                Decline this route
              </button>
              <button
                onClick={() => onAccept(route)}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl font-bold cursor-pointer transition-all hover:-translate-y-0.5 ${accentSolidBtn(dark, isRide)}`}
              >
                <span>{ctaLabel}</span>
                <span className="inline-flex items-center gap-1.5">
                  {route.price > 0 ? `₹${route.price}` : "Free"}
                  <IconArrowRight className="w-4 h-4" />
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}