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

// ── Temporary showcase listings ──────────────────────────────────────────────
// Hardcoded, non-interactive example cards so the grid never looks empty
// while real listings are still trickling in. They're tagged `isDemo: true`
// and given negative sentinel `originalIndex` values (-1, -2, ...) so they
// can never collide with a real array index and never reach onDelete /
// onAccept / onDecline / the parent at all. To remove this showcase content
// later: delete this array, and the two `isDemo` branches below (one in
// `visibleListings`, one in `ServiceCard`'s footer) can go with it.
const DEMO_LISTINGS = [
  {
    isDemo: true,
    category: "Plumber",
    title: "Example: Quick Leak & Tap Repairs",
    description: "This is a sample card so you can see how a listing looks — post your own to replace it.",
    price: 300,
    priceType: "Per visit",
    experience: 5,
    area: "Sample area",
    availability: "Mon-Sat",
    verified: true,
  },
  {
    isDemo: true,
    category: "House Cleaning",
    title: "Example: Home Deep Cleaning",
    description: "Another sample listing for demo purposes — real neighbours' posts will look just like this.",
    price: 800,
    priceType: "Monthly",
    experience: 3,
    area: "Sample area",
    availability: "Tue, Thu, Sat",
  },
];

// Human-readable, compact price suffix — falls back to a parenthesised raw
// value so unrecognised priceType strings still render something sane.
function priceUnitShort(priceType) {
  if (priceType === "Monthly") return "/month";
  if (priceType === "Per visit") return "/visit";
  if (priceType === "One-time") return "";
  return priceType ? ` (${priceType})` : "";
}

// Simple line-style heart, filled + tinted when saved. Kept as its own
// component so the fill/stroke swap in one place instead of being inlined
// twice.
function HeartIcon({ filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-[3.6cqw] h-[3.6cqw]"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
    >
      <path d="M12 20.3c-.24 0-.47-.08-.66-.23C6.9 16.71 3.6 13.83 3.6 9.9 3.6 6.9 5.87 4.7 8.7 4.7c1.6 0 3.13.77 4.06 1.97l1.24 1.6 1.24-1.6c.93-1.2 2.46-1.97 4.06-1.97 2.83 0 5.1 2.2 5.1 5.2 0 3.93-3.3 6.81-7.74 10.17-.19.15-.42.23-.66.23z" />
    </svg>
  );
}

