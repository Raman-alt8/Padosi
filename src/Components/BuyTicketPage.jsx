import { useState, useEffect } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const EVENT_CATEGORIES = [
  { icon: "🎵", label: "Concert" },
  { icon: "🏏", label: "Cricket" },
  { icon: "⚽", label: "Football" },
  { icon: "🎭", label: "Theatre" },
  { icon: "🎬", label: "Movie" },
  { icon: "🎪", label: "Festival" },
  { icon: "🏋️", label: "Sports" },
  { icon: "🎓", label: "Workshop" },
  { icon: "🎤", label: "Comedy" },
  { icon: "🍽️", label: "Dining" },
  { icon: "🎨", label: "Exhibition" },
  { icon: "🎰", label: "Other" },
];

const MOCK_LISTINGS = [
  {
    id: 1,
    title: "Arijit Singh Live",
    category: "Concert",
    icon: "🎵",
    date: "12 Jul 2025",
    venue: "Jawaharlal Nehru Stadium, Delhi",
    price: 1200,
    qty: 3,
    seller: "Rohit M.",
    badge: "Hot",
  },
  {
    id: 2,
    title: "IPL Final — RCB vs MI",
    category: "Cricket",
    icon: "🏏",
    date: "20 Jul 2025",
    venue: "M. Chinnaswamy Stadium, Bengaluru",
    price: 2500,
    qty: 2,
    seller: "Priya S.",
    badge: "2 left",
  },
  {
    id: 3,
    title: "Zakir Khan Stand-Up",
    category: "Comedy",
    icon: "🎤",
    date: "5 Aug 2025",
    venue: "Siri Fort Auditorium, Delhi",
    price: 799,
    qty: 5,
    seller: "Aman K.",
    badge: null,
  },
  {
    id: 4,
    title: "Sunburn Festival 2025",
    category: "Festival",
    icon: "🎪",
    date: "28 Dec 2025",
    venue: "Vagator Beach, Goa",
    price: 4500,
    qty: 1,
    seller: "Neha R.",
    badge: "Last one",
  },
  {
    id: 5,
    title: "ISL — ATK Mohun Bagan vs FC Goa",
    category: "Football",
    icon: "⚽",
    date: "18 Jul 2025",
    venue: "Salt Lake Stadium, Kolkata",
    price: 600,
    qty: 4,
    seller: "Subhash D.",
    badge: null,
  },
  {
    id: 6,
    title: "Kalki 2898-AD — Premier Night",
    category: "Movie",
    icon: "🎬",
    date: "10 Jul 2025",
    venue: "PVR IMAX, Mumbai",
    price: 950,
    qty: 2,
    seller: "Divya T.",
    badge: "New",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabBar({ tab, setTab, dark }) {
  const tabs = [
    { key: "buy", label: "Buy Tickets" },
    { key: "post", label: "Post a Ticket" },
  ];
  return (
    <div
      className={`flex gap-1 p-1 rounded-xl border ${
        dark ? "bg-white/10 border-white/20" : "bg-[#f0f0f5] border-[#e0e0ea]"
      }`}
    >
      {tabs.map(({ key, label }) => {
        const active = tab === key;
        return (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              active
                ? dark
                  ? "bg-white text-black shadow-sm"
                  : "bg-white text-[#111] shadow-sm border border-[#e0e0ea]"
                : dark
                ? "text-white/60 hover:text-white"
                : "text-[#888] hover:text-[#333]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function BadgePill({ text, dark }) {
  if (!text) return null;
  const isUrgent =
    text === "Hot" || text === "Last one" || text === "2 left";
  return (
    <span
      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
        isUrgent
          ? dark
            ? "bg-white text-black"
            : "bg-[#ff2d55] text-white"
          : dark
          ? "bg-white/20 text-white"
          : "bg-[#f0f0f5] text-[#555]"
      }`}
    >
      {text}
    </span>
  );
}

function TicketCard({ listing, dark, onBuy }) {
  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all hover:-translate-y-0.5 ${
        dark
          ? "bg-black border-white/20 hover:border-white/60"
          : "bg-white border-[#eee] hover:border-[#ff2d55] hover:shadow-[0_8px_24px_rgba(255,45,85,0.10)]"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border ${
              dark ? "border-white/20" : "border-[#eee]"
            }`}
          >
            {listing.icon}
          </span>
          <div>
            <p
              className={`text-sm font-black leading-tight ${
                dark ? "text-white" : "text-[#111]"
              }`}
            >
              {listing.title}
            </p>
            <p
              className={`text-xs mt-0.5 ${
                dark ? "text-white/50" : "text-[#999]"
              }`}
            >
              {listing.category}
            </p>
          </div>
        </div>
        <BadgePill text={listing.badge} dark={dark} />
      </div>

      {/* Details */}
      <div
        className={`text-xs flex flex-col gap-1 ${
          dark ? "text-white/60" : "text-[#777]"
        }`}
      >
        <span>📅 {listing.date}</span>
        <span>📍 {listing.venue}</span>
        <span>🎟️ {listing.qty} ticket{listing.qty > 1 ? "s" : ""} available · by {listing.seller}</span>
      </div>

      {/* Price + CTA */}
      <div className="flex items-center justify-between mt-1">
        <div>
          <p
            className={`text-xs ${dark ? "text-white/40" : "text-[#bbb]"}`}
          >
            per ticket
          </p>
          <p
            className={`text-lg font-black ${
              dark ? "text-white" : "text-[#111]"
            }`}
          >
            ₹{listing.price.toLocaleString("en-IN")}
          </p>
        </div>
        <button
          onClick={() => onBuy(listing)}
          className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all border ${
            dark
              ? "bg-white text-black border-white hover:bg-white/80"
              : "bg-[#ff2d55] text-white border-[#ff2d55] hover:bg-[#e0254c]"
          }`}
        >
          Buy
        </button>
      </div>
    </div>
  );
}

function BuyPanel({ dark, listings, showToast }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...EVENT_CATEGORIES.map((c) => c.label)];

  const filtered = listings.filter((l) => {
    const matchCat =
      activeCategory === "All" || l.category === activeCategory;
    const matchSearch =
      search === "" ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.venue.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <input
        type="text"
        placeholder="Search events, venues…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`w-full rounded-xl px-4 py-2.5 text-sm border outline-none transition-colors ${
          dark
            ? "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/60"
            : "bg-[#f6f7fb] border-[#e0e0ea] text-[#111] placeholder:text-[#bbb] focus:border-[#ff2d55]"
        }`}
      />

      {/* Category filter — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const active = activeCategory === cat;
          const catObj = EVENT_CATEGORIES.find((c) => c.label === cat);
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all ${
                active
                  ? dark
                    ? "bg-white text-black border-white"
                    : "bg-[#ff2d55] text-white border-[#ff2d55]"
                  : dark
                  ? "bg-transparent text-white/60 border-white/20 hover:border-white/50"
                  : "bg-transparent text-[#777] border-[#ddd] hover:border-[#ff2d55] hover:text-[#ff2d55]"
              }`}
            >
              {catObj && <span>{catObj.icon}</span>}
              {cat}
            </button>
          );
        })}
      </div>

      {/* Listings */}
      {filtered.length === 0 ? (
        <div
          className={`text-center py-16 text-sm ${
            dark ? "text-white/40" : "text-[#bbb]"
          }`}
        >
          No tickets found. Try a different search or category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((listing) => (
            <TicketCard
              key={listing.id}
              listing={listing}
              dark={dark}
              onBuy={(l) =>
                showToast(`🎟️ Request sent for "${l.title}"!`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostPanel({ dark, showToast }) {
  const [form, setForm] = useState({
    title: "",
    category: "",
    date: "",
    venue: "",
    price: "",
    qty: "1",
    description: "",
    contact: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const inputBase = `w-full rounded-xl px-4 py-2.5 text-sm border outline-none transition-colors ${
    dark
      ? "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white"
      : "bg-[#f6f7fb] border-[#e0e0ea] text-[#111] placeholder:text-[#bbb] focus:border-[#ff2d55]"
  }`;

  const labelBase = `text-xs font-bold mb-1 block ${
    dark ? "text-white/60" : "text-[#888]"
  }`;

  const handleSubmit = () => {
    const required = ["title", "category", "date", "venue", "price", "contact"];
    if (required.some((k) => !form[k])) {
      showToast("⚠️ Please fill in all required fields.");
      return;
    }
    setSubmitted(true);
    showToast("✅ Ticket posted to Padosi Listings!");
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
        <span className="text-6xl">🎟️</span>
        <p
          className={`text-2xl font-black ${
            dark ? "text-white" : "text-[#111]"
          }`}
        >
          Ticket posted!
        </p>
        <p
          className={`text-sm max-w-xs ${
            dark ? "text-white/50" : "text-[#999]"
          }`}
        >
          Your listing is now live. Neighbours nearby can see and contact you.
        </p>
        <button
          onClick={() => {
            setForm({
              title: "",
              category: "",
              date: "",
              venue: "",
              price: "",
              qty: "1",
              description: "",
              contact: "",
            });
            setSubmitted(false);
          }}
          className={`mt-2 px-6 py-2.5 rounded-xl text-sm font-bold border cursor-pointer transition-all ${
            dark
              ? "bg-white text-black border-white hover:bg-white/80"
              : "bg-[#ff2d55] text-white border-[#ff2d55] hover:bg-[#e0254c]"
          }`}
        >
          Post another
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Title */}
      <div>
        <label className={labelBase}>Event name *</label>
        <input
          className={inputBase}
          placeholder="e.g. Arijit Singh Live"
          value={form.title}
          onChange={set("title")}
        />
      </div>

      {/* Category */}
      <div>
        <label className={labelBase}>Category *</label>
        <select
          className={inputBase}
          value={form.category}
          onChange={set("category")}
        >
          <option value="">Select a category</option>
          {EVENT_CATEGORIES.map((c) => (
            <option key={c.label} value={c.label}>
              {c.icon} {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date + Venue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelBase}>Event date *</label>
          <input
            type="date"
            className={inputBase}
            value={form.date}
            onChange={set("date")}
          />
        </div>
        <div>
          <label className={labelBase}>Venue *</label>
          <input
            className={inputBase}
            placeholder="Stadium or location name"
            value={form.venue}
            onChange={set("venue")}
          />
        </div>
      </div>

      {/* Price + Qty */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelBase}>Price per ticket (₹) *</label>
          <input
            type="number"
            min="0"
            className={inputBase}
            placeholder="e.g. 1200"
            value={form.price}
            onChange={set("price")}
          />
        </div>
        <div>
          <label className={labelBase}>Tickets available</label>
          <input
            type="number"
            min="1"
            max="20"
            className={inputBase}
            value={form.qty}
            onChange={set("qty")}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelBase}>Additional details</label>
        <textarea
          rows={3}
          className={`${inputBase} resize-none`}
          placeholder="Seat details, row, category, reason for selling…"
          value={form.description}
          onChange={set("description")}
        />
      </div>

      {/* Contact */}
      <div>
        <label className={labelBase}>Your contact (phone / WhatsApp) *</label>
        <input
          className={inputBase}
          placeholder="+91 98765 43210"
          value={form.contact}
          onChange={set("contact")}
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className={`mt-2 w-full py-3 rounded-xl text-sm font-black cursor-pointer transition-all border ${
          dark
            ? "bg-white text-black border-white hover:bg-white/80"
            : "bg-[#ff2d55] text-white border-[#ff2d55] hover:bg-[#e0254c]"
        }`}
      >
        Post ticket →
      </button>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function BuyTicketPage({ showToast, dark = false }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("buy");

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("padosi:openTickets", handler);
    return () => window.removeEventListener("padosi:openTickets", handler);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[5000] flex flex-col overflow-y-auto transition-opacity duration-300 ${
        dark ? "bg-black" : "bg-[#f6f7fb]"
      } ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      {/* ── Header ── */}
      <div
        className={`h-[70px] flex items-center justify-between px-6 sticky top-0 z-10 border-b ${
          dark ? "bg-black border-white/20" : "bg-white border-[#eee]"
        }`}
      >
        <button
          onClick={() => setOpen(false)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
            dark
              ? "bg-black border-white text-white hover:bg-white hover:text-black"
              : "bg-white border-[#ddd] text-[#333] hover:border-[#ff2d55] hover:text-[#ff2d55]"
          }`}
        >
          ← Back
        </button>

        <p className={`text-base font-black ${dark ? "text-white" : "text-[#111]"}`}>
          Padosi{" "}
          <span
            className={`underline decoration-2 underline-offset-2 ${
              dark ? "text-white" : "text-[#ff2d55]"
            }`}
          >
            Tickets
          </span>
        </p>

        <div className="w-20" />
      </div>

      {/* ── Hero ── */}
      <div
        className={`py-12 px-6 text-center ${
          dark ? "bg-white text-black" : "bg-[#ff2d55] text-white"
        }`}
      >
        <h1 className="text-5xl font-black">🎟️</h1>
        <h2 className="text-3xl font-black mt-2">Tickets</h2>
        <p
          className={`mt-2 text-sm max-w-sm mx-auto ${
            dark ? "opacity-60" : "opacity-90"
          }`}
        >
          Buy tickets from neighbours or post your extras — no middlemen, no markup.
        </p>
      </div>

      {/* ── Body ── */}
      <div className="flex justify-center px-4 pb-16">
        <div className="w-full max-w-3xl -mt-6">
          {/* Card wrapper */}
          <div
            className={`rounded-2xl border p-5 shadow-[0_10px_40px_rgba(0,0,0,0.08)] ${
              dark
                ? "bg-black border-white/20"
                : "bg-white border-[#eee]"
            }`}
          >
            <div className="mb-5">
              <TabBar tab={tab} setTab={setTab} dark={dark} />
            </div>

            {tab === "buy" ? (
              <BuyPanel
                dark={dark}
                listings={MOCK_LISTINGS}
                showToast={showToast}
              />
            ) : (
              <PostPanel dark={dark} showToast={showToast} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
