import { useState } from "react";
import { EVENT_CATEGORIES, todayISO, ImageUploadField, LIMITS, LimitNote, CountryCodeSelect } from "./ticketShared";

// ─── PostPanel ────────────────────────────────────────────────────────────────
// "Post a Ticket" tab — lets a user create a new ticket listing.

export default function PostPanel({ dark, showToast }) {
  const [form, setForm] = useState({
    title: "", category: "", date: "", venue: "",
    price: "", qty: "1", description: "", contact: "", countryCode: "91",
  });
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl]   = useState(null);
  const [preview, setPreview]     = useState(null);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // Price and contact should only ever contain digits — filter out
  // anything else as the person types rather than validating after the fact.
  const setDigits = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value.replace(/\D/g, "") }));

  const inputBase = `w-full rounded-xl px-4 py-2.5 text-sm border outline-none transition-colors ${
    dark
      ? "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white"
      : "bg-[#f6f7fb] border-[#e0e0ea] text-[#111] placeholder:text-[#bbb] focus:border-[#ff2d55]"
  }`;
  const labelBase = `text-xs font-bold mb-1 block ${dark ? "text-white/60" : "text-[#888]"}`;

  const handleImageUpload = async (file) => {
    if (!file) { setImageUrl(null); setPreview(null); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res  = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (!res.ok) { showToast(`⚠️ ${data.error || "Image upload failed."}`); return; }
      setImageUrl(data.url);
      setPreview(data.url);
    } catch { showToast("⚠️ Image upload failed. Please try again."); }
    finally  { setUploading(false); }
  };

  const handleSubmit = async () => {
    const required = ["title", "category", "date", "venue", "price", "contact"];
    if (required.some((k) => !form[k])) { showToast("⚠️ Please fill in all required fields."); return; }
    if (form.date < todayISO())          { showToast("⚠️ Event date cannot be in the past.");   return; }
    if (form.contact.length < LIMITS.contactMin || form.contact.length > LIMITS.contact) {
      showToast(`⚠️ Contact number must be ${LIMITS.contactMin}–${LIMITS.contact} digits.`);
      return;
    }
    try {
      const { countryCode, contact, ...rest } = form;
      const res  = await fetch("/api/tickets", {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          price:     Number(form.price),
          qty:       Number(form.qty) || 1,
          image_url: imageUrl ?? "",
          contact:   `+${countryCode} ${contact}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(`⚠️ ${data.error || "Could not post ticket."}`); return; }
      setSubmitted(true);
      showToast("✅ Ticket posted to Padosi Listings!");
    } catch { showToast("⚠️ Network error. Please try again."); }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
        <span className="text-6xl">🎟️</span>
        <p className={`text-2xl font-black ${dark ? "text-white" : "text-[#111]"}`}>Ticket posted!</p>
        <p className={`text-sm max-w-xs ${dark ? "text-white/50" : "text-[#999]"}`}>
          Your listing is now live. Neighbours nearby can see and contact you.
        </p>
        <button
          onClick={() => {
            setForm({ title: "", category: "", date: "", venue: "", price: "", qty: "1", description: "", contact: "", countryCode: "91" });
            setImageUrl(null); setPreview(null); setSubmitted(false);
          }}
          className={`mt-2 px-6 py-2.5 rounded-xl text-sm font-bold border cursor-pointer transition-all ${
            dark ? "bg-white text-black border-white hover:bg-white/80" : "bg-[#ff2d55] text-white border-[#ff2d55] hover:bg-[#e0254c]"
          }`}
        >
          Post another
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div>
        <label className={labelBase}>Event name *</label>
        <input className={inputBase} placeholder="e.g. Arijit Singh Live" value={form.title} onChange={set("title")} maxLength={LIMITS.title} />
        {form.title.length >= LIMITS.title && <LimitNote />}
      </div>
      <div>
        <label className={labelBase}>Category *</label>
        <select className={inputBase} value={form.category} onChange={set("category")}>
          <option value="">Select a category</option>
          {EVENT_CATEGORIES.map((c) => (
            <option key={c.label} value={c.label}>{c.icon} {c.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelBase}>Event date *</label>
          <input type="date" className={inputBase} value={form.date} min={todayISO()} onChange={set("date")} />
        </div>
        <div>
          <label className={labelBase}>Venue *</label>
          <input className={inputBase} placeholder="Stadium or location name" value={form.venue} onChange={set("venue")} maxLength={LIMITS.venue} />
          {form.venue.length >= LIMITS.venue && <LimitNote />}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelBase}>Price per ticket (₹) *</label>
          <input type="text" inputMode="numeric" className={inputBase} placeholder="e.g. 1200" value={form.price} onChange={setDigits("price")} maxLength={LIMITS.price} />
          {form.price.length >= LIMITS.price && <LimitNote />}
        </div>
        <div>
          <label className={labelBase}>Tickets available</label>
          <input type="number" min="1" max="20" className={inputBase} value={form.qty} onChange={set("qty")} />
        </div>
      </div>
      <div>
        <label className={labelBase}>Additional details</label>
        <textarea rows={3} className={`${inputBase} resize-none`} placeholder="Seat details, row, category, reason for selling…" value={form.description} onChange={set("description")} maxLength={LIMITS.description} />
        {form.description.length >= LIMITS.description && <LimitNote />}
      </div>
      <div>
        <label className={labelBase}>Your contact (phone / WhatsApp) *</label>
        <div className="flex gap-2">
          <CountryCodeSelect
            dark={dark}
            value={form.countryCode}
            onChange={(code) => setForm((prev) => ({ ...prev, countryCode: code }))}
          />
          <input className={inputBase} placeholder="9876543210" value={form.contact} onChange={setDigits("contact")} maxLength={LIMITS.contact} inputMode="numeric" />
        </div>
        {form.contact.length > 0 && form.contact.length < LIMITS.contactMin && (
          <p className="text-[#ff2d55] text-[11px] font-semibold mt-1">
            Enter at least {LIMITS.contactMin} digits.
          </p>
        )}
        {form.contact.length >= LIMITS.contact && <LimitNote />}
      </div>

      {/* Ticket image upload */}
      <ImageUploadField dark={dark} onUpload={handleImageUpload} uploading={uploading} preview={preview} />

      <button
        onClick={handleSubmit}
        disabled={uploading}
        className={`mt-2 w-full py-3 rounded-xl text-sm font-black cursor-pointer transition-all border ${
          uploading
            ? dark ? "bg-white/20 text-white/40 border-white/10" : "bg-[#ffa0b0] text-white border-[#ffa0b0]"
            : dark ? "bg-white text-black border-white hover:bg-white/80"
                   : "bg-[#ff2d55] text-white border-[#ff2d55] hover:bg-[#e0254c]"
        }`}
      >
        {uploading ? "Uploading image…" : "Post ticket →"}
      </button>
    </div>
  );
}