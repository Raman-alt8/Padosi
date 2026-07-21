// RideDetailPage.jsx
import { useEffect } from "react";
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
} from "./rideVisuals";

// Mode-accent colors, card surfaces, and the JourneyConnector now live in
// ./rideVisuals so RideAcceptPage can share the exact same visual language
// instead of re-implementing its own version of each. See rideVisuals.jsx
// for the implementation notes that used to live here.

// Small triangular warning icon for the pending-removal banner. Defined
// locally the same way RideCard defines its own HeartIcon, rather than
// added to RideIcons.js sight-unseen.
function WarningIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.29 2.26h17.78A1.5 1.5 0 0 0 22.18 18L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

// ─── Inactivity / auto-expiry ──────────────────────────────────────────────
// Same rules as RideCard.jsx — kept in sync by hand since rideHelpers.js
// wasn't included in this pass. If it's touched here, mirror the change
// there too (and ideally move both copies into rideHelpers.js).
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PENDING_AFTER_DAYS = 15; // warning appears once this many days pass with no activity
const DELETE_AFTER_DAYS = 18;  // auto-expires once this many days pass with no activity
// Accepted routes skip the pending cycle above entirely and get their own
// longer, silent expiry instead — see the note by showsPendingState below.
const ACCEPTED_DELETE_AFTER_DAYS = 10;
// Applies only once route.recovered_at is set (i.e. after a lapse-and-
// recover cycle) — see RideCard.jsx for the full note. A route that's
// never lapsed doesn't need this yet; a route that's lapsed and never
// been recovered is purged on a separate, shorter clock owned by
// RideRecoveryCard.jsx / RideRecoveryPage.jsx instead.
const ACCEPTED_HARD_DELETE_AFTER_DAYS = 21;

function daysSinceActivity(route) {
  const last = route.last_active_at || route.created_at;
  if (!last) return 0;
  return (Date.now() - new Date(last).getTime()) / MS_PER_DAY;
}

