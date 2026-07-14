// RouteMiniMap.jsx
// Small decorative route visualizer for RideDetailPage. Not a real map —
// Padosi has no maps API/key configured — but a stylized abstract route:
// layered glow+dash path, a dot that travels the route, glowing/pulsing
// pins, faint background roads, and a one-time "draw in" on open. All
// animation is native SVG (<animate>/<animateMotion>), no CSS keyframes,
// so the component stays a single self-contained file like the rest of
// Components/. Colors are derived from `mode` so the whole visual (path
// gradient, pin glow, moving dot) shares one palette per mode instead of
// a single flat accent hex.
export default function RouteMiniMap({ from, to, dark, mode = "partner" }) {
  // Two-tone gradient per mode — same partner=emerald / ride=blue split
  // the rest of the page's chips use, extended into a second stop for
  // richness (emerald→cyan / blue→purple).
  const [colorA, colorB] = mode === "ride"
    ? ["#3b82f6", "#a855f7"]
    : ["#059669", "#06b6d4"];

  const routeD = "M 40 120 C 110 120 130 80 180 75 C 230 70 260 45 360 35";

  return (
    <div className={`relative rounded-2xl border overflow-hidden ${dark ? "border-white/20" : "border-[#eee]"}`}>
      <svg viewBox="0 0 400 160" className="w-full h-[160px] block" preserveAspectRatio="none">
        <defs>
          <linearGradient id="rdm-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={dark ? "#000000" : "#fafbff"} />
            <stop offset="100%" stopColor={dark ? "#0a0a0a" : "#eef0fa"} />
          </linearGradient>

          <linearGradient id="rdm-route-grad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={colorA} />
            <stop offset="100%" stopColor={colorB} />
          </linearGradient>

          {/* Fades the route path (not the pins) near the left/right
              edges instead of letting it cut off abruptly. */}
          <linearGradient id="rdm-edge-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#000" stopOpacity="0" />
            <stop offset="8%" stopColor="#fff" stopOpacity="1" />
            <stop offset="92%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <mask id="rdm-edge-mask">
            <rect x="0" y="0" width="400" height="160" fill="url(#rdm-edge-grad)" />
          </mask>

          {/* One-time left-to-right reveal for the "draw in on open"
              effect — a growing clip rect instead of stroke-dashoffset,
              so the road-dash pattern below doesn't get distorted by it. */}
          <clipPath id="rdm-reveal">
            <rect x="0" y="0" width="0" height="160">
              <animate attributeName="width" from="0" to="400" dur="1.3s" begin="0s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1" />
            </rect>
          </clipPath>
        </defs>

        <rect width="400" height="160" fill="url(#rdm-bg)" />

        {/* Faint abstract background roads — replaces the old dot grid.
            Static, low-opacity, purely atmospheric. */}
        <g stroke={dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"} strokeWidth="1.5" fill="none">
          <path d="M -10 40 C 100 20, 220 60, 410 30" />
          <path d="M -10 140 C 120 160, 260 110, 410 150" />
          <path d="M -10 90 C 90 70, 300 100, 410 70" />
        </g>

        {/* Compass, low-opacity corner flourish */}
        <text x="374" y="24" fontSize="16" opacity="0.12" textAnchor="middle">🧭</text>

        {/* Route path — masked at edges, clipped for the draw-in reveal */}
        <g mask="url(#rdm-edge-mask)">
          <g clipPath="url(#rdm-reveal)">
            {/* Wide faint underlay — the "layered" feel */}
            <path d={routeD} fill="none" stroke="url(#rdm-route-grad)" strokeOpacity="0.12" strokeWidth="10" strokeLinecap="round" />
            {/* Road-dash line on top, rounded caps */}
            <path d={routeD} fill="none" stroke="url(#rdm-route-grad)" strokeWidth="3" strokeLinecap="round" strokeDasharray="16 9" />
          </g>

          {/* Moving dot — starts once the draw-in finishes */}
          <circle r="4" fill={dark ? "#ffffff" : "#ffffff"} stroke="url(#rdm-route-grad)" strokeWidth="2">
            <animateMotion path={routeD} dur="4.5s" begin="1.3s" repeatCount="indefinite" rotate="auto" />
          </circle>
        </g>

        {/* Start pin — layered glow: soft wide ring → color → white core */}
        <circle cx="40" cy="120" r="16" fill={colorA} opacity="0.15" />
        <circle cx="40" cy="120" r="9" fill={colorA} />
        <circle cx="40" cy="120" r="3" fill="#ffffff" />

        {/* End pin — layered glow + a gentle expanding pulse ring */}
        <circle cx="360" cy="35" r="16" fill={colorB} opacity="0.12" />
        <circle cx="360" cy="35" r="9" fill={colorB} opacity="0">
          <animate attributeName="r" values="9;17;9" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.45;0;0.45" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="360" cy="35" r="8" fill={dark ? "#000000" : "#ffffff"} stroke={colorB} strokeWidth="2.5" />
        <circle cx="360" cy="35" r="3" fill={colorB} />
      </svg>

      {/* Floating labels — Apple-Maps-callout style: blurred backing,
          shadow, tiny lift, pin icon. */}
      <div className="absolute left-[6%] bottom-4 max-w-[42%]">
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl truncate backdrop-blur-sm shadow-md -translate-y-0.5 ${
          dark ? "bg-black/60 text-white border border-white/20" : "bg-white/85 text-[#111] border border-white/60"
        }`}>
          📍 {from}
        </span>
      </div>
      <div className="absolute right-[6%] top-4 max-w-[42%] text-right">
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl truncate backdrop-blur-sm shadow-md -translate-y-0.5 ${
          dark ? "bg-black/60 text-white border border-white/20" : "bg-white/85 text-[#111] border border-white/60"
        }`}>
          📍 {to}
        </span>
      </div>
    </div>
  );
}