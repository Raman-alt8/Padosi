// PadosiListings.jsx
import { useState, useEffect, useCallback } from "react";
import RideSharePage from "./RideSharePage";
import BuyTicketPage from "./BuyTicketPage";
import ServiceListingsPage from "./ServiceListingsPage";
import PostServicePage from "./PostServicePage";
import ServiceListingsAllPage from "./ServiceListingsAllPage";

// ─── Listings Grid ──
function ListingsGrid({ showToast, dark }) {
  const tiles = [
    { icon: "🚗", label: "Rent a Vehicle",   action: () => showToast("🚗 Rent a Vehicle — coming soon!") },
    { icon: "🎟️", label: "Buy Ticket",       action: () => window.dispatchEvent(new Event("padosi:openTickets")) },
    { icon: "🔧", label: "Service Listings", action: () => window.dispatchEvent(new Event("padosi:openServices")) },
    { icon: "🛣️", label: "Ride Share",       action: () => window.dispatchEvent(new Event("padosi:openRide")) },
  ];

  return (
    <div className={`rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] p-6 border ${
      dark
        ? "bg-black border-white shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
        : "bg-white border-[#eee]"
    }`}>
      <p className={`text-lg font-black mb-4 ${dark ? "text-white" : "text-[#111]"}`}>
        Padosi{" "}
        <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>
          Listings
        </span>
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map(({ icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            className={`rounded-2xl p-5 flex flex-col items-center gap-2.5 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all group border ${
              dark
                ? "bg-black border-white hover:bg-white hover:shadow-[0_15px_35px_rgba(255,255,255,0.15)]"
                : "bg-[#f6f7fb] border-[#eee] hover:bg-[#ff2d55] hover:border-[#ff2d55] hover:shadow-[0_12px_28px_rgba(255,45,85,0.18)]"
            }`}
          >
            <span className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border transition-colors ${
              dark
                ? "border-white text-white group-hover:border-black group-hover:text-black"
                : "border-[#ddd] text-[#555] group-hover:border-white group-hover:text-white"
            }`}>
              {icon}
            </span>
            <span className={`text-sm font-bold text-center leading-tight transition-colors ${
              dark
                ? "text-white group-hover:text-black"
                : "text-[#333] group-hover:text-white"
            }`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function PadosiListings({ showToast, currentUser, onSelectCategory, dark = false }) {
  const [listings, setListings] = useState([]);

  // Pull every listing from the shared backend — this is what makes a post
  // from one account visible on every other account, not just the poster's.
  const fetchListings = useCallback(async () => {
    try {
      const res = await fetch("/api/services", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setListings(data.services || []);
    } catch (err) {
      console.error("Could not load service listings:", err);
    }
  }, []);

  useEffect(() => {
    fetchListings();
    // Re-fetch whenever a new listing is posted, an existing one is edited,
    // or the "All listings" view is opened, so everyone sees the latest
    // shared data instead of a stale local copy.
    window.addEventListener("padosi:allListings", fetchListings);
    return () => window.removeEventListener("padosi:allListings", fetchListings);
  }, [fetchListings]);

  const handleDeleteListing = async (index) => {
    const listing = listings[index];
    if (!listing) return;

    try {
      const res = await fetch(`/api/services/${listing.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete listing.");

      setListings((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      showToast?.(`⚠️ ${err.message}`);
    }
  };

  return (
    <>
      <ListingsGrid showToast={showToast} dark={dark} />
      <ServiceListingsPage onSelectCategory={onSelectCategory} dark={dark} />
      {/* PostServicePage saves directly to the backend and fires "padosi:allListings"
          on success, which triggers fetchListings() above to refresh everyone's view.
          It also doubles as the edit screen: ServiceListingsAllPage's Edit button
          dispatches the same "padosi:postService" event with a listing attached. */}
      <PostServicePage dark={dark} onSubmit={() => fetchListings()} />
      <ServiceListingsAllPage
        dark={dark}
        listings={listings}
        onDelete={handleDeleteListing}
      />
      <BuyTicketPage showToast={showToast} dark={dark} user={currentUser} />
      <RideSharePage currentUser={currentUser} showToast={showToast} dark={dark} />
    </>
  );
}