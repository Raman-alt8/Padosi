// rideHelpers.js
// Shared display helpers for ride routes — used by both RideSharePage (card
// grid) and RideDetailPage (full-screen detail view), so both read
// frequency/vehicle/gender/mode identically and stay in sync if the scheme
// changes again. Pulled out of RideSharePage.jsx so RideDetailPage can
// import them without RideSharePage having to import RideDetailPage back
// (which would create a circular import between the two).

export function initials(name = "") {
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// Handles the current weekday/weekend/full_week scheme, plus a fallback for
// any older numeric freq value ("7", "5", ...) that might still be sitting
// on a route from before this scheme existed.
export function freqLabel(freq) {
  const map = { weekday: "Weekdays", weekend: "Weekends", full_week: "Full week" };
  if (map[freq]) return map[freq];
  if (freq === "7") return "Daily";
  if (!freq) return "—";
  return `${freq}× a week`;
}

export function genderLabel(g) {
  const map = { male: "Male only", female: "Female only", no_preference: "Any gender" };
  return map[g] || null;
}

// Normalizes to an array regardless of whether the route carries the newer
// vehicle_types array or an older single vehicle_type string.
export function vehicleTypesOf(r) {
  if (Array.isArray(r.vehicle_types)) return r.vehicle_types;
  if (r.vehicle_type) return [r.vehicle_type];
  return [];
}

export function modeOf(r) {
  return r.mode === "ride" ? "ride" : "partner";
}