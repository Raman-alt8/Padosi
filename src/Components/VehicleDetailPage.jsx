// VehicleDetailPage.jsx
// The full-screen page shown when a listing card is clicked.
//
// Design concept: "the rental ticket." A neighbour-to-neighbour rental is
// closer to handing someone a paper tag at a counter than to a dealership
// checkout, so the price/contact panel is styled like a ticket stub — a
// stamp-ink eyebrow label, a serial-style "REF" code pulled from the
// listing's real id, and a perforated divider with punched notches that
// separates "what it is" from "how to get it." Serif numerals carry the
// price and title (the two things a renter actually feels), while every
// functional control (buttons, labels, nav) stays in the app's existing
// bold sans — so the ticket is the one deliberate flourish, not a full
// re-skin.
//
// Layout borrows the familiar split from booking sites: photos + description
// scroll on the left, the ticket stays put on the right as you read, on
// mobile everything collapses to a single column in the natural reading
// order (photos → ticket → description) with no separate mobile-only markup
// needed — see the col-start/row-start comment below.
import { useState, useEffect } from "react";

// A vehicle can arrive from the API with a photoUrls array (current shape)
// or, in principle, only the legacy single photoUrl — cover both so nothing
// breaks if either field is ever missing.
function photosOf(vehicle) {
  if (Array.isArray(vehicle.photoUrls) && vehicle.photoUrls.length) return vehicle.photoUrls;
  return vehicle.photoUrl ? [vehicle.photoUrl] : [];
}

function priceUnitShort(priceType) {
  if (priceType === "Per Hour") return "/hour";
  if (priceType === "Per Day") return "/day";
  return priceType ? ` (${priceType})` : "";
}

// Indian digit grouping for the price (₹425000 → ₹4,25,000), matching how
// prices read on listing sites like OLX.
function formatINR(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString("en-IN");
}

// Turns a created_at timestamp into a short relative label ("3h ago",
// "2d ago") and falls back to a "Jul 02" style date once it's a week old —
// same convention OLX uses on its cards.
function timeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

// Turns a listing's id into a short "ticket reference" style code, e.g.
// "64f2a1b2c9d0" -> "REF 2C9D0". Purely cosmetic (ticket motif on this
// page), so it's fine that this isn't a real lookup code.
function shortRef(id) {
  if (!id) return "REF —";
  const clean = String(id).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `REF ${clean.slice(-6) || clean}`;
}

