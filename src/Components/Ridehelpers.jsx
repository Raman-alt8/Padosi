// rideHelpers.jsx
// Shared data-formatting helpers for the ride flow (RideDetailPage +
// RideAcceptPage). Pure functions only — no colors, no classNames, no JSX.
// For the visual/style side (accent colors, card surfaces, JourneyConnector)
// see ./rideVisuals instead; this file is the data-shaping counterpart.
//
// Every function here previously lived as a locally-duplicated copy inside
// RideAcceptPage.jsx (initials/FREQ_LABEL/getVehicleTypes) — pulled out so
// both pages read routes the exact same way instead of drifting apart.

export function initials(name = "") {
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// Post form saves freq as "weekday" | "weekend" | "full_week". Unrecognized
// or missing values just fall back to showing themselves.
const FREQ_LABEL = {
  weekday:   "Weekdays",
  weekend:   "Weekends",
  full_week: "Full Week",
};
export function freqLabel(freq) {
  return FREQ_LABEL[freq] || freq;
}

// Returns "Male" / "Female" for an explicit preference, or null for
// "no_preference"/unset — callers decide their own fallback copy
// (e.g. `genderLabel(x) || "Any gender"` vs `${genderLabel(x)} only`).
export function genderLabel(pref) {
  if (pref === "male") return "Male";
  if (pref === "female") return "Female";
  return null;
}

// Post form saves `vehicle_types` as an array now, e.g.
// [] | ["car"] | ["bike"] | ["car","bike"], with the older single-string
// `vehicle_type` field kept around for routes posted before that change.
export function vehicleTypesOf(route) {
  if (Array.isArray(route?.vehicle_types) && route.vehicle_types.length) return route.vehicle_types;
  if (route?.vehicle_type) return [route.vehicle_type];
  return [];
}

// Normalizes route.mode to one of the two values the ride flow actually
// branches on. "partner" = poster has a vehicle and is offering seats.
// "ride" = poster has no vehicle and needs one.
export function modeOf(route) {
  return route?.mode === "ride" ? "ride" : "partner";
}