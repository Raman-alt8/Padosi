// RouteMiniMap.jsx
// Small decorative route visualizer for RideDetailPage. Not a real map —
// Padosi has no maps API/key configured — but a stylized abstract route
// (dotted road, start/end pins, place labels) so a route reads visually
// before the person gets to the text details below. Props are shaped the
// way a real map embed would need (from, to, dark), so swapping this out
// for a real MapEmbed later is a one-file change, nothing else touches it.
export default function RouteMiniMap({ from, to, dark, accent = "#ff2d55" }) {
  return (
    <div className={`relative rounded-2xl border overflow-hidden ${dark ? "border-white/20" : "border-[#eee]"}`}>
      <svg viewBox="0 0 400 140" className="w-full h-[140px] block" preserveAspectRatio="none">
        <defs>
          <pattern id="rdm-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill={dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"} />
          </pattern>
          <linearGradient id="rdm-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={dark ? "#000000" : "#fafbff"} />
            <stop offset="100%" stopColor={dark ? "#0a0a0a" : "#eef0fa"} />
          </linearGradient>
        </defs>

        <rect width="400" height="140" fill="url(#rdm-fade)" />
        <rect width="400" height="140" fill="url(#rdm-grid)" />

        {/* Route path — gentle S-curve from start pin to end pin */}
        <path
          d="M 46 100 C 130 100, 110 40, 200 40 S 320 90, 354 40"
          fill="none"
          stroke={dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.18)"}
          strokeWidth="3"
          strokeDasharray="1 10"
          strokeLinecap="round"
        />

        {/* Start pin — filled, with a soft outer ring */}
        <circle cx="46" cy="100" r="12" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.35" />
        <circle cx="46" cy="100" r="7" fill={accent} />

        {/* End pin — hollow ring so start/end read differently at a glance */}
        <circle cx="354" cy="40" r="7" fill={dark ? "#000000" : "#ffffff"} stroke={accent} strokeWidth="2.5" />
      </svg>

      {/* Place labels overlaid near each pin */}
      <div className="absolute left-[7%] bottom-3 max-w-[40%]">
        <span className={`inline-block text-[11px] font-bold px-2 py-1 rounded-lg truncate ${
          dark ? "bg-black/70 text-white border border-white/20" : "bg-white/90 text-[#111] border border-[#eee] shadow-sm"
        }`}>
          {from}
        </span>
      </div>
      <div className="absolute right-[7%] top-3 max-w-[40%] text-right">
        <span className={`inline-block text-[11px] font-bold px-2 py-1 rounded-lg truncate ${
          dark ? "bg-black/70 text-white border border-white/20" : "bg-white/90 text-[#111] border border-[#eee] shadow-sm"
        }`}>
          {to}
        </span>
      </div>
    </div>
  );
}