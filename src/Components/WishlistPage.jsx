// WishlistPage.jsx
// Opens when the navbar heart dispatches "padosi:openWishlist". Shows every
// saved item — vehicles, tickets, services — in one unified card design,
// regardless of which page it was saved from. This deliberately does NOT
// reuse VehicleCard/TicketCard: those are built for their own listing grids
// (owner edit/remove, category badges, etc.), while a "saved items" page is
// its own product surface — closer to Amazon/Flipkart's wishlist grid than
// to any single listing page.
import { useState, useEffect, useMemo } from "react";
import { useWishlist } from "./WishlistContext";

const TYPE_LABEL = { vehicle: "Rental", ticket: "Ticket", service: "Service" };
const TYPE_FILTERS = ["All", "Rentals", "Tickets", "Services"];
const FILTER_TO_TYPE = { Rentals: "vehicle", Tickets: "ticket", Services: "service" };

function formatINR(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-IN") : value;
}

// ─── Ticket reveal ────────────────────────────────────────────────────────
// Ticket seller contact is gated behind a reveal (same as BuyTicketPage's
// RevealModal) — a wishlist entry never stores contact info up front, so
// this hook re-runs that same reveal flow the moment someone hits "Buy"
// here instead of on the Tickets page.
function useTicketReveal(showToast) {
  const [revealed, setRevealed] = useState({}); // id -> { contact, image_url }
  const [loadingId, setLoadingId] = useState(null);

  const reveal = async (entry) => {
    const id = entry.id;
    if (revealed[id]) return;
    if (entry.isDemo) {
      setRevealed((prev) => ({
        ...prev,
        [id]: { contact: entry.raw?.contact, image_url: entry.raw?.image_url },
      }));
      return;
    }
    setLoadingId(id);
    try {
      const res = await fetch(`/api/tickets/${id}/reveal`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) { showToast?.(`⚠️ ${data.error || "Could not load ticket details."}`); return; }
      setRevealed((prev) => ({ ...prev, [id]: data }));
    } catch {
      showToast?.("⚠️ Network error. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  return { revealed, loadingId, reveal };
}

function WishlistCard({ entry, dark, onRemove, ticketReveal }) {
  const isVehicle = entry.type === "vehicle";
  const isTicket  = entry.type === "ticket";
  const isService = entry.type === "service";

  const revealData    = isTicket ? ticketReveal.revealed[entry.id] : null;
  const revealLoading = isTicket && ticketReveal.loadingId === entry.id;

  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${
      dark
        ? "bg-black border-white/20 hover:border-white/50"
        : "bg-white border-[#eee] shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
    }`}>
      {/* Top row: thumbnail, type + badge, remove */}
      <div className="flex items-start gap-3">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden ${
          dark ? "bg-white/5" : "bg-[#f6f7fb]"
        }`}>
          {entry.image ? (
            <img src={entry.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{entry.icon || "🛍️"}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${
              dark ? "bg-white/10 text-white/60" : "bg-[#f0f0f5] text-[#888]"
            }`}>
              {TYPE_LABEL[entry.type] || entry.type}
            </span>
            {entry.badge && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                dark ? "bg-white text-black" : "bg-[#ff2d55] text-white"
              }`}>
                {entry.badge}
              </span>
            )}
          </div>
          <p className={`text-sm font-black leading-tight mt-1 line-clamp-1 ${dark ? "text-white" : "text-[#111]"}`}>
            {entry.title}
          </p>
          {entry.subtitle && (
            <p className={`text-xs mt-0.5 line-clamp-1 ${dark ? "text-white/50" : "text-[#999]"}`}>{entry.subtitle}</p>
          )}
        </div>

        <button
          onClick={() => onRemove(entry.type, entry.id)}
          aria-label="Remove from wishlist"
          title="Remove from wishlist"
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer border-none transition-colors ${
            dark ? "text-white/50 hover:text-white hover:bg-white/10" : "text-[#ccc] hover:text-[#ff2d55] hover:bg-[#fff0f3]"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#ff2d55" stroke="#ff2d55" strokeWidth={2} strokeLinejoin="round">
            <path d="M12 21s-6.7-4.3-9.3-8.2C1 10 1.6 6.7 4.4 5.2 6.6 4 9.2 4.7 12 7.5 14.8 4.7 17.4 4 19.6 5.2c2.8 1.5 3.4 4.8 1.7 7.6C18.7 16.7 12 21 12 21z" />
          </svg>
        </button>
      </div>

      {/* Meta */}
      {entry.meta?.length > 0 && (
        <div className={`text-xs flex flex-col gap-1 ${dark ? "text-white/50" : "text-[#888]"}`}>
          {entry.meta.map((m, i) => <span key={i}>{m}</span>)}
        </div>
      )}

      {/* Price + type-aware CTA */}
      <div className={`flex items-end justify-between gap-2 pt-3 border-t ${dark ? "border-white/10" : "border-gray-100"}`}>
        <div className="min-w-0">
          {entry.price != null && (
            <p className={`text-base font-black leading-none ${dark ? "text-white" : "text-[#111]"}`}>
              ₹{formatINR(entry.price)}
              <span className={`text-xs font-normal ml-1 ${dark ? "text-white/40" : "text-[#bbb]"}`}>{entry.priceUnit}</span>
            </p>
          )}
        </div>

        {isVehicle && entry.raw?.phone && (
          <a
            href={`tel:${entry.raw.phone}`}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
              dark ? "bg-white text-black border-white hover:bg-white/80" : "bg-[#ff2d55] text-white border-[#ff2d55] hover:bg-[#e0254c]"
            }`}
          >
            📞 Rent Now
          </a>
        )}

        {isTicket && (
          revealData ? (
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className={`text-xs font-bold ${dark ? "text-white" : "text-[#111]"}`}>{revealData.contact}</span>
              {/\d{8,}/.test(revealData.contact || "") && (
                <a
                  href={`https://wa.me/${revealData.contact.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-[#25d366] hover:underline"
                >
                  💬 WhatsApp
                </a>
              )}
            </div>
          ) : (
            <button
              onClick={() => ticketReveal.reveal(entry)}
              disabled={revealLoading}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                revealLoading
                  ? dark ? "bg-white/40 text-black/60 border-white/40" : "bg-[#ffa0b0] text-white border-[#ffa0b0]"
                  : dark ? "bg-white text-black border-white hover:bg-white/80" : "bg-[#ff2d55] text-white border-[#ff2d55] hover:bg-[#e0254c]"
              }`}
            >
              {revealLoading ? "…" : "🎟️ Buy"}
            </button>
          )
        )}

        {/* TODO: once ServiceListingsAllPage.jsx is wired to save/remove
            wishlist entries, give this the same direct CTA treatment as
            vehicle (tel:) / ticket (reveal) above, using whatever contact
            shape that file's cards use. For now this just routes back to
            the Services page. */}
        {isService && (
          <button
            onClick={() => window.dispatchEvent(new Event("padosi:openServices"))}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
              dark ? "bg-white text-black border-white hover:bg-white/80" : "bg-[#ff2d55] text-white border-[#ff2d55] hover:bg-[#e0254c]"
            }`}
          >
            View
          </button>
        )}
      </div>
    </div>
  );
}