export default function VehicleDetailPage({ vehicle, deleteConfirm, onClose, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel, dark }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Reset to the thumbnail photo whenever a different vehicle is opened.
  useEffect(() => {
    setPhotoIndex(0);
  }, [vehicle?.id]);

  // One small entrance — content fades/slides in on open rather than
  // popping in instantly. Deliberately the only animation on this page.
  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, [vehicle?.id]);

  if (!vehicle) return null;

  const photos = photosOf(vehicle);
  const hasPhotos = photos.length > 0;
  const showNav = photos.length > 1;

  const prevPhoto = () => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
  const nextPhoto = () => setPhotoIndex((i) => (i + 1) % photos.length);

  // Stamp-ink accent — the ticket motif's secondary color, used sparingly
  // for eyebrow labels and the ref code. Everything else stays on the app's
  // existing pink/ink palette.
  const stamp = dark ? "#35A98A" : "#1F6F5C";
  const notchBg = dark ? "bg-black" : "bg-[#f6f7fb]";

  return (
    <div className={`fixed inset-0 z-[5500] flex flex-col overflow-y-auto ${dark ? "bg-black" : "bg-[#f6f7fb]"}`}>

      {/* Header */}
      <div className={`h-[80px] shrink-0 flex items-center justify-between px-6 sticky top-0 z-20 border-b ${
        dark ? "bg-black border-white" : "bg-white border-[#eee]"
      }`}>
        <button
          onClick={onClose}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
            dark
              ? "bg-black border-white text-white hover:bg-white hover:text-black"
              : "bg-white border-[#ddd] text-[#333] hover:border-[#ff2d55] hover:text-[#ff2d55]"
          }`}
        >
          ← Back
        </button>

        <p className={`font-serif font-bold text-lg ${dark ? "text-white" : "text-[#111]"}`}>Padosi</p>

        {/* Wishlist heart — cosmetic only, same as the card's heart; no
            saved-listings endpoint exists yet on the backend. */}
        <button
          onClick={() => setSaved((s) => !s)}
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          className={`w-9 h-9 rounded-full flex items-center justify-center border cursor-pointer transition-colors ${
            dark ? "border-white/30 hover:bg-white/10" : "border-[#ddd] hover:bg-gray-50"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill={saved ? "#ff2d55" : "none"} stroke={saved ? "#ff2d55" : dark ? "#aaa" : "#555"} strokeWidth={2} strokeLinejoin="round">
            <path d="M12 21s-6.7-4.3-9.3-8.2C1 10 1.6 6.7 4.4 5.2 6.6 4 9.2 4.7 12 7.5 14.8 4.7 17.4 4 19.6 5.2c2.8 1.5 3.4 4.8 1.7 7.6C18.7 16.7 12 21 12 21z" />
          </svg>
        </button>
      </div>

      <div className={`flex-1 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
        <div className="mx-auto max-w-[1100px] px-6 lg:px-10 py-8 lg:py-12">

          {/*
            Three top-level grid children: Gallery, Ticket, Description.
            At mobile (grid-cols-1) they simply stack in DOM order — photos,
            then the ticket, then the description — which is the order that
            actually makes sense on a phone. At lg+, col-start/row-start move
            the ticket into a second sticky column beside the photos, with
            the description continuing underneath in the first column.
          */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-x-12 lg:gap-y-10">

            {/* ── Gallery ── */}
            <div className="lg:col-start-1 lg:row-start-1">
              <div className={`relative w-full aspect-[4/3] lg:aspect-[16/11] rounded-3xl overflow-hidden flex items-center justify-center ${
                dark ? "bg-[#111]" : "bg-[#eceef4]"
              }`}>
                {hasPhotos ? (
                  <img src={photos[photoIndex]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl opacity-30">🚗</span>
                )}

                {showNav && (
                  <>
                    <button
                      onClick={prevPhoto}
                      aria-label="Previous photo"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center bg-black/55 text-white text-lg font-bold cursor-pointer border-none hover:bg-black/75 transition-colors"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextPhoto}
                      aria-label="Next photo"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center bg-black/55 text-white text-lg font-bold cursor-pointer border-none hover:bg-black/75 transition-colors"
                    >
                      ›
                    </button>
                    {/* Photo count — read like a stub number rather than a
                        row of dots. */}
                    <span className="absolute top-3 left-3 font-mono text-[11px] font-bold tracking-wide px-2 py-1 rounded-md bg-black/60 text-white">
                      {photoIndex + 1} / {photos.length}
                    </span>
                  </>
                )}
              </div>

              {showNav && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {photos.map((url, i) => (
                    <button
                      key={url + i}
                      onClick={() => setPhotoIndex(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 ${
                        i === photoIndex
                          ? "border-[#ff2d55] border-solid"
                          : dark ? "border-white/20 border-dashed opacity-60 hover:opacity-100" : "border-[#d8d8d8] border-dashed opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Ticket panel ── */}
            <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-[104px] lg:self-start">
              <div className={`relative rounded-3xl border p-6 lg:p-7 overflow-hidden ${
                dark ? "bg-black border-white/15" : "bg-white border-[#ebebeb] shadow-[0_10px_40px_rgba(0,0,0,0.06)]"
              }`}>

                {/* Eyebrow row: rental type + a ticket-style reference code
                    pulled from the listing's real id. */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: stamp }}>
                    {vehicle.priceType === "Per Hour" ? "Hourly rental" : "Daily rental"}
                  </span>
                  <span className="font-mono text-[11px] font-bold tracking-wider" style={{ color: stamp }}>
                    {shortRef(vehicle.id)}
                  </span>
                </div>

                {/* Price — serif, the one place this page raises its voice. */}
                <div className="flex items-baseline gap-2 mt-4">
                  <span className={`font-serif font-bold text-4xl lg:text-5xl leading-none ${dark ? "text-white" : "text-[#111]"}`}>
                    ₹{formatINR(vehicle.price)}
                  </span>
                  <span className={`text-sm ${dark ? "text-[#888]" : "text-gray-500"}`}>
                    {priceUnitShort(vehicle.priceType)}
                  </span>
                </div>

                <h1 className={`font-serif font-semibold text-xl lg:text-2xl mt-2 leading-snug ${dark ? "text-white" : "text-[#111]"}`}>
                  {vehicle.title}
                </h1>

                <div className={`flex items-center gap-2 mt-3 text-xs ${dark ? "text-[#888]" : "text-gray-500"}`}>
                  <span className="truncate">📍 {vehicle.area || "Area not listed"}</span>
                  <span>•</span>
                  <span className="flex-shrink-0">{vehicle.isDemo ? "Demo listing" : timeAgo(vehicle.created_at)}</span>
                </div>

                {/* Perforation — a dashed rule with two punched notches at
                    the card's own edges, bleeding full-width via -mx to
                    match the card's padding exactly. */}
                <div className="relative my-6 -mx-6 lg:-mx-7 h-0">
                  <div className={`border-t ${dark ? "border-white/20" : "border-[#e3ddd0]"}`} style={{ borderTopStyle: "dashed" }} />
                  <span className={`absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full ${notchBg}`} />
                  <span className={`absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full ${notchBg}`} />
                </div>

                {vehicle.phone && (
                  <a
                    href={`tel:${vehicle.phone}`}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#ff2d55] text-white font-bold text-sm hover:-translate-y-0.5 hover:shadow-lg transition-all"
                  >
                    Rent Now
                  </a>
                )}

                {vehicle.isOwner && (
                  <div className="mt-3">
                    {deleteConfirm === vehicle.id ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onDeleteConfirm(vehicle.id)}
                          className="py-3 rounded-xl text-sm font-bold cursor-pointer bg-red-500 text-white hover:bg-red-600 transition-colors border-none"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={onDeleteCancel}
                          className={`py-3 rounded-xl text-sm font-bold cursor-pointer border transition-colors ${
                            dark ? "border-white text-[#aaa] hover:bg-[#1a1a1a]" : "border-[#e0e0e0] text-[#777] hover:border-[#333] hover:text-[#333]"
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEdit(vehicle)}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer border transition-colors ${
                            dark
                              ? "border-white text-white hover:bg-white hover:text-black"
                              : "border-[#e0e0e0] text-[#555] hover:border-[#999] hover:text-[#1a1a1a]"
                          }`}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => onDeleteRequest(vehicle.id)}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer border transition-colors ${
                            dark
                              ? "border-white text-[#aaa] hover:bg-red-950"
                              : "border-[#e0e0e0] text-[#999] hover:bg-red-50 hover:border-red-300 hover:text-red-500"
                          }`}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <p className={`text-[11px] text-center mt-4 ${dark ? "text-[#666]" : "text-gray-400"}`}>
                  Listed by a neighbour in {vehicle.area || "your area"}
                </p>
              </div>
            </div>

            {/* ── Description ── */}
            {vehicle.description && (
              <div className="lg:col-start-1 lg:row-start-2">
                <p className="text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: stamp }}>
                  About this vehicle
                </p>
                <p className={`text-sm leading-relaxed ${dark ? "text-[#ccc]" : "text-[#444]"}`}>
                  {vehicle.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}