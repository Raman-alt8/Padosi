import { demoSellerFor } from "../demoIdentities";

function demoEmailFor(name = "") {
  return `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
}

// Hardcoded "days since last activity" per demo route, purely so the
// pending-removal warning (see PENDING_AFTER_DAYS / DELETE_AFTER_DAYS in
// RideCard.jsx and RideDetailPage.jsx) has something real to render in demo
// mode, instead of everyone always looking "just active". Recomputed
// relative to "now" every time getDemoRoutes() runs (see daysAgoISO below),
// so the demo stays in the same state forever rather than drifting as real
// time passes.
//
//   0.0–3.9  → fresh, no warning at all
//   4.0–4.9  → pending: red glow on the card + warning banner in detail +
//              "I'm here" button (poster-only — see note below)
//   5.0+     → left out on purpose: an expired card just renders as a plain
//              card with no visual cue, since real deletion is meant to be
//              enforced server-side, so it's not useful to look at in demo
//
// NOTE: the pending state only ever shows to the poster (isOwner), same as
// in production. Since these demo routes' poster_id comes from
// demoSellerFor(route.id) — a synthetic seller, not whoever is currently
// browsing — routes -3 and -5 will only show the warning if the logged-in
// demo user happens to be that specific seller. Everyone else just sees an
// ordinary card, which is the correct/expected behavior.
const DEMO_DAYS_SINCE_ACTIVITY = {
  "-1": 0,
  "-2": 1,
  "-3": 4.2,
  "-4": 0.5,
  "-5": 4.8,
  "-6": 2,
  "-7": 0,
  "-8": 3,
};

function daysAgoISO(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

const RAW_DEMO_ROUTES = [
  {
    id: -1,
    from_place: "Vaishali Nagar",
    to_place: "MI Road",
    freq: "weekday",
    depart_time: "08:30",
    seats: 3,
    price: 40,
    description: "Sample ride — post your own route to replace this.",
    phone: "+91 90000 00003",
    mode: "partner",
    vehicle_types: ["car"],
    gender_pref: "",
  },
  {
    id: -2,
    from_place: "Malviya Nagar",
    to_place: "Sindhi Camp",
    freq: "full_week",
    depart_time: "18:00",
    seats: 2,
    price: 0,
    description: "Another sample route so you can see how ride cards look.",
    phone: "+91 90000 00004",
    mode: "partner",
    vehicle_types: ["bike"],
    gender_pref: "",
  },
  {
    id: -3,
    from_place: "Mansarovar",
    to_place: "Jaipur Railway Station",
    freq: "full_week",
    depart_time: "07:15",
    seats: 4,
    price: 30,
    description: "Daily office commute, AC car, music on request.",
    phone: "+91 90000 00009",
    mode: "partner",
    vehicle_types: ["car", "bike"],
    gender_pref: "male",
  },
  {
    id: -4,
    from_place: "C-Scheme",
    to_place: "World Trade Park",
    freq: "weekend",
    depart_time: "10:00",
    seats: 2,
    price: 20,
    description: "Weekend shopping run, looking for someone already headed that way.",
    phone: "+91 90000 00010",
    mode: "ride",
    vehicle_types: [],
    gender_pref: "female",
  },
  {
    id: -5,
    from_place: "Jagatpura",
    to_place: "Malviya Nagar Metro",
    freq: "weekday",
    depart_time: "09:00",
    seats: 3,
    price: 25,
    description: "Weekday college commute, punctual departure every time.",
    phone: "+91 90000 00011",
    mode: "partner",
    vehicle_types: ["car"],
    gender_pref: "no_preference",
  },
  {
    id: -6,
    from_place: "Vidhyadhar Nagar",
    to_place: "Sanganer Airport",
    freq: "weekend",
    depart_time: "05:30",
    seats: 1,
    price: 150,
    description: "Early morning airport drop, occasional trips only.",
    phone: "+91 90000 00012",
    mode: "partner",
    vehicle_types: ["car"],
    gender_pref: "",
  },
  {
    id: -7,
    from_place: "Tonk Road",
    to_place: "Amrapali Circle",
    freq: "full_week",
    depart_time: "19:30",
    seats: 3,
    price: 15,
    description: "Evening return commute, bike-friendly boot space.",
    phone: "+91 90000 00013",
    mode: "partner",
    vehicle_types: ["bike"],
    gender_pref: "",
  },
  {
    id: -8,
    from_place: "Raja Park",
    to_place: "SMS Hospital",
    freq: "weekday",
    depart_time: "08:00",
    seats: 2,
    price: 20,
    description: "Regular hospital visit, looking for a lift rather than driving myself.",
    phone: "+91 90000 00014",
    mode: "ride",
    vehicle_types: [],
    gender_pref: "no_preference",
  },
];

export function getDemoRoutes() {
  return RAW_DEMO_ROUTES.map((route) => {
    const seller = demoSellerFor(route.id);
    const daysAgo = DEMO_DAYS_SINCE_ACTIVITY[route.id] ?? 0;
    const created_at = daysAgoISO(daysAgo);
    return {
      ...route,
      isDemo: true,
      poster_id: seller.id,
      poster_name: seller.name,
      poster_contact: {
        name: seller.name,
        email: demoEmailFor(seller.name),
        phone: route.phone,
      },
      created_at,
      last_active_at: created_at, // no demo "I'm here" confirmations yet
    };
  });
}