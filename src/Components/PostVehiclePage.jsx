// PostVehiclePage.jsx
import { useState, useEffect } from "react";
import { VEHICLE_CATEGORIES } from "./RentVehiclePage";

const PRICE_TYPES = ["Per Hour", "Per Day", "Per Week"];

const emptyForm = {
  category: VEHICLE_CATEGORIES[0].label,
  title: "",
  description: "",
  price: "",
  priceType: "Per Day",
  area: "",
  availability: "",
  phone: "",
  photoUrl: "",
};

// ─── Post / Edit a Vehicle ─────────────────────────────────────────────────────
// Mirrors PostServicePage's role for the Services flow: a full-page form that
// opens on "padosi:postVehicle", saves to the backend, and fires
// "padosi:allVehicles" on success so any open vehicle-listing view refreshes.
// Passing { detail: { vehicle } } on the open event switches this into edit
// mode — same convention ServiceListingsAllPage's Edit button uses today.
//
// ASSUMPTIONS (flag if these don't match your backend):
//   - REST endpoints: POST /api/vehicles (create), PUT /api/vehicles/:id (edit)
//   - Vehicle photo is stored as a data URL client-side (no upload endpoint)
export default function PostVehiclePage({ dark, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      setOpen(true);
      setError("");
      const vehicle = e?.detail?.vehicle;
      if (vehicle) {
        setEditingId(vehicle.id ?? null);
        setForm({
          category: vehicle.category || emptyForm.category,
          title: vehicle.title || "",
          description: vehicle.description || "",
          price: vehicle.price != null ? String(vehicle.price) : "",
          priceType: vehicle.priceType || "Per Day",
          area: vehicle.area || "",
          availability: vehicle.availability || "",
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

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, photoUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const close = () => {
    setOpen(false);
    setError("");
  };

  const handleSubmit = async () => {
    const title = form.title.trim();
    const p = Number(form.price);
    const phone = form.phone.trim();

    if (!title) { setError("Give the vehicle a name, e.g. \"Honda Activa 6G\"."); return; }
    if (!p || p <= 0) { setError("Please enter a valid rental price."); return; }
    if (!phone) { setError("A contact number is required so renters can reach you."); return; }

    setError("");
    setLoading(true);
    try {
      const body = {
        category: form.category,
        title,
        description: form.description.trim(),
        price: p,
        priceType: form.priceType,
        area: form.area.trim(),
        availability: form.availability.trim(),
        phone,
        photoUrl: form.photoUrl,
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
            <div className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-3xl border ${
              dark ? "border-white bg-black" : "border-[#eee] bg-[#fafafa]"
            }`}>
              {form.photoUrl
                ? <img src={form.photoUrl} alt="" className="w-full h-full object-cover" />
                : <span>🚗</span>
              }
            </div>
            <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
              dark
                ? "bg-black border-white text-white hover:bg-white hover:text-black"
                : "bg-[#f3f3f3] border-transparent text-[#555] hover:bg-[#ffe0e6] hover:text-[#ff2d55]"
            }`}>
              Upload photo
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
            {form.photoUrl && (
              <button
                onClick={() => setForm((prev) => ({ ...prev, photoUrl: "" }))}
                className={`text-xs font-bold underline underline-offset-2 cursor-pointer ${dark ? "text-[#aaa]" : "text-[#999]"}`}
              >
                Remove
              </button>
            )}
          </div>

          {/* Category */}
          <label className={labelCls}>Vehicle type</label>
          <select value={form.category} onChange={update("category")} className={`${inputCls} mb-5 cursor-pointer`}>
            {VEHICLE_CATEGORIES.map((cat) => (
              <option key={cat.label} value={cat.label}>{cat.icon} {cat.label}</option>
            ))}
          </select>

          {/* Title */}
          <label className={labelCls}>Vehicle name</label>
          <input
            type="text"
            value={form.title}
            onChange={update("title")}
            placeholder="e.g. Honda Activa 6G"
            className={`${inputCls} mb-5`}
          />

          {/* Description */}
          <label className={labelCls}>Description</label>
          <textarea
            value={form.description}
            onChange={update("description")}
            placeholder="Condition, mileage, any pickup instructions…"
            rows={3}
            className={`${inputCls} mb-5 resize-none`}
          />

          {/* Price row */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelCls}>Rental price (₹)</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.price}
                onChange={update("price")}
                placeholder="500"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Billed</label>
              <select value={form.priceType} onChange={update("priceType")} className={`${inputCls} cursor-pointer`}>
                {PRICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Area + availability */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelCls}>Pickup area</label>
              <input
                type="text"
                value={form.area}
                onChange={update("area")}
                placeholder="e.g. Sector 14"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Availability</label>
              <input
                type="text"
                value={form.availability}
                onChange={update("availability")}
                placeholder="e.g. Mon-Sun, 7am-9pm"
                className={inputCls}
              />
            </div>
          </div>

          {/* Phone */}
          <label className={labelCls}>Contact number</label>
          <input
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            placeholder="+91 98765 43210"
            className={`${inputCls} mb-2`}
          />

          {error && <p className="text-[#ff2d55] text-xs mt-3 font-medium">⚠️ {error}</p>}

          <div className="flex items-center gap-2 mt-6">
            <button
              onClick={handleSubmit}
              disabled={loading}
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
