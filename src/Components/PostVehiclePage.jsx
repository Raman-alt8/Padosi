// PostVehiclePage.jsx
import { useState, useEffect } from "react";

const PRICE_TYPES = ["Per Hour", "Per Day"];

// Character limits per field. Enforced two ways: maxLength stops typing past
// the limit (so there's never a need for a running counter), and a small red
// note appears under a field only while it's sitting exactly at its limit —
// it disappears the moment a character is deleted, since the length check
// stops matching.
const LIMITS = {
  title: 30,
  description: 100,
  price: 8,
  area: 60,
  phone: 10,
};

const emptyForm = {
  title: "",
  description: "",
  price: "",
  priceType: "Per Day",
  area: "",
  phone: "",
  photoUrl: "",
};

// Small red "you've hit the limit" note. Only rendered by the caller when
// the field's current length has reached its cap, so no state or timers are
// needed for it to disappear — it just stops being rendered.
function LimitNote({ dark }) {
  return (
    <p className="text-[#ff2d55] text-[11px] font-semibold mt-1">
      Character limit reached.
    </p>
  );
}

// ─── Post / Edit a Vehicle ─────────────────────────────────────────────────────
// Mirrors PostServicePage's role for the Services flow: a full-page form that
// opens on "padosi:postVehicle", saves to the backend, and fires
// "padosi:allVehicles" on success so any open vehicle-listing view refreshes.
// Passing { detail: { vehicle } } on the open event switches this into edit
// mode — same convention ServiceListingsAllPage's Edit button uses today.
//
// Photo uploads happen in two steps, same as the rest of the app's upload flow:
// picking a file immediately POSTs it to /api/upload (field name "image"),
// which stores it on Cloudinary and returns a hosted URL; that URL is what
// gets saved as photo_url when the vehicle form itself is submitted.
export default function PostVehiclePage({ dark, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      setOpen(true);
      setError("");
      const vehicle = e?.detail?.vehicle;
      if (vehicle) {
        setEditingId(vehicle.id ?? null);
        setForm({
          title: vehicle.title || "",
          description: vehicle.description || "",
          price: vehicle.price != null ? String(vehicle.price) : "",
          priceType: vehicle.priceType || "Per Day",
          area: vehicle.area || "",
          phone: vehicle.phone || "",
          photoUrl: vehicle.photoUrl || "",
        });
      } else {
        setEditingId(null);
        setForm(emptyForm);
      }
    };
    window.addEventListener("padosi:postVehicle", handler);
    return () => window.removeEventListener("padosi:postVehicle", handler);
  }, []);

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not upload photo.");
      setForm((prev) => ({ ...prev, photoUrl: data.url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const close = () => {
    setOpen(false);
    setError("");
  };

  const handleSubmit = async () => {
    const title = form.title.trim();
    const p = Number(form.price);
    const phone = form.phone.replace(/\D/g, "");

    if (!title) { setError("Give the vehicle a name, e.g. \"Honda Activa 6G\"."); return; }
    if (!p || p <= 0) { setError("Please enter a valid rental price."); return; }
    if (!/^\d{10}$/.test(phone)) { setError("Phone number must be exactly 10 digits."); return; }

    setError("");
    setLoading(true);
    try {
      const body = {
        title,
        description: form.description.trim(),
        price: p,
        priceType: form.priceType,
        area: form.area.trim(),
        phone,
        photo_url: form.photoUrl,
      };

      const url = editingId ? `/api/vehicles/${editingId}` : "/api/vehicles";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save this listing.");

      window.dispatchEvent(new Event("padosi:allVehicles"));
      onSubmit?.();
      close();
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none transition-colors ${
    dark
      ? "bg-black border-white text-white placeholder:text-[#666] focus:border-white"
      : "bg-white border-[#ddd] text-[#111] placeholder:text-[#aaa] focus:border-[#ff2d55]"
  }`;
  const labelCls = `block text-xs font-bold uppercase tracking-wide mb-2 ${dark ? "text-[#888]" : "text-[#999]"}`;

  return (
    <div className={`fixed inset-0 z-[6000] flex flex-col overflow-y-auto transition-opacity duration-300 ${
      dark ? "bg-black" : "bg-[#f6f7fb]"
    } ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>

      {/* Header */}
      <div className={`h-[70px] flex items-center justify-between px-6 sticky top-0 z-10 border-b ${
        dark ? "bg-black border-white" : "bg-white border-[#eee]"
      }`}>
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
          {editingId ? "Edit" : "List a"}{" "}
          <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>
            Vehicle
          </span>
        </p>
        <div className="w-[76px]" />
      </div>

      {/* Form */}
      <div className="flex justify-center px-6 py-10">
        <div className={`w-full max-w-[640px] rounded-2xl p-8 border ${
          dark ? "bg-black border-white" : "bg-white border-transparent shadow-[0_10px_40px_rgba(0,0,0,0.06)]"
        }`}>

          {/* Photo */}
          <label className={labelCls}>Photo</label>
          <div className="flex items-center gap-4 mb-6">
            <label className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center border transition-colors ${
              dark ? "border-white bg-black" : "border-[#eee] bg-[#fafafa]"
            } ${uploading ? "cursor-not-allowed" : "cursor-pointer"}`}>
              {form.photoUrl && (
                <img
                  src={form.photoUrl}
                  alt=""
                  className={`w-full h-full object-cover transition-opacity ${uploading ? "opacity-40" : ""}`}
                />
              )}

              {/* Centered plus icon — only shown when there's no photo yet */}
              {!form.photoUrl && !uploading && (
                <svg
                  viewBox="0 0 24 24"
                  className={`w-7 h-7 ${dark ? "text-white/30" : "text-[#ccc]"}`}
                  fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}

              {/* Small uploading indicator, replaces both states while the request is in flight */}
              {uploading && (
                <span className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold ${
                  dark ? "text-white" : "text-[#555]"
                }`}>
                  …
                </span>
              )}

              {/* Corner plus badge — shown once a photo exists, signalling the frame is still clickable to replace it */}
              {form.photoUrl && !uploading && (
                <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                  dark ? "bg-white border-black text-black" : "bg-[#ff2d55] border-white text-white"
                }`}>
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              )}

              <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploading} className="hidden" />
            </label>
            <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border transition-colors ${
              uploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            } ${
              dark
                ? "bg-black border-white text-white hover:bg-white hover:text-black"
                : "bg-[#f3f3f3] border-transparent text-[#555] hover:bg-[#ffe0e6] hover:text-[#ff2d55]"
            }`}>
              {uploading ? "Uploading…" : "Upload photo"}
              <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploading} className="hidden" />
            </label>
            {form.photoUrl && !uploading && (
              <button
                onClick={() => setForm((prev) => ({ ...prev, photoUrl: "" }))}
                className={`text-xs font-bold underline underline-offset-2 cursor-pointer ${dark ? "text-[#aaa]" : "text-[#999]"}`}
              >
                Remove
              </button>
            )}
          </div>

          {/* Title */}
          <label className={labelCls}>Vehicle name</label>
          <input
            type="text"
            value={form.title}
            onChange={update("title")}
            maxLength={LIMITS.title}
            placeholder="e.g. Honda Activa 6G"
            className={inputCls}
          />
          {form.title.length >= LIMITS.title && <LimitNote dark={dark} />}
          <div className="mb-5" />

          {/* Description */}
          <label className={labelCls}>Description</label>
          <textarea
            value={form.description}
            onChange={update("description")}
            maxLength={LIMITS.description}
            placeholder="Condition, mileage, any pickup instructions…"
            rows={3}
            className={`${inputCls} resize-none`}
          />
          {form.description.length >= LIMITS.description && <LimitNote dark={dark} />}
          <div className="mb-5" />

          {/* Price row */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelCls}>Rental price (₹)</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.price}
                onChange={update("price")}
                maxLength={LIMITS.price}
                placeholder="500"
                className={inputCls}
              />
              {form.price.length >= LIMITS.price && <LimitNote dark={dark} />}
            </div>
            <div>
              <label className={labelCls}>Billed</label>
              <select value={form.priceType} onChange={update("priceType")} className={`${inputCls} cursor-pointer`}>
                {PRICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Area */}
          <label className={labelCls}>Pickup area</label>
          <input
            type="text"
            value={form.area}
            onChange={update("area")}
            maxLength={LIMITS.area}
            placeholder="e.g. Sector 14"
            className={inputCls}
          />
          {form.area.length >= LIMITS.area && <LimitNote dark={dark} />}
          <div className="mb-5" />

          {/* Phone */}
          <label className={labelCls}>Contact number</label>
          <input
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            maxLength={LIMITS.phone}
            placeholder="9876543210"
            className={inputCls}
          />
          {form.phone.length >= LIMITS.phone && <LimitNote dark={dark} />}

          {error && <p className="text-[#ff2d55] text-xs mt-3 font-medium">⚠️ {error}</p>}

          <div className="flex items-center gap-2 mt-6">
            <button
              onClick={handleSubmit}
              disabled={loading || uploading}
              className="px-7 py-3.5 rounded-xl bg-[#ff2d55] text-white font-semibold text-sm hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-60 disabled:translate-y-0 cursor-pointer border-none"
            >
              {loading ? "Saving…" : editingId ? "Save Changes" : "List Vehicle"}
            </button>
            <button
              onClick={close}
              className={`px-7 py-3.5 rounded-xl border font-semibold text-sm transition-colors cursor-pointer bg-transparent ${
                dark ? "border-white text-[#aaa] hover:bg-[#1a1a1a]" : "border-[#ddd] text-[#555] hover:bg-[#f3f3f3]"
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}