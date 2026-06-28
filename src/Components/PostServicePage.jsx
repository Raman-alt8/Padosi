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

export default function PostServicePage({ onSubmit, dark }) {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    category: "",
    title: "",
    description: "",
    priceType: "Monthly",
    price: "",
    area: "",
    experience: "",
    availability: "",
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

  const isValid = form.category && form.title.trim() && form.description.trim() && form.phone.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit?.({ ...form, photo: photoPreview });
    // Close this page and go straight to the listings page
    setOpen(false);
    setSubmitted(false);
    window.dispatchEvent(new Event("padosi:allListings"));
  };

  // After posting, "View all listings" closes this page and opens the listings page
  const handleViewListings = () => {
    close();
    window.dispatchEvent(new Event("padosi:allListings"));
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
          <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>
            Service
          </span>
        </p>
        <div className="w-20" />
      </div>

      <div className="flex justify-center px-6 py-10">
        <div className="w-full max-w-[640px]">
          {submitted ? (
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
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <p className={`text-sm -mt-2 mb-2 ${dark ? "text-white/60" : "text-[#777]"}`}>
                Tell neighbours what you offer — it only takes a minute.
              </p>

              {/* Category */}
              <div>
                <label className={labelBase}>Service category</label>
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

              {/* Title */}
              <div>
                <label className={labelBase}>Listing title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={update("title")}
                  placeholder="e.g. Quick AC repair & servicing"
                  required
                  className={inputBase}
                />
              </div>

              {/* Description */}
              <div>
                <label className={labelBase}>Description</label>
                <textarea
                  value={form.description}
                  onChange={update("description")}
                  placeholder="Describe what you offer, your experience, and anything customers should know"
                  required
                  rows={4}
                  className={`${inputBase} resize-none`}
                />
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
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={update("price")}
                    placeholder="e.g. 500"
                    className={inputBase}
                  />
                </div>
              </div>

              {/* Area served */}
              <div>
                <label className={labelBase}>Area you serve</label>
                <input
                  type="text"
                  value={form.area}
                  onChange={update("area")}
                  placeholder="e.g. Within 5km of Sector 12"
                  className={inputBase}
                />
              </div>

              {/* Experience + Availability */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelBase}>Experience (years)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.experience}
                    onChange={update("experience")}
                    placeholder="e.g. 3"
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className={labelBase}>Availability</label>
                  <input
                    type="text"
                    value={form.availability}
                    onChange={update("availability")}
                    placeholder="e.g. Mon–Sat, 9am–6pm"
                    className={inputBase}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className={labelBase}>Contact phone number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="e.g. 98765 43210"
                  required
                  className={inputBase}
                />
              </div>

              {/* Photo */}
              <div>
                <label className={labelBase}>Photo</label>
                {photoPreview ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={photoPreview}
                      alt="Service preview"
                      className={`w-20 h-20 rounded-xl object-cover border ${dark ? "border-white/30" : "border-[#ddd]"}`}
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className={`text-xs font-bold cursor-pointer underline ${
                        dark ? "text-white/70 hover:text-white" : "text-[#777] hover:text-[#ff2d55]"
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