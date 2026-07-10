// RentVehiclePage.jsx
import { useState, useEffect, useCallback } from "react";

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

// A vehicle can arrive from the API with a photoUrls array (current shape)
// or, in principle, only the legacy single photoUrl — cover both so nothing
// breaks if either field is ever missing.
function photosOf(vehicle) {
  if (Array.isArray(vehicle.photoUrls) && vehicle.photoUrls.length) return vehicle.photoUrls;
  return vehicle.photoUrl ? [vehicle.photoUrl] : [];
}

// ─── Vehicle Card ───────────────────────────────────────────────────────────
// The whole card is clickable and opens VehicleDetailOverlay on the vehicle's
// first photo. Interactive children (call link, edit, delete/confirm/cancel)
// stop propagation so they act on themselves instead of also opening detail.
function VehicleCard({ vehicle, deleteConfirm, onView, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel, dark }) {
  const photos = photosOf(vehicle);
  const thumbnail = photos[0];

  return (
    <div
      onClick={() => onView(vehicle)}
      className={`rounded-2xl border overflow-hidden flex flex-col cursor-pointer transition-transform hover:-translate-y-0.5 ${
        dark ? "bg-black border-white" : "bg-white border-[#ebebeb] shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
      }`}
    >
      <div className={`relative w-full aspect-[4/3] flex items-center justify-center overflow-hidden ${
        dark ? "bg-[#111]" : "bg-[#f6f7fb]"
      }`}>
        {thumbnail ? (
          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl opacity-30">🚗</span>
        )}

        {photos.length > 1 && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-black/65 text-white">
            📷 {photos.length}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className={`text-base font-extrabold leading-snug line-clamp-1 ${dark ? "text-white" : "text-[#111]"}`}>
          {vehicle.title}
        </h3>
        {vehicle.description && (
          <p className={`text-xs mt-1 leading-snug line-clamp-2 ${dark ? "text-[#999]" : "text-[#888]"}`}>
            {vehicle.description}
          </p>
        )}

        {vehicle.area && (
          <span className={`inline-flex items-center gap-1 mt-2.5 self-start rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            dark ? "bg-[#111] text-[#aaa]" : "bg-gray-100 text-[#555]"
          }`}>
            📍 {vehicle.area}
          </span>
        )}

        <div className="flex items-end justify-between mt-3">
          <div>
            <p className={`text-[11px] font-semibold ${dark ? "text-[#888]" : "text-gray-500"}`}>Rent</p>
            <div className="flex items-end gap-1">
              <span className="text-lg font-black text-[#ff2d55] leading-none">₹{vehicle.price}</span>
              <span className={`text-xs leading-none ${dark ? "text-[#888]" : "text-gray-500"}`}>
                {priceUnitShort(vehicle.priceType)}
              </span>
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-2 mt-4 pt-3 border-t ${dark ? "border-white/10" : "border-gray-100"}`}>
          {vehicle.phone && (
            <a
              href={`tel:${vehicle.phone}`}
              onClick={(e) => e.stopPropagation()}
              className={`min-w-0 flex-1 text-sm font-semibold truncate flex items-center gap-1.5 transition-colors ${
                dark ? "text-white hover:text-[#ff2d55]" : "text-[#111] hover:text-[#ff2d55]"
              }`}
            >
              📞 {vehicle.phone}
            </a>
          )}

          {vehicle.isOwner && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(vehicle); }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border transition-colors ${
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
                    className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer bg-red-500 text-white hover:bg-red-600 transition-colors border-none"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteCancel(); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border transition-colors ${
                      dark ? "border-white text-[#aaa] hover:bg-[#1a1a1a]" : "border-[#e0e0e0] text-[#777] hover:border-[#333] hover:text-[#333]"
                    }`}
                  >
                    No
                  </button>
                </>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteRequest(vehicle.id); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border transition-colors ${
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
    </div>
  );
}

// ─── Vehicle Detail Overlay ─────────────────────────────────────────────────
// Opens on top of the listing grid (same "full page override" pattern
// RentVehiclePage and PostVehiclePage already use — fixed inset-0 + its own
// z-index) and shows every photo the listing has via a simple gallery: a
// large main image with prev/next arrows and dot indicators, plus a
// thumbnail strip to jump straight to a given photo.
function VehicleDetailOverlay({ vehicle, deleteConfirm, onClose, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel, dark }) {
  const [photoIndex, setPhotoIndex] = useState(0);

  // Reset to the thumbnail photo whenever a different vehicle is opened.
  useEffect(() => {
    setPhotoIndex(0);
  }, [vehicle?.id]);

  if (!vehicle) return null;

  const photos = photosOf(vehicle);
  const hasPhotos = photos.length > 0;
  const showNav = photos.length > 1;

  const prevPhoto = () => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
  const nextPhoto = () => setPhotoIndex((i) => (i + 1) % photos.length);

  return (
    <div className={`fixed inset-0 z-[5500] flex flex-col overflow-y-auto ${dark ? "bg-black" : "bg-[#f6f7fb]"}`}>

      {/* Header */}
      <div className={`h-[70px] flex items-center justify-between px-6 sticky top-0 z-10 border-b ${
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
        <p className={`text-base font-black truncate max-w-[55%] ${dark ? "text-white" : "text-[#111]"}`}>
          {vehicle.title}
        </p>
        <div className="w-[76px]" />
      </div>

      <div className="flex justify-center px-6 py-8">
        <div className="w-full max-w-[720px]">

          {/* Main photo */}
          <div className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden flex items-center justify-center ${
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

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {photos.map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        i === photoIndex ? "bg-white" : "bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {showNav && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {photos.map((url, i) => (
                <button
                  key={url + i}
                  onClick={() => setPhotoIndex(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${
                    i === photoIndex
                      ? "border-[#ff2d55]"
                      : dark ? "border-transparent opacity-60 hover:opacity-100" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Details */}
          <div className={`mt-6 rounded-2xl p-6 border ${
            dark ? "bg-black border-white" : "bg-white border-transparent shadow-[0_10px_40px_rgba(0,0,0,0.06)]"
          }`}>
            <div className="flex items-start justify-between gap-4">
              <h2 className={`text-xl font-black leading-snug ${dark ? "text-white" : "text-[#111]"}`}>
                {vehicle.title}
              </h2>
              <div className="text-right flex-shrink-0">
                <span className="text-2xl font-black text-[#ff2d55] leading-none">₹{vehicle.price}</span>
                <span className={`block text-xs mt-0.5 ${dark ? "text-[#888]" : "text-gray-500"}`}>
                  {priceUnitShort(vehicle.priceType)}
                </span>
              </div>
            </div>

            {vehicle.area && (
              <span className={`inline-flex items-center gap-1 mt-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                dark ? "bg-[#111] text-[#aaa]" : "bg-gray-100 text-[#555]"
              }`}>
                📍 {vehicle.area}
              </span>
            )}

            {vehicle.description && (
              <p className={`text-sm mt-4 leading-relaxed ${dark ? "text-[#ccc]" : "text-[#444]"}`}>
                {vehicle.description}
              </p>
            )}

            <div className={`flex flex-wrap items-center gap-2 mt-6 pt-5 border-t ${dark ? "border-white/10" : "border-gray-100"}`}>
              {vehicle.phone && (
                <a
                  href={`tel:${vehicle.phone}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ff2d55] text-white font-semibold text-sm hover:-translate-y-0.5 hover:shadow-lg transition-all"
                >
                  📞 Call {vehicle.phone}
                </a>
              )}

              {vehicle.isOwner && (
                <>
                  <button
                    onClick={() => onEdit(vehicle)}
                    className={`px-5 py-3 rounded-xl text-sm font-bold cursor-pointer border transition-colors ${
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
                        onClick={() => onDeleteConfirm(vehicle.id)}
                        className="px-5 py-3 rounded-xl text-sm font-bold cursor-pointer bg-red-500 text-white hover:bg-red-600 transition-colors border-none"
                      >
                        Confirm delete
                      </button>
                      <button
                        onClick={onDeleteCancel}
                        className={`px-5 py-3 rounded-xl text-sm font-bold cursor-pointer border transition-colors ${
                          dark ? "border-white text-[#aaa] hover:bg-[#1a1a1a]" : "border-[#e0e0e0] text-[#777] hover:border-[#333] hover:text-[#333]"
                        }`}
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onDeleteRequest(vehicle.id)}
                      className={`px-5 py-3 rounded-xl text-sm font-bold cursor-pointer border transition-colors ${
                        dark
                          ? "border-white text-[#aaa] hover:bg-red-950"
                          : "border-[#e0e0e0] text-[#999] hover:bg-red-50 hover:border-red-300 hover:text-red-500"
                      }`}
                    >
                      🗑️ Remove
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
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

  const selectedVehicle = vehicles.find((v) => v.id === selectedId) || null;

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
      <div className="flex-1 px-6 py-8">
        {loading ? (
          <p className={`text-center text-sm mt-16 ${dark ? "text-[#888]" : "text-[#999]"}`}>Loading vehicles…</p>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 mt-16 text-center">
            <span className="text-4xl">🚗</span>
            <p className={`text-sm font-bold ${dark ? "text-white" : "text-[#333]"}`}>No vehicles listed yet</p>
            <p className={`text-xs ${dark ? "text-[#888]" : "text-[#999]"}`}>Be the first to list one for your neighbours.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-[1400px] mx-auto">
            {vehicles.map((vehicle) => (
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
        <VehicleDetailOverlay
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