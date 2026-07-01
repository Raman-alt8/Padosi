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

// Fixed page size so exactly one screen's worth of cards shows at a time —
// 3 columns × 2 rows on wider screens, 2 columns × 3 rows on narrow ones.
const CARDS_PER_PAGE = 6;

// ── TODO: REMOVE — temporary hardcoded cards for UI preview ──────────────────
// Delete this whole constant (and the `allListings` merge below) when real data is wired up.
const TEMP_CARDS = [
  { _isTemp: true, isOwner: true,  title: "Vikram's Carpentry",      category: "Carpenter",            price: 500,  priceType: "Per visit", description: "Custom furniture, door fitting, and woodwork repairs. Quality guaranteed.", area: "Sector 7",    availability: "Mon-Fri",      experience: 8,  phone: "+91 98001 11111" },
  { _isTemp: true, isOwner: false, title: "Priya House Cleaning",    category: "House Cleaning",        price: 800,  priceType: "Monthly",   description: "Deep clean, regular sweep, and kitchen scrub. Reliable and thorough.", area: "Green Park",  availability: "Mornings",     experience: 3,  phone: "+91 98002 22222" },
  { _isTemp: true, isOwner: false, title: "Ravi AC & Fridge Repair", category: "AC & Appliance Repair", price: 400,  priceType: "Per visit", description: "All brands serviced. Gas refill, coil cleaning, compressor checks.", area: "Model Town", availability: "Anytime",      experience: 10, phone: "+91 98003 33333" },
  { _isTemp: true, isOwner: false, title: "Sharma Pest Control",     category: "Pest Control",          price: 1200, priceType: "One-time",  description: "Cockroaches, termites, rodents — full home treatment with warranty.", area: "Sector 14",  availability: "Weekends",     experience: 6,  phone: "+91 98004 44444" },
  { _isTemp: true, isOwner: false, title: "Meena Beauty at Home",    category: "Salon & Beauty",        price: 300,  priceType: "Per visit", description: "Facial, waxing, threading, and bridal packages at your doorstep.", area: "Lake View",  availability: "By appt.",     experience: 5,  phone: "+91 98005 55555" },
];
// ─────────────────────────────────────────────────────────────────────────────

const RING_TINTS = ["#ffd1d6", "#ffdcaf", "#bfe6c9", "#bcd6f5", "#dcc7f0", "#f3c9e0"];
function ringFor(index) {
  return RING_TINTS[index % RING_TINTS.length];
}

