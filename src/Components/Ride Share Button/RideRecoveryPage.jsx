// RideRecoveryPage.jsx
import { modeOf, freqLabel } from "./rideHelpers";
import { IconArrowLeft } from "./RideIcons";

// Full-screen overlay opened by tapping a RideRecoveryCard. Same
// controlled-overlay pattern as RideDetailPage.jsx — parent owns
// open/route/onClose state, not a self-managed window-event listener,
// since it's only ever reachable from RideRecoveryCard (unlike
// RideCompletePage, which needed to be reachable from anywhere).
export default function RideRecoveryPage({ open, route, dark, onClose, onRecover }) {
  if (!open || !route) return null;

  const mode = modeOf(route);

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

        <div className={`mt-6 rounded-2xl border p-6 text-center ${
          dark ? "border-white/20" : "border-[#eee] bg-white"
        }`}>
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 ${
            dark ? "bg-white/10" : "bg-[#f6f7fb]"
          }`}>
            🗑️
          </div>

          <h1 className="text-xl font-black mb-2">This route was removed</h1>
          <p className={`text-sm leading-relaxed ${dark ? "text-white/60" : "text-[#777]"}`}>
            Someone accepted this route, but nobody confirmed it was still active in the 10 days after — so it was automatically taken down.
          </p>

          <div className={`mt-5 rounded-xl border px-4 py-3 text-left ${
            dark ? "border-white/15 bg-white/5" : "border-[#eee] bg-[#f6f7fb]"
          }`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${dark ? "text-white/40" : "text-[#aaa]"}`}>
              {mode === "ride" ? "Partner to share ride" : "Offering a ride"}
            </p>
            <p className="text-sm font-bold mt-1">{route.from_place} → {route.to_place}</p>
            {route.depart_time && (
              <p className={`text-xs mt-1 ${dark ? "text-white/50" : "text-[#999]"}`}>
                {freqLabel(route.freq)} · {route.depart_time}
              </p>
            )}
          </div>

          <p className={`text-xs mt-5 leading-relaxed ${dark ? "text-white/40" : "text-[#aaa]"}`}>
            Recovering it starts fresh: it goes back to being an unmatched listing, open to anyone (including whoever accepted it before), with its inactivity clock reset.
          </p>

          <button
            onClick={() => onRecover(route.id)}
            className={`mt-6 w-full py-3 rounded-xl font-bold text-sm cursor-pointer border-none transition-opacity hover:opacity-90 ${
              dark ? "bg-white text-black" : "bg-[#ff2d55] text-white"
            }`}
          >
            ↺ Recover this route
          </button>
        </div>
      </div>
    </div>
  );
}
