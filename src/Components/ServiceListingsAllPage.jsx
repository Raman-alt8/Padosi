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

// ── Service Card ──────────────────────────────────────────────────────────────
function ServiceCard({ listing, index, deleteConfirm, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel }) {
  const icon = CATEGORY_ICONS[listing.category] || "🛠️";

  return (
    <div className="group bg-white rounded-2xl border border-[#ebebeb] overflow-hidden flex flex-col h-full transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_22px_45px_rgba(0,0,0,0.14)] hover:border-[#ff2d55]/25">

      {/* Photo — does the visual heavy lifting now: full-bleed, zooms gently
          on hover, with the title/category set right on top via a bottom
          gradient scrim, poster-style. No photo falls back to a colored
          gradient field so the layout still feels intentional, not broken. */}
      <div className="relative h-44 w-full flex-shrink-0 overflow-hidden">
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

        {/* Title + category — set on a bottom scrim over the photo */}
        <div className="absolute inset-x-0 bottom-0 pt-12 pb-3 px-3.5 bg-gradient-to-t from-black/85 via-black/35 to-transparent">
          <p className="text-[9.5px] font-bold uppercase tracking-widest text-white/85">
            {listing.category}
          </p>
          <h3 className="text-[14.5px] font-black text-white leading-snug line-clamp-1 mt-0.5">
            {listing.title}
          </h3>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2.5 p-3.5 flex-1">

        {/* Description */}
        {listing.description && (
          <p className="text-[11.5px] text-[#777] leading-relaxed line-clamp-2">
            {listing.description}
          </p>
        )}

        {/* Meta pills */}
        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          {listing.area && (
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#555] bg-[#f4f4f4] rounded-full px-2.5 py-1">
              <span className="text-[10px]">📍</span>
              {listing.area}
            </span>
          )}
          {listing.availability && (
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#555] bg-[#f4f4f4] rounded-full px-2.5 py-1">
              <span className="text-[10px]">🕐</span>
              {listing.availability}
            </span>
          )}
          {listing.experience && (
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#555] bg-[#f4f4f4] rounded-full px-2.5 py-1">
              <span className="text-[10px]">⭐</span>
              {listing.experience}y exp
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3.5 py-2.5 border-t border-[#f0f0f0] bg-[#fafafa] flex items-center justify-between gap-2">
        {listing.phone ? (
          <a
            href={`tel:${listing.phone}`}
            className="text-[11px] font-bold text-[#ff2d55] hover:text-[#e0264a] transition-colors truncate flex items-center gap-1"
          >
            <span className="text-[10px]">📞</span>
            {listing.phone}
          </a>
        ) : <span />}

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onEdit(listing)}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer border border-[#ff2d55]/25 text-[#ff2d55] bg-[#fff0f3] hover:bg-[#ff2d55] hover:text-white hover:border-[#ff2d55] transition-colors"
          >
            Edit
          </button>

          {deleteConfirm === index ? (
            <>
              <button
                onClick={() => onDeleteConfirm(index)}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={onDeleteCancel}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer border border-[#e0e0e0] text-[#777] hover:border-[#333] hover:text-[#333] transition-colors"
              >
                No
              </button>
            </>
          ) : (
            <button
              onClick={() => onDeleteRequest(index)}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer border border-[#e0e0e0] text-[#999] hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ServiceListingsAllPage({ listings = [], onDelete, dark }) {
  const [open, setOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const handler = (e) => {
      setOpen(true);
      // If opened from a category card (ServiceListingsPage), e.detail.category is set;
      // the hero "All Listings" button dispatches a plain Event with no detail → show all.
      const incomingCategory = e?.detail?.category;
      setCategoryFilter(
        incomingCategory && POST_CATEGORIES.includes(incomingCategory) ? incomingCategory : "All"
      );
    };
    window.addEventListener("padosi:allListings", handler);
    return () => window.removeEventListener("padosi:allListings", handler);
  }, []);

  const close = () => setOpen(false);

  // Editing now happens on the full PostServicePage instead of a small inline
  // modal: close this view and hand the listing off via the same event
  // PostServicePage already listens to for opening, with the listing attached
  // so it knows to pre-fill the form and PUT instead of POST on submit.
  const handleEdit = (listing) => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("padosi:postService", { detail: { listing } }));
  };

  const handleDelete = (index) => {
    onDelete?.(index);
    setDeleteConfirm(null);
  };

  // Keep each listing's original array index (needed by delete) while filtering + sorting
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
      {/* Header */}
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

        {/* Count badge */}
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

      {/* Body — fixed to fill remaining viewport height so 6 cards are always visible by default */}
      <div className="flex-1 min-h-0 w-full px-6 py-6 flex flex-col gap-4 overflow-hidden">

        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#ddd] bg-white p-16 flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">🏘️</span>
            <p className="text-[15px] font-black text-[#111]">Nothing here yet</p>
            <p className="text-sm text-[#888]">Post the first service — neighbours are waiting.</p>
          </div>
        ) : (
          <>
            {/* Category + sort controls — replaces the old sub-label line */}
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

            {/* Grid — fixed row height keeps exactly 6 cards visible without scrolling; more items scroll */}
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
                <div className="grid grid-cols-3 gap-5 items-start">
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