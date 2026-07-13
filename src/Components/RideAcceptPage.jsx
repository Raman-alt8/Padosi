import { useState, useEffect } from "react";
import MessageSellerButton from "./MessageSellerButton";

function initials(name = "") {
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Ride Accept Page ─────────────────────────────────────────────────────
// Opens as a full-screen overlay on top of RideSharePage, the same way
// RidePostFormPage does. This exists so that accepting a route never grows
// the card it was clicked from — all the "how many seats / what's my share /
// here's the poster's contact" content lives here instead, in a fixed
// layout of its own.
//
// Two steps:
//   "review"    — pick seat count, see your contribution, add an optional
//                 note, then Confirm.
//   "confirmed" — the poster's contact info + chat button, shown after a
//                 successful accept (or immediately, if reopened for a
//                 route you already accepted).
//
// Props:
//   open            — boolean, whether to render
//   route           — the ride route object this page is acting on
//   currentUser     — passed through in case future features need it
//   dark            — boolean
//   showToast       — (msg: string) => void
//   onClose         — () => void, called on Back/Cancel/Done
//   onConfirmAccept — async (routeId, seats, note) => { poster_contact }
//                     Left to the parent so the real API call / demo
//                     local-state logic stays in one place (RideSharePage).
//   initialStep     — "review" | "confirmed" — "confirmed" when reopening
//                     an already-accepted route just to see contact info.
//   initialSeats    — seat count to preselect (previously booked count, or 1)
//   initialNote     — note to preselect, if any
export default function RideAcceptPage({
  open,
  route,
  currentUser,
  dark,
  showToast,
  onClose,
  onConfirmAccept,
  initialStep = "review",
  initialSeats = 1,
  initialNote = "",
}) {
  const [step, setStep]             = useState(initialStep);
  const [seats, setSeats]           = useState(initialSeats);
  const [note, setNote]             = useState(initialNote);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [confirmedInfo, setConfirmedInfo] = useState(null);

  // Reset local state whenever a new route is opened (or the same route is
  // reopened) so stale seat counts / notes from a previous card never leak in.
  useEffect(() => {
    if (!open || !route) return;
    const maxSeats = route.seats || 1;
    setStep(initialStep);
    setSeats(Math.min(Math.max(initialSeats, 1), maxSeats));
    setNote(initialNote);
    setError("");
    setConfirmedInfo(
      initialStep === "confirmed"
        ? { poster_contact: route.poster_contact, seats: initialSeats }
        : null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, route?.id]);

  if (!open || !route) return null;

  const perSeat  = route.price || 0;
  const maxSeats = route.seats || 1;
  const total    = perSeat * seats;
  const posterFirstName = route.poster_name?.split(" ")[0] || "poster";

  const adjustSeats = (delta) => {
    setSeats(s => Math.min(Math.max(s + delta, 1), maxSeats));
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError("");
    try {
      const result = await onConfirmAccept(route.id, seats, note.trim());
      setConfirmedInfo({
        poster_contact: result?.poster_contact || route.poster_contact,
        seats,
      });
      setStep("confirmed");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Could not accept this route. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const contact     = confirmedInfo?.poster_contact || route.poster_contact;
  const bookedSeats = confirmedInfo?.seats ?? seats;

  return (
    <div className={`fixed inset-0 z-[5100] flex flex-col overflow-hidden ${dark ? "bg-black" : "bg-[#f6f7fb]"}`}>

      {/* ── Header — same h-[80px]/sticky/border pattern as RideSharePage,
          but a 3-column grid so the title stays truly centered without a
          second real button on the right. ── */}
      <div className={`h-[80px] shrink-0 grid grid-cols-[auto_1fr_auto] items-center gap-2 px-6 sticky top-0 z-10 border-b ${
        dark ? "bg-black border-white" : "bg-white border-[#eee]"
      }`}>
        <button
          onClick={onClose}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors justify-self-start ${
            dark
              ? "bg-black border-white text-white hover:bg-white hover:text-black"
              : "bg-white border-[#ddd] text-[#333] hover:border-[#ff2d55] hover:text-[#ff2d55]"
          }`}
        >
          ← {step === "confirmed" ? "Close" : "Back"}
        </button>
        <p className={`text-lg font-black text-center truncate ${dark ? "text-white" : "text-[#111]"}`}>
          {step === "confirmed" ? "You're in! 🎉" : "Review & Accept"}
        </p>
        <span />
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[560px] mx-auto flex flex-col gap-5">

          {/* Route summary — always visible, same visual language as the card */}
          <div className={`rounded-2xl border p-5 flex flex-col gap-3.5 ${
            dark ? "bg-black border-white" : "bg-white border-[#eee] shadow-sm"
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <span className={`w-2.5 h-2.5 rounded-full ${dark ? "bg-white" : "bg-[#ff2d55]"}`} />
                <span className={`w-0.5 h-5 ${dark ? "bg-white/30" : "bg-[#eee]"}`} />
                <span className={`w-2.5 h-2.5 rounded-full border-2 ${dark ? "border-white" : "border-[#ff2d55]"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${dark ? "text-white" : "text-[#111]"}`}>{route.from_place}</p>
                <p className={`text-xs mt-2 truncate ${dark ? "text-white/50" : "text-[#999]"}`}>{route.to_place}</p>
              </div>
              {route.isDemo && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border border-purple-300 text-purple-600 bg-purple-50">
                  Sample
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { icon: "📅", text: route.freq === "7" ? "Daily" : `${route.freq}× a week` },
                { icon: "🕐", text: route.depart_time || "—" },
                { icon: "👥", text: `${route.seats} seat${route.seats > 1 ? "s" : ""} available` },
              ].map(({ icon, text }) => (
                <span
                  key={text}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border ${
                    dark ? "border-white/40 text-white/70" : "border-[#eee] text-[#888] bg-[#f6f7fb]"
                  }`}
                >
                  {icon} {text}
                </span>
              ))}
            </div>

            <div className={`flex items-center gap-2 pt-3 border-t ${dark ? "border-white/20" : "border-[#eee]"}`}>
              <span className={`w-7 h-7 rounded-full border text-xs font-bold flex items-center justify-center ${
                dark ? "border-white text-white" : "border-[#ddd] text-[#555] bg-[#f6f7fb]"
              }`}>
                {initials(route.poster_name || "")}
              </span>
              <span className={`text-xs font-semibold ${dark ? "text-white/70" : "text-[#777]"}`}>
                Posted by {route.poster_name}
              </span>
            </div>
          </div>

          {step === "review" ? (
            <>
              {/* Seat picker */}
              <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${
                dark ? "bg-black border-white" : "bg-white border-[#eee] shadow-sm"
              }`}>
                <p className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>
                  How many seats do you need?
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => adjustSeats(-1)}
                    disabled={seats <= 1}
                    aria-label="One fewer seat"
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold cursor-pointer border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      dark ? "border-white text-white hover:bg-white hover:text-black" : "border-[#ddd] text-[#555] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                    }`}
                  >
                    −
                  </button>
                  <span className={`text-xl font-black w-8 text-center ${dark ? "text-white" : "text-[#111]"}`}>{seats}</span>
                  <button
                    onClick={() => adjustSeats(1)}
                    disabled={seats >= maxSeats}
                    aria-label="One more seat"
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold cursor-pointer border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      dark ? "border-white text-white hover:bg-white hover:text-black" : "border-[#ddd] text-[#555] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                    }`}
                  >
                    +
                  </button>
                  <span className={`text-xs ${dark ? "text-white/40" : "text-[#aaa]"}`}>
                    {maxSeats} seat{maxSeats > 1 ? "s" : ""} available
                  </span>
                </div>
              </div>

              {/* Contribution */}
              <div className={`rounded-2xl border p-5 flex flex-col gap-2.5 ${
                dark ? "bg-black border-white" : "bg-white border-[#eee] shadow-sm"
              }`}>
                {perSeat > 0 ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className={dark ? "text-white/60" : "text-[#888]"}>₹{perSeat} × {seats} seat{seats > 1 ? "s" : ""}</span>
                      <span className={dark ? "text-white/60" : "text-[#888]"}>₹{total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>Your share</span>
                      <span className={`text-xl font-black ${dark ? "text-white" : "text-[#ff2d55]"}`}>₹{total}</span>
                    </div>
                    <p className={`text-xs ${dark ? "text-white/40" : "text-[#aaa]"}`}>
                      Pay {posterFirstName} directly when you meet — Padosi doesn't process payments.
                    </p>
                  </>
                ) : (
                  <p className={`text-sm font-bold ${dark ? "text-white" : "text-[#27ae60]"}`}>
                    🎉 This is a free ride — no contribution needed.
                  </p>
                )}
              </div>

              {/* Note to poster */}
              <div className={`rounded-2xl border p-5 flex flex-col gap-2 ${
                dark ? "bg-black border-white" : "bg-white border-[#eee] shadow-sm"
              }`}>
                <label className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>
                  Add a note for {posterFirstName} <span className="font-normal opacity-60">(optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. I'll be waiting outside the main gate"
                  rows={3}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm resize-none focus:outline-none transition-colors ${
                    dark
                      ? "bg-black border-white/40 text-white placeholder-white/30 focus:border-white"
                      : "bg-white border-[#ddd] text-[#111] placeholder-[#bbb] focus:border-[#ff2d55]"
                  }`}
                />
              </div>

              {error && (
                <p className="text-xs font-semibold text-[#e0002b]">⚠️ {error}</p>
              )}
            </>
          ) : (
            <>
              {/* Confirmed — contact + chat */}
              <div className={`rounded-2xl p-5 border flex flex-col gap-2.5 ${
                dark ? "bg-white/5 border-white/20" : "bg-[#f0fff4] border-[#b2f5c8]"
              }`}>
                <p className={`text-sm font-bold ${dark ? "text-white" : "text-[#27ae60]"}`}>
                  ✅ Booked for {bookedSeats} seat{bookedSeats > 1 ? "s" : ""}
                  {perSeat > 0 ? ` · ₹${perSeat * bookedSeats} to contribute` : " · Free ride"}
                </p>
                <a
                  href={`mailto:${contact?.email || ""}?subject=Ride Share — ${route.from_place} to ${route.to_place}`}
                  className={`inline-flex items-center justify-center gap-2 text-sm font-bold py-2.5 px-3 rounded-lg border transition-colors ${
                    dark ? "border-white text-white hover:bg-white hover:text-black" : "border-[#ddd] text-[#555] bg-white hover:border-[#ff2d55] hover:text-[#ff2d55]"
                  }`}
                >
                  ✉️ Email {posterFirstName}
                </a>
                {contact?.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className={`inline-flex items-center justify-center gap-2 text-sm font-bold py-2.5 px-3 rounded-lg border transition-colors ${
                      dark ? "border-white/40 text-white/70 hover:border-white hover:text-white" : "border-[#ddd] text-[#555] bg-white hover:border-[#27ae60] hover:text-[#27ae60]"
                    }`}
                  >
                    📞 {contact.phone}
                  </a>
                )}
                <MessageSellerButton
                  listingType="ride"
                  listingId={route.id}
                  sellerId={route.poster_id}
                  sellerName={route.poster_name}
                  isDemo={route.isDemo}
                  dark={dark}
                  label={`💬 Chat with ${posterFirstName}`}
                  className={`inline-flex items-center justify-center gap-2 text-sm font-bold py-2.5 px-3 rounded-lg border cursor-pointer transition-colors ${
                    dark ? "border-white/40 text-white/70 hover:border-white hover:text-white" : "border-[#ddd] text-[#555] bg-white hover:border-[#ff2d55] hover:text-[#ff2d55]"
                  }`}
                />
              </div>
              <p className={`text-xs ${dark ? "text-white/40" : "text-[#aaa]"}`}>
                Reminder: settle your share directly with {posterFirstName} — Padosi just makes the introduction.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Footer CTA — fixed, so nothing above it ever resizes the overlay ── */}
      <div className={`shrink-0 border-t px-6 py-4 ${dark ? "bg-black border-white" : "bg-white border-[#eee]"}`}>
        <div className="max-w-[560px] mx-auto flex gap-3">
          {step === "review" ? (
            <>
              <button
                onClick={onClose}
                disabled={submitting}
                className={`flex-1 text-sm py-3 rounded-xl font-bold cursor-pointer border transition-colors disabled:opacity-50 ${
                  dark ? "border-white/40 text-white/70 bg-black hover:border-white hover:text-white" : "border-[#eee] text-[#aaa] bg-white hover:border-[#ddd] hover:text-[#999]"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className={`flex-1 text-sm py-3 rounded-xl font-bold cursor-pointer border transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 ${
                  dark ? "border-white bg-white text-black hover:shadow-[0_6px_20px_rgba(255,255,255,0.2)]" : "border-[#ff2d55] bg-[#ff2d55] text-white hover:bg-[#e0002b] hover:shadow-[0_6px_20px_rgba(255,45,85,0.25)]"
                }`}
              >
                {submitting ? "Confirming…" : `Confirm ${seats} seat${seats > 1 ? "s" : ""}`}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className={`flex-1 text-sm py-3 rounded-xl font-bold cursor-pointer border transition-all hover:-translate-y-0.5 ${
                dark ? "border-white bg-white text-black hover:shadow-[0_6px_20px_rgba(255,255,255,0.2)]" : "border-[#ff2d55] bg-[#ff2d55] text-white hover:bg-[#e0002b] hover:shadow-[0_6px_20px_rgba(255,45,85,0.25)]"
              }`}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
