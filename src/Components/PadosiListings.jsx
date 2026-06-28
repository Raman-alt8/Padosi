// PadosiListings.jsx
import RideSharePage from "./RideSharePage";
import BuyTicketPage from "./BuyTicketPage";
import ServiceListingsPage from "./ServiceListingsPage";
import PostServicePage from "./PostServicePage";

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
  return (
    <>
      <ListingsGrid showToast={showToast} dark={dark} />
      <ServiceListingsPage onSelectCategory={onSelectCategory} dark={dark} />
      <PostServicePage dark={dark} />
      <BuyTicketPage showToast={showToast} dark={dark} user={currentUser} />
      <RideSharePage currentUser={currentUser} showToast={showToast} dark={dark} />
    </>
  );
}