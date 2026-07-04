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

// ─── Vehicle Card ───────────────────────────────────────────────────────────
function VehicleCard({ vehicle, deleteConfirm, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel, dark }) {
  return (
    <div className={`rounded-2xl border overflow-hidden flex flex-col ${
      dark ? "bg-black border-white" : "bg-white border-[#ebebeb] shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
    }`}>
      <div className={`w-full aspect-[4/3] flex items-center justify-center overflow-hidden ${
        dark ? "bg-[#111]" : "bg-[#f6f7fb]"
      }`}>
        {vehicle.photoUrl ? (
          <img src={vehicle.photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl opacity-30">🚗</span>
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
                onClick={() => onEdit(vehicle)}
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
                    onClick={() => onDeleteConfirm(vehicle.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer bg-red-500 text-white hover:bg-red-600 transition-colors border-none"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={onDeleteCancel}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border transition-colors ${
                      dark ? "border-white text-[#aaa] hover:bg-[#1a1a1a]" : "border-[#e0e0e0] text-[#777] hover:border-[#333] hover:text-[#333]"
                    }`}
                  >
                    No
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onDeleteRequest(vehicle.id)}
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
    setOpen(false);
    window.dispatchEvent(new CustomEvent("padosi:postVehicle", { detail: { vehicle } }));
  };

  const handleDeleteConfirm = async (id) => {
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not delete listing.");
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error("Delete vehicle error:", err);
    } finally {
      setDeleteConfirm(null);
    }
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
    </div>
  );
}