// ── Service Card ──────────────────────────────────────────────────────────────
// NOTE: `[container-type:inline-size]` on the card root turns the card into a
// CSS query container. Sizes below use `cqw` so content scales with the card's
// own width. Two fixes vs. the old version:
//   1. The identity row no longer starves the title of space — the avatar and
//      price badge are smaller, and the title wraps to 2 lines instead of
//      getting hard-truncated to a few characters.
//   2. The card is no longer forced into a fixed grid row height that could
//      clip the footer. The grid below uses auto rows sized to content, and
//      the page scrolls if six full cards don't fit — so Accept/Decline/Edit/
//      phone number are always visible.
function ServiceCard({ listing, index, deleteConfirm, isAccepted, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel, onAccept, onDecline, onChat }) {
  const icon = CATEGORY_ICONS[listing.category] || "🛠️";
  const ring = ringFor(index);
  const isOwner = listing.isOwner;

  return (
    <div className="group relative bg-white rounded-2xl border border-[#ebebeb] overflow-visible flex flex-col h-full w-full transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_22px_45px_rgba(0,0,0,0.14)] hover:border-[#ff2d55]/25 [container-type:inline-size]">

      {/* Pin */}
      <span className="absolute -top-[2.6cqw] left-[9cqw] w-[5.2cqw] h-[5.2cqw] rounded-full bg-[#ff2d55] shadow-[0_2px_4px_rgba(0,0,0,0.25)] z-10" />

      <div className="rounded-2xl overflow-hidden flex flex-col flex-1">
        {/* Identity row */}
        <div className="relative flex items-start gap-[3cqw] px-[5cqw] pt-[5.5cqw] pb-[2cqw]">
          <div
            className="w-[12cqw] h-[12cqw] flex-shrink-0 rounded-full overflow-hidden bg-white flex items-center justify-center text-[6cqw]"
            style={{ boxShadow: `0 0 0 2px #fff, 0 0 0 3px ${ring}` }}
          >
            {listing.photoUrl ? (
              <img src={listing.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{icon}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[3.4cqw] font-bold uppercase tracking-widest text-[#999] flex items-center gap-[1.8cqw] truncate">
              {icon} {listing.category}
            </p>
            <h3 className="text-[5cqw] font-black text-[#1a1a1a] leading-snug mt-[1cqw] line-clamp-2 break-words">
              {listing.title}
            </h3>
          </div>
          {listing.price && (
            <span className="flex-shrink-0 text-[4cqw] font-bold text-[#111] bg-[#f4f4f4] rounded-full px-[3.2cqw] py-[1.2cqw] whitespace-nowrap leading-none">
              ₹{listing.price}
              <span className="font-normal text-[#999] ml-[1.6cqw]">
                {listing.priceType === "Monthly" ? "/mo" : "· once"}
              </span>
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="flex flex-col gap-[2.2cqw] px-[5.5cqw] flex-1">
          {listing.description && (
            <p className="text-[4.6cqw] text-[#888] leading-snug line-clamp-2">
              {listing.description}
            </p>
          )}

          <div className="flex flex-wrap gap-[2.2cqw]">
            {listing.area && (
              <span className="inline-flex items-center gap-[2.2cqw] text-[4.2cqw] font-bold text-[#555] bg-[#f4f4f4] rounded-full px-[3.3cqw] py-[1.1cqw]">
                <span className="text-[4cqw]">📍</span>
                {listing.area}
              </span>
            )}
            {listing.availability && (
              <span className="inline-flex items-center gap-[2.2cqw] text-[4.2cqw] font-bold text-[#555] bg-[#f4f4f4] rounded-full px-[3.3cqw] py-[1.1cqw]">
                <span className="text-[4cqw]">🕐</span>
                {listing.availability}
              </span>
            )}
          </div>

          <div className="relative flex-1 min-h-[2px]">
            {listing.experience && (
              <div
                className="absolute right-0 bottom-0 w-[13cqw] h-[13cqw] rounded-full border flex flex-col items-center justify-center opacity-85"
                style={{ borderColor: ring, transform: "rotate(-9deg)" }}
              >
                <span className="text-[4.4cqw] font-black text-[#1a1a1a] opacity-55 leading-none">
                  {listing.experience}
                  <sup className="text-[3cqw]">y</sup>
                </span>
                <span className="text-[2.3cqw] font-bold uppercase tracking-widest text-[#1a1a1a] opacity-40 mt-[1cqw]">
                  Exp
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Seam */}
        <div className="relative mt-[3cqw]">
          <span className="absolute top-1/2 -left-px -translate-y-1/2 w-[5cqw] h-[5cqw] rounded-full bg-[#f5f5f7] border border-[#ebebeb]" />
          <span className="absolute top-1/2 -right-px -translate-y-1/2 w-[5cqw] h-[5cqw] rounded-full bg-[#f5f5f7] border border-[#ebebeb]" />
          <div className="border-t border-dashed border-[#dcd8cf] mx-[6cqw]" />
        </div>

        {/* Footer */}
        <div className="px-[6cqw] py-[3.5cqw] flex items-center justify-between gap-[4cqw]">
          {isOwner || !isAccepted ? (
            listing.phone ? (
              <a
                href={`tel:${listing.phone}`}
                className="text-[4.6cqw] font-bold text-[#ff2d55] hover:text-[#e0264a] transition-colors truncate flex items-center gap-[1.8cqw]"
              >
                <span className="text-[4.2cqw]">📞</span>
                {listing.phone}
              </a>
            ) : <span />
          ) : <span />}

          <div className="flex items-center gap-[2cqw] flex-shrink-0">
            {isOwner ? (
              /* ── Owner: Edit + Delete ── */
              <>
                <button
                  onClick={() => onEdit(listing)}
                  className="px-[3.8cqw] py-[1.4cqw] rounded-full text-[4.2cqw] font-bold cursor-pointer border border-[#ff2d55]/25 text-[#ff2d55] bg-[#fff0f3] hover:bg-[#ff2d55] hover:text-white hover:border-[#ff2d55] transition-colors"
                >
                  Edit
                </button>

                {deleteConfirm === index ? (
                  <>
                    <button
                      onClick={() => onDeleteConfirm(index)}
                      className="px-[3.8cqw] py-[1.4cqw] rounded-full text-[4.2cqw] font-bold cursor-pointer bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={onDeleteCancel}
                      className="px-[3.8cqw] py-[1.4cqw] rounded-full text-[4.2cqw] font-bold cursor-pointer border border-[#e0e0e0] text-[#777] hover:border-[#333] hover:text-[#333] transition-colors"
                    >
                      No
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onDeleteRequest(index)}
                    className="px-[3.8cqw] py-[1.4cqw] rounded-full text-[4.2cqw] font-bold cursor-pointer border border-[#e0e0e0] text-[#999] hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </>
            ) : isAccepted ? (
              /* ── Accepted: poster's phone number + chat icon ── */
              <div className="flex items-center gap-[3cqw] w-full justify-between">
                {listing.phone ? (
                  <a
                    href={`tel:${listing.phone}`}
                    className="text-[4.6cqw] font-bold text-[#ff2d55] hover:text-[#e0264a] transition-colors truncate flex items-center gap-[1.8cqw]"
                  >
                    <span className="text-[4.2cqw]">📞</span>
                    {listing.phone}
                  </a>
                ) : (
                  <span className="text-[4.2cqw] font-bold text-[#999]">No number</span>
                )}
                <button
                  onClick={() => onChat?.(index)}
                  aria-label="Chat"
                  title="Chat"
                  className="w-[11cqw] h-[11cqw] flex-shrink-0 rounded-full flex items-center justify-center text-[5cqw] cursor-pointer border border-[#e0e0e0] text-[#555] bg-[#f4f4f4] hover:bg-[#ff2d55] hover:text-white hover:border-[#ff2d55] transition-colors"
                >
                  💬
                </button>
              </div>
            ) : (
              /* ── Other user: Accept + Decline ── */
              <>
                <button
                  onClick={() => onAccept?.(index)}
                  className="px-[3.8cqw] py-[1.4cqw] rounded-full text-[4.2cqw] font-bold cursor-pointer border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => onDecline?.(index)}
                  className="px-[3.8cqw] py-[1.4cqw] rounded-full text-[4.2cqw] font-bold cursor-pointer border border-[#e0e0e0] text-[#999] hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-colors"
                >
                  Decline
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ServiceListingsAllPage({ listings = [], onDelete, onAccept, onDecline, onChat, dark }) {
  const [open, setOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  // Locally-scoped, "this account only" state. Declining hides a card just for
  // this viewer without touching the underlying listing; accepting flips that
  // card's footer to show contact details instead of Accept/Decline.
  const [declinedIndexes, setDeclinedIndexes] = useState(() => new Set());
  const [acceptedIndexes, setAcceptedIndexes] = useState(() => new Set());

  const [page, setPage] = useState(1);

  // Jump back to page 1 whenever the filter or sort changes the list.
  useEffect(() => {
    setPage(1);
  }, [categoryFilter, sortBy]);

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

  const handleAccept = (index) => {
    setAcceptedIndexes((prev) => new Set(prev).add(index));
    onAccept?.(index);
  };

  const handleDecline = (index) => {
    // Remove from this viewer's list only — the listing itself is untouched.
    setDeclinedIndexes((prev) => new Set(prev).add(index));
    onDecline?.(index);
  };

  // TODO: REMOVE — merge real listings with temp cards; delete `allListings` and use `listings` directly when done
  const allListings = useMemo(() => [...listings, ...TEMP_CARDS], [listings]);

  const visibleListings = useMemo(() => {
    const indexed = allListings
      .map((listing, originalIndex) => ({ listing, originalIndex }))
      .filter(({ originalIndex }) => !declinedIndexes.has(originalIndex));

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
  }, [allListings, categoryFilter, sortBy, declinedIndexes]);

  const totalPages = Math.max(1, Math.ceil(visibleListings.length / CARDS_PER_PAGE));

  // Clamp page if a decline (or filter change) shrinks the list out from under it.
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pagedListings = useMemo(() => {
    const start = (page - 1) * CARDS_PER_PAGE;
    return visibleListings.slice(start, start + CARDS_PER_PAGE);
  }, [visibleListings, page]);

  const rangeStart = visibleListings.length === 0 ? 0 : (page - 1) * CARDS_PER_PAGE + 1;
  const rangeEnd = Math.min(page * CARDS_PER_PAGE, visibleListings.length);

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

        <div className="min-w-[40px] text-right">
          {allListings.length > 0 && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              dark ? "bg-white/10 text-white/60" : "bg-[#ff2d55]/10 text-[#ff2d55]"
            }`}>
              {allListings.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full px-6 py-6 flex flex-col gap-4 overflow-hidden">

        {allListings.length === 0 ? (
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

              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-bold uppercase tracking-widest whitespace-nowrap ${metaCol}`}>
                  {rangeStart}–{rangeEnd} of {visibleListings.length}
                </span>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      aria-label="Previous page"
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-bold border transition-colors ${
                        page === 1
                          ? "opacity-30 cursor-not-allowed border-[#e0e0e0] text-[#999]"
                          : "cursor-pointer border-[#e0e0e0] text-[#555] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                      } ${dark ? "border-white/15 text-white/60" : ""}`}
                    >
                      ‹
                    </button>
                    <span className={`text-[11px] font-bold whitespace-nowrap ${dark ? "text-white/60" : "text-[#555]"}`}>
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      aria-label="Next page"
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-bold border transition-colors ${
                        page === totalPages
                          ? "opacity-30 cursor-not-allowed border-[#e0e0e0] text-[#999]"
                          : "cursor-pointer border-[#e0e0e0] text-[#555] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                      } ${dark ? "border-white/15 text-white/60" : ""}`}
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Changed from a fixed grid-rows-3/2 + overflow-hidden (which could
                clip the footer of any card taller than its allotted row) to
                auto-height rows with a scrollable region. Six cards still fit
                one screen in the common case, but nothing gets cut off if a
                card needs a bit more room (long title, long description). */}
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
                <div className="grid grid-cols-2 md:grid-cols-3 auto-rows-[minmax(260px,auto)] gap-4 w-full">
                  {pagedListings.map(({ listing, originalIndex }) => (
                    <ServiceCard
                      key={originalIndex}
                      listing={listing}
                      index={originalIndex}
                      deleteConfirm={deleteConfirm}
                      isAccepted={acceptedIndexes.has(originalIndex)}
                      onEdit={handleEdit}
                      onDeleteRequest={(idx) => setDeleteConfirm(idx)}
                      onDeleteConfirm={handleDelete}
                      onDeleteCancel={() => setDeleteConfirm(null)}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      onChat={onChat}
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

// ── Demo wrapper ──────────────────────────────────────────────────────────────
export function Demo() {
  const [listings, setListings] = useState([
    { isOwner: true, title: "My Plumbing Service", category: "Plumber", price: 350, priceType: "Per visit", description: "24/7 emergency leak fixing, pipe fitting, and bathroom installs.", area: "Sector 14", availability: "Mon-Sat", experience: 12, phone: "+91 98765 43210" },
  ]);
  return (
    <ServiceListingsAllPage
      listings={listings}
      onDelete={(idx) => setListings((prev) => prev.filter((_, i) => i !== idx))}
      onAccept={(idx) => console.log("Accepted", idx)}
      onDecline={(idx) => console.log("Declined", idx)}
      onChat={(idx) => console.log("Open chat for", idx)}
    />
  );
}