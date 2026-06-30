// ServiceListingsPage.jsx
import { useState, useEffect } from "react";

export const SERVICE_CATEGORIES = [
  { icon: "🔧", label: "Plumber",                  prompt: "Need a plumber to fix " },
  { icon: "⚡", label: "Electrician",              prompt: "Need an electrician to " },
  { icon: "👶", label: "Daycare & Babysitting",    prompt: "Need a babysitter/daycare helper for " },
  { icon: "🔨", label: "Carpenter",                prompt: "Need a carpenter to " },
  { icon: "🎨", label: "Painter",                  prompt: "Need a painter to " },
  { icon: "❄️",  label: "AC & Appliance Repair",   prompt: "Need help repairing my " },
  { icon: "🧹", label: "House Cleaning",           prompt: "Need house cleaning help for " },
  { icon: "🐛", label: "Pest Control",             prompt: "Need pest control for " },
  { icon: "✂️",  label: "Salon & Beauty",           prompt: "Need a salon/beauty appointment for " },
  { icon: "📚", label: "Tutoring",                 prompt: "Need a tutor for " },
  { icon: "🐾", label: "Pet Care",                 prompt: "Need pet care help with " },
  { icon: "🚚", label: "Packers & Movers",         prompt: "Need help packing/moving " },
  { icon: "🪪", label: "Driver on Demand",         prompt: "Need a driver for " },
  { icon: "🍽️", label: "Cook & Catering",          prompt: "Need a cook/catering for " },
  { icon: "💻", label: "Computer & Mobile Repair", prompt: "Need help repairing my " },
  { icon: "👕", label: "Laundry & Ironing",        prompt: "Need laundry/ironing help for " },
  { icon: "🧓", label: "Elderly Care",             prompt: "Need elderly care assistance with " },
  { icon: "🔵", label: "Other",                    prompt: "Need help with " },
];

export default function ServiceListingsPage({ onSelectCategory, onPostService, dark }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("padosi:openServices", handler);
    return () => window.removeEventListener("padosi:openServices", handler);
  }, []);

  const handlePostService = () => {
    if (onPostService) {
      onPostService();
    } else {
      window.dispatchEvent(new CustomEvent("padosi:postService"));
    }
  };

  const handleOpenAllListings = () => {
    window.dispatchEvent(new Event("padosi:allListings"));
  };

  const handleSelectCategory = (cat) => {
    setOpen(false);
    // Jump straight to the All Listings page, pre-filtered to this category
    window.dispatchEvent(new CustomEvent("padosi:allListings", { detail: { category: cat.label } }));
    onSelectCategory?.(cat);
  };

  return (
    <div className={`fixed inset-0 z-[5000] flex flex-col overflow-y-auto transition-opacity duration-300 ${
      dark ? "bg-black" : "bg-[#f6f7fb]"
    } ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>

      {/* Header */}
      <div className={`h-[70px] flex items-center justify-between px-6 sticky top-0 z-10 border-b ${
        dark ? "bg-black border-white" : "bg-white border-[#eee]"
      }`}>
        <button
          onClick={() => setOpen(false)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
            dark
              ? "bg-black border-white text-white hover:bg-white hover:text-black"
              : "bg-white border-[#ddd] text-[#333] hover:border-[#ff2d55] hover:text-[#ff2d55]"
          }`}
        >
          ← Back
        </button>
        <p className={`text-base font-black ${dark ? "text-white" : "text-[#111]"}`}>
          Padosi{" "}
          <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>
            Services
          </span>
        </p>
        <button
          onClick={handlePostService}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
            dark
              ? "bg-white border-white text-black hover:bg-black hover:text-white"
              : "bg-[#ff2d55] border-[#ff2d55] text-white hover:bg-[#e0264a] hover:border-[#e0264a]"
          }`}
        >
          + Post a Service
        </button>
      </div>

      {/* Hero */}
      <div className={`py-14 px-6 text-center ${
        dark ? "bg-white text-black" : "bg-[#ff2d55] text-white"
      }`}>
        <button
          onClick={handleOpenAllListings}
          className={`
            group relative inline-block
            text-5xl font-black cursor-pointer
            bg-transparent border-none p-0
            transition-all duration-150
            ${dark ? "text-black" : "text-white"}
          `}
        >
          All Listings
          <span className={`
            absolute left-0 -bottom-1 h-[3px] w-0 rounded-full
            transition-all duration-200 group-hover:w-full
            ${dark ? "bg-black" : "bg-white"}
          `} />
        </button>

        <p className={`mt-2.5 text-sm max-w-md mx-auto ${dark ? "opacity-70" : "opacity-90"}`}>
          Pick what you need help with — we'll get your task ready to post to neighbours nearby.
        </p>
      </div>

      {/* Category grid */}
      <div className="flex justify-center px-6 pb-16">
        <div className="w-full max-w-[1100px] -mt-9">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {SERVICE_CATEGORIES.map((cat, i) => (
              <button
                key={i}
                onClick={() => handleSelectCategory(cat)}
                className={`rounded-2xl py-5 px-3 flex flex-col items-center gap-3 cursor-pointer transition-all hover:-translate-y-1 group border ${
                  dark
                    ? "bg-black border-white shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:bg-white hover:shadow-[0_15px_35px_rgba(255,255,255,0.15)]"
                    : "bg-white border-[#eee] shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:bg-[#ff2d55] hover:border-[#ff2d55] hover:shadow-[0_12px_28px_rgba(255,45,85,0.18)]"
                }`}
              >
                <span className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border transition-colors ${
                  dark
                    ? "border-white text-white group-hover:border-black group-hover:text-black"
                    : "border-[#ddd] text-[#555] group-hover:border-white group-hover:text-white"
                }`}>
                  {cat.icon}
                </span>
                <span className={`text-xs font-bold text-center leading-tight transition-colors ${
                  dark
                    ? "text-white group-hover:text-black"
                    : "text-[#333] group-hover:text-white"
                }`}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}