// Distinct from daysSinceActivity — see RideCard.jsx for the full note.
// Counts from route.accepted_at (set once, on first acceptance), not from
// last_active_at/created_at. Returns 0 if accepted_at isn't set yet, so an
// accepted route never auto-expires until the backend actually provides it.
function daysSinceAcceptance(route) {
  if (!route.accepted_at) return 0;
  return (Date.now() - new Date(route.accepted_at).getTime()) / MS_PER_DAY;
}

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
//
// onConfirmActive / onAutoExpire mirror the new RideCard props: the former
// fires when the poster taps "I'm here" (parent should persist a fresh
// last_active_at), the latter fires once the route crosses DELETE_AFTER_DAYS
// with nobody having confirmed. See RideCard.jsx for the fuller note on why
// the client-side auto-expire is only a best-effort nudge, not the source
// of truth for actual deletion.
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
  onConfirmActive,
  onAutoExpire,
  onAcceptedExpire,
  onAcceptedHardExpire,
  isWishlisted,
  toggleWishlist,
  buildWishlistEntry,
}) {
  // Hooks must run every render regardless of `open`/`route`, so the
  // early-return below stays after these rather than before.
  const daysSince = route ? daysSinceActivity(route) : 0;
  // `forceOwnerDemo` (see rideShareDemoData.js, ownerMode: "force") must be
  // honored here the same way RideCard.jsx honors it — otherwise a route
  // that renders as "Your route" in the card list (with Edit/Remove, the
  // accepted-count badge, etc.) would flip to looking like a stranger's
  // route (Accept/Decline) the moment its detail page is opened, since its
  // synthetic poster_id ("demo-you") never matches a real currentUser.id.
  const isOwnerRoute = !!route && (route.poster_id === currentUser?.id || !!route.forceOwnerDemo);
  // Hoisted above the early return (unlike RideCard.jsx, where it's already
  // naturally at the top) because showsPendingState below now needs it, and
  // the useEffect that reads isExpired has to run before `if (!open ||
  // !route) return null;` per the hooks-order comment above.
  const acceptedCount = isOwnerRoute ? (route?.accepted_count || 0) : 0;
  const hasAccepted = isOwnerRoute && acceptedCount > 0;
  // Non-owner demo routes (e.g. the "someone else's ride, pending removal"
  // samples) still surface the pending banner as an illustration of that
  // state, same exception as RideCard's showsPendingState — but accepted
  // routes skip the pending cycle entirely and get their own longer, silent
  // expiry (ACCEPTED_DELETE_AFTER_DAYS) instead, since a route someone
  // accepted isn't an abandoned listing.
  const showsPendingState = (isOwnerRoute || !!route?.isDemo) && !hasAccepted;
  const isPending = showsPendingState && daysSince >= PENDING_AFTER_DAYS && daysSince < DELETE_AFTER_DAYS;
  // `!route?.isDemo` guard: hardcoded roster cards (rideShareDemoData.js)
  // are never real backend rows, so they must never trip the
  // accepted-expiry clock or fire onAcceptedExpire here either — mirrors
  // the same guard added to RideCard.jsx. `!route?.recovered_at` guard —
  // see RideCard.jsx for why a recovered route must skip this check.
  const isAcceptedExpired = hasAccepted && !route?.isDemo && !route?.recovered_at && daysSinceAcceptance(route) >= ACCEPTED_DELETE_AFTER_DAYS;
  // Same demo guard, same accepted_at clock, later threshold — now also
  // gated on route.recovered_at, see RideCard.jsx for the full reasoning.
  const isAcceptedHardExpired = hasAccepted && !route?.isDemo && !!route?.recovered_at && daysSinceAcceptance(route) >= ACCEPTED_HARD_DELETE_AFTER_DAYS;
  // Renamed from the old combined isExpired — see RideCard.jsx for the
  // full note. isStaleExpired still hard-deletes via onAutoExpire;
  // isAcceptedExpired now soft-expires via onAcceptedExpire instead, so
  // the poster gets a recovery card rather than the route just vanishing.
  const isStaleExpired = showsPendingState && daysSince >= DELETE_AFTER_DAYS;

  useEffect(() => {
    // Hard-expiry takes priority — see RideCard.jsx for why.
    if (isAcceptedHardExpired) {
      onAcceptedHardExpire?.(route.id);
    } else if (isAcceptedExpired) {
      onAcceptedExpire?.(route.id);
    } else if (isStaleExpired) {
      onAutoExpire?.(route.id);
    }
  }, [isAcceptedHardExpired, isAcceptedExpired, isStaleExpired, route?.id, onAcceptedHardExpire, onAcceptedExpire, onAutoExpire]);

  if (!open || !route) return null;

  const isOwner   = isOwnerRoute;
  const mode      = modeOf(route);
  const isRide    = mode === "ride";
  const vehicles  = vehicleTypesOf(route);
  const genderTag = genderLabel(route.gender_pref);
  const saved     = isWishlisted("ride", route.id);
  const accepted  = route.my_response === "accepted";
  const hoursLeft = isPending ? Math.max(0, Math.ceil((DELETE_AFTER_DAYS - daysSince) * 24)) : 0;
  // acceptedCount / hasAccepted are computed above, before the early
  // return, since showsPendingState needs them.

  const vehicleValue = vehicles.length === 0
    ? "Any vehicle"
    : vehicles.length > 1
      ? "Car & Bike"
      : vehicles[0] === "car" ? "Car" : "Bike";
  const VehicleIcon = vehicles.length === 1 && vehicles[0] === "bike" ? IconBike : IconCar;

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
            {isPending && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                dark ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-600"
              }`}>
                <WarningIcon className="w-3.5 h-3.5" /> Pending removal
              </span>
            )}
            {route.isDemo && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-600">
                Sample
              </span>
            )}
          </div>

          {/* ── Pending-removal warning ── */}
          {isPending && (
            <>
              <div className={`rounded-2xl border-l-4 overflow-hidden ${
                dark ? "bg-red-950/20 border-red-500" : "bg-red-50 border-red-500"
              }`}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <WarningIcon className={`w-5 h-5 shrink-0 ${dark ? "text-red-400" : "text-red-600"}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>Pending removal</p>
                    <p className={`text-xs mt-0.5 ${dark ? "text-white/60" : "text-[#666]"}`}>
                      No activity in {PENDING_AFTER_DAYS} days — this route will be removed in about {hoursLeft} hour{hoursLeft === 1 ? "" : "s"} unless {isOwner ? "you confirm you're" : "the poster confirms they're"} still here.
                    </p>
                  </div>
                </div>
                {/* Owner-only action, same as RideCard.jsx: a real non-owner
                    viewer would never see this button, so non-owner demo
                    pending routes (-3, -10) show the banner above but not
                    this. */}
                {isOwner && (
                  <button
                    onClick={() => onConfirmActive?.(route.id)}
                    className={`w-full flex items-center justify-center gap-1.5 text-sm font-bold py-3 border-t cursor-pointer transition-colors ${
                      dark ? "border-red-500/30 text-white hover:bg-red-500/10" : "border-red-200 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    I'm here — keep this route active
                  </button>
                )}
              </div>
              <JourneyConnector height={32} dark={dark} isRide={isRide} />
            </>
          )}

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
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("padosi:openProfile", {
              detail: {
                userId: route.poster_id,
                isDemo: !!route.isDemo,
                demoProfile: route.isDemo ? { full_name: route.poster_name } : undefined,
              },
            }))}
            className={`w-full text-left rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-colors ${cardCls(dark)}`}
          >
            <span className={`w-12 h-12 rounded-full text-sm font-bold flex items-center justify-center shrink-0 ${
              dark ? "bg-white/10 text-white" : "bg-[#f0f0f5] text-[#555]"
            }`}>
              {initials(route.poster_name || "")}
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>{route.poster_name}</p>
              <p className={`text-xs mt-0.5 ${dark ? "text-white/40" : "text-[#aaa]"}`}>Neighbourhood poster · View profile</p>
            </div>
          </button>
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
              {acceptedCount > 0 ? (
                <button
                  onClick={() => {
                    onDelete(route.id);
                    onClose();
                    window.dispatchEvent(new CustomEvent("padosi:openRideComplete", {
                      detail: { fromPlace: route.from_place, toPlace: route.to_place },
                    }));
                  }}
                  className={`px-4 inline-flex items-center justify-center gap-1.5 text-sm py-3 rounded-xl font-bold cursor-pointer transition-colors ${
                    dark ? "text-white hover:bg-white/10" : "text-[#27ae60] hover:bg-[#f0fff4]"
                  }`}
                >
                  <IconCheck className="w-4 h-4" /> Complete Ride
                </button>
              ) : (
                <button
                  onClick={() => { onDelete(route.id); onClose(); }}
                  className={`px-4 inline-flex items-center justify-center gap-1.5 text-sm py-3 rounded-xl font-bold cursor-pointer transition-colors ${
                    dark ? "text-white/50 hover:text-white hover:bg-white/5" : "text-[#aaa] hover:text-[#777] hover:bg-black/5"
                  }`}
                >
                  <IconTrash className="w-4 h-4" /> Remove
                </button>
              )}
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