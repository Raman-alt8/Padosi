// RideRecoveryCard.jsx
import { useEffect, useState } from "react";
import { modeOf } from "./rideHelpers";

// Small archive-box icon — deliberately not the trash emoji this replaced.
// A trash can reads as "this is garbage"; this route is soft-expired and
// fully restorable, so the icon (and the amber accent throughout this
// file) is borrowed from "storage"/"archive" language instead of "danger"
// or "deleted". Defined locally, same pattern RideCard.jsx uses for its
// own small icons rather than adding to a shared icon file sight-unseen.
function ArchiveIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M4.5 8v9.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8" />
      <path d="M10 12.5h4" />
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
export default function RideRecoveryCard({ route: r, dark, onOpenDetail, onRecover }) {
  const mode = modeOf(r);

  // Quiet settle-in on mount rather than just appearing — the card is
  // meant to feel like it's easing into an "archived" resting state, not
  // popping in like an ordinary list item. Purely cosmetic; skip it
  // entirely if prefers-reduced-motion matters to you, this is the one
  // spot to gate it.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      onClick={() => onOpenDetail(r)}
      className={`relative overflow-hidden rounded-2xl border border-dashed p-5 pt-4 flex flex-col cursor-pointer transition-all duration-500 ease-out hover:-translate-y-1 ${
        settled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1.5"
      } ${
        dark ? "bg-black/60 border-white/20 saturate-[0.75]" : "bg-white/70 border-[#ddd] saturate-[0.85]"
      }`}
      style={{
        backgroundImage: dark
          ? "repeating-linear-gradient(135deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 11px)"
          : "repeating-linear-gradient(135deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 11px)",
      }}
    >
      {/* Archived watermark — decorative texture only, sits behind every
          real element below because it's the only child here without its
          own `position: relative`. See the wrapper div's comment. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none select-none absolute -bottom-3 -right-2 text-[36px] font-black tracking-widest uppercase ${
          dark ? "text-white/[0.05]" : "text-black/[0.04]"
        }`}
        style={{ transform: "rotate(-11deg)" }}
      >
        Archived
      </span>

      {/* Everything real lives in this one `relative` wrapper so it all
          shares a stacking context above the watermark, instead of every
          row needing `relative` individually. */}
      <div className="relative flex flex-col gap-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border ${
            dark ? "border-amber-400/40 text-amber-300 bg-amber-400/10" : "border-amber-200 text-amber-700 bg-amber-50"
          }`}>
            <ArchiveIcon /> Archived
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

        <p className={`text-[11px] font-bold uppercase tracking-wide ${dark ? "text-amber-300/80" : "text-amber-700/90"}`}>
          Archived after 10 days
        </p>

        <p className={`text-xs leading-relaxed ${dark ? "text-white/40" : "text-[#999]"}`}>
          Archived because no activity was confirmed within 10 days of being accepted.
        </p>

        <button
          onClick={(e) => { e.stopPropagation(); onRecover(r.id); }}
          className={`w-full text-xs font-bold py-2.5 rounded-xl cursor-pointer border transition-all active:scale-[0.98] ${
            dark
              ? "border-white bg-white text-black hover:shadow-[0_6px_18px_rgba(255,255,255,0.18)]"
              : "border-amber-500 bg-amber-500 text-white hover:bg-amber-600 hover:shadow-[0_6px_18px_rgba(217,119,6,0.25)]"
          }`}
        >
          ↺ Restore Route
        </button>
      </div>
    </div>
  );
}