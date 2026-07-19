import { demoSellerFor } from "../demoIdentities";

function demoEmailFor(name = "") {
  return `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
}

// ── Demo route roster ───────────────────────────────────────────────────
// 6 cards per mode. Descriptions on most of them are written to explain
// what UI state that card demonstrates (so a recruiter clicking around
// understands the point without reading code) — the 1st card is tagged
// "(Standard)" and keeps an ordinary-sounding ride description, as a
// baseline "this is what a normal listing looks like" reference next to
// the explanatory ones.
//
// All 6 "this is your route" cards (-9, -5, -6, -11, -12, -7) use
// ownerMode: "force" — always rendering as owned by whoever's viewing,
// with zero dependency on being logged in. This was originally split into
// "force" (always yours) vs "dynamic" (only yours if actually logged in),
// but dynamic mode isn't useful for a cold recruiter demo — most visitors
// to a live link won't sign in first — so everything "yours" is force
// mode now.
//
// "Offering a ride" (mode: partner)
//   -1       → someone else's ride, fresh — (Standard) baseline listing
//   -2       → someone else's ride, fresh — explains itself
//   -3       → someone else's ride, pending removal — explains itself
//   -9       → you posted it, no responses yet — FORCED
//   -5       → you posted it, someone accepted — FORCED
//   -6       → you posted it, went stale after acceptance — FORCED,
//              renders RideRecoveryCard (see `expired` note below)
//
// "Partner to share ride" (mode: ride)
//   -4       → someone else's ride, fresh — (Standard) baseline listing
//   -8       → someone else's ride, fresh — explains itself
//   -10      → someone else's ride, pending removal — explains itself
//   -11      → you posted it, no responses yet — FORCED
//   -12      → you posted it, someone accepted — FORCED
//   -7       → you posted it, went stale after acceptance — FORCED,
//              renders RideRecoveryCard (see `expired` note below)
//
// ownerMode:
//   "force"   → always renders as yours, regardless of login. `poster_id`
//               is set to a fixed "demo-you" id and `forceOwnerDemo: true`
//               is threaded through to RideCard.jsx, which ORs it into
//               isOwner.
//   (none)    → always a synthetic seller (demoIdentities for -1..-8,
//               `fallbackSeller` on the route for anything newer)
//
// expired: true → getDemoRoutes below also stamps `expired_at` on this
//               route, unconditionally (not computed from any real
//               staleness) — same "hardcoded regardless of real time or
//               login" spirit as ownerMode: "force" above. RideSharePage's
//               grid checks `route.expired_at` directly and renders
//               RideRecoveryCard.jsx in place of RideCard.jsx whenever
//               it's set, same contract a real route gets from actually
//               hitting POST /:id/expire on the backend. Note this is
//               display-only: nothing client-side ever calls that
//               endpoint automatically for real routes yet (RideCard.jsx /
//               RideDetailPage.jsx compute isAcceptedExpired and would
//               fire onAcceptedExpire once a real route goes 10+ days
//               unconfirmed after acceptance, but RideSharePage.jsx
//               doesn't pass that prop down, so it's still a no-op for
//               real routes — same as before. Demo routes are additionally
//               hard-excluded from that computation entirely via the
//               `!isDemo` guard on isAcceptedExpired, so they can only
//               ever end up "expired" through this explicit flag, never
//               through the clock).
const RAW_DEMO_ROUTES = [
  // ── "Offering a ride" (mode: partner) ──────────────────────────────
  {
    id: -1,
    from_place: "Vaishali Nagar",
    to_place: "MI Road",
    freq: "weekday",
    depart_time: "08:30",
    seats: 3,
    price: 40,
    description: "Daily commute from Vaishali Nagar to MI Road, AC car available, music on request. (Standard)",
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
    description: "All of these cards are force coded but this is how the site behaves if real user were to use it. I highly recommend logging in and checking it for yourself.",
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
    description: "This is what a route looks like right before it's auto-removed for inactivity — shows the warning banner and the \"I'm here\" button that keeps it alive.",
    phone: "+91 90000 00009",
    mode: "partner",
    vehicle_types: ["car", "bike"],
    gender_pref: "male",
  },
  {
    id: -9,
    from_place: "Vidhyadhar Nagar",
    to_place: "Sanganer Airport",
    freq: "weekend",
    depart_time: "05:30",
    seats: 1,
    price: 150,
    description: "This is what a route you've posted looks like before anyone responds — Edit or Remove it anytime.",
    phone: "+91 90000 00012",
    mode: "partner",
    vehicle_types: ["car"],
    gender_pref: "",
    accepted_count: 0,
    ownerMode: "force",
  },
  {
    id: -5,
    from_place: "Jagatpura",
    to_place: "Malviya Nagar Metro",
    freq: "weekday",
    depart_time: "09:00",
    seats: 3,
    price: 25,
    description: "This is what a route you've posted looks like once someone accepts it — tap below to view who responded.",
    phone: "+91 90000 00011",
    mode: "partner",
    vehicle_types: ["car"],
    gender_pref: "no_preference",
    accepted_count: 2,
    ownerMode: "force",
  },
  {
    id: -6,
    from_place: "Adarsh Nagar",
    to_place: "Jaipur Airport",
    freq: "weekend",
    depart_time: "11:00",
    seats: 2,
    price: 60,
    description: "This is what one of your routes looks like once it's gone stale after someone accepted it — hidden from everyone else, with a one-tap Recover option.",
    phone: "+91 90000 00018",
    mode: "partner",
    vehicle_types: ["car"],
    gender_pref: "",
    accepted_count: 1,
    ownerMode: "force",
    expired: true,
  },

  // ── "Partner to share ride" (mode: ride) ────────────────────────────
  {
    id: -4,
    from_place: "C-Scheme",
    to_place: "World Trade Park",
    freq: "weekend",
    depart_time: "10:00",
    seats: 2,
    price: 20,
    description: "Weekend shopping run from C-Scheme to World Trade Park, looking for someone already headed that way. (Standard)",
    phone: "+91 90000 00010",
    mode: "ride",
    vehicle_types: [],
    gender_pref: "female",
  },
  {
    id: -8,
    from_place: "Raja Park",
    to_place: "SMS Hospital",
    freq: "weekday",
    depart_time: "08:00",
    seats: 2,
    price: 20,
    description: "A regular ride-request card posted by another user — Accept or Decline it just like a real listing.",
    phone: "+91 90000 00014",
    mode: "ride",
    vehicle_types: [],
    gender_pref: "no_preference",
  },
  {
    id: -10,
    from_place: "Tonk Road",
    to_place: "Amrapali Circle",
    freq: "full_week",
    depart_time: "19:30",
    seats: 0,
    price: 15,
    description: "This is what a ride request looks like right before it's auto-removed for inactivity — shows the warning banner and the \"I'm here\" button that keeps it alive.",
    phone: "+91 90000 00013",
    mode: "ride",
    vehicle_types: [],
    gender_pref: "",
    fallbackSeller: { id: "demo-seller-10", name: "Meera Joshi" },
  },
  {
    id: -11,
    from_place: "Shastri Nagar",
    to_place: "Jaipur Junction",
    freq: "weekday",
    depart_time: "08:15",
    seats: 0,
    price: 0,
    description: "This is what a ride request you've posted looks like before anyone responds — Edit or Remove it anytime.",
    phone: "+91 90000 00016",
    mode: "ride",
    vehicle_types: [],
    gender_pref: "no_preference",
    accepted_count: 0,
    ownerMode: "force",
  },
  {
    id: -12,
    from_place: "Bani Park",
    to_place: "Jaipur Railway Station",
    freq: "weekend",
    depart_time: "06:00",
    seats: 0,
    price: 100,
    description: "This is what a ride request you've posted looks like once someone accepts it — tap below to view who responded.",
    phone: "+91 90000 00017",
    mode: "ride",
    vehicle_types: [],
    gender_pref: "",
    accepted_count: 3,
    ownerMode: "force",
  },
  {
    id: -7,
    from_place: "Civil Lines",
    to_place: "Jaipur Railway Station",
    freq: "weekday",
    depart_time: "17:45",
    seats: 0,
    price: 10,
    description: "This is what one of your ride requests looks like once it's gone stale after someone accepted it — hidden from everyone else, with a one-tap Recover option.",
    phone: "+91 90000 00019",
    mode: "ride",
    vehicle_types: [],
    gender_pref: "",
    accepted_count: 1,
    ownerMode: "force",
    expired: true,
  },
];

// Hardcoded "days since last activity" per demo route — see
// PENDING_AFTER_DAYS / DELETE_AFTER_DAYS in RideCard.jsx / RideDetailPage.jsx.
//   0.0–3.9  → fresh, no warning
//   4.0–4.9  → pending: red glow + "I'm here" banner
//   5.0+     → left out on purpose, see original notes
const DEMO_DAYS_SINCE_ACTIVITY = {
  "-1": 0,
  "-2": 0.5,
  "-3": 4.5,   // pending
  "-9": 0.2,   // yours, fresh
  "-5": 1,     // yours, fresh (already accepted)
  "-6": 1,     // yours, fresh — expired look comes from `expired: true`, not this
  "-4": 0,
  "-8": 0.3,
  "-10": 4.6,  // pending
  "-11": 0.2,  // yours, fresh
  "-12": 1,    // yours, fresh (already accepted)
  "-7": 1,     // yours, fresh — expired look comes from `expired: true`, not this
};

function daysAgoISO(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

// Picks who "posted" a route. See the ownerMode comment on RAW_DEMO_ROUTES
// above for what force mode does.
function sellerFor(route, currentUser) {
  if (route.ownerMode === "force") {
    return {
      id: "demo-you",
      name: currentUser?.name || currentUser?.full_name || currentUser?.username || "You",
    };
  }
  return route.fallbackSeller || demoSellerFor(route.id);
}

// currentUser: pass the real logged-in user object (or null/undefined for a
// guest). At this point it only affects the display *name* on the 4 forced
// "yours" cards (uses your real name if logged in, "You" otherwise) — it no
// longer decides whether those cards render as yours at all.
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
      // Set only for routes that already have an acceptance in the demo
      // roster (accepted_count > 0) — mirrors what the backend needs to do
      // for real routes: set accepted_at once, on first acceptance, and
      // never touch it again. Drives the 10-day silent auto-expiry in
      // RideCard.jsx / RideDetailPage.jsx (ACCEPTED_DELETE_AFTER_DAYS).
      accepted_at: route.accepted_count > 0 ? created_at : undefined,
      // Unconditional, like ownerMode: "force" above — always set for
      // `expired: true` routes regardless of real time. This is what
      // RideSharePage.jsx's grid checks to render RideRecoveryCard.jsx
      // instead of RideCard.jsx.
      expired_at: route.expired ? daysAgoISO(1) : undefined,
    };
  });
}