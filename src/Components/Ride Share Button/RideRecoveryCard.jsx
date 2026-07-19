// RideRecoveryCard.jsx
import { modeOf } from "./rideHelpers";

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

  return (
    <div
      onClick={() => onOpenDetail(r)}
      className={`relative overflow-hidden rounded-2xl border border-dashed p-5 pt-4 flex flex-col gap-3.5 cursor-pointer transition-all hover:-translate-y-1 ${
        dark ? "bg-black/60 border-white/25" : "bg-white/60 border-[#ddd]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border ${
          dark ? "border-white/40 text-white/60 bg-black/40" : "border-[#ccc] text-[#999] bg-[#f6f7fb]"
        }`}>
          🗑️ Removed
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
          <p className={`text-sm font-bold truncate ${dark ? "text-white/70" : "text-[#666]"}`}>{r.from_place}</p>
          <p className={`text-xs mt-2 truncate ${dark ? "text-white/40" : "text-[#aaa]"}`}>{r.to_place}</p>
        </div>
      </div>

      <p className={`text-xs leading-relaxed ${dark ? "text-white/40" : "text-[#999]"}`}>
        Nobody confirmed this route was still active after it was accepted, so it was automatically taken down after 10 days.
      </p>

      <button
        onClick={(e) => { e.stopPropagation(); onRecover(r.id); }}
        className={`w-full text-xs font-bold py-2.5 rounded-xl cursor-pointer border transition-colors ${
          dark
            ? "border-white text-white bg-black hover:bg-white hover:text-black"
            : "border-[#ff2d55] text-[#ff2d55] bg-white hover:bg-[#fff0f3]"
        }`}
      >
        ↺ Recover this route
      </button>
    </div>
  );
}
