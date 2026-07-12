// RentVehiclePage.jsx
import { useState, useEffect, useCallback } from "react";
import VehicleDetailPage from "./VehicleDetailPage";
import { useWishlist } from "./WishlistContext";

// Pulls whichever id field is present on the logged-in user object — same
// helper PadosiListings.jsx uses for services, kept consistent here so
// ownership checks work the same way regardless of how auth wires up the id.
function currentUserId(currentUser) {
  const raw = currentUser?.id ?? currentUser?._id ?? currentUser?.userId;
  return raw != null ? String(raw) : null;
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

// A vehicle can arrive from the API with a photoUrls array (current shape)
// or, in principle, only the legacy single photoUrl — cover both so nothing
// breaks if either field is ever missing.
function photosOf(vehicle) {
  if (Array.isArray(vehicle.photoUrls) && vehicle.photoUrls.length) return vehicle.photoUrls;
  return vehicle.photoUrl ? [vehicle.photoUrl] : [];
}

// ─── TEMPORARY DEMO DATA ────────────────────────────────────────────────────
// Two placeholder listings so the redesigned card can be previewed without
// needing real rows in the vehicles table. Everything below is safe to
// delete once you're happy with the look — just remove this block and the
// `...DEMO_VEHICLES,` line inside RentVehiclePage further down.
const DEMO_VEHICLES = [
  {
    id: "demo-1",
    user_id: "demo",
    title: "Honda Activa 6G",
    description: "Well maintained, recently serviced, great mileage.",
    priceType: "Per Day",
    price: 350,
    phone: "9876543210",
    area: "Sector 14",
    photoUrls: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Honda_Activa_6G.jpg?width=800",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Gold_Metallic_Honda_Activa.jpg?width=800",
    ],
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isOwner: false,
    isDemo: true,
  },
  {
    id: "demo-2",
    user_id: "demo",
    title: "Maruti Suzuki Swift",
    description: "Clean interiors, AC works great, full tank on pickup.",
    priceType: "Per Day",
    price: 1500,
    phone: "9123456780",
    area: "Alwar Bypass Road",
    photoUrls: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Maruti_Suzuki_Swift_4456.JPG?width=800",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Maruti_Suzuki_Swift_2098.JPG?width=800",
    ],
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isOwner: false,
    isDemo: true,
  },
  {
    id: "demo-3",
    user_id: "demo",
    title: "Royal Enfield Classic 350",
    description: "Smooth thump, garage-kept, ideal for weekend rides.",
    priceType: "Per Day",
    price: 800,
    phone: "9812345670",
    area: "Moti Dungri Road",
    photoUrls: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Royal_Enfield_Classic_350_(2017_Model_Year).jpg?width=800",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Royal_Enfield_Classic_350_2010_Model.jpg?width=800",
    ],
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isOwner: false,
    isDemo: true,
  },
  {
    id: "demo-4",
    user_id: "demo",
    title: "Hyundai Creta",
    description: "Spacious SUV, sunroof, perfect for family trips.",
    priceType: "Per Day",
    price: 2800,
    phone: "9988776655",
    area: "Company Bagh",
    photoUrls: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Hyundai_Creta.jpg?width=800",
      "https://commons.wikimedia.org/wiki/Special:FilePath/2023_Hyundai_Creta_Black_Edition.jpg?width=800",
    ],
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    isOwner: false,
    isDemo: true,
  },
  {
    id: "demo-5",
    user_id: "demo",
    title: "Maruti Suzuki Alto K10",
    description: "Light on fuel, easy to park, great for city runs.",
    priceType: "Per Day",
    price: 1000,
    phone: "9765432109",
    area: "Arya Nagar",
    photoUrls: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Maruti_Suzuki_Alto_K10.jpg?width=800",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Maruti_Suzuki_Alto_K10_-_front.jpg?width=800",
    ],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isOwner: false,
    isDemo: true,
  },
  {
    id: "demo-6",
    user_id: "demo",
    title: "Bajaj Pulsar 150",
    description: "Punchy engine, new tyres, good for daily commute.",
    priceType: "Per Day",
    price: 450,
    phone: "9654321098",
    area: "Malakhera Road",
    photoUrls: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Red_Bajaj_Pulsar_outside_hotel_in_Goa.jpg?width=800",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Bajaj_Pulsar_150,_2003.jpg?width=800",
    ],
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isOwner: false,
    isDemo: true,
  },
  {
    id: "demo-7",
    user_id: "demo",
    title: "Tata Nexon",
    description: "Compact SUV, top safety rating, great highway ride.",
    priceType: "Per Day",
    price: 2200,
    phone: "9543210987",
    area: "Naya Bas",
    photoUrls: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/2018_Tata_Nexon_XM.jpg?width=800",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Tata_Nexon_Blue_Dual_Tone.jpg?width=800",
    ],
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    isOwner: false,
    isDemo: true,
  },
  {
    id: "demo-8",
    user_id: "demo",
    title: "Mahindra Thar",
    description: "4x4 ready, great for off-road weekend getaways.",
    priceType: "Per Day",
    price: 3000,
    phone: "9432109876",
    area: "Bhagat Singh Circle",
    photoUrls: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Mahindra_Thar_in_Mumbai_2012.JPG?width=800",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Mahindra_Thar_in_maroon,_rear_right.jpg?width=800",
    ],
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    isOwner: false,
    isDemo: true,
  },
];

