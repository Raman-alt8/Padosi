// RideRecoveryPage.jsx
import { useEffect, useState } from "react";
import { modeOf, freqLabel } from "./rideHelpers";
import { IconArrowLeft } from "./RideIcons";

// Same archive-box icon as RideRecoveryCard.jsx — kept in sync by hand
// since these two files don't share an icon module in this pass. If it's
// touched here, mirror the change there too.
function ArchiveIcon({ className = "w-8 h-8" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M4.5 8v9.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8" />
      <path d="M10 12.5h4" />
    </svg>
  );
}

// Small checkmark for the status timeline below.
function CheckIcon({ className = "w-3 h-3" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

// route.expired_at is the one timestamp this page can rely on existing —
// it's the field that gets a route routed here in the first place (see
// RideRecoveryCard.jsx). Posted/accepted dates aren't guaranteed to be on
// the route object, so the timeline below shows them as plain completed
// steps without dates rather than guessing at field names that might not
// exist.
function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return null;
  }
}

// Full-screen overlay opened by tapping a RideRecoveryCard. Same
// controlled-overlay pattern as RideDetailPage.jsx — parent owns
// open/route/onClose state, not a self-managed window-event listener,
// since it's only ever reachable from RideRecoveryCard (unlike
// RideCompletePage, which needed to be reachable from anywhere).
export default function RideRecoveryPage({ open, route, dark, onClose, onRecover }) {
  // Hooks run every render regardless of open/route, same reasoning as the
  // days-since-activity hooks in RideDetailPage.jsx — the early return
  // below has to come after this, not before.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!open) { setSettled(false); return; }
    const raf = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(raf);
  }, [open, route?.id]);

  if (!open || !route) return null;

  const mode = modeOf(route);

  const timelineSteps = [
    { label: "Posted" },
    { label: "Accepted" },
    { label: "Inactive for 10 days" },
    { label: "Archived", date: formatDate(route.expired_at), final: true },
  ];

  return (
    <div className={`fixed inset-0 z-[5500] overflow-y-auto ${dark ? "bg-black text-white" : "bg-[#f6f7fb] text-[#111]"}`}>
      <div className="max-w-lg mx-auto px-5 py-6">
        <button
          onClick={onClose}
          className={`inline-flex items-center gap-1.5 text-sm font-semibold cursor-pointer border-none bg-transparent ${
            dark ? "text-white/70 hover:text-white" : "text-[#777] hover:text-[#111]"
          }`}
        >
          <IconArrowLeft className="w-5 h-5" /> Back
        </button>

        <div
          className={`relative overflow-hidden mt-6 rounded-2xl border p-6 text-center transition-all duration-500 ease-out ${
            settled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          } ${dark ? "border-white/20" : "border-[#eee] bg-white"}`}
          style={{
            backgroundImage: dark
              ? "repeating-linear-gradient(135deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 12px)"
              : "repeating-linear-gradient(135deg, rgba(0,0,0,0.015) 0px, rgba(0,0,0,0.015) 1px, transparent 1px, transparent 12px)",
          }}
        >
          {/* Archived watermark, same decorative role as in RideRecoveryCard */}
          <span
            aria-hidden="true"
            className={`pointer-events-none select-none absolute -bottom-4 -right-3 text-[64px] font-black tracking-widest uppercase ${
              dark ? "text-white/[0.04]" : "text-black/[0.03]"
            }`}
            style={{ transform: "rotate(-10deg)" }}
          >
            Archived
          </span>

          {/* Everything real shares this relative wrapper so it stacks
              above the watermark — see RideRecoveryCard.jsx for the same
              trick with the same reasoning. */}
          <div className="relative">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
              dark ? "bg-amber-400/10 text-amber-300" : "bg-amber-50 text-amber-600"
            }`}>
              <ArchiveIcon />
            </div>

            <h1 className="text-xl font-black mb-2">This route was archived</h1>
            <p className={`text-sm leading-relaxed ${dark ? "text-white/60" : "text-[#777]"}`}>
              Archived because no activity was confirmed within 10 days of being accepted.
            </p>

            <div className={`h-px my-6 ${dark ? "bg-white/10" : "bg-[#eee]"}`} />

            {/* ── Route summary — deliberately built to look like the
                original ride card, so it's immediately recognizable which
                route this is before you commit to restoring it. ── */}
            <div className={`rounded-xl border overflow-hidden text-left ${dark ? "border-white/15" : "border-[#eee]"}`}>
              <div className={`px-4 py-2.5 border-b ${dark ? "border-white/10 bg-white/[0.03]" : "border-[#eee] bg-[#fafafa]"}`}>
                <span className={`text-[11px] font-bold uppercase tracking-wide ${dark ? "text-white/50" : "text-[#999]"}`}>
                  {mode === "ride" ? "Partner to share ride" : "Offering a ride"}
                </span>
              </div>
              <div className="px-4 py-4 flex items-center gap-3">
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <span className={`w-2.5 h-2.5 rounded-full ${dark ? "bg-white/50" : "bg-[#ccc]"}`} />
                  <span className={`w-0.5 h-6 ${dark ? "bg-white/15" : "bg-[#eee]"}`} />
                  <span className={`w-2.5 h-2.5 rounded-full border-2 ${dark ? "border-white/50" : "border-[#ccc]"}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-base font-black truncate ${dark ? "text-white" : "text-[#111]"}`}>{route.from_place}</p>
                  <p className={`text-sm mt-2 truncate ${dark ? "text-white/50" : "text-[#999]"}`}>{route.to_place}</p>
                </div>
              </div>
              {route.depart_time && (
                <div className={`px-4 py-2.5 border-t text-xs font-medium ${dark ? "border-white/10 text-white/50" : "border-[#eee] text-[#999]"}`}>
                  {freqLabel(route.freq)} · {route.depart_time}
                </div>
              )}
            </div>

            <div className={`h-px my-6 ${dark ? "bg-white/10" : "bg-[#eee]"}`} />

            {/* ── Status timeline ── */}
            <div className="text-left">
              {timelineSteps.map((step, i) => {
                const isLast = i === timelineSteps.length - 1;
                return (
                  <div key={step.label} className="flex items-stretch gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        step.final
                          ? dark ? "bg-amber-400 text-black" : "bg-amber-500 text-white"
                          : dark ? "bg-white/15 text-white/70" : "bg-[#eee] text-[#888]"
                      }`}>
                        <CheckIcon />
                      </span>
                      {!isLast && <span className={`w-0.5 flex-1 my-1 ${dark ? "bg-white/15" : "bg-[#eee]"}`} />}
                    </div>
                    <div className={isLast ? "pb-1" : "pb-4"}>
                      <p className={`text-sm font-bold ${
                        step.final ? (dark ? "text-amber-300" : "text-amber-700") : dark ? "text-white/70" : "text-[#555]"
                      }`}>
                        {step.label}
                      </p>
                      {step.date && (
                        <p className={`text-[11px] mt-0.5 ${dark ? "text-white/40" : "text-[#aaa]"}`}>{step.date}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              <p className={`text-xs italic mt-1 ${dark ? "text-white/40" : "text-[#aaa]"}`}>
                Restore to reopen.
              </p>
            </div>

            <div className={`h-px my-6 ${dark ? "bg-white/10" : "bg-[#eee]"}`} />

            <p className={`text-xs leading-relaxed ${dark ? "text-white/40" : "text-[#aaa]"}`}>
              Restoring reopens it as a fresh, unmatched listing — open to anyone, including whoever accepted it before — with the inactivity clock reset.
            </p>

            <button
              onClick={() => onRecover(route.id)}
              className={`mt-6 w-full py-3 rounded-xl font-bold text-sm cursor-pointer border-none transition-all active:scale-[0.98] hover:opacity-90 ${
                dark ? "bg-white text-black" : "bg-amber-500 text-white"
              }`}
            >
              ↺ Restore Route
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}