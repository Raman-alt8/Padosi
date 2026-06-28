// ServiceListingsAllPage.jsx
import { useState, useEffect } from "react";

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

const POST_CATEGORIES = Object.keys(CATEGORY_ICONS);

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ listing, index, dark, onSave, onClose }) {
  const [form, setForm] = useState({ ...listing });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const inputBase = `w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors ${
    dark
      ? "bg-black border-white/30 text-white placeholder-white/40 focus:border-white"
      : "bg-white border-[#ddd] text-[#222] placeholder-[#999] focus:border-[#ff2d55]"
  }`;
  const labelBase = `block text-xs font-bold mb-1.5 uppercase tracking-wide ${
    dark ? "text-white/70" : "text-[#777]"
  }`;

  return (
    /* Backdrop */
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
          >
            ✕
          </button>
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
          >
            Save changes
          </button>
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
              dark
                ? "border-white/30 text-white/70 hover:border-white hover:text-white"
                : "border-[#ddd] text-[#666] hover:border-[#ff2d55] hover:text-[#ff2d55]"
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ServiceListingsAllPage({ listings = [], onUpdate, onDelete, dark }) {
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // { listing, index }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // index

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

  const bg       = dark ? "bg-black"               : "bg-[#f6f7fb]";
  const headerBg = dark ? "bg-black border-white"  : "bg-white border-[#eee]";
  const cardBg   = dark ? "bg-black border-white/20" : "bg-white border-[#eee]";
  const titleCol = dark ? "text-white"              : "text-[#111]";
  const bodyCol  = dark ? "text-white/70"           : "text-[#555]";
  const metaCol  = dark ? "text-white/40"           : "text-[#aaa]";
  const pillBg   = dark ? "bg-white/10 text-white/60" : "bg-[#f0f0f0] text-[#666]";
  const badgeBg  = dark ? "bg-white/10 text-white/80" : "bg-[#ff2d55]/10 text-[#ff2d55]";
  const divider  = dark ? "border-white/10"         : "border-[#f2f2f2]";

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
          >
            ← Back
          </button>
          <p className={`text-base font-black ${titleCol}`}>
            Listed{" "}
            <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>
              Services
            </span>
          </p>
          <div className="w-20" />
        </div>

        {/* Body */}
        <div className="flex justify-center px-6 py-8">
          <div className="w-full max-w-[900px] flex flex-col gap-4">

            <p className={`text-xs font-bold uppercase tracking-wide ${metaCol}`}>
              {listings.length === 0
                ? "No services posted yet"
                : `${listings.length} service${listings.length !== 1 ? "s" : ""} available`}
            </p>

            {listings.length === 0 ? (
              <div className={`rounded-2xl border p-14 flex flex-col items-center gap-3 text-center ${cardBg}`}>
                <span className="text-5xl">🛠️</span>
                <p className={`text-base font-black ${titleCol}`}>Nothing here yet</p>
                <p className={`text-sm ${bodyCol}`}>Post the first service — neighbours are waiting.</p>
              </div>
            ) : (
              /* 3-column grid — 6 cards visible per screen */
              <div className="grid grid-cols-3 gap-4">
                {listings.map((listing, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl border overflow-hidden flex flex-col ${cardBg}`}
                  >
                    {/* Square top — photo or emoji */}
                    <div className="relative w-full aspect-square">
                      {listing.photo ? (
                        <img
                          src={listing.photo}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-5xl ${
                          dark ? "bg-white/5" : "bg-[#f6f7fb]"
                        }`}>
                          {CATEGORY_ICONS[listing.category] ?? "🛠️"}
                        </div>
                      )}
                      {/* Category badge overlaid on image */}
                      <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${badgeBg}`}>
                        {listing.category}
                      </span>
                    </div>

                    {/* Card body */}
                    <div className="flex flex-col gap-1 p-3 flex-1">
                      <h3 className={`text-xs font-black leading-snug line-clamp-1 ${titleCol}`}>
                        {listing.title}
                      </h3>
                      <p className={`text-[11px] leading-relaxed line-clamp-2 ${bodyCol}`}>
                        {listing.description}
                      </p>

                      {/* Price + area */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {listing.price && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pillBg}`}>
                            ₹{listing.price}{listing.priceType === "Monthly" ? "/mo" : ""}
                          </span>
                        )}
                        {listing.area && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${pillBg}`}>
                            📍 {listing.area}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer — phone + edit/delete */}
                    <div className={`px-3 py-2.5 border-t flex flex-col gap-2 ${divider}`}>
                      {listing.phone && (
                        <a
                          href={`tel:${listing.phone}`}
                          className={`text-[11px] font-bold transition-colors ${
                            dark ? "text-white hover:text-white/70" : "text-[#ff2d55] hover:text-[#e0264a]"
                          }`}
                        >
                          📞 {listing.phone}
                        </a>
                      )}

                      {/* Edit + Delete row */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditTarget({ listing, index: i })}
                          className={`flex-1 py-1 rounded-full text-[10px] font-bold cursor-pointer border transition-colors ${
                            dark
                              ? "border-white/20 text-white/60 hover:border-white hover:text-white"
                              : "border-[#ddd] text-[#666] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                          }`}
                        >
                          ✏️ Edit
                        </button>
                        {deleteConfirm === i ? (
                          <>
                            <button
                              onClick={() => handleDelete(i)}
                              className="flex-1 py-1 rounded-full text-[10px] font-bold cursor-pointer bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className={`flex-1 py-1 rounded-full text-[10px] font-bold cursor-pointer border transition-colors ${
                                dark
                                  ? "border-white/20 text-white/60 hover:border-white hover:text-white"
                                  : "border-[#ddd] text-[#666] hover:border-[#333] hover:text-[#333]"
                              }`}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(i)}
                            className={`flex-1 py-1 rounded-full text-[10px] font-bold cursor-pointer border transition-colors ${
                              dark
                                ? "border-white/20 text-white/60 hover:border-red-400 hover:text-red-400"
                                : "border-[#ddd] text-[#666] hover:border-red-400 hover:text-red-500"
                            }`}
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit modal */}
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