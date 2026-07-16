// RouteMiniMap.jsx
// Small decorative route visualizer for RideDetailPage. Not a real map —
// Padosi has no maps API/key configured — but styled to read as a
// navigation preview rather than an illustration: single mode-accent color
// throughout (no more two-tone gradient — matches the "one accent per
// page" direction below), a thicker layered path with a soft ambient glow,
// a larger dot traveling the route, and START/DESTINATION labels that
// fade + rise in on mount instead of appearing instantly.
import { useState, useEffect } from "react";

export default function RouteMiniMap({ from, to, dark, mode = "partner" }) {
  const isRide = mode === "ride";
  const ACCENT = isRide ? (dark ? "#60a5fa" : "#2563eb") : (dark ? "#34d399" : "#059669");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const routeD = "M 40 130 C 110 130 140 90 190 82 C 240 74 270 50 360 30";

  return (
    <div className={`relative rounded-2xl overflow-hidden ${dark ? "" : "shadow-sm"}`}>
      <svg viewBox="0 0 400 190" className="w-full h-[190px] block" preserveAspectRatio="none">
        <defs>
          <linearGradient id="rdm-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={dark ? "#141414" : "#fafbff"} />
            <stop offset="100%" stopColor={dark ? "#0a0a0a" : "#eef0fa"} />
          </linearGradient>

          <radialGradient id="rdm-glow" cx="55%" cy="55%" r="65%">
            <stop offset="0%" stopColor={ACCENT} stopOpacity={dark ? "0.14" : "0.10"} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </radialGradient>

          <linearGradient id="rdm-edge-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#000" stopOpacity="0" />
            <stop offset="8%" stopColor="#fff" stopOpacity="1" />
            <stop offset="92%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <mask id="rdm-edge-mask">
            <rect x="0" y="0" width="400" height="190" fill="url(#rdm-edge-grad)" />
          </mask>

          <clipPath id="rdm-reveal">
            <rect x="0" y="0" width="0" height="190">
              <animate attributeName="width" from="0" to="400" dur="1.3s" begin="0s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1" />
            </rect>
          </clipPath>
        </defs>

        <rect width="400" height="190" fill="url(#rdm-bg)" />
        <rect width="400" height="190" fill="url(#rdm-glow)" />

        {/* Faint abstract background roads — atmosphere only */}
        <g stroke={dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"} strokeWidth="1.5" fill="none">
          <path d="M -10 50 C 110 25, 230 65, 410 35" />
          <path d="M -10 155 C 130 175, 270 125, 410 165" />
        </g>

        <g mask="url(#rdm-edge-mask)">
          <g clipPath="url(#rdm-reveal)">
            {/* Wide soft underlay — the "layered" road feel */}
            <path d={routeD} fill="none" stroke={ACCENT} strokeOpacity="0.16" strokeWidth="15" strokeLinecap="round" />
            {/* Thicker road-dash line on top */}
            <path d={routeD} fill="none" stroke={ACCENT} strokeWidth="4.5" strokeLinecap="round" strokeDasharray="20 11" />
          </g>

          {/* Larger moving dot */}
          <circle r="6" fill={dark ? "#0a0a0a" : "#ffffff"} stroke={ACCENT} strokeWidth="3">
            <animateMotion path={routeD} dur="4.5s" begin="1.3s" repeatCount="indefinite" rotate="auto" />
          </circle>
        </g>

        {/* Start pin — glow → solid → white core */}
        <circle cx="40" cy="130" r="20" fill={ACCENT} opacity="0.16" />
        <circle cx="40" cy="130" r="10" fill={ACCENT} />
        <circle cx="40" cy="130" r="3.5" fill="#ffffff" />

        {/* Destination pin — pulsing glow → ring → solid core */}
        <circle cx="360" cy="30" r="20" fill={ACCENT} opacity="0.14" />
        <circle cx="360" cy="30" r="10" fill={ACCENT} opacity="0">
          <animate attributeName="r" values="10;20;10" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="360" cy="30" r="9" fill={dark ? "#0a0a0a" : "#ffffff"} stroke={ACCENT} strokeWidth="3" />
        <circle cx="360" cy="30" r="3.5" fill={ACCENT} />
      </svg>

      {/* Floating labels — eyebrow + place name, fade/rise in on mount */}
      <div
        className={`absolute left-[6%] bottom-4 max-w-[42%] transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <div className={`px-3 py-2 rounded-xl backdrop-blur-sm shadow-md ${dark ? "bg-black/60" : "bg-white/85"}`}>
          <p className={`text-[9px] font-bold uppercase tracking-wider ${dark ? "text-white/50" : "text-[#999]"}`}>Start</p>
          <p className={`text-[12px] font-bold truncate ${dark ? "text-white" : "text-[#111]"}`}>{from}</p>
        </div>
      </div>
      <div
        className="absolute right-[6%] top-4 max-w-[42%] text-right transition-all duration-700 ease-out"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(-6px)",
          transitionDelay: mounted ? "150ms" : "0ms",
        }}
      >
        <div className={`px-3 py-2 rounded-xl backdrop-blur-sm shadow-md inline-block ${dark ? "bg-black/60" : "bg-white/85"}`}>
          <p className={`text-[9px] font-bold uppercase tracking-wider ${dark ? "text-white/50" : "text-[#999]"}`}>Destination</p>
          <p className={`text-[12px] font-bold truncate ${dark ? "text-white" : "text-[#111]"}`}>{to}</p>
        </div>
      </div>
    </div>
  );
}