// demoIdentities.js
//
// Shared pool of fake "neighbour" seller identities used only for
// isDemo listings (vehicles, services, or any other listing type).
// Demo listings aren't backed by a real user row in the DB, so without
// this, MessageSellerButton falls back to the generic "Demo Seller"
// placeholder — fine functionally, but it undersells the chat feature
// when you're showing it off. This gives each demo listing a consistent,
// named seller instead.
//
// Usage — wherever a demo listing object is built:
//
//   import { demoSellerFor } from "./demoIdentities";
//
//   const seller = demoSellerFor(vehicle.id);
//   const demoVehicle = {
//     ...vehicle,
//     isDemo: true,
//     seller: seller.name,
//     userId: seller.id,
//     area: vehicle.area || seller.area,
//   };
//
// Or directly in MessageSellerButton's demo branch, replacing the
// "Demo Seller" fallback:
//
//   import { demoSellerFor } from "./demoIdentities";
//   ...
//   const fallback = demoSellerFor(listingId);
//   seller_id: sellerId ?? fallback.id,
//   seller_name: sellerName ?? fallback.name,

const DEMO_IDENTITIES = [
  { name: "Rohan Mehta", area: "Sector 14, Gurugram" },
  { name: "Ananya Iyer", area: "Indiranagar, Bengaluru" },
  { name: "Karan Bhatia", area: "Bandra West, Mumbai" },
  { name: "Priya Nair", area: "Kothrud, Pune" },
  { name: "Arjun Malhotra", area: "Vaishali Nagar, Jaipur" },
  { name: "Sneha Kapoor", area: "Salt Lake, Kolkata" },
  { name: "Vikram Rathore", area: "Malviya Nagar, Delhi" },
  { name: "Meera Pillai", area: "Adyar, Chennai" },
  { name: "Aditya Joshi", area: "Vastrapur, Ahmedabad" },
  { name: "Kavya Reddy", area: "Banjara Hills, Hyderabad" },
  { name: "Nikhil Chopra", area: "Sector 62, Noida" },
  { name: "Ishita Desai", area: "Alkapuri, Vadodara" },
];

// Deterministic hash → index, so a given listing id always resolves to the
// *same* name every time it's opened. A true random pick would make the
// seller change on every render/reload, which reads as broken rather than
// as a real person.
function hashToIndex(key, length) {
  const str = String(key ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

// Returns { id, name, area } for a given listing id. Same shape as what
// MessageSellerButton and *DetailPage components expect for sellerId /
// sellerName / area.
export function demoSellerFor(listingId) {
  const identity = DEMO_IDENTITIES[hashToIndex(listingId, DEMO_IDENTITIES.length)];
  return {
    id: `demo-seller-${listingId}`,
    name: identity.name,
    area: identity.area,
  };
}

export default DEMO_IDENTITIES;
