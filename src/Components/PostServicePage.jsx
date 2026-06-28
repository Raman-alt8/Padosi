// PostServicePage.jsx
import { useState, useEffect, useRef } from "react";

const POST_CATEGORIES = [
  { icon: "🔧", label: "Plumber" },
  { icon: "⚡", label: "Electrician" },
  { icon: "👶", label: "Daycare & Babysitting" },
  { icon: "🔨", label: "Carpenter" },
  { icon: "🎨", label: "Painter" },
  { icon: "❄️", label: "AC & Appliance Repair" },
  { icon: "🧹", label: "House Cleaning" },
  { icon: "🐛", label: "Pest Control" },
  { icon: "✂️", label: "Salon & Beauty" },
  { icon: "📚", label: "Tutoring" },
  { icon: "🐾", label: "Pet Care" },
  { icon: "🚚", label: "Packers & Movers" },
  { icon: "🪪", label: "Driver on Demand" },
  { icon: "🍽️", label: "Cook & Catering" },
  { icon: "💻", label: "Computer & Mobile Repair" },
  { icon: "👕", label: "Laundry & Ironing" },
  { icon: "🧓", label: "Elderly Care" },
  { icon: "🛠️", label: "Other" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TITLE_LIMIT = 50;
const DESC_LIMIT  = 100;
const PRICE_MAX_DIGITS = 7;
const EXP_MAX_DIGITS   = 2;

export default function PostServicePage({ onSubmit, dark }) {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    category: "",
    title: "",
    description: "",
    priceType: "Monthly",
    price: "",
    experience: "",
    availabilityDays: [],
    availabilityFrom: "",
    availabilityTo: "",
    phone: "",
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("padosi:postService", handler);
    return () => window.removeEventListener("padosi:postService", handler);
  }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggleDay = (day) =>
    setForm((f) => ({
      ...f,
      availabilityDays: f.availabilityDays.includes(day)
        ? f.availabilityDays.filter((d) => d !== day)
        : [...f.availabilityDays, day],
    }));

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const close = () => {
    setOpen(false);
    setSubmitted(false);
  };

  const isValid =
    form.category &&
    form.title.trim() &&
    form.description.trim() &&
    form.phone.length === 10;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;

    const availabilityStr =
      form.availabilityDays.length > 0
        ? `${form.availabilityDays.join(", ")}${
            form.availabilityFrom && form.availabilityTo
              ? `, ${form.availabilityFrom} – ${form.availabilityTo}`
              : ""
          }`
        : "";

    onSubmit?.({ ...form, availability: availabilityStr, photo: photoPreview });
    setOpen(false);
    setSubmitted(false);
    window.dispatchEvent(new Event("padosi:allListings"));
  };

  const handleViewListings = () => {
    close();
    window.dispatchEvent(new Event("padosi:allListings"));
  };

  /* ─── style helpers ─── */
  const inputBase = `w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors ${
    dark
      ? "bg-black border-white/30 text-white placeholder-white/40 focus:border-white"
      : "bg-white border-[#ddd] text-[#222] placeholder-[#999] focus:border-[#ff2d55]"
  }`;

  const labelBase = `text-xs font-bold uppercase tracking-wide ${
    dark ? "text-white/70" : "text-[#777]"
  }`;

  /* ─── render ─── */
  return (
    <div
      className={`fixed inset-0 z-[6000] flex flex-col overflow-y-auto transition-opacity duration-300 ${
        dark ? "bg-black" : "bg-[#f6f7fb]"
      } ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      {/* Header */}
      <div
        className={`h-[70px] flex items-center justify-between px-6 sticky top-0 z-10 border-b ${
          dark ? "bg-black border-white" : "bg-white border-[#eee]"
        }`}
      >
        <button
          onClick={close}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
            dark
              ? "bg-black border-white text-white hover:bg-white hover:text-black"
              : "bg-white border-[#ddd] text-[#333] hover:border-[#ff2d55] hover:text-[#ff2d55]"
          }`}
        >
          ← Back
        </button>
        <p className={`text-base font-black ${dark ? "text-white" : "text-[#111]"}`}>
          Post a{" "}
          <span
            className={`underline decoration-2 underline-offset-2 ${
              dark ? "text-white" : "text-[#ff2d55]"
            }`}
          >
            Service
          </span>
        </p>
        <div className="w-20" />
      </div>

      <div className="flex justify-center px-6 py-10">
        <div className="w-full max-w-[640px]">
          {submitted ? (
            /* ── Success state ── */
            <div
              className={`rounded-2xl p-10 text-center border ${
                dark ? "border-white bg-black" : "border-[#eee] bg-white"
              }`}
            >
              <div className="text-5xl mb-4">✅</div>
              <h2 className={`text-2xl font-black mb-2 ${dark ? "text-white" : "text-[#111]"}`}>
                Listing posted!
              </h2>
              <p className={`text-sm mb-6 ${dark ? "text-white/70" : "text-[#666]"}`}>
                Your service is now visible to neighbours nearby.
              </p>
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleViewListings}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold cursor-pointer transition-colors ${
                    dark
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-[#ff2d55] text-white hover:bg-[#e0264a]"
                  }`}
                >
                  View all listings
                </button>
                <button
                  onClick={close}
                  className={`text-sm font-bold cursor-pointer transition-colors ${
                    dark ? "text-white/50 hover:text-white" : "text-[#aaa] hover:text-[#555]"
                  }`}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <p className={`text-sm -mt-2 mb-2 ${dark ? "text-white/60" : "text-[#777]"}`}>
                Tell neighbours what you offer — it only takes a minute.
              </p>

              {/* Category */}
              <div>
                <label className={`block ${labelBase} mb-1.5`}>Service category</label>
                <select
                  value={form.category}
                  onChange={update("category")}
                  required
                  className={`${inputBase} cursor-pointer`}
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {POST_CATEGORIES.map((cat) => (
                    <option key={cat.label} value={cat.label}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title — 50 char limit */}
              <div>
                <label className={`block ${labelBase} mb-1.5`}>Listing title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => {
                    if (e.target.value.length <= TITLE_LIMIT) update("title")(e);
                  }}
                  maxLength={TITLE_LIMIT}
                  placeholder="e.g. Quick AC repair & servicing"
                  required
                  className={inputBase}
                />
                {form.title.length >= TITLE_LIMIT && (
                  <div className="h-px bg-red-500 mt-1 rounded" />
                )}
              </div>

              {/* Description — 100 char limit */}
              <div>
                <label className={`block ${labelBase} mb-1.5`}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => {
                    if (e.target.value.length <= DESC_LIMIT) update("description")(e);
                  }}
                  maxLength={DESC_LIMIT}
                  placeholder="Describe what you offer, your experience, and anything customers should know"
                  required
                  rows={4}
                  className={`${inputBase} resize-none`}
                />
                {form.description.length >= DESC_LIMIT && (
                  <div className="h-px bg-red-500 mt-1 rounded" />
                )}
              </div>

              {/* Price — max 7 digits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block ${labelBase} mb-1.5`}>Pricing</label>
                  <select
                    value={form.priceType}
                    onChange={update("priceType")}
                    className={`${inputBase} cursor-pointer`}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="One Time Service">One Time Service</option>
                  </select>
                </div>
                <div>
                  <label className={`block ${labelBase} mb-1.5`}>Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => {
                      if (String(e.target.value).replace("-", "").length <= PRICE_MAX_DIGITS)
                        update("price")(e);
                    }}
                    placeholder="e.g. 500"
                    className={inputBase}
                  />
                </div>
              </div>

              {/* Experience — max 2 digits */}
              <div className="w-1/2 pr-1.5">
                <label className={`block ${labelBase} mb-1.5`}>Experience (years)</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={form.experience}
                  onChange={(e) => {
                    if (String(e.target.value).replace("-", "").length <= EXP_MAX_DIGITS)
                      update("experience")(e);
                  }}
                  placeholder="e.g. 3"
                  className={inputBase}
                />
              </div>

              {/* Availability — day chips + From / To time */}
              <div>
                <label className={`block ${labelBase} mb-2`}>Availability</label>

                {/* Day chips — Mon to Sun */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {DAYS.map((day) => {
                    const selected = form.availabilityDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border transition-colors ${
                          selected
                            ? dark
                              ? "bg-white text-black border-white"
                              : "bg-[#ff2d55] text-white border-[#ff2d55]"
                            : dark
                            ? "bg-transparent text-white/70 border-white/30 hover:border-white hover:text-white"
                            : "bg-white text-[#666] border-[#ddd] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {/* From / To time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className={`text-xs mb-1 ${dark ? "text-white/50" : "text-[#999]"}`}>
                      From
                    </p>
                    <input
                      type="time"
                      value={form.availabilityFrom}
                      onChange={update("availabilityFrom")}
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <p className={`text-xs mb-1 ${dark ? "text-white/50" : "text-[#999]"}`}>
                      To
                    </p>
                    <input
                      type="time"
                      value={form.availabilityTo}
                      onChange={update("availabilityTo")}
                      className={inputBase}
                    />
                  </div>
                </div>
              </div>

              {/* Phone — exactly 10 digits */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className={labelBase}>Contact phone number</label>
                  <span
                    className={`text-xs ${
                      form.phone.length === 10
                        ? dark
                          ? "text-green-400 font-bold"
                          : "text-green-500 font-bold"
                        : dark
                        ? "text-white/40"
                        : "text-[#bbb]"
                    }`}
                  >
                    {form.phone.length}/10
                  </span>
                </div>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setForm((f) => ({ ...f, phone: digits }));
                  }}
                  placeholder="e.g. 98765 43210"
                  required
                  className={inputBase}
                />
                {form.phone.length > 0 && form.phone.length < 10 && (
                  <p className={`text-xs mt-1 ${dark ? "text-red-400" : "text-red-500"}`}>
                    Please enter a 10-digit phone number.
                  </p>
                )}
              </div>

              {/* Photo */}
              <div>
                <label className={`block ${labelBase} mb-1.5`}>Photo</label>
                {photoPreview ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={photoPreview}
                      alt="Service preview"
                      className={`w-20 h-20 rounded-xl object-cover border ${
                        dark ? "border-white/30" : "border-[#ddd]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className={`text-xs font-bold cursor-pointer underline ${
                        dark
                          ? "text-white/70 hover:text-white"
                          : "text-[#777] hover:text-[#ff2d55]"
                      }`}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer border-2 border-dashed transition-colors ${
                      dark
                        ? "border-white/30 text-white/80 hover:border-white hover:text-white"
                        : "border-[#ddd] text-[#666] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                    }`}
                  >
                    📷 Add Photo
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              <button
                type="submit"
                disabled={!isValid}
                className={`mt-3 w-full py-3.5 rounded-full text-sm font-bold cursor-pointer transition-colors ${
                  isValid
                    ? dark
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-[#ff2d55] text-white hover:bg-[#e0264a]"
                    : "bg-[#ccc] text-white cursor-not-allowed"
                }`}
              >
                Post Listing
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}