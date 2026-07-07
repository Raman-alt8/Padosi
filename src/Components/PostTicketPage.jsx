import { useState, useRef, useEffect } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const EVENT_CATEGORIES = [
  { icon: "🎵", label: "Concert" },
  { icon: "🏏", label: "Cricket" },
  { icon: "⚽", label: "Football" },
  { icon: "🎭", label: "Theatre" },
  { icon: "🎬", label: "Movie" },
  { icon: "🎪", label: "Festival" },
  { icon: "🏋️", label: "Sports" },
  { icon: "🎓", label: "Workshop" },
  { icon: "🎤", label: "Comedy" },
  { icon: "🍽️", label: "Dining" },
  { icon: "🎨", label: "Exhibition" },
  { icon: "🎰", label: "Other" },
];

// Character limits per field. Enforced two ways: maxLength stops typing past
// the limit (so there's never a need for a running counter), and a small red
// note appears under a field only while it's sitting exactly at its limit —
// it disappears the moment a character is deleted, since the length check
// stops matching.
const LIMITS = {
  title:       50,
  venue:       40,
  price:       7,
  contact:     20,
  description: 250,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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

// ─── Image Upload Field ───────────────────────────────────────────────────────

function ImageUploadField({ dark, onUpload, uploading, preview }) {
  const inputRef = useRef(null);

  return (
    <div>
      <label className={`text-xs font-bold mb-1 block ${dark ? "text-white/60" : "text-[#888]"}`}>
        Ticket photo <span className={`font-normal ${dark ? "text-white/30" : "text-[#bbb]"}`}>(shown to buyer after purchase)</span>
      </label>

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Ticket preview"
            className="w-full max-h-48 object-contain rounded-xl border"
            style={{ borderColor: dark ? "rgba(255,255,255,0.15)" : "#e0e0ea" }}
          />
          <button
            onClick={() => onUpload(null)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80 cursor-pointer"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`w-full rounded-xl border-2 border-dashed py-8 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
            uploading
              ? dark ? "border-white/10 text-white/20" : "border-[#ddd] text-[#ccc]"
              : dark
              ? "border-white/20 text-white/40 hover:border-white/50 hover:text-white/60"
              : "border-[#ddd] text-[#bbb] hover:border-[#ff2d55] hover:text-[#ff2d55]"
          }`}
        >
          <span className="text-2xl">{uploading ? "⏳" : "📷"}</span>
          <span className="text-sm font-bold">
            {uploading ? "Uploading…" : "Upload ticket image"}
          </span>
          <span className="text-xs">JPG, PNG, WEBP · max 5 MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Post Form ────────────────────────────────────────────────────────────────

function PostForm({ dark, showToast, onBack }) {
  const [form, setForm] = useState({
    title: "", category: "", date: "", venue: "",
    price: "", qty: "1", description: "", contact: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl]   = useState(null);
  const [preview, setPreview]     = useState(null);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

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
    try {
      const res  = await fetch("/api/tickets", {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price), qty: Number(form.qty) || 1, image_url: imageUrl ?? "" }),
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
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => {
              setForm({ title: "", category: "", date: "", venue: "", price: "", qty: "1", description: "", contact: "" });
              setImageUrl(null); setPreview(null); setSubmitted(false);
            }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold border cursor-pointer transition-all ${
              dark ? "bg-white text-black border-white hover:bg-white/80" : "bg-[#ff2d55] text-white border-[#ff2d55] hover:bg-[#e0254c]"
            }`}
          >
            Post another
          </button>
          <button
            onClick={onBack}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold border cursor-pointer transition-all ${
              dark
                ? "bg-transparent text-white border-white/40 hover:border-white hover:bg-white/10"
                : "bg-white text-[#888] border-[#ddd] hover:border-[#999] hover:text-[#333]"
            }`}
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div>
        <label className={labelBase}>Event name *</label>
        <input
          className={inputBase}
          placeholder="e.g. Arijit Singh Live"
          maxLength={LIMITS.title}
          value={form.title}
          onChange={set("title")}
        />
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
          <input
            className={inputBase}
            placeholder="Stadium or location name"
            maxLength={LIMITS.venue}
            value={form.venue}
            onChange={set("venue")}
          />
          {form.venue.length >= LIMITS.venue && <LimitNote />}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelBase}>Price per ticket (₹) *</label>
          <input
            type="text"
            inputMode="numeric"
            className={inputBase}
            placeholder="e.g. 1200"
            maxLength={LIMITS.price}
            value={form.price}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, price: e.target.value.replace(/\D/g, "") }))
            }
          />
          {form.price.length >= LIMITS.price && <LimitNote />}
        </div>
        <div>
          <label className={labelBase}>Tickets available</label>
          <input type="number" min="1" max="20" className={inputBase} value={form.qty} onChange={set("qty")} />
        </div>
      </div>
      <div>
        <label className={labelBase}>Additional details</label>
        <textarea
          rows={3}
          className={`${inputBase} resize-none`}
          placeholder="Seat details, row, category, reason for selling…"
          maxLength={LIMITS.description}
          value={form.description}
          onChange={set("description")}
        />
        {form.description.length >= LIMITS.description && <LimitNote />}
      </div>
      <div>
        <label className={labelBase}>Your contact (phone / WhatsApp) *</label>
        <input
          className={inputBase}
          placeholder="+91 98765 43210"
          maxLength={LIMITS.contact}
          value={form.contact}
          onChange={set("contact")}
        />
        {form.contact.length >= LIMITS.contact && <LimitNote />}
      </div>

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

// ─── Main export ──────────────────────────────────────────────────────────────

export default function PostTicketPage({ showToast, dark = false }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("padosi:postTicket", handler);
    return () => window.removeEventListener("padosi:postTicket", handler);
  }, []);

  const handleBack = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("padosi:openTickets"));
  };

  return (
    <div
      className={`fixed inset-0 z-[5000] flex flex-col overflow-y-auto transition-opacity duration-300 ${
        dark ? "bg-black" : "bg-[#f6f7fb]"
      } ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      <div className={`h-[70px] flex items-center justify-between px-6 sticky top-0 z-10 border-b ${dark ? "bg-black border-white/20" : "bg-white border-[#eee]"}`}>
        <button
          onClick={handleBack}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
            dark ? "bg-black border-white text-white hover:bg-white hover:text-black" : "bg-white border-[#ddd] text-[#333] hover:border-[#ff2d55] hover:text-[#ff2d55]"
          }`}
        >
          ← Back
        </button>
        <p className={`text-base font-black ${dark ? "text-white" : "text-[#111]"}`}>
          Padosi <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>Tickets</span>
        </p>
        <div className="w-20" />
      </div>

      <div className={`py-12 px-6 text-center ${dark ? "bg-white text-black" : "bg-[#ff2d55] text-white"}`}>
        <h1 className="text-5xl font-black">🎟️</h1>
        <h2 className="text-3xl font-black mt-2">Post a Ticket</h2>
        <p className={`mt-2 text-sm max-w-sm mx-auto ${dark ? "opacity-60" : "opacity-90"}`}>
          List your extra tickets for neighbours to buy — no middlemen, no markup.
        </p>
      </div>

      <div className="flex justify-center px-4 pb-16">
        <div className="w-full max-w-3xl -mt-6">
          <div className={`rounded-2xl border p-5 shadow-[0_10px_40px_rgba(0,0,0,0.08)] ${dark ? "bg-black border-white/20" : "bg-white border-[#eee]"}`}>
            <PostForm dark={dark} showToast={showToast} onBack={handleBack} />
          </div>
        </div>
      </div>
    </div>
  );
}