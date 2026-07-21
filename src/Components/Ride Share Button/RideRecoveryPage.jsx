// RideRecoveryPage.jsx
import { useEffect, useState } from "react";
import { modeOf, freqLabel } from "./rideHelpers";
import { IconArrowLeft } from "./RideIcons";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Same 11-day-from-accepted_at threshold as RideRecoveryCard.jsx — see
// RideCard.jsx for the full reasoning. Kept in sync by hand, same as the
// FlatlineIcon duplication noted below.
const ACCEPTED_HARD_DELETE_AFTER_DAYS = 11;

function daysSinceAcceptance(route) {
  if (!route?.accepted_at) return 0;
  return (Date.now() - new Date(route.accepted_at).getTime()) / MS_PER_DAY;
}

// Same flatline icon as RideRecoveryCard.jsx, scaled up — kept in sync by
// hand since these two files don't share an icon module in this pass. If
// it's touched here, mirror the change there too.
function FlatlineIcon({ className = "w-7 h-7" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h3l2-7 3 14 2-11 1.5 4H22" />
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

// A mostly-flat rule with one small blip in it — used as the section
// divider throughout this page instead of a plain line, so the "went
// quiet" motif from the hero icon shows up again on the way down the
// page rather than living in exactly one spot.
function FlatlineDivider({ dark }) {
  return (
    <svg viewBox="0 0 400 16" preserveAspectRatio="none" className="w-full h-4 my-6" aria-hidden="true">
      <path
        d="M0 8 H160 L170 2 L182 14 L192 8 H400"
        fill="none"
        stroke={dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.1)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
// RideCompletePage, which needed to be reachable from anywhere). The
// header below intentionally mirrors RideDetailPage's header shape so
// this reads as part of the same family of overlays.
export default function RideRecoveryPage({ open, route, dark, onClose, onRecover, onAcceptedHardExpire }) {
  // Hooks run every render regardless of open/route, same reasoning as the
  // days-since-activity hooks in RideDetailPage.jsx — the early return
  // below has to come after this, not before.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!open) { setSettled(false); return; }
    const raf = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(raf);
  }, [open, route?.id]);

  // Same guard/reasoning as RideRecoveryCard.jsx — keeps the 11-day clock
  // running while a lapsed route is open in this full-screen view too,
  // rather than only while it's sitting as a card in the grid. Hoisted
  // above the early return below for the same hooks-order reason as the
  // effect above; no-ops via `!!route` when the overlay is closed.
  const isHardExpired = !!route && !route.isDemo && daysSinceAcceptance(route) >= ACCEPTED_HARD_DELETE_AFTER_DAYS;
  useEffect(() => {
    if (isHardExpired) {
      onAcceptedHardExpire?.(route.id);
    }
  }, [isHardExpired, route?.id, onAcceptedHardExpire]);

  if (!open || !route) return null;

  const mode = modeOf(route);

  const timelineSteps = [
    { label: "Posted" },
    { label: "Accepted" },
    { label: "Inactive for 10 days" },
    { label: "Lapsed", date: formatDate(route.expired_at), final: true },
  ];

  return (
    <div className={`fixed inset-0 z-[5500] flex flex-col overflow-hidden ${dark ? "bg-black text-white" : "bg-[#f6f7fb] text-[#111]"}`}>

      {/* Header */}
      <div className={`h-[72px] shrink-0 flex items-center justify-between px-5 border-b ${
        dark ? "bg-black border-white/10" : "bg-white border-[#eee]"
      }`}>
        <button
          onClick={onClose}
          aria-label="Back"
          className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
            dark ? "text-white/70 hover:bg-white/10" : "text-[#333] hover:bg-black/5"
          }`}
        >
          <IconArrowLeft className="w-5 h-5" />
        </button>
        <p className={`text-base font-bold ${dark ? "text-white" : "text-[#111]"}`}>Route Recovery</p>
        {/* Spacer matching the back button's footprint so the title stays
            visually centered — there's no second action to balance it. */}
        <div className="w-10 h-10" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-lg mx-auto">
          <div
            className={`relative overflow-hidden rounded-2xl border p-6 text-center transition-all duration-500 ease-out ${
              settled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            } ${dark ? "border-white/20" : "border-[#eee] bg-white"}`}
            style={{
              backgroundImage: dark
                ? "repeating-linear-gradient(135deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 12px)"
                : "repeating-linear-gradient(135deg, rgba(0,0,0,0.015) 0px, rgba(0,0,0,0.015) 1px, transparent 1px, transparent 12px)",
            }}
          >
            {/* Hero icon with a couple of faded rings behind it — a
                signal that's gone quiet and stopped radiating, echoing
                the flatline shape at its center. */}
            <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <span className={`absolute inset-0 rounded-full border ${dark ? "border-blue-400/10" : "border-blue-300/20"}`} />
              <span className={`absolute inset-3 rounded-full border ${dark ? "border-blue-400/15" : "border-blue-300/30"}`} />
              <div className={`relative w-14 h-14 rounded-full flex items-center justify-center ${
                dark ? "bg-blue-400/10 text-blue-300" : "bg-blue-50 text-blue-600"
              }`}>
                <FlatlineIcon />
              </div>
            </div>

            <h1 className="text-xl font-black mb-2">This route lapsed</h1>
            <p className={`text-sm leading-relaxed ${dark ? "text-white/60" : "text-[#777]"}`}>
              It lapsed because no activity was confirmed within 10 days of being accepted.
            </p>

            <FlatlineDivider dark={dark} />

            {/* ── Route summary — built to look like the original ride
                card, so it's immediately recognizable which route this is
                before you commit to renewing it. ── */}
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

            <FlatlineDivider dark={dark} />

            {/* ── Status timeline ── */}
            <div className="text-left">
              {timelineSteps.map((step, i) => {
                const isLast = i === timelineSteps.length - 1;
                return (
                  <div key={step.label} className="flex items-stretch gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        step.final
                          ? dark ? "bg-blue-400 text-black" : "bg-blue-500 text-white"
                          : dark ? "bg-white/15 text-white/70" : "bg-[#eee] text-[#888]"
                      }`}>
                        <CheckIcon />
                      </span>
                      {!isLast && <span className={`w-0.5 flex-1 my-1 ${dark ? "bg-white/15" : "bg-[#eee]"}`} />}
                    </div>
                    <div className={isLast ? "pb-1" : "pb-4"}>
                      <p className={`text-sm font-bold ${
                        step.final ? (dark ? "text-blue-300" : "text-blue-600") : dark ? "text-white/70" : "text-[#555]"
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
                Recover to reopen.
              </p>
            </div>

            <FlatlineDivider dark={dark} />

            <p className={`text-xs leading-relaxed ${dark ? "text-white/40" : "text-[#aaa]"}`}>
              Recovering un-hides this route and keeps everyone who already responded to it — it does not reset the deletion clock. If it's not recovered within 1 day of lapsing (11 days after acceptance), it's gone for good.
            </p>

            <button
              onClick={() => onRecover(route.id)}
              className={`mt-6 w-full py-3 rounded-xl font-bold text-sm cursor-pointer border-none transition-all active:scale-[0.98] hover:opacity-90 ${
                dark ? "bg-white text-black" : "bg-blue-500 text-white"
              }`}
            >
              ↺ Recover Route
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}