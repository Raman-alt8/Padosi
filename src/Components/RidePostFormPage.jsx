import { useState, useEffect } from "react";

// Base URL for API calls — Vite exposes VITE_API_URL from .env
const API_BASE = import.meta.env.VITE_API_URL || "";

// Word limits (not character limits) — counts whitespace-separated words.
const PLACE_WORD_LIMIT = 30;
const DESC_WORD_LIMIT = 250;

// How long the "word limit reached" warning stays visible before fading out.
const WARNING_VISIBLE_MS = 1400;

// Counts words in a string (empty/whitespace-only string = 0 words).
function wordCount(text = "") {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

// Caps a string at `maxWords` words. Once the limit is hit, the browser
// simply refuses to add any further words — existing words + a trailing
// space (so the user can keep finishing the word they're mid-typing) are
// preserved, but no new word can start.
function limitWords(text, maxWords) {
  if (wordCount(text) <= maxWords) return text;
  const words = text.trim().split(/\s+/).slice(0, maxWords);
  const endsWithSpace = /\s$/.test(text);
  return words.join(" ") + (endsWithSpace ? " " : "");
}

// ─── Ride Post / Edit Form ──────
// Standalone modal for creating or editing a ride route. Fully owns its
// form state, word-limited inputs, map preview, and the create/update API
// call — RideSharePage just mounts it conditionally and reacts to onSaved.
//
// Props:
//   open         — boolean, whether the form is showing (parent should only
//                  mount this component when true, so state resets naturally
//                  between opens)
//   editingRoute — route object to prefill for editing, or null to create
//   dark         — boolean
//   showToast    — (msg: string) => void
//   onClose      — () => void, called when the user backs out
//   onSaved      — (route, isEdit: boolean) => void, called with the
//                  server's route object after a successful save
export default function RidePostFormPage({ open, editingRoute, dark, showToast, onClose, onSaved }) {
  const [seats, setSeats]           = useState(1);
  const [freq, setFreq]             = useState("");
  const [from, setFrom]             = useState("");
  const [to, setTo]                 = useState("");
  const [deptTime, setDeptTime]     = useState("");
  const [priceVal, setPriceVal]     = useState("");
  const [desc, setDesc]             = useState("");
  const [formError, setFormError]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [mapSrc, setMapSrc]         = useState("");
  const [mapHidden, setMapHidden]   = useState(true);

  // Word-limit warnings — set true the instant a field would be typed past
  // its limit, then auto-fade back to false a moment later. The <p> below
  // each field stays mounted the whole time so the opacity transition can
  // actually animate instead of popping in/out.
  const [fromWarn, setFromWarn] = useState(false);
  const [toWarn, setToWarn]     = useState(false);
  const [descWarn, setDescWarn] = useState(false);

  useEffect(() => {
    if (!fromWarn) return;
    const t = setTimeout(() => setFromWarn(false), WARNING_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [fromWarn]);

  useEffect(() => {
    if (!toWarn) return;
    const t = setTimeout(() => setToWarn(false), WARNING_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [toWarn]);

  useEffect(() => {
    if (!descWarn) return;
    const t = setTimeout(() => setDescWarn(false), WARNING_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [descWarn]);

  // Initialize fields whenever the form opens — either prefilled from
  // editingRoute, or blank for a fresh post.
  useEffect(() => {
    if (!open) return;
    if (editingRoute) {
      setFrom(editingRoute.from_place);
      setTo(editingRoute.to_place);
      setFreq(editingRoute.freq);
      setDeptTime(editingRoute.depart_time);
      setPriceVal(String(editingRoute.price ?? ""));
      setDesc(editingRoute.description);
      setSeats(editingRoute.seats);
      const q = encodeURIComponent(`${editingRoute.from_place} to ${editingRoute.to_place} India`);
      setMapSrc(`https://maps.google.com/maps?q=${q}&z=13&output=embed`);
      setMapHidden(false);
    } else {
      setFrom(""); setTo(""); setFreq(""); setDeptTime(""); setPriceVal("");
      setDesc(""); setSeats(1); setMapSrc(""); setMapHidden(true);
    }
    setFormError("");
    setSubmitting(false);
  }, [open, editingRoute]);

  const handleSubmit = async () => {
    if (!from)     { setFormError("⚠️ Please enter a starting point.");          return; }
    if (!to)       { setFormError("⚠️ Please enter a destination.");             return; }
    if (!freq)     { setFormError("⚠️ Please select how many times a week.");    return; }
    if (!deptTime) { setFormError("⚠️ Please enter your usual departure time."); return; }
    if (!desc)     { setFormError("⚠️ Please add a short description.");         return; }

    setSubmitting(true);
    setFormError("");

    const payload = {
      from_place:  from,
      to_place:    to,
      freq,
      depart_time: deptTime,
      seats,
      price:       Number(priceVal) || 0,
      description: desc,
    };

    try {
      const url    = editingRoute
        ? `${API_BASE}/api/ride-routes/${editingRoute.id}`
        : `${API_BASE}/api/ride-routes`;
      const method = editingRoute ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Something went wrong."); return; }

      onSaved?.(data.route, Boolean(editingRoute));
      showToast(editingRoute ? "✏️ Route updated" : "🚗 Route posted!");
      onClose?.();
    } catch (err) {
      console.error(err);
      setFormError("⚠️ Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = `w-full px-3.5 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
    dark
      ? "bg-black border-white text-white placeholder-white/30 focus:ring-1 focus:ring-white"
      : "bg-white border-[#ddd] text-[#111] placeholder-[#aaa] focus:border-[#ff2d55]"
  }`;

  if (!open) return null;

  return (
    <div className={`absolute inset-0 z-10 flex flex-col ${dark ? "bg-black" : "bg-[#f6f7fb]"}`}>

      {/* Form header */}
      <div className={`h-[70px] flex items-center justify-between px-6 flex-shrink-0 border-b ${
        dark ? "bg-black border-white" : "bg-white border-[#eee]"
      }`}>
        <button
          onClick={() => onClose?.()}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
            dark
              ? "bg-black border-white text-white hover:bg-white hover:text-black"
              : "bg-white border-[#ddd] text-[#333] hover:border-[#ff2d55] hover:text-[#ff2d55]"
          }`}
        >
          ← Back
        </button>
        <p className={`text-base font-black ${dark ? "text-white" : "text-[#111]"}`}>
          {editingRoute ? "Edit " : "Post a "}
          <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>
            Route
          </span>
        </p>
        <div className="w-20" />
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

        {/* Map pane */}
        <div className={`flex-1 relative min-h-[200px] ${dark ? "bg-black" : "bg-[#f0f1f5]"}`}>
          {mapSrc && (
            <iframe src={mapSrc} className="w-full h-full border-none" allowFullScreen loading="lazy" />
          )}
          {mapHidden && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span className={`text-5xl ${dark ? "text-white/20" : "text-[#ccc]"}`}>🗺️</span>
              <p className={`text-sm text-center max-w-[180px] leading-snug ${dark ? "text-white/30" : "text-[#bbb]"}`}>
                Enter your route to preview it on the map
              </p>
            </div>
          )}
        </div>

        {/* Form pane */}
        <div className={`w-full md:w-[400px] flex-shrink-0 overflow-y-auto p-7 border-l ${
          dark ? "bg-black border-white" : "bg-white border-[#eee]"
        }`}>
          <h2 className={`text-xl font-black mb-1 ${dark ? "text-white" : "text-[#111]"}`}>
            {editingRoute ? "Edit your route" : "Your route details"}
          </h2>
          <p className={`text-xs mb-6 ${dark ? "text-white/40" : "text-[#999]"}`}>
            Share your regular trip so neighbours can ride along.
          </p>

          {/* From / To — word-limited so place names stay short */}
          {[
            { label: "🟢 From", val: from, set: setFrom, placeholder: "Starting point, e.g. Vaishali Nagar", warn: fromWarn, setWarn: setFromWarn },
            { label: "📍 To",   val: to,   set: setTo,   placeholder: "Destination, e.g. MI Road", warn: toWarn, setWarn: setToWarn },
          ].map(({ label, val, set, placeholder, warn, setWarn }) => (
            <div key={label} className="mb-4">
              <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>{label}</label>
              <input
                value={val}
                onChange={e => {
                  const raw = e.target.value;
                  if (wordCount(raw) > PLACE_WORD_LIMIT) setWarn(true);
                  set(limitWords(raw, PLACE_WORD_LIMIT));
                }}
                placeholder={placeholder}
                className={inputCls}
              />
              <p className={`text-[11px] font-semibold text-red-500 mt-1 transition-opacity duration-500 ${warn ? "opacity-100" : "opacity-0"}`}>
                Word limit reached ({PLACE_WORD_LIMIT} words)
              </p>
            </div>
          ))}

          {/* Map preview trigger */}
          <button
            onClick={() => {
              if (!from || !to) { showToast("⚠️ Enter both a starting point and destination first."); return; }
              const q = encodeURIComponent(`${from} to ${to} India`);
              setMapSrc(`https://maps.google.com/maps?q=${q}&z=13&output=embed`);
              setMapHidden(false);
            }}
            className={`w-full py-3 rounded-xl border text-sm font-bold cursor-pointer transition-colors mb-5 ${
              dark
                ? "border-white bg-black text-white hover:bg-white hover:text-black"
                : "border-[#ddd] bg-white text-[#555] hover:border-[#ff2d55] hover:text-[#ff2d55]"
            }`}
          >
            🗺️ Preview on Map
          </button>

          <hr className={`my-5 ${dark ? "border-white/20" : "border-[#eee]"}`} />

          {/* Frequency */}
          <div className="mb-4">
            <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>📅 Times per week</label>
            <div className="flex gap-2 flex-wrap">
              {["1","2","3","4","5","6","7"].map(v => (
                <button
                  key={v}
                  onClick={() => setFreq(v)}
                  className={`px-3 py-2 rounded-xl border text-sm font-bold cursor-pointer transition-colors ${
                    freq === v
                      ? dark
                        ? "bg-white border-white text-black"
                        : "bg-[#ff2d55] border-[#ff2d55] text-white"
                      : dark
                        ? "border-white/40 bg-black text-white/60 hover:border-white hover:text-white"
                        : "border-[#ddd] bg-white text-[#777] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                  }`}
                >
                  {v === "7" ? "Daily" : `${v}×`}
                </button>
              ))}
            </div>
          </div>

          {/* Departure time + seats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>🕐 Departs at</label>
              <input
                type="time"
                value={deptTime}
                onChange={e => setDeptTime(e.target.value)}
                style={{ colorScheme: dark ? "dark" : "light" }}
                className={inputCls}
              />
            </div>
            <div>
              <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>👥 Seats available</label>
              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={() => setSeats(s => Math.max(1, s - 1))}
                  className={`w-8 h-8 rounded-full border text-lg font-bold flex items-center justify-center cursor-pointer transition-colors ${
                    dark
                      ? "border-white bg-black text-white hover:bg-white hover:text-black"
                      : "border-[#ddd] bg-white text-[#555] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                  }`}
                >−</button>
                <span className={`text-xl font-black min-w-[20px] text-center ${dark ? "text-white" : "text-[#111]"}`}>{seats}</span>
                <button
                  onClick={() => setSeats(s => Math.min(8, s + 1))}
                  className={`w-8 h-8 rounded-full border text-lg font-bold flex items-center justify-center cursor-pointer transition-colors ${
                    dark
                      ? "border-white bg-black text-white hover:bg-white hover:text-black"
                      : "border-[#ddd] bg-white text-[#555] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                  }`}
                >+</button>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="mb-4">
            <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>₹ Price per seat</label>
            <input
              type="number"
              value={priceVal}
              onChange={e => setPriceVal(e.target.value)}
              placeholder="e.g. 50  (leave blank for free)"
              min="0"
              className={inputCls}
            />
          </div>

          {/* Description — word-limited instead of character-limited */}
          <div className="mb-4">
            <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>📝 Description</label>
            <textarea
              value={desc}
              onChange={e => {
                const raw = e.target.value;
                if (wordCount(raw) > DESC_WORD_LIMIT) setDescWarn(true);
                setDesc(limitWords(raw, DESC_WORD_LIMIT));
              }}
              placeholder="e.g. I drive to Malviya Nagar every morning around 8 AM, AC car, non-smoker, happy to drop anyone along the route."
              rows={4}
              className={`${inputCls} resize-y leading-relaxed`}
            />
            <p className={`text-[11px] font-semibold text-red-500 mt-1 transition-opacity duration-500 ${descWarn ? "opacity-100" : "opacity-0"}`}>
              Word limit reached ({DESC_WORD_LIMIT} words)
            </p>
          </div>

          {formError && (
            <p className={`text-sm font-semibold mb-3 rounded-xl px-3 py-2 border ${
              dark
                ? "text-white border-white/40 bg-white/5"
                : "text-[#ff2d55] border-[#ff2d55]/30 bg-[#fff0f3]"
            }`}>{formError}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full py-4 rounded-2xl text-sm font-bold cursor-pointer border transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 ${
              dark
                ? "bg-white text-black border-white hover:shadow-[0_8px_24px_rgba(255,255,255,0.2)]"
                : "bg-[#ff2d55] text-white border-[#ff2d55] hover:shadow-[0_8px_24px_rgba(255,45,85,0.25)] hover:bg-[#e0002b]"
            }`}
          >
            {submitting
              ? "Saving…"
              : editingRoute ? "💾 Save Changes" : "🚗 Post Route"}
          </button>
        </div>
      </div>
    </div>
  );
}