// ─── Vehicle Card ───────────────────────────────────────────────────────────
// Styled after OLX's listing cards: price leads (bold, large), then a short
// subtitle, then the title, then a location/posted-date row, with a
// price-type corner tag and a wishlist heart over the photo. The whole card
// is clickable and opens VehicleDetailPage; interactive children (call,
// wishlist, edit, delete/confirm/cancel) stop propagation so they act on
// themselves instead of also opening detail.
function VehicleCard({ vehicle, deleteConfirm, onView, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel, dark }) {
  const photos = photosOf(vehicle);
  const thumbnail = photos[0];

  // Wishlist heart reads/writes the shared store (WishlistContext) so this
  // vehicle shows up on the navbar's Wishlist page alongside saved tickets
  // and services, not just locally on this card.
  const { isWishlisted, toggleWishlist } = useWishlist();
  const saved = isWishlisted("vehicle", vehicle.id);

  const handleToggleWishlist = (e) => {
    e.stopPropagation();
    toggleWishlist({
      type:      "vehicle",
      id:        vehicle.id,
      title:     vehicle.title,
      subtitle:  vehicle.description,
      image:     thumbnail,
      price:     vehicle.price,
      priceUnit: priceUnitShort(vehicle.priceType),
      meta:      [`📍 ${vehicle.area || "Area not listed"}`],
      badge:     vehicle.isDemo ? "Demo" : null,
      isDemo:    !!vehicle.isDemo,
      raw:       vehicle,
    });
  };

  return (
    <div
      onClick={() => onView(vehicle)}
      className={`rounded-2xl border overflow-hidden flex flex-col cursor-pointer transition-transform hover:-translate-y-0.5 ${
        dark ? "bg-black border-white" : "bg-white border-[#ebebeb] shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
      }`}
    >
      <div className={`relative w-full aspect-[16/10] flex items-center justify-center overflow-hidden ${
        dark ? "bg-[#111]" : "bg-[#f6f7fb]"
      }`}>
        {thumbnail ? (
          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl opacity-30">🚗</span>
        )}

        {/* Corner tag — mirrors the "FEATURED" ribbon slot on OLX cards */}
        <span className="absolute top-2 left-2 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide bg-[#ff2d55] text-white">
          {vehicle.isDemo ? "Demo" : vehicle.priceType === "Per Hour" ? "Hourly" : "Daily"}
        </span>

        {/* Wishlist heart */}
        <button
          onClick={handleToggleWishlist}
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm cursor-pointer border-none hover:bg-white transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill={saved ? "#ff2d55" : "none"}
            stroke={saved ? "#ff2d55" : "#555"}
            strokeWidth={2}
            strokeLinejoin="round"
          >
            <path d="M12 21s-6.7-4.3-9.3-8.2C1 10 1.6 6.7 4.4 5.2 6.6 4 9.2 4.7 12 7.5 14.8 4.7 17.4 4 19.6 5.2c2.8 1.5 3.4 4.8 1.7 7.6C18.7 16.7 12 21 12 21z" />
          </svg>
        </button>

        {photos.length > 1 && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-black/65 text-white">
            📷 {photos.length}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        {/* Price leads the card, same as OLX */}
        <div className="flex items-baseline gap-1.5">
          <span className={`text-xl font-black leading-none ${dark ? "text-white" : "text-[#111]"}`}>
            ₹{formatINR(vehicle.price)}
          </span>
          <span className={`text-xs leading-none ${dark ? "text-[#888]" : "text-gray-500"}`}>
            {priceUnitShort(vehicle.priceType)}
          </span>
        </div>

        {vehicle.description && (
          <p className={`text-xs mt-1 leading-snug line-clamp-1 ${dark ? "text-[#999]" : "text-[#888]"}`}>
            {vehicle.description}
          </p>
        )}

        <h3 className={`text-base font-extrabold leading-snug line-clamp-1 mt-1 ${dark ? "text-white" : "text-[#111]"}`}>
          {vehicle.title}
        </h3>

        <div className={`flex items-center justify-between gap-2 mt-2 text-[11px] ${dark ? "text-[#888]" : "text-gray-500"}`}>
          <span className="truncate">📍 {vehicle.area || "Area not listed"}</span>
          <span className="flex-shrink-0">{vehicle.isDemo ? "Demo listing" : timeAgo(vehicle.created_at)}</span>
        </div>

        {vehicle.isOwner && (
          <div className={`flex items-center justify-end gap-2 mt-3 pt-2 border-t ${dark ? "border-white/10" : "border-gray-100"}`}>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(vehicle); }}
              className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer border transition-colors ${
                dark
                  ? "border-white text-white hover:bg-white hover:text-black"
                  : "border-[#e0e0e0] text-[#555] hover:border-[#999] hover:text-[#1a1a1a]"
              }`}
            >
              ✏️ Edit
            </button>
            {deleteConfirm === vehicle.id ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteConfirm(vehicle.id); }}
                  className="px-3 py-1 rounded-full text-xs font-bold cursor-pointer bg-red-500 text-white hover:bg-red-600 transition-colors border-none"
                >
                  Confirm
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteCancel(); }}
                  className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer border transition-colors ${
                    dark ? "border-white text-[#aaa] hover:bg-[#1a1a1a]" : "border-[#e0e0e0] text-[#777] hover:border-[#333] hover:text-[#333]"
                  }`}
                >
                  No
                </button>
              </>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteRequest(vehicle.id); }}
                className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer border transition-colors ${
                  dark
                    ? "border-white text-[#aaa] hover:bg-red-950"
                    : "border-[#e0e0e0] text-[#999] hover:bg-red-50 hover:border-red-300 hover:text-red-500"
                }`}
              >
                🗑️ Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
// Was previously a category-picker (mirroring ServiceListingsPage). Now
// simplified per request: it opens straight into the listing grid, pulling
// from GET /api/vehicles and refreshing whenever a vehicle is posted, edited,
// or deleted — same "padosi:allVehicles" event PostVehiclePage already fires
// on save, so no changes are needed there.
export default function RentVehiclePage({ currentUser, onPostVehicle, dark }) {
  const [open, setOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vehicles", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        const myId = currentUserId(currentUser);
        const withOwnership = (data.vehicles || []).map((v) => ({
          ...v,
          isOwner: myId != null && String(v.user_id) === myId,
        }));
        setVehicles(withOwnership);
      }
    } catch (err) {
      console.error("Could not load vehicle listings:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const handler = () => {
      setOpen(true);
      fetchVehicles();
    };
    window.addEventListener("padosi:openRentVehicle", handler);
    return () => window.removeEventListener("padosi:openRentVehicle", handler);
  }, [fetchVehicles]);

  useEffect(() => {
    // Refresh whenever a listing is created/edited elsewhere (PostVehiclePage
    // fires this on successful save), so the grid never shows stale data.
    window.addEventListener("padosi:allVehicles", fetchVehicles);
    return () => window.removeEventListener("padosi:allVehicles", fetchVehicles);
  }, [fetchVehicles]);

  const handlePostVehicle = () => {
    if (onPostVehicle) {
      onPostVehicle();
    } else {
      window.dispatchEvent(new CustomEvent("padosi:postVehicle"));
    }
  };

  const handleEdit = (vehicle) => {
    setSelectedId(null);
    setOpen(false);
    window.dispatchEvent(new CustomEvent("padosi:postVehicle", { detail: { vehicle } }));
  };

  const handleDeleteConfirm = async (id) => {
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not delete listing.");
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      // If the listing being deleted is the one currently open in detail
      // view, close that overlay too so it doesn't linger on stale data.
      setSelectedId((prev) => (prev === id ? null : prev));
    } catch (err) {
      console.error("Delete vehicle error:", err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  // TEMPORARY: demo listings prepended so the new card design is visible
  // right away. Remove `...DEMO_VEHICLES,` once you're done previewing.
  const displayVehicles = [...DEMO_VEHICLES, ...vehicles];

  const selectedVehicle = displayVehicles.find((v) => v.id === selectedId) || null;

  return (
    <div className={`fixed inset-0 z-[5000] flex flex-col overflow-y-auto transition-opacity duration-300 ${
      dark ? "bg-black" : "bg-[#f6f7fb]"
    } ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>

      {/* Header — shrink-0 keeps this pinned at 80px even once the listing
          grid grows taller than the viewport; without it, flexbox will
          shrink the header toward its own content height instead of letting
          the page scroll (this was the bug: header rendered fine while the
          "Loading vehicles…" line was short, then got squeezed down once the
          full grid pushed the page past viewport height). */}
      <div className={`h-[80px] shrink-0 flex items-center justify-between px-6 sticky top-0 z-10 border-b ${
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
        <p className={`text-xl font-black ${dark ? "text-white" : "text-[#111]"}`}>
          Padosi{" "}
          <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>
            Rentals
          </span>
        </p>
        <button
          onClick={handlePostVehicle}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
            dark
              ? "bg-white border-white text-black hover:bg-black hover:text-white"
              : "bg-[#ff2d55] border-[#ff2d55] text-white hover:bg-[#e0264a] hover:border-[#e0264a]"
          }`}
        >
          + List a Vehicle
        </button>
      </div>

      {/* Listing grid */}
      <div className="flex-1 px-6 pt-10 pb-8">
        {loading ? (
          <p className={`text-center text-sm mt-16 ${dark ? "text-[#888]" : "text-[#999]"}`}>Loading vehicles…</p>
        ) : displayVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 mt-16 text-center">
            <span className="text-4xl">🚗</span>
            <p className={`text-sm font-bold ${dark ? "text-white" : "text-[#333]"}`}>No vehicles listed yet</p>
            <p className={`text-xs ${dark ? "text-[#888]" : "text-[#999]"}`}>Be the first to list one for your neighbours.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-[1400px] mx-auto">
            {displayVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                deleteConfirm={deleteConfirm}
                onView={(v) => setSelectedId(v.id)}
                onEdit={handleEdit}
                onDeleteRequest={(id) => setDeleteConfirm(id)}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setDeleteConfirm(null)}
                dark={dark}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail overlay — only mounted while a vehicle is selected */}
      {selectedVehicle && (
        <VehicleDetailPage
          vehicle={selectedVehicle}
          deleteConfirm={deleteConfirm}
          onClose={() => setSelectedId(null)}
          onEdit={handleEdit}
          onDeleteRequest={(id) => setDeleteConfirm(id)}
          onDeleteConfirm={handleDeleteConfirm}
          onDeleteCancel={() => setDeleteConfirm(null)}
          dark={dark}
        />
      )}
    </div>
  );
}