// RideCompletePage.jsx
import { useState, useEffect } from "react";

// Self-managed overlay — opens on "padosi:openRideComplete" (fired by
// RideCard.jsx / RideDetailPage.jsx when the poster taps "Complete Ride"
// on a route someone accepted). Same pattern as WishlistPage/ChatPage/
// AccountDetailPage: mounted once at the root (see Padosi.jsx) and drives
// its own open/closed state off a window event rather than being
// controlled by a parent's state, so it's reachable from anywhere a route
// card renders.
export default function RideCompletePage({ dark }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    function handleOpen(e) {
      setDetails(e.detail || null);
      setOpen(true);
    }
    window.addEventListener("padosi:openRideComplete", handleOpen);
    return () => window.removeEventListener("padosi:openRideComplete", handleOpen);
  }, []);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    setDetails(null);
  };

  return (
    <div
      className={`fixed inset-0 z-[6000] flex flex-col items-center justify-center px-6 text-center ${
        dark ? "bg-black text-white" : "bg-[#f6f7fb] text-[#111]"
      }`}
    >
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6 ${
          dark ? "bg-white/10" : "bg-[#fff0f3]"
        }`}
      >
        🎉
      </div>

      <h1 className="text-2xl font-black mb-2">Ride complete!</h1>
      <p className={`text-sm max-w-xs leading-relaxed ${dark ? "text-white/60" : "text-[#777]"}`}>
        Thanks for helping a neighbour get where they needed to go.
      </p>

      {details?.fromPlace && details?.toPlace && (
        <p
          className={`text-xs font-semibold mt-4 px-4 py-2 rounded-full border whitespace-nowrap ${
            dark ? "border-white/20 text-white/70" : "border-[#eee] text-[#999] bg-white"
          }`}
        >
          {details.fromPlace} → {details.toPlace}
        </p>
      )}

      <p className={`text-xs mt-10 max-w-xs leading-relaxed ${dark ? "text-white/40" : "text-[#aaa]"}`}>
        Thanks for using Padosi to connect with the people around you. 💛
      </p>

      <button
        onClick={close}
        className={`mt-8 px-8 py-3 rounded-xl font-bold text-sm cursor-pointer border-none transition-opacity hover:opacity-90 ${
          dark ? "bg-white text-black" : "bg-[#ff2d55] text-white"
        }`}
      >
        Done
      </button>
    </div>
  );
}
