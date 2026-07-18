import { demoSellerFor } from "../demoIdentities";

function demoEmailFor(name = "") {
  return `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
}

// ── Demo route roster ───────────────────────────────────────────────────
//   -1, -2   → someone else's ride, freshly posted — no special state
//   -3       → someone else's ride, pending removal (see PENDING_AFTER_DAYS /
//              DELETE_AFTER_DAYS in RideCard.jsx / RideDetailPage.jsx)
//   -4       → "you posted this, no responses yet" — DYNAMIC: only renders
//              as yours when someone is actually logged in (poster_id =
//              currentUser.id). Falls back to an ordinary demo seller for a
//              signed-out guest.
//   -5       → "someone accepted your route" — FORCED: always renders as
//              yours regardless of login, via `forceOwnerDemo` (RideCard.jsx
//              ORs this into isOwner). Doesn't depend on any real account,
//              so a recruiter clicking around with no login still sees the
//              full owner UI (Edit/Remove + "N accepted — View responses").
//
// Swap `ownerMode` below ("dynamic" vs "force") if you want to flip which
// of the two behaves which way.
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
    description: "This is what a route you've posted looks like before anyone responds.",
    phone: "+91 90000 00010",
    mode: "ride",
    vehicle_types: [],
    gender_pref: "female",
    accepted_count: 0,
    ownerMode: "dynamic",
  },
  {
    id: -5,
    from_place: "Jagatpura",
    to_place: "Malviya Nagar Metro",
    freq: "weekday",
    depart_time: "09:00",
    seats: 3,
    price: 25,
    description: "This is what a route you've posted looks like once someone accepts it.",
    phone: "+91 90000 00011",
    mode: "partner",
    vehicle_types: ["car"],
    gender_pref: "no_preference",
    accepted_count: 2,
    ownerMode: "force",
  },
];

// Hardcoded "days since last activity" per demo route — see RideCard.jsx /
// RideDetailPage.jsx for how this drives the pending-removal warning.
const DEMO_DAYS_SINCE_ACTIVITY = {
  "-1": 0,
  "-2": 0.5,
  "-3": 4.5,   // pending
  "-4": 0.2,   // yours, fresh — not pending
  "-5": 1,     // yours, fresh — not pending
};

function daysAgoISO(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

// Picks who "posted" a route:
//   ownerMode "force"   → a fixed identity that always reads as yours,
//                         regardless of who (if anyone) is logged in
//   ownerMode "dynamic" → the real logged-in user, if there is one —
//                         otherwise falls back to a synthetic seller
//   (none)              → always a synthetic seller
function sellerFor(route, currentUser) {
  if (route.ownerMode === "force") {
    return {
      id: "demo-you",
      name: currentUser?.name || currentUser?.full_name || currentUser?.username || "You",
    };
  }
  if (route.ownerMode === "dynamic" && currentUser) {
    return {
      id: currentUser.id,
      name: currentUser.name || currentUser.full_name || currentUser.username || "You",
    };
  }
  return demoSellerFor(route.id);
}

// currentUser: pass the real logged-in user object (or null/undefined for a
// guest). Drives -4 (dynamic) and just the display name on -5 (force) —
// every other field on these two routes is still static demo data.
export function getDemoRoutes(currentUser) {
  return RAW_DEMO_ROUTES.map((route) => {
    const seller = sellerFor(route, currentUser);
    const daysAgo = DEMO_DAYS_SINCE_ACTIVITY[route.id] ?? 0;
    const created_at = daysAgoISO(daysAgo);

    return {
      ...route,
      isDemo: true,
      forceOwnerDemo: route.ownerMode === "force",
      poster_id: seller.id,
      poster_name: seller.name,
      poster_contact: {
        name: seller.name,
        email: route.ownerMode && currentUser?.email ? currentUser.email : demoEmailFor(seller.name),
        phone: route.phone,
      },
      created_at,
      last_active_at: created_at,
    };
  });
}