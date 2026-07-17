// RideResponsesPage.jsx
import { useEffect, useState } from "react";
import { initials, freqLabel, modeOf } from "./rideHelpers";

// Same pattern RideSharePage.jsx uses — Vite exposes VITE_API_URL from .env
const API_BASE = import.meta.env.VITE_API_URL || "";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 0 1 2-2h2.28a1 1 0 0 1 .97.76l1.1 4.39a1 1 0 0 1-.29.98L7.6 10.6a12.05 12.05 0 0 0 5.8 5.8l1.47-1.46a1 1 0 0 1 .98-.29l4.39 1.1a1 1 0 0 1 .76.97V19a2 2 0 0 1-2 2h-1C9.16 21 3 14.84 3 7V5z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18v12H3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
    </svg>
  );
}

// Three pulsing placeholder rows, same shape as a real response card, shown
// while the fetch is in flight instead of a bare "Loading…" line.
function ResponseCardSkeleton({ dark }) {
  const shimmer = dark ? "bg-white/10" : "bg-[#eee]";
  return (
    <div className={`flex flex-col gap-3`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`rounded-2xl border p-4 animate-pulse ${
            dark ? "bg-black border-white/10" : "bg-white border-[#eee]"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className={`w-12 h-12 rounded-full flex-shrink-0 ${shimmer}`} />
            <div className="flex-1 flex flex-col gap-2">
              <span className={`h-3 w-1/3 rounded ${shimmer}`} />
              <span className={`h-2.5 w-1/2 rounded ${shimmer}`} />
            </div>
          </div>
          <span className={`block h-2.5 w-1/3 rounded mb-3 ${shimmer}`} />
          <span className={`block h-8 rounded-xl ${shimmer}`} />
        </div>
      ))}
    </div>
  );
}

// ─── Ride Responses Page ───────────────────────────────────────────────────
// Poster-facing page. RideCard already routes here (see its onViewResponses
// call) whenever the poster taps the explicit "N accepted — View responses"
// button on their own card. Fetches fresh from
// GET /api/ride-routes/:id/responses on mount rather than trusting anything
// cached on the route object, since new acceptances can land at any time.
//
// Props:
//   route   — the route object the card was opened from (needs at least
//             .id, .from_place, .to_place, .freq, .depart_time, .price,
//             and — for the "seats available" footer line — .mode/.seats)
//   dark    — boolean, theme flag
//   onBack  — () => void, closes this page and returns to the grid
export default function RideResponsesPage({ route, dark, onBack }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/ride-routes/${route.id}/responses`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load responses.");
        if (!cancelled) setResponses(data.responses || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load responses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [route.id]);

  const count = responses.length;
  const isPartner = modeOf(route) === "partner";
  const seatsLeft = isPartner && route.seats != null
    ? Math.max(0, Number(route.seats) - count)
    : null;

  return (
    <div className={`fixed inset-0 z-[5500] overflow-y-auto ${dark ? "bg-black text-white" : "bg-[#fafafa] text-[#111]"}`}>
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={onBack}
            aria-label="Back"
            className={`w-9 h-9 rounded-full flex items-center justify-center border cursor-pointer transition-colors flex-shrink-0 ${
              dark
                ? "border-white/30 text-white hover:bg-white/10"
                : "border-[#eee] text-[#555] hover:bg-[#f0f0f0]"
            }`}
          >
            <BackIcon />
          </button>
          <p className={`text-xs font-bold uppercase tracking-wide ${dark ? "text-white/50" : "text-[#999]"}`}>
            Route responses
          </p>
        </div>

        {/* Hero: journey connector + response count, same visual language
            as RideCard's own from/to block */}
        <div className={`rounded-2xl border p-5 mb-5 ${
          dark ? "bg-black border-white" : "bg-white border-[#eee] shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
        }`}>
          <p className={`text-xs font-bold uppercase tracking-wide mb-4 ${dark ? "text-white/50" : "text-[#999]"}`}>
            Who accepted your ride
          </p>

          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <span className={`w-2.5 h-2.5 rounded-full ${dark ? "bg-white" : "bg-[#ff2d55]"}`} />
              <span className={`w-0.5 h-6 ${dark ? "bg-white/30" : "bg-[#eee]"}`} />
              <span className={`w-2.5 h-2.5 rounded-full border-2 ${dark ? "border-white" : "border-[#ff2d55]"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-base font-bold truncate ${dark ? "text-white" : "text-[#111]"}`}>{route.from_place}</p>
              <p className={`text-sm mt-2 truncate ${dark ? "text-white/50" : "text-[#999]"}`}>{route.to_place}</p>
            </div>
          </div>

          {!loading && !error && count > 0 && (
            <p className={`text-lg font-black ${dark ? "text-white" : "text-[#27ae60]"}`}>
              {count} {count === 1 ? "person" : "people"} accepted
            </p>
          )}
        </div>

        {/* Route summary chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold border ${
            dark ? "border-white/40 text-white/70" : "border-[#eee] text-[#888] bg-[#f6f7fb]"
          }`}>
            📅 {freqLabel(route.freq)}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold border ${
            dark ? "border-white/40 text-white/70" : "border-[#eee] text-[#888] bg-[#f6f7fb]"
          }`}>
            🕐 {route.depart_time || "—"}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold border ${
            dark ? "border-white text-white bg-white/10" : "border-[#ff2d55]/30 text-[#ff2d55] bg-[#fff0f3]"
          }`}>
            {route.price > 0 ? `₹${route.price}/seat` : "Free"}
          </span>
        </div>

        {/* Body */}
        {loading && <ResponseCardSkeleton dark={dark} />}

        {!loading && error && (
          <div className={`text-sm text-center py-16 ${dark ? "text-red-300" : "text-red-500"}`}>
            {error}
          </div>
        )}

        {!loading && !error && count === 0 && (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <span className="text-5xl">🚗</span>
            <strong className={`text-base ${dark ? "text-white/40" : "text-[#bbb]"}`}>
              No responses yet
            </strong>
            <span className={`text-sm ${dark ? "text-white/30" : "text-[#ccc]"}`}>
              People who accept your ride will appear here.
            </span>
          </div>
        )}

        {!loading && !error && count > 0 && (
          <>
            <div className="flex flex-col gap-3">
              {responses.map((p) => (
                <div
                  key={p.id}
                  className={`relative overflow-hidden rounded-2xl border p-4 pl-5 transition-all hover:-translate-y-0.5 ${
                    dark
                      ? "bg-black border-white/20 hover:shadow-[0_10px_28px_rgba(255,255,255,0.08)]"
                      : "bg-white border-[#eee] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)]"
                  }`}
                >
                  {/* Accent bar — this route has at least one acceptance,
                      same green/white accent RideCard uses for that state */}
                  <span className={`absolute top-0 left-0 bottom-0 w-1 ${dark ? "bg-white" : "bg-[#27ae60]"}`} />

                  {/* Status badge */}
                  <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                    dark ? "border-white/60 text-white bg-black/60" : "border-[#b2f5c8] text-[#27ae60] bg-[#f0fff4]"
                  }`}>
                    Accepted ✓
                  </span>

                  <div className="flex items-center gap-3 mb-3 pr-20">
                    <span className={`w-12 h-12 flex-shrink-0 rounded-full border-2 text-base font-bold flex items-center justify-center bg-gradient-to-br ${
                      dark
                        ? "from-white/20 to-white/5 border-white text-white"
                        : "from-[#ffe1e8] to-[#fff0f3] border-[#ff2d55]/30 text-[#ff2d55]"
                    }`}>
                      {initials(p.full_name || "")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{p.full_name}</p>
                      <p className={`text-xs truncate ${dark ? "text-white/50" : "text-[#999]"}`}>{p.email}</p>
                    </div>
                  </div>

                  <p className={`text-xs mb-3 flex items-center gap-1.5 ${dark ? "text-white/60" : "text-[#777]"}`}>
                    <PhoneIcon /> {p.phone || "Phone not shared"}
                  </p>

                  <div className={`flex gap-2 pt-3 border-t ${dark ? "border-white/20" : "border-[#eee]"}`}>
                    {p.phone && (
                      <a
                        href={`tel:${p.phone}`}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl border transition-colors ${
                          dark
                            ? "bg-white/10 text-white border-white/30 hover:bg-white/20"
                            : "bg-[#f0fff4] text-[#27ae60] border-[#b2f5c8] hover:bg-[#e3fbe9]"
                        }`}
                      >
                        <PhoneIcon /> Call
                      </a>
                    )}
                    <a
                      href={`mailto:${p.email}`}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl transition-colors ${
                        dark ? "bg-white text-black hover:bg-white/90" : "bg-[#ff2d55] text-white hover:bg-[#e0002b]"
                      }`}
                    >
                      <MailIcon /> Email
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer summary */}
            <div className={`mt-6 pt-4 border-t flex items-center justify-between ${dark ? "border-white/20" : "border-[#eee]"}`}>
              <span className={`text-sm font-bold ${dark ? "text-white/80" : "text-[#555]"}`}>
                {count} {count === 1 ? "rider" : "riders"} accepted
              </span>
              {seatsLeft !== null && (
                <span className={`text-xs font-semibold ${dark ? "text-white/50" : "text-[#999]"}`}>
                  Seats available: {seatsLeft}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}