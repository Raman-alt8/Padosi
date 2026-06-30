// ServiceListingsAllPage.jsx
import { useState, useEffect, useMemo } from "react";

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

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "experience", label: "Most experienced" },
];

// Ring tints keyed off category so the avatar halo + stamp colour feel
// intentional rather than random — pulled from the original index-card prototype.
const RING_TINTS = ["#ffd1d6", "#ffdcaf", "#bfe6c9", "#bcd6f5", "#dcc7f0", "#f3c9e0"];
function ringFor(index) {
  return RING_TINTS[index % RING_TINTS.length];
}

// ── Service Card ──────────────────────────────────────────────────────────────
// Merges the photo-hero treatment with the corkboard "index card" details from
// the original prototype: a pin at the top, a round avatar badge with a tinted
// halo sitting on the photo, a torn-ticket dashed seam above the footer, and a
// rotated experience stamp — so the card still reads as a pinned listing card,
// not just a generic photo tile.
function ServiceCard({ listing, index, deleteConfirm, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel }) {
  const icon = CATEGORY_ICONS[listing.category] || "🛠️";
  const ring = ringFor(index);

  return (
    <div className="group relative bg-white rounded-2xl border border-[#ebebeb] overflow-visible flex flex-col h-full transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_22px_45px_rgba(0,0,0,0.14)] hover:border-[#ff2d55]/25">

      {/* Pin — corkboard detail, sits above the card edge */}
      <span className="absolute -top-[6px] left-5 w-3 h-3 rounded-full bg-[#ff2d55] shadow-[0_2px_4px_rgba(0,0,0,0.25)] z-10" />

      <div className="rounded-2xl overflow-hidden flex flex-col flex-1">
        {/* Photo — full-bleed hero, zooms gently on hover */}
        <div className="relative h-28 w-full flex-shrink-0 overflow-hidden">
          {listing.photoUrl ? (
            <img
              src={listing.photoUrl}
              alt={listing.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.08]"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-[#ff2d55] to-[#ff8a65] transition-transform duration-500 ease-out group-hover:scale-[1.08]">
              {icon}
            </div>
          )}

          {/* Price — floats above the photo */}
          {listing.price && (
            <span className="absolute top-2.5 right-2.5 text-[11px] font-bold text-[#111] bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 whitespace-nowrap leading-none shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
              ₹{listing.price}
              <span className="font-normal text-[#999] ml-1">
                {listing.priceType === "Monthly" ? "/mo" : "· once"}
              </span>
            </span>
          )}
        </div>

        {/* Identity row — avatar badge with tinted halo, overlapping the photo
            bottom edge, ticket-prototype style instead of text-over-scrim */}
        <div className="relative flex items-center gap-2 px-3 pt-0 pb-1.5 -mt-5">
          <div
            className="w-9 h-9 flex-shrink-0 rounded-full overflow-hidden bg-white flex items-center justify-center text-base"
            style={{ boxShadow: `0 0 0 2.5px #fff, 0 0 0 3.5px ${ring}` }}
          >
            {listing.photoUrl ? (
              <img src={listing.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{icon}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[8.5px] font-bold uppercase tracking-widest text-[#999] flex items-center gap-1 truncate">
              {icon} {listing.category}
            </p>
            <h3 className="text-[13px] font-black text-[#1a1a1a] leading-snug truncate mt-0.5">
              {listing.title}
            </h3>
          </div>
        </div>

        {/* Card body */}
        <div className="flex flex-col gap-1.5 px-3 flex-1">
          {listing.description && (
            <p className="text-[10.5px] text-[#888] leading-snug line-clamp-2">
              {listing.description}
            </p>
          )}

          <div className="flex flex-wrap gap-1">
            {listing.area && (
              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-[#555] bg-[#f4f4f4] rounded-full px-2 py-0.5">
                <span className="text-[9px]">📍</span>
                {listing.area}
              </span>
            )}
            {listing.availability && (
              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-[#555] bg-[#f4f4f4] rounded-full px-2 py-0.5">
                <span className="text-[9px]">🕐</span>
                {listing.availability}
              </span>
            )}
          </div>

          {/* Spacer with rotated experience stamp, anchored bottom-right —
              mirrors the original prototype's "stamp" detail */}
          <div className="relative flex-1 min-h-[4px]">
            {listing.experience && (
              <div
                className="absolute right-0 bottom-0 w-8 h-8 rounded-full border flex flex-col items-center justify-center opacity-85"
                style={{ borderColor: ring, transform: "rotate(-9deg)" }}
              >
                <span className="text-[10px] font-black text-[#1a1a1a] opacity-55 leading-none">
                  {listing.experience}
                  <sup className="text-[6.5px]">y</sup>
                </span>
                <span className="text-[5px] font-bold uppercase tracking-widest text-[#1a1a1a] opacity-40 mt-0.5">
                  Exp
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Seam — dashed perforation with notch cutouts, like a torn ticket
            stub, separating the card body from the footer */}
        <div className="relative mt-0.5">
          <span className="absolute top-1/2 -left-px -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#f5f5f7] border border-[#ebebeb]" />
          <span className="absolute top-1/2 -right-px -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#f5f5f7] border border-[#ebebeb]" />
          <div className="border-t border-dashed border-[#dcd8cf] mx-3" />
        </div>

        {/* Footer */}
        <div className="px-3 py-1.5 flex items-center justify-between gap-2">
          {listing.phone ? (
            <a
              href={`tel:${listing.phone}`}
              className="text-[10px] font-bold text-[#ff2d55] hover:text-[#e0264a] transition-colors truncate flex items-center gap-1"
            >
              <span className="text-[9px]">📞</span>
              {listing.phone}
            </a>
          ) : <span />}

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(listing)}
              className="px-2 py-0.5 rounded-full text-[9px] font-bold cursor-pointer border border-[#ff2d55]/25 text-[#ff2d55] bg-[#fff0f3] hover:bg-[#ff2d55] hover:text-white hover:border-[#ff2d55] transition-colors"
            >
              Edit
            </button>

            {deleteConfirm === index ? (
              <>
                <button
                  onClick={() => onDeleteConfirm(index)}
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold cursor-pointer bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={onDeleteCancel}
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold cursor-pointer border border-[#e0e0e0] text-[#777] hover:border-[#333] hover:text-[#333] transition-colors"
                >
                  No
                </button>
              </>
            ) : (
              <button
                onClick={() => onDeleteRequest(index)}
                className="px-2 py-0.5 rounded-full text-[9px] font-bold cursor-pointer border border-[#e0e0e0] text-[#999] hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ServiceListingsAllPage({ listings = [], onDelete, dark }) {
  const [open, setOpen] = useState(true); // default true for preview purposes
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const handler = (e) => {
      setOpen(true);
      const incomingCategory = e?.detail?.category;
      setCategoryFilter(
        incomingCategory && POST_CATEGORIES.includes(incomingCategory) ? incomingCategory : "All"
      );
    };
    window.addEventListener("padosi:allListings", handler);
    return () => window.removeEventListener("padosi:allListings", handler);
  }, []);

  const close = () => setOpen(false);

  const handleEdit = (listing) => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("padosi:postService", { detail: { listing } }));
  };

  const handleDelete = (index) => {
    onDelete?.(index);
    setDeleteConfirm(null);
  };

  const visibleListings = useMemo(() => {
    const indexed = listings.map((listing, originalIndex) => ({ listing, originalIndex }));
    const filtered = categoryFilter === "All"
      ? indexed
      : indexed.filter(({ listing }) => listing.category === categoryFilter);

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price_low":
          return (Number(a.listing.price) || 0) - (Number(b.listing.price) || 0);
        case "price_high":
          return (Number(b.listing.price) || 0) - (Number(a.listing.price) || 0);
        case "experience":
          return (Number(b.listing.experience) || 0) - (Number(a.listing.experience) || 0);
        case "newest":
        default:
          return b.originalIndex - a.originalIndex;
      }
    });

    return sorted;
  }, [listings, categoryFilter, sortBy]);

  const bg = dark ? "bg-[#0d0d0d]" : "bg-[#f5f5f7]";
  const headerBg = dark ? "bg-[#111] border-white/10" : "bg-white border-[#ebebeb]";
  const titleCol = dark ? "text-white" : "text-[#111]";
  const metaCol = dark ? "text-white/30" : "text-[#bbb]";

  const selectClass = `h-9 rounded-full px-3 text-[11px] font-bold border outline-none cursor-pointer transition-colors ${
    dark
      ? "bg-[#111] border-white/15 text-white/80 hover:border-white/30 focus:border-white/50"
      : "bg-white border-[#e0e0e0] text-[#555] hover:border-[#ccc] focus:border-[#ff2d55]"
  }`;

  return (
    <div
      className={`fixed inset-0 z-[7000] flex flex-col transition-opacity duration-300 ${bg} ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className={`h-[64px] flex-shrink-0 flex items-center justify-between px-6 border-b ${headerBg}`}>
        <button
          onClick={close}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold cursor-pointer border transition-all active:scale-[0.97] ${
            dark
              ? "bg-transparent border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
              : "bg-white border-[#e0e0e0] text-[#555] hover:border-[#ccc] hover:text-[#222]"
          }`}
        >
          ← Back
        </button>

        <p className={`text-[15px] font-black tracking-tight ${titleCol}`}>
          Listed Services
        </p>

        <div className={`min-w-[40px] text-right`}>
          {listings.length > 0 && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              dark ? "bg-white/10 text-white/60" : "bg-[#ff2d55]/10 text-[#ff2d55]"
            }`}>
              {listings.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full px-6 py-6 flex flex-col gap-4 overflow-hidden">

        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#ddd] bg-white p-16 flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">🏘️</span>
            <p className="text-[15px] font-black text-[#111]">Nothing here yet</p>
            <p className="text-sm text-[#888]">Post the first service — neighbours are waiting.</p>
          </div>
        ) : (
          <>
            <div className="h-9 flex-shrink-0 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="All">All categories</option>
                  {POST_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={selectClass}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <span className={`text-[11px] font-bold uppercase tracking-widest whitespace-nowrap ${metaCol}`}>
                {visibleListings.length} of {listings.length} shown
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {visibleListings.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
                  <span className="text-3xl">🔍</span>
                  <p className={`text-sm font-bold ${dark ? "text-white" : "text-[#333]"}`}>
                    No listings in {categoryFilter}
                  </p>
                  <button
                    onClick={() => setCategoryFilter("All")}
                    className="text-[11px] font-bold text-[#ff2d55] underline underline-offset-2 cursor-pointer"
                  >
                    Clear filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 grid-rows-3 gap-4 h-full">
                  {visibleListings.map(({ listing, originalIndex }) => (
                    <ServiceCard
                      key={originalIndex}
                      listing={listing}
                      index={originalIndex}
                      deleteConfirm={deleteConfirm}
                      onEdit={handleEdit}
                      onDeleteRequest={(idx) => setDeleteConfirm(idx)}
                      onDeleteConfirm={handleDelete}
                      onDeleteCancel={() => setDeleteConfirm(null)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Demo data + wrapper so this renders standalone in the artifact preview ───
const DEMO_LISTINGS = [
  { title: "Ramesh Kumar — Plumbing", category: "Plumber", price: 350, priceType: "Per visit", description: "24/7 emergency leak fixing, pipe fitting, and bathroom installs. 12 years in the colony.", area: "Sector 14", availability: "Mon-Sat", experience: 12, phone: "+91 98765 43210", photoUrl: null },
  { title: "Sunita's Daycare", category: "Daycare & Babysitting", price: 6500, priceType: "Monthly", description: "Safe, loving daycare for ages 1-5. CPR certified, home-cooked meals included.", area: "Green Park", availability: "8am-6pm", experience: 7, phone: "+91 91234 56789", photoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&h=400&fit=crop" },
  { title: "Quick Fix Electrical", category: "Electrician", price: 250, priceType: "Per visit", description: "Wiring, fan installs, MCB issues — same day response.", area: "Sector 9", availability: "Anytime", experience: 5, phone: "+91 99887 76655", photoUrl: null },
  { title: "Anjali Tutoring", category: "Tutoring", price: 800, priceType: "Monthly", description: "Maths & Science, grades 6-10. Board exam focused, small batches.", area: "Lake View", availability: "Evenings", experience: 4, phone: "+91 90000 11122", photoUrl: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400&h=400&fit=crop" },
  { title: "Bruno's Pet Walks", category: "Pet Care", price: 200, priceType: "One-time", description: "Daily walks and weekend boarding for dogs of any size.", area: "Sector 14", availability: "Morning", experience: 2, phone: "+91 98123 45678", photoUrl: null },
  { title: "Ghar Ka Khana", category: "Cook & Catering", price: 4000, priceType: "Monthly", description: "North Indian home-style tiffin service, fresh daily.", area: "Model Town", availability: "Lunch & Dinner", experience: 9, phone: "+91 97654 32109", photoUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop" },
];

export function Demo() {
  const [listings, setListings] = useState(DEMO_LISTINGS);
  return (
    <ServiceListingsAllPage
      listings={listings}
      onDelete={(idx) => setListings((prev) => prev.filter((_, i) => i !== idx))}
    />
  );
}