// ── Service Card ──────────────────────────────────────────────────────────────
// NOTE: `[container-type:inline-size]` on the card root turns the card into a
// CSS query container. Sizes below use `cqw` so content scales with the card's
// own width. The grid uses auto rows sized to content, and the page scrolls if
// six full cards don't fit — so the footer's phone number and action buttons
// are always visible.
//
// Layout: square image tile (falls back to the category emoji when there's
// no photo) next to category + optional "Verified" badges, title, and a
// one-line tagline. Below that, scannable meta rows (location, hours, and —
// only when the data exists — a star rating) hand off to two label/value
// stat rows for price and experience, the two numbers people are actually
// comparing across cards. A heart toggle sits top-right for saving a listing.
// `listing.verified`, `listing.rating`, and `listing.reviewCount` are all
// optional — each row only renders when the field is present, nothing is
// invented.
function ServiceCard({ listing, index, deleteConfirm, isAccepted, isWishlisted, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel, onAccept, onDecline, onChat, onToggleWishlist }) {
  const icon = CATEGORY_ICONS[listing.category] || "🛠️";
  const isOwner = listing.isOwner;
  const isDemo = listing.isDemo;
  const hasMetaRow = listing.area || listing.availability || listing.rating != null;
  const hasStatRow = listing.price || listing.experience;

  return (
    <div className="group relative bg-white rounded-2xl border border-[#ebebeb] overflow-hidden flex flex-col h-full w-full transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_22px_45px_rgba(0,0,0,0.14)] hover:border-[#ff2d55]/25 [container-type:inline-size]">

      {/* Wishlist */}
      <button
        onClick={() => onToggleWishlist?.(index)}
        aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={isWishlisted}
        className={`absolute top-[2.6cqw] right-[2.6cqw] z-20 w-[7.2cqw] h-[7.2cqw] flex-shrink-0 rounded-full flex items-center justify-center cursor-pointer border transition-all duration-200 active:scale-90 ${
          isWishlisted
            ? "bg-[#ff2d55] border-[#ff2d55] text-white shadow-[0_4px_10px_rgba(255,45,85,0.35)]"
            : "bg-white/95 border-[#ebebeb] text-[#bbb] shadow-[0_2px_6px_rgba(0,0,0,0.1)] hover:text-[#ff2d55] hover:border-[#ff2d55]/40"
        }`}
      >
        <HeartIcon filled={isWishlisted} />
      </button>

      <div className="flex flex-col flex-1">
        {/* Identity row */}
        <div className="flex items-start gap-[2.6cqw] pl-[4.5cqw] pr-[9cqw] pt-[4.2cqw] pb-[2cqw]">
          <div className="w-[11.5cqw] h-[11.5cqw] flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-[#fff5f7] to-[#eef4ff] border border-white shadow-sm flex items-center justify-center text-[5.4cqw] transition-transform duration-300 group-hover:scale-105">
            {listing.photoUrl ? (
              <img src={listing.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{icon}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-[1.1cqw]">
              <span className="inline-flex max-w-full items-center text-[2.3cqw] font-black uppercase tracking-wide text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-[2cqw] py-[0.8cqw] truncate">
                {listing.category}
              </span>
              {listing.verified && (
                <span className="inline-flex items-center text-[2.3cqw] font-bold text-[#16a34a] bg-[#dcfce7] rounded-full px-[2cqw] py-[0.8cqw] whitespace-nowrap">
                  Verified
                </span>
              )}
              {isDemo && (
                <span className="inline-flex items-center text-[2.3cqw] font-bold text-[#7c3aed] bg-[#f3e8ff] rounded-full px-[2cqw] py-[0.8cqw] whitespace-nowrap">
                  Sample
                </span>
              )}
            </div>
            <h3 className="text-[3.8cqw] font-extrabold tracking-tight leading-snug text-[#1a1a1a] mt-[1.2cqw] line-clamp-2 break-words">
              {listing.title}
            </h3>
            {listing.description && (
              <p className="text-[2.9cqw] text-[#999] leading-snug line-clamp-2 mt-[0.5cqw] break-words">
                {listing.description}
              </p>
            )}
          </div>
        </div>

        {/* Meta rows + stat rows — flex-1 so the footer stays pinned to the
            bottom of the card regardless of how much content is above it. */}
        <div className="flex flex-col gap-[1.6cqw] px-[4.5cqw] flex-1">
          {(listing.area || listing.availability) && (
            <div className="flex flex-wrap gap-[1.2cqw]">
              {listing.area && (
                <span className="inline-flex items-center gap-[1cqw] rounded-full bg-gray-100 px-[1.8cqw] py-[0.7cqw] text-[2.6cqw] font-semibold text-[#555] max-w-full truncate">
                  📍 {listing.area}
                </span>
              )}
              {listing.availability && (
                <span className="inline-flex items-center gap-[1cqw] rounded-full bg-gray-100 px-[1.8cqw] py-[0.7cqw] text-[2.6cqw] font-semibold text-[#555] max-w-full truncate">
                  🕐 {listing.availability}
                </span>
              )}
            </div>
          )}
          {listing.rating != null && (
            <div className="flex items-center gap-[1.2cqw] text-[3cqw] font-bold text-[#1a1a1a]">
              <span className="text-[3cqw]">⭐</span>
              {listing.rating}
              {listing.reviewCount != null && (
                <span className="text-[2.6cqw] font-semibold text-[#999]">({listing.reviewCount} reviews)</span>
              )}
            </div>
          )}

          {hasMetaRow && hasStatRow && (
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          )}

          {(listing.price || listing.experience) && (
            <div className="flex items-end justify-between gap-[1.6cqw]">
              {listing.price && (
                <div className="min-w-0 flex flex-col gap-[0.3cqw]">
                  <p className="text-[2.5cqw] font-semibold text-gray-500">Starting at</p>
                  <div className="flex items-end gap-[0.6cqw]">
                    <span className="text-[4.4cqw] font-black text-[#ff2d55] leading-none whitespace-nowrap">₹{listing.price}</span>
                    {priceUnitShort(listing.priceType) && (
                      <span className="text-[2.3cqw] text-gray-500 leading-none whitespace-nowrap">{priceUnitShort(listing.priceType)}</span>
                    )}
                  </div>
                </div>
              )}
              {listing.experience && (
                <span className="inline-flex flex-shrink-0 items-center gap-[0.8cqw] rounded-full bg-amber-50 text-amber-700 px-[2cqw] py-[0.8cqw] text-[2.5cqw] font-semibold whitespace-nowrap">
                  ⭐ {listing.experience} Years
                </span>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-[4.5cqw] mt-[1.8cqw]" />

        {/* Footer
            NOTE: font sizes/padding here use clamp(min, Ncqw, max) instead of
            bare cqw. Bare cqw scaled with the *card's* width, and on wide
            (3-per-row desktop) cards that pushed the phone number + buttons
            past the available width, cutting the number off. clamp() keeps
            the same fluid feel on small cards but caps growth on large ones. */}
        <div className="px-[4.5cqw] py-[2.6cqw] flex items-center gap-[clamp(6px,2cqw,14px)]">
          {isDemo ? (
            <span className="text-[clamp(11px,2.3cqw,14px)] font-semibold text-[#aaa] italic truncate">
              Sample listing — post yours to replace this
            </span>
          ) : isOwner || !isAccepted ? (
            listing.phone ? (
              <a
                href={`tel:${listing.phone}`}
                className="min-w-0 flex-1 text-[clamp(11px,2.3cqw,14px)] font-semibold text-[#111] hover:text-[#ff2d55] transition-colors truncate flex items-center gap-[clamp(3px,0.8cqw,6px)]"
              >
                <span className="text-[clamp(11px,2.1cqw,13px)] flex-shrink-0">📞</span>
                <span className="truncate">{listing.phone}</span>
              </a>
            ) : <span />
          ) : <span />}

          {!isDemo && (
            <div className="flex items-center gap-[clamp(4px,1cqw,8px)] flex-shrink-0">
              {isOwner ? (
                /* ── Owner: Edit + Remove ── */
                <>
                  <button
                    onClick={() => onEdit(listing)}
                    className="inline-flex items-center gap-[clamp(3px,0.8cqw,6px)] px-[clamp(8px,1.8cqw,14px)] py-[clamp(4px,0.9cqw,7px)] rounded-full text-[clamp(10.5px,1.9cqw,13px)] font-bold cursor-pointer whitespace-nowrap border border-[#e0e0e0] text-[#555] bg-white hover:border-[#999] hover:text-[#1a1a1a] transition-colors"
                  >
                    <span className="text-[clamp(9px,1.6cqw,12px)]">✏️</span> Edit
                  </button>

                  {deleteConfirm === index ? (
                    <>
                      <button
                        onClick={() => onDeleteConfirm(index)}
                        className="px-[clamp(8px,1.8cqw,14px)] py-[clamp(4px,0.9cqw,7px)] rounded-full text-[clamp(10.5px,1.9cqw,13px)] font-bold cursor-pointer whitespace-nowrap bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={onDeleteCancel}
                        className="px-[clamp(8px,1.8cqw,14px)] py-[clamp(4px,0.9cqw,7px)] rounded-full text-[clamp(10.5px,1.9cqw,13px)] font-bold cursor-pointer whitespace-nowrap border border-[#e0e0e0] text-[#777] hover:border-[#333] hover:text-[#333] transition-colors"
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onDeleteRequest(index)}
                      className="inline-flex items-center gap-[clamp(3px,0.8cqw,6px)] px-[clamp(8px,1.8cqw,14px)] py-[clamp(4px,0.9cqw,7px)] rounded-full text-[clamp(10.5px,1.9cqw,13px)] font-bold cursor-pointer whitespace-nowrap border border-[#e0e0e0] text-[#999] hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-colors"
                    >
                      <span className="text-[clamp(9px,1.6cqw,12px)]">🗑️</span> Remove
                    </button>
                  )}
                </>
              ) : isAccepted ? (
                /* ── Accepted: poster's phone number + chat icon ── */
                <div className="flex items-center gap-[clamp(6px,1.6cqw,12px)] w-full justify-between">
                  {listing.phone ? (
                    <a
                      href={`tel:${listing.phone}`}
                      className="min-w-0 flex-1 text-[clamp(11px,2.3cqw,14px)] font-semibold text-[#111] hover:text-[#ff2d55] transition-colors flex items-center gap-[clamp(3px,0.8cqw,6px)]"
                    >
                      <span className="text-[clamp(11px,2.1cqw,13px)] flex-shrink-0">📞</span>
                      <span className="truncate">{listing.phone}</span>
                    </a>
                  ) : (
                    <span className="text-[clamp(11px,2.1cqw,13px)] font-bold text-[#999]">No number</span>
                  )}
                  <button
                    onClick={() => onChat?.(index)}
                    aria-label="Chat"
                    title="Chat"
                    className="w-[clamp(26px,6cqw,34px)] h-[clamp(26px,6cqw,34px)] flex-shrink-0 rounded-full flex items-center justify-center text-[clamp(12px,2.6cqw,16px)] cursor-pointer border border-[#e0e0e0] text-[#555] bg-[#f4f4f4] hover:bg-[#ff2d55] hover:text-white hover:border-[#ff2d55] transition-colors"
                  >
                    💬
                  </button>
                </div>
              ) : (
                /* ── Other user: Accept + Decline ── */
                <>
                  <button
                    onClick={() => onAccept?.(index)}
                    className="px-[3cqw] py-[1.1cqw] rounded-full text-[3.2cqw] font-bold cursor-pointer border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onDecline?.(index)}
                    className="px-[3cqw] py-[1.1cqw] rounded-full text-[3.2cqw] font-bold cursor-pointer border border-[#e0e0e0] text-[#999] hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-colors"
                  >
                    Decline
                  </button>
                </>
              )}
            </div>
          )}
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
    if (index < 0) return; // demo card — nothing to delete
    onDelete?.(index);
    setDeleteConfirm(null);
  };

  const handleAccept = (index) => {
    if (index < 0) return; // demo card — not a real request
    setAcceptedIndexes((prev) => new Set(prev).add(index));
    onAccept?.(index);
  };

  const handleDecline = (index) => {
    if (index < 0) return; // demo card — nothing to decline
    // Remove from this viewer's list only — the listing itself is untouched.
    setDeclinedIndexes((prev) => new Set(prev).add(index));
    onDecline?.(index);
  };

  const visibleListings = useMemo(() => {
    const real = listings
      .map((listing, originalIndex) => ({ listing, originalIndex }))
      .filter(({ originalIndex }) => !declinedIndexes.has(originalIndex));

    // Demo cards get negative sentinel indices (-1, -2, ...) so they can
    // never collide with a real listing's array position.
    const demo = DEMO_LISTINGS.map((listing, i) => ({ listing, originalIndex: -(i + 1) }));

    const indexed = [...real, ...demo];

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
          // Keep demo cards pinned to the end under "Newest first" so they
          // never crowd out real, newer listings.
          if (a.originalIndex < 0 && b.originalIndex >= 0) return 1;
          if (b.originalIndex < 0 && a.originalIndex >= 0) return -1;
          return b.originalIndex - a.originalIndex;
      }
    });

    return sorted;
  }, [listings, categoryFilter, sortBy, declinedIndexes]);

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

        <div className="flex-1 min-h-0 overflow-hidden">
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
            <div className="grid grid-cols-2 grid-rows-3 md:grid-cols-3 md:grid-rows-2 gap-4 h-full w-full">
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