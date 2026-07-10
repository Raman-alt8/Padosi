// PostVehiclePage.jsx
import { useState, useEffect } from "react";

const PRICE_TYPES = ["Per Hour", "Per Day"];

// Max number of photos a listing can carry. The first photo in the array is
// always treated as the thumbnail — that's what RentVehiclePage's card grid
// shows, and what the "detail" view (coming next) opens on.
const MAX_PHOTOS = 6;

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
  photoUrls: [],
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
// picking file(s) immediately POSTs each one to /api/upload (field name
// "image"), which stores it on Cloudinary and returns a hosted URL; those
// URLs are collected in form.photoUrls and saved together when the vehicle
// form itself is submitted. A listing can hold up to MAX_PHOTOS photos, and
// whichever one sits at index 0 is the thumbnail — new uploads are appended
// to the end, and "Make thumbnail" moves an existing photo to the front.
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
        // Accept either a new-style photoUrls array or the old single
        // photoUrl field, so listings created before this change still load.
        const initialPhotos = Array.isArray(vehicle.photoUrls) && vehicle.photoUrls.length
          ? vehicle.photoUrls
          : (vehicle.photoUrl ? [vehicle.photoUrl] : []);
        setForm({
          title: vehicle.title || "",
          description: vehicle.description || "",
          price: vehicle.price != null ? String(vehicle.price) : "",
          priceType: vehicle.priceType || "Per Day",
          area: vehicle.area || "",
          phone: vehicle.phone || "",
          photoUrls: initialPhotos,
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

  // Uploads every selected file (up to whatever room is left under
  // MAX_PHOTOS), appending each hosted URL to photoUrls as it comes back so
  // the grid fills in progressively rather than waiting on the whole batch.
  const handlePhotosChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow picking the same file again later
    if (!files.length) return;

    const remaining = MAX_PHOTOS - form.photoUrls.length;
    const toUpload = files.slice(0, remaining);
    if (!toUpload.length) return;

    setError("");
    setUploading(true);
    try {
      for (const file of toUpload) {
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not upload photo.");
        setForm((prev) => ({ ...prev, photoUrls: [...prev.photoUrls, data.url] }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    setForm((prev) => ({ ...prev, photoUrls: prev.photoUrls.filter((_, i) => i !== index) }));
  };

  const makeThumbnail = (index) => {
    setForm((prev) => {
      if (index === 0) return prev;
      const next = [...prev.photoUrls];
      const [picked] = next.splice(index, 1);
      next.unshift(picked);
      return { ...prev, photoUrls: next };
    });
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
        // photo_url stays as the first image for back-compat with anything
        // still reading a single photo; photo_urls carries the full set.
        photo_url: form.photoUrls[0] || "",
        photo_urls: form.photoUrls,
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

          {/* Photos */}
          <label className={labelCls}>Photos</label>
          <p className={`text-xs mb-3 -mt-1 ${dark ? "text-[#777]" : "text-[#aaa]"}`}>
            The first photo is used as the thumbnail. Up to {MAX_PHOTOS}.
          </p>
          <div className="flex flex-wrap gap-3 mb-6">
            {form.photoUrls.map((url, index) => (
              <div
                key={url + index}
                className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border ${
                  dark ? "border-white" : "border-[#eee]"
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />

                {index === 0 && (
                  <span className={`absolute top-1 left-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    dark ? "bg-white text-black" : "bg-[#ff2d55] text-white"
                  }`}>
                    Thumbnail
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center bg-black/70 text-white text-[11px] font-bold cursor-pointer border-none"
                  aria-label="Remove photo"
                >
                  ✕
                </button>

                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => makeThumbnail(index)}
                    className="absolute bottom-0 left-0 right-0 py-0.5 text-[9px] font-bold text-white bg-black/60 cursor-pointer border-none"
                  >
                    Make thumbnail
                  </button>
                )}
              </div>
            ))}

            {form.photoUrls.length < MAX_PHOTOS && (
              <label className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center border transition-colors ${
                dark ? "border-white bg-black" : "border-[#eee] bg-[#fafafa]"
              } ${uploading ? "cursor-not-allowed" : "cursor-pointer"}`}>
                {uploading ? (
                  <span className={`text-[11px] font-bold ${dark ? "text-white" : "text-[#555]"}`}>…</span>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className={`w-7 h-7 ${dark ? "text-white/30" : "text-[#ccc]"}`}
                    fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotosChange}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
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