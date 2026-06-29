cat > /home/claude/ServiceListingsAllPage.jsx << 'ENDOFFILE'
// ServiceListingsAllPage.jsx
import { useState, useEffect, useRef } from "react";

const CATEGORY_ICONS = {
  "Plumber": "🔧",
  "Electrician": "⚡",
  "Daycare & Babysitting": "👶",
  "Carpenter": "🔨",
  "Painter": "🎨",
  "AC & Appliance Repair": "❄️",
  "House Cleaning": "🧹",
  "Pest Control": "🐛",
  "Salon & Beauty": "✂️",
  "Tutoring": "📚",
  "Pet Care": "🐾",
  "Packers & Movers": "🚚",
  "Driver on Demand": "🪪",
  "Cook & Catering": "🍽️",
  "Computer & Mobile Repair": "💻",
  "Laundry & Ironing": "👕",
  "Elderly Care": "🧓",
  "Other": "🛠️",
};

// Soft gradient palette per category (from → to)
const CATEGORY_GRADIENT = {
  "Plumber":                ["#dbeafe", "#bfdbfe"],
  "Electrician":            ["#fef9c3", "#fde68a"],
  "Daycare & Babysitting":  ["#fce7f3", "#fbcfe8"],
  "Carpenter":              ["#fef3c7", "#fde68a"],
  "Painter":                ["#ede9fe", "#ddd6fe"],
  "AC & Appliance Repair":  ["#cffafe", "#a5f3fc"],
  "House Cleaning":         ["#d1fae5", "#a7f3d0"],
  "Pest Control":           ["#dcfce7", "#bbf7d0"],
  "Salon & Beauty":         ["#fce7f3", "#f9a8d4"],
  "Tutoring":               ["#dbeafe", "#93c5fd"],
  "Pet Care":               ["#fef3c7", "#fcd34d"],
  "Packers & Movers":       ["#f1f5f9", "#e2e8f0"],
  "Driver on Demand":       ["#f0fdf4", "#bbf7d0"],
  "Cook & Catering":        ["#fff7ed", "#fed7aa"],
  "Computer & Mobile Repair":["#f5f3ff", "#ddd6fe"],
  "Laundry & Ironing":      ["#eff6ff", "#bfdbfe"],
  "Elderly Care":            ["#fdf2f8", "#fce7f3"],
  "Other":                  ["#f8fafc", "#e2e8f0"],
};

