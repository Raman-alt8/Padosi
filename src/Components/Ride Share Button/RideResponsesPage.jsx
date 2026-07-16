// RideResponsesPage.jsx
import { useEffect, useState } from "react";
import { initials, freqLabel } from "./rideHelpers";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 0 1 2-2h2.28a1 1 0 0 1 .97.76l1.1 4.39a1 1 0 0 1-.29.98L7.6 10.6a12.05 12.05 0 0 0 5.8 5.8l1.47-1.46a1 1 0 0 1 .98-.29l4.39 1.1a1 1 0 0 1 .76.97V19a2 2 0 0 1-2 2h-1C9.16 21 3 14.84 3 7V5z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18v12H3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
    </svg>
  );
}

// ─── Ride Responses Page ───────────────────────────────────────────────────
// Poster-facing page. RideCard already routes here (see its onViewResponses
// call) whenever the poster taps their own card and acceptedCount > 0.
// Fetches fresh from GET /api/ride-routes/:id/responses on mount rather than
// trusting anything cached on the route object, since new acceptances can
// land at any time.
//
// Props:
//   route   — the route object the card was opened from (needs at least
//             .id, .from_place, .to_place, .freq, .depart_time, .price)
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
        const res = await fetch(`/api/ride-routes/${route.id}/responses`, {
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

  return (
    <div className={`min-h-screen ${dark ? "bg-black text-white" : "bg-[#fafafa] text-[#111]"}`}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
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
          <div className="min-w-0">
            <h1 className="text-lg font-black truncate">Who accepted your route</h1>
            <p className={`text-xs truncate ${dark ? "text-white/50" : "text-[#999]"}`}>
              {route.from_place} → {route.to_place}
            </p>
          </div>
        </div>

        {/* Route summary chips, same tag style as the card */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border ${
            dark ? "border-white/40 text-white/70" : "border-[#eee] text-[#888] bg-[#f6f7fb]"
          }`}>
            📅 {freqLabel(route.freq)}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border ${
            dark ? "border-white/40 text-white/70" : "border-[#eee] text-[#888] bg-[#f6f7fb]"
          }`}>
            🕐 {route.depart_time || "—"}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border ${
            dark ? "border-white/40 text-white/70" : "border-[#eee] text-[#888] bg-[#f6f7fb]"
          }`}>
            {route.price > 0 ? `₹${route.price}/seat` : "Free"}
          </span>
        </div>

        {/* Body */}
        {loading && (
          <div className={`text-sm text-center py-16 ${dark ? "text-white/50" : "text-[#999]"}`}>
            Loading responses…
          </div>
        )}

        {!loading && error && (
          <div className={`text-sm text-center py-16 ${dark ? "text-red-300" : "text-red-500"}`}>
            {error}
          </div>
        )}

        {!loading && !error && responses.length === 0 && (
          <div className={`text-sm text-center py-16 ${dark ? "text-white/50" : "text-[#999]"}`}>
            No one has accepted this route yet.
          </div>
        )}

        {!loading && !error && responses.length > 0 && (
          <div className="flex flex-col gap-3">
            {responses.map((p) => (
              <div
                key={p.id}
                className={`rounded-2xl border p-4 flex items-center gap-3 ${
                  dark
                    ? "bg-black border-white/20"
                    : "bg-white border-[#eee] shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
                }`}
              >
                <span className={`w-10 h-10 flex-shrink-0 rounded-full border text-sm font-bold flex items-center justify-center ${
                  dark ? "border-white text-white" : "border-[#ddd] text-[#555] bg-[#f6f7fb]"
                }`}>
                  {initials(p.full_name || "")}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{p.full_name}</p>
                  <p className={`text-xs truncate ${dark ? "text-white/50" : "text-[#999]"}`}>{p.email}</p>
                  <p className={`text-xs truncate ${dark ? "text-white/50" : "text-[#999]"}`}>
                    {p.phone || "Phone not shared"}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={`mailto:${p.email}`}
                    aria-label={`Email ${p.full_name}`}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                      dark
                        ? "border-white/30 text-white/70 hover:text-white hover:border-white"
                        : "border-[#eee] text-[#888] hover:text-[#ff2d55] hover:border-[#ff2d55]/40"
                    }`}
                  >
                    <MailIcon />
                  </a>
                  {p.phone && (
                    <a
                      href={`tel:${p.phone}`}
                      aria-label={`Call ${p.full_name}`}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                        dark
                          ? "border-white/30 text-white/70 hover:text-white hover:border-white"
                          : "border-[#eee] text-[#888] hover:text-[#27ae60] hover:border-[#27ae60]/40"
                      }`}
                    >
                      <PhoneIcon />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