export default function WishlistPage({ dark = false, showToast }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const { items, removeWishlist } = useWishlist();
  const ticketReveal = useTicketReveal(showToast);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("padosi:openWishlist", handler);
    return () => window.removeEventListener("padosi:openWishlist", handler);
  }, []);

  const filtered = useMemo(() => {
    if (filter === "All") return items;
    const t = FILTER_TO_TYPE[filter];
    return items.filter((it) => it.type === t);
  }, [items, filter]);

  return (
    <div className={`fixed inset-0 z-[5000] flex flex-col overflow-y-auto transition-opacity duration-300 ${
      dark ? "bg-black" : "bg-[#f6f7fb]"
    } ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>

      {/* Header — matches the rest of the app's real header exactly. */}
      <div className={`h-[80px] shrink-0 flex items-center justify-between px-6 sticky top-0 z-10 border-b ${
        dark ? "bg-black border-white" : "bg-white border-[#eee]"
      }`}>
        <button
          onClick={() => setOpen(false)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
            dark ? "bg-black border-white text-white hover:bg-white hover:text-black" : "bg-white border-[#ddd] text-[#333] hover:border-[#ff2d55] hover:text-[#ff2d55]"
          }`}
        >
          ← Back
        </button>
        <p className={`text-xl font-black ${dark ? "text-white" : "text-[#111]"}`}>
          Padosi{" "}
          <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>
            Wishlist
          </span>
        </p>
        <div className="w-20" />
      </div>

      {/* Filters */}
      <div className="flex justify-center px-6 pt-6">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar max-w-[1100px] w-full">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all ${
                filter === f
                  ? dark ? "bg-white text-black border-white" : "bg-[#ff2d55] text-white border-[#ff2d55]"
                  : dark ? "bg-transparent text-white/60 border-white/20 hover:border-white/50" : "bg-transparent text-[#777] border-[#ddd] hover:border-[#ff2d55] hover:text-[#ff2d55]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 px-6 py-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 mt-16 text-center">
            <span className="text-4xl">🤍</span>
            <p className={`text-sm font-bold ${dark ? "text-white" : "text-[#333]"}`}>Nothing saved yet</p>
            <p className={`text-xs ${dark ? "text-[#888]" : "text-[#999]"}`}>Tap the heart on any listing to save it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1100px] mx-auto">
            {filtered.map((entry) => (
              <WishlistCard
                key={`${entry.type}:${entry.id}`}
                entry={entry}
                dark={dark}
                onRemove={removeWishlist}
                ticketReveal={ticketReveal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