const POST_CATEGORIES = Object.keys(CATEGORY_ICONS);

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ listing, index, dark, onSave, onClose }) {
  const [form, setForm] = useState({ ...listing });
  const fileRef = useRef();

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  const inputBase = `w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors ${
    dark
      ? "bg-black border-white/30 text-white placeholder-white/40 focus:border-white"
      : "bg-white border-[#ddd] text-[#222] placeholder-[#999] focus:border-[#ff2d55]"
  }`;
  const labelBase = `block text-xs font-bold mb-1.5 uppercase tracking-wide ${
    dark ? "text-white/70" : "text-[#777]"
  }`;

  return (
    <div
      className="fixed inset-0 z-[8000] flex items-start justify-center px-4 py-10 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`w-full max-w-[560px] rounded-2xl border shadow-xl flex flex-col gap-5 p-6 ${
        dark ? "bg-black border-white/30" : "bg-white border-[#eee]"
      }`}>
        {/* Modal header */}
        <div className="flex items-center justify-between">
          <p className={`text-base font-black ${dark ? "text-white" : "text-[#111]"}`}>
            Edit <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>Listing</span>
          </p>
          <button
            onClick={onClose}
            className={`text-xl leading-none cursor-pointer transition-opacity hover:opacity-60 ${dark ? "text-white" : "text-[#333]"}`}
          >✕</button>
        </div>

        {/* Photo upload */}
        <div>
          <label className={labelBase}>Service photo</label>
          {form.photo ? (
            <div className="relative rounded-xl overflow-hidden">
              <img src={form.photo} alt="preview" className="w-full h-36 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <button
                onClick={() => setForm((f) => ({ ...f, photo: "" }))}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold hover:bg-black transition-colors"
              >✕</button>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-2 right-2 bg-black/60 text-white rounded-lg px-3 py-1 text-[10px] font-bold hover:bg-black transition-colors"
              >Change</button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className={`w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                dark
                  ? "border-white/20 hover:border-white/50 hover:bg-white/5"
                  : "border-[#ddd] hover:border-[#ff2d55] hover:bg-[#ff2d55]/5"
              }`}
            >
              <span className="text-3xl">📷</span>
              <span className={`text-xs font-semibold ${dark ? "text-white/40" : "text-[#aaa]"}`}>
                Upload a photo of your service
              </span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        {/* Category */}
        <div>
          <label className={labelBase}>Service category</label>
          <select value={form.category} onChange={update("category")} className={`${inputBase} cursor-pointer`}>
            {POST_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className={labelBase}>Listing title</label>
          <input type="text" value={form.title} onChange={update("title")} className={inputBase} />
        </div>

        {/* Description */}
        <div>
          <label className={labelBase}>Description</label>
          <textarea value={form.description} onChange={update("description")} rows={3} className={`${inputBase} resize-none`} />
        </div>

        {/* Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>Pricing</label>
            <select value={form.priceType} onChange={update("priceType")} className={`${inputBase} cursor-pointer`}>
              <option value="Monthly">Monthly</option>
              <option value="One Time Service">One Time Service</option>
            </select>
          </div>
          <div>
            <label className={labelBase}>Amount (₹)</label>
            <input type="number" min="0" value={form.price} onChange={update("price")} placeholder="e.g. 500" className={inputBase} />
          </div>
        </div>

        {/* Area + Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>Area you serve</label>
            <input type="text" value={form.area} onChange={update("area")} className={inputBase} />
          </div>
          <div>
            <label className={labelBase}>Phone</label>
            <input type="tel" value={form.phone} onChange={update("phone")} className={inputBase} />
          </div>
        </div>

        {/* Experience + Availability */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>Experience (years)</label>
            <input type="number" min="0" value={form.experience} onChange={update("experience")} className={inputBase} />
          </div>
          <div>
            <label className={labelBase}>Availability</label>
            <input type="text" value={form.availability} onChange={update("availability")} className={inputBase} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => onSave(index, form)}
            className={`flex-1 py-3 rounded-full text-sm font-bold cursor-pointer transition-colors ${
              dark ? "bg-white text-black hover:bg-white/90" : "bg-[#ff2d55] text-white hover:bg-[#e0264a]"
            }`}
          >Save changes</button>
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
              dark
                ? "border-white/30 text-white/70 hover:border-white hover:text-white"
                : "border-[#ddd] text-[#666] hover:border-[#ff2d55] hover:text-[#ff2d55]"
            }`}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Service Card ──────────────────────────────────────────────────────────────
