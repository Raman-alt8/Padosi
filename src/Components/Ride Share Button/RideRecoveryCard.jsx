// RideRecoveryCard.jsx
import { useEffect, useState } from "react";
import { modeOf } from "./rideHelpers";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
// This card only ever represents a route that's lapsed for the first time
// and hasn't been recovered yet (route.recovered_at is NOT set — see
// RideSharePage.jsx's render check). Once recovered, a route goes back to
// rendering as a normal RideCard, which owns its own separate, absolute
// day-21 deadline (see RideCard.jsx / ACCEPTED_HARD_DELETE_AFTER_DAYS
// there) — this component never has to think about that later stage.
//
// So the only clock this card needs is the recovery window itself:
// ACCEPTED_RECOVERY_WINDOW_DAYS (2) counted from expired_at, i.e. from
// when the route actually lapsed, not from accepted_at. Tapping "Recover
// Route" below (POST /:id/recover) clears expired_at and stamps
// recovered_at — miss this window and the route is gone for good.
const ACCEPTED_RECOVERY_WINDOW_DAYS = 2;

function daysSinceExpiry(route) {
  if (!route.expired_at) return 0;
  return (Date.now() - new Date(route.expired_at).getTime()) / MS_PER_DAY;
}

// A little ECG-style spike settling into a flat line — the visual pun
// being "activity flatlined." Reads more specifically than a generic box
// or clock, and it's the same shape used (bigger) on RideRecoveryPage, so
// the two pages share one consistent icon language for this state.
function FlatlineIcon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h3l2-7 3 14 2-11 1.5 4H22" />
    </svg>
  );
}

// Rendered in place of RideCard.jsx, poster-only, whenever a route has
// route.expired_at set (see rideRouteRoutes.js POST /:id/expire) — meaning
// it was accepted, then sat untouched for ACCEPTED_DELETE_AFTER_DAYS (10
// days) and got soft-expired instead of hard-deleted. The route is hidden
// from everyone else — the GET / query filters it out for non-posters —
// so only the poster ever sees this card, in the same grid position the
// original route card occupied.
//
// Same controlled-overlay pattern as RideCard/RideDetailPage: onOpenDetail
// is expected to open RideRecoveryPage, wired by the parent the same way
// RideCard's onOpenDetail wires RideDetailPage.
export default function RideRecoveryCard({ route: r, dark, onOpenDetail, onRecover, onAcceptedHardExpire }) {
  const mode = modeOf(r);

  // Quiet settle-in on mount rather than just appearing.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // `!r.isDemo` guard: hardcoded roster cards (rideShareDemoData.js) are
  // never real backend rows, so they must never trip this clock or fire
  // onAcceptedHardExpire — mirrors the same guard in RideCard.jsx /
  // RideDetailPage.jsx. This is the piece that keeps the 2-day recovery
  // window running once a route lands here — RideCard's own checks don't
  // apply the moment RideSharePage.jsx swaps a route over to this
  // component, since RideCard just isn't mounted for it anymore.
  const isHardExpired = !r.isDemo && daysSinceExpiry(r) >= ACCEPTED_RECOVERY_WINDOW_DAYS;

  useEffect(() => {
    if (isHardExpired) {
      onAcceptedHardExpire?.(r.id);
    }
  }, [isHardExpired, r.id, onAcceptedHardExpire]);

  return (
    <div
      onClick={() => onOpenDetail(r)}
      className={`relative overflow-hidden rounded-2xl border border-dashed p-5 pt-4 flex flex-col gap-3.5 cursor-pointer transition-all duration-500 ease-out hover:-translate-y-1 ${
        settled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1.5"
      } ${
        dark ? "bg-black/60 border-blue-400/25 saturate-[0.8]" : "bg-white/70 border-blue-200/70 saturate-[0.9]"
      }`}
      style={{
        backgroundImage: dark
          ? "repeating-linear-gradient(135deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 11px)"
          : "repeating-linear-gradient(135deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 11px)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border ${
          dark ? "border-blue-400/40 text-blue-300 bg-blue-400/10" : "border-blue-200 text-blue-600 bg-blue-50"
        }`}>
          <FlatlineIcon className="w-3.5 h-3.5" /> Lapsed
        </span>
        <span className={`text-[11px] font-semibold ${dark ? "text-white/40" : "text-[#aaa]"}`}>
          {mode === "ride" ? "Partner to share ride" : "Offering a ride"}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <span className={`w-2.5 h-2.5 rounded-full ${dark ? "bg-white/40" : "bg-[#ccc]"}`} />
          <span className={`w-0.5 h-5 ${dark ? "bg-white/15" : "bg-[#eee]"}`} />
          <span className={`w-2.5 h-2.5 rounded-full border-2 ${dark ? "border-white/40" : "border-[#ccc]"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${dark ? "text-white/80" : "text-[#555]"}`}>{r.from_place}</p>
          <p className={`text-xs mt-2 truncate ${dark ? "text-white/45" : "text-[#999]"}`}>{r.to_place}</p>
        </div>
      </div>

      <p className={`text-[11px] font-bold uppercase tracking-wide ${dark ? "text-blue-300/80" : "text-blue-600/90"}`}>
        Lapsed after 10 days
      </p>

      <p className={`text-xs leading-relaxed ${dark ? "text-white/40" : "text-[#999]"}`}>
        It lapsed because no activity was confirmed within 10 days of being accepted. Recover it within {ACCEPTED_RECOVERY_WINDOW_DAYS} days or it's gone for good.
      </p>

      <button
        onClick={(e) => { e.stopPropagation(); onRecover(r.id); }}
        className={`w-full text-xs font-bold py-2.5 rounded-xl cursor-pointer border transition-all active:scale-[0.98] ${
          dark
            ? "border-white bg-white text-black hover:shadow-[0_6px_18px_rgba(255,255,255,0.18)]"
            : "border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:shadow-[0_6px_18px_rgba(37,99,235,0.25)]"
        }`}
      >
        ↺ Recover Route
      </button>
    </div>
  );
}