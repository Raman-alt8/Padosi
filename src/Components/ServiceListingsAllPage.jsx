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
  "Gardening": "🌱",
  "Computer & Mobile Repair": "💻",
  "Laundry & Ironing": "👕",
  "Elderly Care": "🧓",
};

export default function ServiceListingsAllPage({ listings = [], dark }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("padosi:allListings", handler);
    return () => window.removeEventListener("padosi:allListings", handler);
  }, []);

  const close = () => setOpen(false);

  const bg       = dark ? "bg-black"        : "bg-[#f6f7fb]";
  const headerBg = dark ? "bg-black border-white" : "bg-white border-[#eee]";
  const cardBg   = dark ? "bg-black border-white/20" : "bg-white border-[#eee]";
  const titleCol = dark ? "text-white"       : "text-[#111]";
  const bodyCol  = dark ? "text-white/70"    : "text-[#555]";
  const metaCol  = dark ? "text-white/40"    : "text-[#aaa]";
  const pillBg   = dark ? "bg-white/10 text-white/60" : "bg-[#f0f0f0] text-[#666]";
  const badgeBg  = dark ? "bg-white/10 text-white/80" : "bg-[#ff2d55]/10 text-[#ff2d55]";
  const divider  = dark ? "border-white/10"  : "border-[#f2f2f2]";

  return (
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
      <div className="flex justify-center px-6 py-10">
        <div className="w-full max-w-[720px] flex flex-col gap-4">

          {/* Count line */}
          <p className={`text-xs font-bold uppercase tracking-wide ${metaCol}`}>
            {listings.length === 0
              ? "No services posted yet"
              : `${listings.length} service${listings.length !== 1 ? "s" : ""} available`}
          </p>

          {listings.length === 0 ? (
            /* Empty state */
            <div className={`rounded-2xl border p-14 flex flex-col items-center gap-3 text-center ${cardBg}`}>
              <span className="text-5xl">🛠️</span>
              <p className={`text-base font-black ${titleCol}`}>Nothing here yet</p>
              <p className={`text-sm ${bodyCol}`}>
                Post the first service — neighbours are waiting.
              </p>
            </div>
          ) : (
            listings.map((listing, i) => (
              <div key={i} className={`rounded-2xl border overflow-hidden ${cardBg}`}>
                <div className="flex gap-4 p-5">

                  {/* Photo or emoji fallback */}
                  {listing.photo ? (
                    <img
                      src={listing.photo}
                      alt={listing.title}
                      className={`w-[72px] h-[72px] rounded-xl object-cover flex-shrink-0 border ${
                        dark ? "border-white/20" : "border-[#eee]"
                      }`}
                    />
                  ) : (
                    <div className={`w-[72px] h-[72px] rounded-xl flex-shrink-0 flex items-center justify-center text-3xl border ${
                      dark ? "bg-white/5 border-white/10" : "bg-[#f6f7fb] border-[#eee]"
                    }`}>
                      {CATEGORY_ICONS[listing.category] ?? "🛠️"}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    {/* Category badge */}
                    <span className={`self-start text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${badgeBg}`}>
                      {listing.category}
                    </span>

                    {/* Title */}
                    <h3 className={`text-sm font-black leading-snug ${titleCol}`}>
                      {listing.title}
                    </h3>

                    {/* Description */}
                    <p className={`text-xs leading-relaxed line-clamp-2 ${bodyCol}`}>
                      {listing.description}
                    </p>

                    {/* Meta pills */}
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {listing.price && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${pillBg}`}>
                          ₹{listing.price}
                          {listing.priceType === "Hourly"
                            ? "/hr"
                            : listing.priceType === "Negotiable"
                            ? " (neg.)"
                            : ""}
                        </span>
                      )}
                      {listing.area && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${pillBg}`}>
                          📍 {listing.area}
                        </span>
                      )}
                      {listing.availability && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${pillBg}`}>
                          🕐 {listing.availability}
                        </span>
                      )}
                      {listing.experience && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${pillBg}`}>
                          ⭐ {listing.experience} yr{listing.experience !== "1" ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer — phone */}
                {listing.phone && (
                  <div className={`px-5 py-3 border-t flex items-center justify-between ${divider}`}>
                    <span className={`text-[11px] uppercase tracking-wide font-bold ${metaCol}`}>
                      Contact
                    </span>
                    <a
                      href={`tel:${listing.phone}`}
                      className={`text-sm font-bold transition-colors ${
                        dark
                          ? "text-white hover:text-white/70"
                          : "text-[#ff2d55] hover:text-[#e0264a]"
                      }`}
                    >
                      📞 {listing.phone}
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
