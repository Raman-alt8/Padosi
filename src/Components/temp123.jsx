// rideVisuals.jsx
// Shared visual language for the ride flow (RideDetailPage + RideAcceptPage).
// Pulled out of RideDetailPage.jsx so both pages share one source of truth
// for the mode-accent colors, card surfaces, and the journey-connector
// motif, instead of each page carrying its own copy that can drift apart.

// ── Mode-themed static class helpers ──────────────────────────────────────
// Every one of these returns a literal Tailwind class string per branch —
// never an interpolated/runtime-built string like `text-[${hex}]`.
// Tailwind's compiler scans source *text* for literal class names, so a
// dynamically assembled string silently produces no CSS in a production
// build even though it looks fine in the browser during dev. Branching on
// two known values (dark, isRide) and returning one of four fixed literal
// strings keeps every class something Tailwind can actually see and emit.
export function accentText(dark, isRide) {
  if (isRide) return dark ? "text-blue-400" : "text-blue-600";
  return dark ? "text-emerald-400" : "text-emerald-600";
}
export function accentDot(isRide) {
  return isRide ? "bg-blue-500" : "bg-emerald-500";
}
export function accentChipCls(dark, isRide) {
  if (isRide) return dark ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700";
  return dark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700";
}
export function accentSolidBtn(dark, isRide) {
  if (isRide) return dark ? "bg-blue-400 text-black hover:bg-blue-300" : "bg-blue-600 text-white hover:bg-blue-700";
  return dark ? "bg-emerald-400 text-black hover:bg-emerald-300" : "bg-emerald-600 text-white hover:bg-emerald-700";
}
export function accentBannerCls(dark, isRide) {
  if (isRide) return dark ? "bg-blue-500/10 border-blue-400" : "bg-blue-50 border-blue-500";
  return dark ? "bg-emerald-500/10 border-emerald-400" : "bg-emerald-50 border-emerald-500";
}
// Accent-colored border/focus treatment for inputs (used by the note field
// on the Accept page — Detail page has no text inputs, so this is new but
// follows the exact same two-branch literal-string pattern as the rest).
export function accentFocusBorder(dark, isRide) {
  if (isRide) return dark ? "focus:border-blue-400" : "focus:border-blue-500";
  return dark ? "focus:border-emerald-400" : "focus:border-emerald-500";
}

// Card surface classes — shadow-based differentiation instead of borders
// (the "fewer borders" direction). Dark mode substitutes a hairline border
// for the shadow (shadows don't read on near-black) and uses layered
// near-black surfaces (page #111 / card #1b1b1b / tile #242424) instead of
// pure black everywhere, so panels visibly sit above the page rather than
// blending into it.
export function cardCls(dark) {
  return dark ? "bg-[#1b1b1b] border border-white/10" : "bg-white shadow-sm";
}
export function tileCls(dark) {
  return dark ? "bg-[#242424] border border-white/10" : "bg-[#f9fafc] shadow-sm";
}

// Small vertical connector between sections — a short threaded line with a
// mode-colored waypoint dot. This is the ride flow's one signature idea:
// the route continues, quite literally, as the spine linking every section
// below it, so a page reads as one continuous journey instead of a stack
// of unrelated cards. Shared by the Detail page (map → trip details →
// about → driver) and the Accept page (journey → seats → payment →
// message → confirm) so the two feel like one experience, not two apps.
export function JourneyConnector({ height, dark, isRide }) {
  return (
    <div className="relative flex justify-center shrink-0" style={{ height }}>
      <div className={`w-px h-full ${dark ? "bg-white/10" : "bg-black/10"}`} />
      <span className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${accentDot(isRide)}`} />
    </div>
  );
}

// Small uppercase section eyebrow used above every card on both pages
// ("TRIP DETAILS", "SEATS", "PAYMENT"...) so section labels look identical
// wherever they appear.
export function SectionEyebrow({ children, dark, isRide, className = "" }) {
  return (
    <p className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${accentText(dark, isRide)} ${className}`}>
      {children}
    </p>
  );
}