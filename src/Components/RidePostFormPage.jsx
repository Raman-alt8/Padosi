import { useState, useEffect } from "react";

// Base URL for API calls — Vite exposes VITE_API_URL from .env
const API_BASE = import.meta.env.VITE_API_URL || "";

// Character limits per field. Enforced two ways: maxLength stops typing past
// the limit (so there's never a need for a running counter), and a small red
// note appears under a field only while it's sitting exactly at its limit —
// it disappears the moment a character is deleted, since the length check
// stops matching.
const LIMITS = {
  place: 30,
  description: 250,
  price: 7,
};

// Default map view shown the instant the form opens, before the user has
// typed a From/To — a wide India view so the iframe is never blank/hidden.
const DEFAULT_MAP_SRC = "https://maps.google.com/maps?q=India&z=5&output=embed";

// Small red "you've hit the limit" note. Only rendered by the caller when
// the field's current length has reached its cap, so no state or timers are
// needed for it to disappear — it just stops being rendered.
function LimitNote() {
  return (
    <p className="text-[#ff2d55] text-[11px] font-semibold mt-1">
      Character limit reached.
    </p>
  );
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
  // "partner"  → you have a vehicle and are offering to share your commute
  // "ride"     → you don't have a vehicle and are looking for someone
  //              driving your route. Vehicle/Seats don't apply in this
  //              mode since you're not the one offering the ride.
  const [mode, setMode]               = useState("partner");
  const [seats, setSeats]             = useState(1);
  const [vehicleTypes, setVehicleTypes] = useState([]); // e.g. [] | ["car"] | ["bike"] | ["car","bike"]
  const [freq, setFreq]               = useState(""); // "weekday" | "weekend" | "full_week"
  const [genderPref, setGenderPref]   = useState(""); // "" | "male" | "female" | "no_preference"
  const [from, setFrom]               = useState("");
  const [to, setTo]                   = useState("");
  const [deptTime, setDeptTime]       = useState("");
  const [priceVal, setPriceVal]       = useState("");
  const [desc, setDesc]               = useState("");
  const [formError, setFormError]     = useState("");
  const [submitting, setSubmitting]   = useState(false);

  // Map is always on once the form is open — starts on a default wide view
  // and is swapped for a route-specific view once From/To are filled (or
  // the user hits Preview).
  const [mapSrc, setMapSrc] = useState(DEFAULT_MAP_SRC);

  // Initialize fields whenever the form opens — either prefilled from
  // editingRoute, or blank for a fresh post.
  useEffect(() => {
    if (!open) return;
    if (editingRoute) {
      setMode(editingRoute.mode === "ride" ? "ride" : "partner");
      setFrom(editingRoute.from_place);
      setTo(editingRoute.to_place);
      setFreq(editingRoute.freq);
      setGenderPref(editingRoute.gender_pref || "");
      setDeptTime(editingRoute.depart_time);
      setPriceVal(String(editingRoute.price ?? ""));
      setDesc(editingRoute.description);
      setSeats(editingRoute.seats);
      // Back-compat: older routes may only have a single vehicle_type string.
      if (Array.isArray(editingRoute.vehicle_types)) {
        setVehicleTypes(editingRoute.vehicle_types);
      } else if (editingRoute.vehicle_type) {
        setVehicleTypes([editingRoute.vehicle_type]);
      } else {
        setVehicleTypes([]);
      }
      const q = encodeURIComponent(`${editingRoute.from_place} to ${editingRoute.to_place} India`);
      setMapSrc(`https://maps.google.com/maps?q=${q}&z=13&output=embed`);
    } else {
      setMode("partner");
      setFrom(""); setTo(""); setFreq(""); setGenderPref(""); setDeptTime(""); setPriceVal("");
      setDesc(""); setSeats(1); setVehicleTypes([]); setMapSrc(DEFAULT_MAP_SRC);
    }
    setFormError("");
    setSubmitting(false);
  }, [open, editingRoute]);

  const toggleVehicle = (key) => {
    setVehicleTypes(prev => prev.includes(key) ? prev.filter(v => v !== key) : [...prev, key]);
  };

  const handleSubmit = async () => {
    if (!from)     { setFormError("⚠️ Please enter a starting point.");          return; }
    if (!to)       { setFormError("⚠️ Please enter a destination.");             return; }
    if (!freq)     { setFormError("⚠️ Please select weekday, weekend, or full week."); return; }
    if (!deptTime) { setFormError("⚠️ Please enter your usual departure time."); return; }
    if (!desc)     { setFormError("⚠️ Please add a short description.");         return; }

    setSubmitting(true);
    setFormError("");

    const payload = {
      mode,
      from_place:    from,
      to_place:      to,
      freq,
      gender_pref:   genderPref || null,
      depart_time:   deptTime,
      seats:         mode === "partner" ? seats : null,
      vehicle_types: mode === "partner" ? vehicleTypes : [],
      price:         Number(priceVal) || 0,
      description:   desc,
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
      showToast(editingRoute ? "✏️ Updated" : mode === "ride" ? "🙋 Ride request posted!" : "🚗 Route posted!");
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

        {/* Map pane — always live, no placeholder state */}
        <div className={`flex-1 relative min-h-[200px] ${dark ? "bg-black" : "bg-[#f0f1f5]"}`}>
          <iframe src={mapSrc} className="w-full h-full border-none" allowFullScreen loading="lazy" />
        </div>

        {/* Form pane */}
        <div className={`w-full md:w-[400px] flex-shrink-0 overflow-y-auto p-7 border-l ${
          dark ? "bg-black border-white" : "bg-white border-[#eee]"
        }`}>

          {/* Offer a Ride / Need a Ride — top-level mode switch. Defaults
              to "partner" (the original layout). Switching to "ride" hides
              the Vehicle and Seats sections below, since a ride-seeker
              isn't the one offering a vehicle. */}
          <div className="flex gap-2 mb-6">
            {[
              { key: "partner", label: "🧑‍🤝‍🧑 Offer a Ride" },
              { key: "ride",    label: "🙋 Need a Ride" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-bold cursor-pointer transition-colors ${
                  mode === key
                    ? dark
                      ? "bg-white border-white text-black"
                      : "bg-[#ff2d55] border-[#ff2d55] text-white"
                    : dark
                      ? "border-white/40 bg-black text-white/60 hover:border-white hover:text-white"
                      : "border-[#ddd] bg-white text-[#777] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <h2 className={`text-xl font-black mb-1 ${dark ? "text-white" : "text-[#111]"}`}>
            {editingRoute
              ? "Edit your route"
              : mode === "ride" ? "Your ride request" : "Your route details"}
          </h2>
          <p className={`text-xs mb-6 ${dark ? "text-white/40" : "text-[#999]"}`}>
            {mode === "ride"
              ? "Tell neighbours the route you need a lift on."
              : "Share your regular trip so neighbours can ride along."}
          </p>

          {/* From / To — character-limited, maxLength stops the browser from
              registering any keystroke past the cap */}
          {[
            { label: "🟢 From", val: from, set: setFrom, placeholder: "Starting point, e.g. Vaishali Nagar" },
            { label: "📍 To",   val: to,   set: setTo,   placeholder: "Destination, e.g. MI Road" },
          ].map(({ label, val, set, placeholder }) => (
            <div key={label} className="mb-4">
              <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>{label}</label>
              <input
                value={val}
                onChange={e => set(e.target.value)}
                maxLength={LIMITS.place}
                placeholder={placeholder}
                className={inputCls}
              />
              {val.length >= LIMITS.place && <LimitNote />}
            </div>
          ))}

          {/* Map preview trigger — still here for updating the view to the
              specific route on demand; map itself is already live by default */}
          <button
            onClick={() => {
              if (!from || !to) { showToast("⚠️ Enter both a starting point and destination first."); return; }
              const q = encodeURIComponent(`${from} to ${to} India`);
              setMapSrc(`https://maps.google.com/maps?q=${q}&z=13&output=embed`);
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

          {/* Frequency — now three options instead of the old 1–7 picker */}
          <div className="mb-4">
            <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>📅 Frequency</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "weekday",   label: "Weekday" },
                { key: "weekend",   label: "Weekend" },
                { key: "full_week", label: "Full Week" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFreq(key)}
                  className={`px-3 py-2 rounded-xl border text-sm font-bold cursor-pointer transition-colors ${
                    freq === key
                      ? dark
                        ? "bg-white border-white text-black"
                        : "bg-[#ff2d55] border-[#ff2d55] text-white"
                      : dark
                        ? "border-white/40 bg-black text-white/60 hover:border-white hover:text-white"
                        : "border-[#ddd] bg-white text-[#777] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle type + Seats — only relevant when offering a ride.
              Vehicle is now a multi-select: clicking a pill toggles it in
              or out (both Car and Bike can be active at once); clicking an
              already-active pill removes it. */}
          {mode === "partner" && (
            <>
              <div className="mb-4">
                <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>🚘 Vehicle</label>
                <div className="flex gap-2">
                  {[
                    { key: "car",  label: "🚗 Car" },
                    { key: "bike", label: "🏍️ Bike" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => toggleVehicle(key)}
                      className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-bold cursor-pointer transition-colors ${
                        vehicleTypes.includes(key)
                          ? dark
                            ? "bg-white border-white text-black"
                            : "bg-[#ff2d55] border-[#ff2d55] text-white"
                          : dark
                            ? "border-white/40 bg-black text-white/60 hover:border-white hover:text-white"
                            : "border-[#ddd] bg-white text-[#777] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
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
            </>
          )}

          {/* Departure time */}
          <div className="mb-4">
            <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>🕐 Departs at</label>
            <input
              type="time"
              value={deptTime}
              onChange={e => setDeptTime(e.target.value)}
              style={{ colorScheme: dark ? "dark" : "light" }}
              className={inputCls}
            />
          </div>

          {/* Gender preference — now a single-click toggle instead of
              double-click. Clicking an already-selected pill deselects it
              back to "" (unset); clicking a different pill just swaps
              the selection, same as Frequency above. */}
          <div className="mb-4">
            <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>
              🚻 Gender preference{" "}
              <span className={`font-medium normal-case ${dark ? "text-white/30" : "text-[#bbb]"}`}>
                (optional)
              </span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "male",          label: "Male" },
                { key: "female",        label: "Female" },
                { key: "no_preference", label: "No preference" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setGenderPref(prev => prev === key ? "" : key)}
                  className={`px-3 py-2 rounded-xl border text-sm font-bold cursor-pointer transition-colors ${
                    genderPref === key
                      ? dark
                        ? "bg-white border-white text-black"
                        : "bg-[#ff2d55] border-[#ff2d55] text-white"
                      : dark
                        ? "border-white/40 bg-black text-white/60 hover:border-white hover:text-white"
                        : "border-[#ddd] bg-white text-[#777] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="mb-4">
            <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>₹ Price per seat</label>
            <input
              type="text"
              inputMode="numeric"
              value={priceVal}
              onChange={e => setPriceVal(e.target.value.replace(/\D/g, ""))}
              maxLength={LIMITS.price}
              placeholder="e.g. 50  (leave blank for free)"
              className={inputCls}
            />
            {priceVal.length >= LIMITS.price && <LimitNote />}
          </div>

          {/* Description — character-limited, maxLength stops the browser
              from registering any keystroke past the cap */}
          <div className="mb-4">
            <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>📝 Description</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              maxLength={LIMITS.description}
              placeholder="e.g. I drive to Malviya Nagar every morning around 8 AM, AC car, non-smoker, happy to drop anyone along the route."
              rows={4}
              className={`${inputCls} resize-y leading-relaxed`}
            />
            {desc.length >= LIMITS.description && <LimitNote />}
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
              : editingRoute ? "💾 Save Changes" : mode === "ride" ? "🙋 Post Ride Request" : "🚗 Post Route"}
          </button>
        </div>
      </div>
    </div>
  );
}