import { useState, useEffect } from "react";
import MessageSellerButton from "./MessageSellerButton";
import { initials, freqLabel, genderLabel, vehicleTypesOf, modeOf } from "./rideHelpers";
import { IconArrowLeft, IconArrowRight, IconUsers, IconCheck } from "./RideIcons";
import {
  accentText, accentDot, accentChipCls, accentSolidBtn, accentBannerCls,
  accentFocusBorder, cardCls, tileCls, JourneyConnector, SectionEyebrow,
} from "./";

// Vehicle emoji for the route-summary chip strip. Kept local (not folded
// into rideHelpers) because it's purely presentational — the actual vehicle
// list comes from the shared vehicleTypesOf() helper.
const VEHICLE_META = {
  car:  { icon: "🚗", label: "Car" },
  bike: { icon: "🏍️", label: "Bike" },
};

// ─── Ride Accept Page ─────────────────────────────────────────────────────
// Full-screen overlay on top of RideSharePage, same pattern as
// RidePostFormPage / RideDetailPage. Now shares its visual language
// (accent colors, card surfaces, JourneyConnector, SectionEyebrow) with
// RideDetailPage via ./rideVisuals, so accepting a ride reads as a
// continuation of the same flow instead of a differently-styled page.
// No functional change from the previous version — same props, same
// state, same handlers, only the render layer changed.
//
// Handles both post-form modes:
//   "partner" — poster is offering their vehicle. Acceptor books seats and
//               owes a per-seat contribution.
//   "ride"    — poster has no vehicle and needs a lift. Acceptor is offering
//               to be the driver, so there's no seat count to pick — it's
//               framed as agreeing to drive them, and the price (if any) is
//               what the poster is offering to pay, not "your share".
//
// Two steps:
//   "review"    — pick seat count (partner mode only), see your contribution
//                 / their offer, add an optional note, then Confirm.
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
//   initialStep     — "review" | "confirmed"
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

  const isRideMode = modeOf(route) === "ride";

  // Reset local state whenever a new route is opened (or the same route is
  // reopened) so stale seat counts / notes from a previous card never leak in.
  useEffect(() => {
    if (!open || !route) return;
    const maxSeats = route.mode === "ride" ? 1 : (route.seats || 1);
    setStep(initialStep);
    setSeats(route.mode === "ride" ? 1 : Math.min(Math.max(initialSeats, 1), maxSeats));
    setNote(initialNote);
    setError("");
    setConfirmedInfo(
      initialStep === "confirmed"
        ? { poster_contact: route.poster_contact, seats: route.mode === "ride" ? 1 : initialSeats }
        : null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, route?.id]);

  if (!open || !route) return null;

  const perSeat  = route.price || 0;
  const maxSeats = isRideMode ? 1 : (route.seats || 1);
  const total    = perSeat * seats;
  const posterFirstName = route.poster_name?.split(" ")[0] || "poster";
  const freqText = freqLabel(route.freq);
  const vehicleTypes = vehicleTypesOf(route);
  const genderTag = genderLabel(route.gender_pref);

  const adjustSeats = (delta) => {
    setSeats(s => Math.min(Math.max(s + delta, 1), maxSeats));
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError("");
    try {
      const seatsToSend = isRideMode ? 1 : seats;
      const result = await onConfirmAccept(route.id, seatsToSend, note.trim());
      setConfirmedInfo({
        poster_contact: result?.poster_contact || route.poster_contact,
        seats: seatsToSend,
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

  const headerTitle = step === "confirmed"
    ? (isRideMode ? "You're all set! 🎉" : "You're in! 🎉")
    : (isRideMode ? "Review & Offer" : "Review & Accept");

  return (
    <div className={`fixed inset-0 z-[5100] flex flex-col overflow-hidden ${dark ? "bg-[#111111]" : "bg-[#f6f7fb]"}`}>

      {/* Header — same 72px/border pattern as RideDetailPage, so the two
          overlays read as one flow rather than two different apps. */}
      <div className={`h-[72px] shrink-0 grid grid-cols-[auto_1fr_auto] items-center gap-2 px-5 border-b ${
        dark ? "bg-[#111111] border-white/10" : "bg-white border-[#eee]"
      }`}>
        <button
          onClick={onClose}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold cursor-pointer transition-colors justify-self-start ${
            dark ? "text-white/70 hover:bg-white/10" : "text-[#333] hover:bg-black/5"
          }`}
        >
          <IconArrowLeft className="w-4 h-4" />
          {step === "confirmed" ? "Close" : "Back"}
        </button>
        <p className={`text-base font-bold text-center truncate ${dark ? "text-white" : "text-[#111]"}`}>
          {headerTitle}
        </p>
        <span />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        <div className="max-w-[560px] mx-auto flex flex-col">

          {/* Mode + sample badges — identical copy/treatment to
              RideDetailPage so the same route reads the same way here. */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${accentChipCls(dark, isRideMode)}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${accentDot(isRideMode)}`} />
              {isRideMode ? "Partner to share ride" : "Offering a ride"}
            </span>
            {route.isDemo && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-600">
                Sample
              </span>
            )}
          </div>

          {/* Route summary */}
          <div className={`rounded-2xl p-4 flex flex-col gap-3.5 ${cardCls(dark)}`}>
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <span className={`w-2.5 h-2.5 rounded-full ${accentDot(isRideMode)}`} />
                <span className={`w-0.5 h-5 ${dark ? "bg-white/15" : "bg-black/10"}`} />
                <span className={`w-2.5 h-2.5 rounded-full border-2 ${dark ? "border-white/40" : "border-black/20"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${dark ? "text-white" : "text-[#111]"}`}>{route.from_place}</p>
                <p className={`text-xs mt-2 truncate ${dark ? "text-white/50" : "text-[#999]"}`}>{route.to_place}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { icon: "📅", text: freqText },
                { icon: "🕐", text: route.depart_time || "—" },
                ...(!isRideMode ? [{ icon: "👥", text: `${route.seats} seat${route.seats > 1 ? "s" : ""} available` }] : []),
                ...vehicleTypes.map(v => ({ icon: VEHICLE_META[v]?.icon || "🚘", text: VEHICLE_META[v]?.label || v })),
                ...(genderTag ? [{ icon: "🚻", text: `${genderTag} only` }] : []),
              ].map(({ icon, text }) => (
                <span
                  key={text}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${tileCls(dark)}`}
                >
                  {icon} {text}
                </span>
              ))}
            </div>

            <div className={`flex items-center gap-2 pt-3 border-t ${dark ? "border-white/10" : "border-black/5"}`}>
              <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                dark ? "bg-white/10 text-white" : "bg-[#f0f0f5] text-[#555]"
              }`}>
                {initials(route.poster_name || "")}
              </span>
              <span className={`text-xs font-semibold ${dark ? "text-white/60" : "text-[#777]"}`}>
                Posted by {route.poster_name}
              </span>
            </div>
          </div>

          {step === "review" ? (
            <>
              {/* Seats — only applies to "partner" routes, where the poster
                  has a vehicle and you're claiming a seat in it. Skipped
                  entirely for "ride" mode, where you're the one offering
                  to drive the poster. */}
              {!isRideMode && (
                <>
                  <JourneyConnector height={32} dark={dark} isRide={isRideMode} />
                  <SectionEyebrow dark={dark} isRide={isRideMode}>Seats</SectionEyebrow>
                  <div className={`rounded-2xl p-4 flex items-center gap-4 ${cardCls(dark)}`}>
                    <IconUsers className={`w-6 h-6 shrink-0 ${accentText(dark, isRideMode)}`} />
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => adjustSeats(-1)}
                        disabled={seats <= 1}
                        aria-label="One fewer seat"
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${tileCls(dark)} ${accentText(dark, isRideMode)}`}
                      >
                        −
                      </button>
                      <span className={`text-xl font-black w-6 text-center ${dark ? "text-white" : "text-[#111]"}`}>{seats}</span>
                      <button
                        onClick={() => adjustSeats(1)}
                        disabled={seats >= maxSeats}
                        aria-label="One more seat"
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${tileCls(dark)} ${accentText(dark, isRideMode)}`}
                      >
                        +
                      </button>
                    </div>
                    <span className={`text-xs ml-auto ${dark ? "text-white/40" : "text-[#aaa]"}`}>
                      {maxSeats} seat{maxSeats > 1 ? "s" : ""} available
                    </span>
                  </div>
                </>
              )}

              {/* Payment — "your share" for partner mode (you pay the
                  driver), or "what they're offering" for ride mode (the
                  poster pays, since you'd be doing the driving). */}
              <JourneyConnector height={32} dark={dark} isRide={isRideMode} />
              <SectionEyebrow dark={dark} isRide={isRideMode}>Payment</SectionEyebrow>
              <div className={`rounded-2xl p-4 flex flex-col gap-2.5 ${cardCls(dark)}`}>
                {perSeat > 0 ? (
                  isRideMode ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>
                          {posterFirstName} is offering
                        </span>
                        <span className={`text-xl font-black ${accentText(dark, isRideMode)}`}>₹{perSeat}</span>
                      </div>
                      <p className={`text-xs ${dark ? "text-white/40" : "text-[#aaa]"}`}>
                        Settle up directly when you meet — Padosi doesn't process payments.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className={dark ? "text-white/50" : "text-[#999]"}>₹{perSeat} × {seats} seat{seats > 1 ? "s" : ""}</span>
                        <span className={dark ? "text-white/50" : "text-[#999]"}>₹{total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>Your share</span>
                        <span className={`text-xl font-black ${accentText(dark, isRideMode)}`}>₹{total}</span>
                      </div>
                      <p className={`text-xs ${dark ? "text-white/40" : "text-[#aaa]"}`}>
                        Pay {posterFirstName} directly when you meet — Padosi doesn't process payments.
                      </p>
                    </>
                  )
                ) : (
                  <p className={`text-sm font-bold ${accentText(dark, isRideMode)}`}>
                    🎉 {isRideMode ? "No payment requested — just lending a hand." : "This is a free ride — no contribution needed."}
                  </p>
                )}
              </div>

              {/* Note to poster */}
              <JourneyConnector height={32} dark={dark} isRide={isRideMode} />
              <SectionEyebrow dark={dark} isRide={isRideMode}>Message</SectionEyebrow>
              <div className={`rounded-2xl p-4 flex flex-col gap-2 ${cardCls(dark)}`}>
                <label className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>
                  Add a note for {posterFirstName} <span className="font-normal opacity-60">(optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={isRideMode ? "e.g. I can pick you up at 8 AM sharp" : "e.g. I'll be waiting outside the main gate"}
                  rows={3}
                  className={`w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none transition-colors border ${
                    dark
                      ? `bg-[#242424] border-white/10 text-white placeholder-white/30 ${accentFocusBorder(dark, isRideMode)}`
                      : `bg-[#f9fafc] border-transparent text-[#111] placeholder-[#bbb] ${accentFocusBorder(dark, isRideMode)}`
                  }`}
                />
              </div>

              {error && (
                <p className="mt-3 text-xs font-semibold text-[#e0002b]">⚠️ {error}</p>
              )}
            </>
          ) : (
            <>
              {/* Confirmed banner — same accentBannerCls treatment as the
                  "Ride confirmed" banner on RideDetailPage. */}
              <JourneyConnector height={32} dark={dark} isRide={isRideMode} />
              <div className={`rounded-2xl border-l-4 overflow-hidden ${accentBannerCls(dark, isRideMode)}`}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <IconCheck className={`w-5 h-5 shrink-0 ${accentText(dark, isRideMode)}`} />
                  <p className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>
                    {isRideMode
                      ? `You've offered to drive ${posterFirstName}${perSeat > 0 ? ` · ₹${perSeat} agreed` : " · Free ride"}`
                      : `Booked for ${bookedSeats} seat${bookedSeats > 1 ? "s" : ""}${perSeat > 0 ? ` · ₹${perSeat * bookedSeats} to contribute` : " · Free ride"}`}
                  </p>
                </div>
              </div>

              {/* Contact + chat */}
              <JourneyConnector height={32} dark={dark} isRide={isRideMode} />
              <SectionEyebrow dark={dark} isRide={isRideMode}>Contact {posterFirstName}</SectionEyebrow>
              <div className={`rounded-2xl p-4 flex flex-col gap-2.5 ${cardCls(dark)}`}>
                {contact?.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className={`inline-flex items-center justify-center gap-2 text-sm font-bold py-2.5 px-3 rounded-lg cursor-pointer transition-colors ${tileCls(dark)} ${dark ? "text-white hover:bg-white/10" : "text-[#555] hover:bg-black/5"}`}
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
                  className={`inline-flex items-center justify-center gap-2 text-sm font-bold py-2.5 px-3 rounded-lg cursor-pointer transition-colors ${accentSolidBtn(dark, isRideMode)}`}
                />
              </div>
              <p className={`mt-3 text-xs ${dark ? "text-white/40" : "text-[#aaa]"}`}>
                Reminder: settle your share directly with {posterFirstName} — Padosi just makes the introduction.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Footer CTA — fixed, so nothing above it ever resizes the overlay */}
      <div className={`shrink-0 px-5 py-4 border-t ${dark ? "bg-[#111111] border-white/10" : "bg-white border-[#eee]"}`}>
        <div className="max-w-[560px] mx-auto">
          {step === "review" ? (
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={submitting}
                className={`px-4 inline-flex items-center justify-center text-sm py-3 rounded-xl font-bold cursor-pointer transition-colors disabled:opacity-50 ${
                  dark ? "text-white/50 hover:text-white hover:bg-white/5" : "text-[#aaa] hover:text-[#777] hover:bg-black/5"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className={`flex-1 flex items-center justify-between px-5 py-3.5 rounded-xl font-bold cursor-pointer transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 ${accentSolidBtn(dark, isRideMode)}`}
              >
                <span>
                  {submitting
                    ? "Confirming…"
                    : isRideMode
                      ? "Confirm & Offer Ride"
                      : `Confirm ${seats} seat${seats > 1 ? "s" : ""}`}
                </span>
                {!submitting && <IconArrowRight className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className={`w-full flex items-center justify-center px-5 py-3.5 rounded-xl font-bold cursor-pointer transition-all hover:-translate-y-0.5 ${accentSolidBtn(dark, isRideMode)}`}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}