function ServiceCard({ listing, index, deleteConfirm, setDeleteConfirm, setEditTarget, handleDelete }) {
  const [from, to] = CATEGORY_GRADIENT[listing.category] ?? ["#f8fafc", "#e2e8f0"];

  return (
    <div className="rounded-2xl border border-[#ebebeb] bg-white overflow-hidden flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-200">

      {/* ── Photo / Placeholder ── */}
      <div className="relative h-[118px] flex-shrink-0 overflow-hidden">
        {listing.photo ? (
          <img
            src={listing.photo}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
          >
            <span className="text-5xl opacity-60 select-none">
              {CATEGORY_ICONS[listing.category] ?? "🛠️"}
            </span>
          </div>
        )}
        {/* Scrim so badge is always readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {/* Category badge pinned bottom-left of photo */}
        <span className="absolute bottom-2 left-3 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/90 text-[#333] shadow-sm">
          {CATEGORY_ICONS[listing.category]} {listing.category}
        </span>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col gap-1.5 p-3.5 flex-1 min-h-0">
        <h3 className="text-[13px] font-black leading-snug line-clamp-2 text-[#111]">
          {listing.title}
        </h3>
        <p className="text-[11px] leading-relaxed line-clamp-2 text-[#666]">
          {listing.description}
        </p>

        {/* Meta row */}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {listing.price && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff2d55]/10 text-[#ff2d55]">
              ₹{listing.price}
              <span className="font-normal opacity-70"> · {listing.priceType}</span>
            </span>
          )}
          {listing.area && (
            <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-[#f3f4f6] text-[#555]">
              📍 {listing.area}
            </span>
          )}
          {listing.availability && (
            <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-[#f3f4f6] text-[#555]">
              🕐 {listing.availability}
            </span>
          )}
          {listing.experience && (
            <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-[#f3f4f6] text-[#555]">
              ⭐ {listing.experience} yr{listing.experience !== "1" ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-3.5 py-2.5 border-t border-[#f0f0f0] flex items-center justify-between gap-2 flex-shrink-0 bg-[#fafafa]">
        {listing.phone ? (
          <a
            href={`tel:${listing.phone}`}
            className="text-[11px] font-bold truncate text-[#ff2d55] hover:text-[#e0264a] transition-colors flex items-center gap-1"
          >
            <span className="text-[10px]">📞</span> {listing.phone}
          </a>
        ) : <span />}

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setEditTarget({ listing, index })}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer border transition-colors border-[#e0e0e0] text-[#666] hover:border-[#ff2d55] hover:text-[#ff2d55]"
          >Edit</button>

          {deleteConfirm === index ? (
            <>
              <button
                onClick={() => handleDelete(index)}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer bg-red-500 text-white hover:bg-red-600 transition-colors"
              >Confirm</button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer border transition-colors border-[#e0e0e0] text-[#666] hover:border-[#333] hover:text-[#333]"
              >No</button>
            </>
          ) : (
            <button
              onClick={() => setDeleteConfirm(index)}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer border transition-colors border-[#e0e0e0] text-[#666] hover:border-red-400 hover:text-red-500"
            >Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ServiceListingsAllPage({ listings = [], onUpdate, onDelete, dark }) {
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("padosi:allListings", handler);
    return () => window.removeEventListener("padosi:allListings", handler);
  }, []);

  const close = () => setOpen(false);

  const handleSave = (index, updated) => {
    onUpdate?.(index, updated);
    setEditTarget(null);
  };

  const handleDelete = (index) => {
    onDelete?.(index);
    setDeleteConfirm(null);
  };

  const bg       = dark ? "bg-black"              : "bg-[#f6f7fb]";
  const headerBg = dark ? "bg-black border-white" : "bg-white border-[#eee]";
  const titleCol = dark ? "text-white"             : "text-[#111]";
  const metaCol  = dark ? "text-white/40"          : "text-[#aaa]";

  return (
    <>
      <div
        className={`fixed inset-0 z-[7000] flex flex-col overflow-y-auto transition-opacity duration-300 ${bg} ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className={`h-[70px] flex items-center justify-between px-6 sticky top-0 z-10 border-b ${headerBg}`}>
          <button
            onClick={close}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
              dark
                ? "bg-black border-white text-white hover:bg-white hover:text-black"
                : "bg-white border-[#ddd] text-[#333] hover:border-[#ff2d55] hover:text-[#ff2d55]"
            }`}
          >← Back</button>
          <p className={`text-base font-black ${titleCol}`}>
            Listed{" "}
            <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>
              Services
            </span>
          </p>
          <div className="w-20" />
        </div>

        {/* Body */}
        <div className="w-full px-6 py-6 flex flex-col gap-4">
          <p className={`text-xs font-bold uppercase tracking-wide ${metaCol}`}>
            {listings.length === 0
              ? "No services posted yet"
              : `${listings.length} service${listings.length !== 1 ? "s" : ""} available`}
          </p>

          {listings.length === 0 ? (
            <div className="rounded-2xl border border-[#eee] bg-white p-14 flex flex-col items-center gap-3 text-center shadow-sm">
              <span className="text-5xl">🏡</span>
              <p className="text-base font-black text-[#111]">Nothing here yet</p>
              <p className="text-sm text-[#888]">Post the first service — neighbours are waiting.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {listings.map((listing, i) => (
                <ServiceCard
                  key={i}
                  listing={listing}
                  index={i}
                  deleteConfirm={deleteConfirm}
                  setDeleteConfirm={setDeleteConfirm}
                  setEditTarget={setEditTarget}
                  handleDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {editTarget && (
        <EditModal
          listing={editTarget.listing}
          index={editTarget.index}
          dark={dark}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  );
}
