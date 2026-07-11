// vehicleUtils.js
// Shared helpers used by both RentVehiclePage.jsx (grid + cards) and
// VehicleDetailPage.jsx (the single-listing view), pulled out so neither
// file has to duplicate this logic.

// Pulls whichever id field is present on the logged-in user object — same
// helper PadosiListings.jsx uses for services, kept consistent here so
// ownership checks work the same way regardless of how auth wires up the id.
export function currentUserId(currentUser) {
  const raw = currentUser?.id ?? currentUser?._id ?? currentUser?.userId;
  return raw != null ? String(raw) : null;
}

export function priceUnitShort(priceType) {
  if (priceType === "Per Hour") return "/hour";
  if (priceType === "Per Day") return "/day";
  return priceType ? ` (${priceType})` : "";
}

// Indian digit grouping for the price (₹425000 → ₹4,25,000), matching how
// prices read on listing sites like OLX.
export function formatINR(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString("en-IN");
}

// Turns a created_at timestamp into a short relative label ("3h ago",
// "2d ago") and falls back to a "Jul 02" style date once it's a week old —
// same convention OLX uses on its cards.
export function timeAgo(dateString) {
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
export function photosOf(vehicle) {
  if (Array.isArray(vehicle.photoUrls) && vehicle.photoUrls.length) return vehicle.photoUrls;
  return vehicle.photoUrl ? [vehicle.photoUrl] : [];
}

// Turns a listing's id into a short "ticket reference" style code, e.g.
// "64f2a1b2c9d0" -> "REF 2C9D0". Purely cosmetic (ticket motif on the detail
// page), so it's fine that this isn't a real lookup code.
export function shortRef(id) {
  if (!id) return "REF —";
  const clean = String(id).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `REF ${clean.slice(-6) || clean}`;
}
