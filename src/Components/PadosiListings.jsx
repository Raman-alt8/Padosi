import { useState, useEffect } from "react";

// ─── Padosi Listings Tab ───────────────────────────────────────────────────
// Self-contained: the 4-tile grid (Rent a Vehicle / Buy Ticket / Service
// Listings / Ride Share) PLUS the two full-page overlays that "Service
// Listings" and "Ride Share" open. Everything this tab needs lives here.

const SERVICE_CATEGORIES = [
  { icon: "🔧", label: "Plumber",                  prompt: "Need a plumber to fix " },
  { icon: "⚡", label: "Electrician",              prompt: "Need an electrician to " },
  { icon: "👶", label: "Daycare & Babysitting",    prompt: "Need a babysitter/daycare helper for " },
  { icon: "🔨", label: "Carpenter",                prompt: "Need a carpenter to " },
  { icon: "🎨", label: "Painter",                  prompt: "Need a painter to " },
  { icon: "❄️",  label: "AC & Appliance Repair",   prompt: "Need help repairing my " },
  { icon: "🧹", label: "House Cleaning",           prompt: "Need house cleaning help for " },
  { icon: "🐛", label: "Pest Control",             prompt: "Need pest control for " },
  { icon: "✂️",  label: "Salon & Beauty",           prompt: "Need a salon/beauty appointment for " },
  { icon: "📚", label: "Tutoring",                 prompt: "Need a tutor for " },
  { icon: "🐾", label: "Pet Care",                 prompt: "Need pet care help with " },
  { icon: "🚚", label: "Packers & Movers",         prompt: "Need help packing/moving " },
  { icon: "🪪", label: "Driver on Demand",         prompt: "Need a driver for " },
  { icon: "🍽️", label: "Cook & Catering",          prompt: "Need a cook/catering for " },
  { icon: "🌱", label: "Gardening",                prompt: "Need gardening help with " },
  { icon: "💻", label: "Computer & Mobile Repair", prompt: "Need help repairing my " },
  { icon: "👕", label: "Laundry & Ironing",        prompt: "Need laundry/ironing help for " },
  { icon: "🧓", label: "Elderly Care",             prompt: "Need elderly care assistance with " },
];

function initials(name = "") {
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Listings Grid (the visible tab) ───────────────────────────────────────
function ListingsGrid({ showToast }) {
  const tiles = [
    { icon: "🚗", label: "Rent a Vehicle",   action: () => showToast("🚗 Rent a Vehicle — coming soon!") },
    { icon: "🎟️", label: "Buy Ticket",       action: () => showToast("🎟️ Buy Ticket — coming soon!") },
    { icon: "🔧", label: "Service Listings", action: () => window.dispatchEvent(new Event("padosi:openServices")) },
    { icon: "🛣️", label: "Ride Share",       action: () => window.dispatchEvent(new Event("padosi:openRide")) },
  ];

  return (
    <div className="bg-gray-900 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-6">
      <p className="text-lg font-black text-white mb-4">
        Padosi <span className="text-red-500">Listings</span>
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map(({ icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-5 flex flex-col items-center gap-2.5 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.6)] hover:border-gray-600 transition-all"
          >
            <span className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-xl">{icon}</span>
            <span className="text-sm font-bold text-white text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Service Listings Page (opens on "Service Listings" tile) ─────────────
function ServiceListingsPage({ onSelectCategory }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("padosi:openServices", handler);
    return () => window.removeEventListener("padosi:openServices", handler);
  }, []);

  return (
    <div className={`fixed inset-0 z-[5000] bg-[#0a0a0a] flex flex-col overflow-y-auto transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
      {/* Header */}
      <div className="h-[70px] flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <button
          onClick={() => setOpen(false)}
          className="inline-flex items-center gap-2 bg-gray-800 border-none px-4 py-2 rounded-full text-sm font-bold text-gray-300 cursor-pointer hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          ← Back
        </button>
        <p className="text-base font-black text-white">Padosi <span className="text-red-500">Services</span></p>
        <div className="w-20" />
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-red-600 to-red-500 text-white py-14 px-6 text-center">
        <h1 className="text-5xl font-black">Serve</h1>
        <p className="mt-2.5 text-sm opacity-90 max-w-md mx-auto">
          Pick what you need help with — we'll get your task ready to post to neighbours nearby.
        </p>
      </div>

      {/* Category grid */}
      <div className="flex justify-center px-6 pb-16">
        <div className="w-full max-w-[1100px] -mt-9">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {SERVICE_CATEGORIES.map((cat, i) => (
              <button
                key={i}
                onClick={() => { setOpen(false); onSelectCategory(cat); }}
                className="bg-gray-800 border border-gray-700 rounded-2xl py-5 px-3 flex flex-col items-center gap-3 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.6)] hover:border-gray-600 transition-all"
              >
                <span className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-2xl">{cat.icon}</span>
                <span className="text-xs font-bold text-white text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ride Share Page (opens on "Ride Share" tile) ──────────────────────────
function RideSharePage({ currentUser, showToast }) {
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [search, setSearch] = useState("");
  const [editingRoute, setEditingRoute] = useState(null);
  const [seats, setSeats] = useState(1);
  const [freq, setFreq] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [deptTime, setDeptTime] = useState("");
  const [priceVal, setPriceVal] = useState("");
  const [desc, setDesc] = useState("");
  const [formError, setFormError] = useState("");
  const [mapSrc, setMapSrc] = useState("");
  const [mapHidden, setMapHidden] = useState(true);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("padosi:openRide", handler);
    return () => window.removeEventListener("padosi:openRide", handler);
  }, []);

  const resetForm = () => {
    setFrom(""); setTo(""); setFreq(""); setDeptTime(""); setPriceVal("");
    setDesc(""); setSeats(1); setFormError(""); setMapSrc(""); setMapHidden(true);
    setEditingRoute(null);
  };

  const openForm = (route = null) => {
    if (route) {
      setEditingRoute(route);
      setFrom(route.from); setTo(route.to); setFreq(route.freq);
      setDeptTime(route.time); setPriceVal(String(route.price || ""));
      setDesc(route.desc); setSeats(route.seats);
      const q = encodeURIComponent(route.from + " to " + route.to + " Jaipur India");
      setMapSrc(`https://maps.google.com/maps?q=${q}&z=13&output=embed`);
      setMapHidden(false);
    } else {
      resetForm();
    }
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!from)     { setFormError("⚠️ Please enter a starting point."); return; }
    if (!to)       { setFormError("⚠️ Please enter a destination."); return; }
    if (!freq)     { setFormError("⚠️ Please select how many times a week."); return; }
    if (!deptTime) { setFormError("⚠️ Please enter your usual departure time."); return; }
    if (!desc)     { setFormError("⚠️ Please add a short description."); return; }

    const name = currentUser?.full_name || "User";
    const inits = initials(name);

    if (editingRoute) {
      setRoutes(prev => prev.map(r =>
        r.id === editingRoute.id
          ? { ...r, from, to, freq, time: deptTime, seats, price: Number(priceVal) || 0, desc }
          : r
      ));
      showToast("✏️ Route updated");
    } else {
      setRoutes(prev => [{
        id: Date.now(), from, to, freq, time: deptTime,
        seats, price: Number(priceVal) || 0, desc,
        posterName: name, posterInitials: inits,
        posterId: currentUser?.id, createdAt: new Date().toISOString()
      }, ...prev]);
      showToast("🚗 Route posted!");
    }
    setFormOpen(false);
    resetForm();
  };

  const filtered = routes.filter(r => {
    const t = search.toLowerCase();
    return !t || r.from.toLowerCase().includes(t) || r.to.toLowerCase().includes(t) || r.desc.toLowerCase().includes(t);
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[5000] bg-[#0a0a0a] flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="h-[70px] flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <button
          onClick={() => setOpen(false)}
          className="inline-flex items-center gap-2 bg-gray-800 border-none px-4 py-2 rounded-full text-sm font-bold text-gray-300 cursor-pointer hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          ← Back
        </button>
        <p className="text-base font-black text-white">Padosi <span className="text-red-500">Ride Share</span></p>
        <button
          onClick={() => {
            if (!currentUser) { showToast("👋 Please log in to post a route."); return; }
            openForm(null);
          }}
          className="inline-flex items-center gap-2 bg-red-500 text-white border-none px-5 py-2 rounded-full text-sm font-bold cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(239,68,68,0.4)] transition-all"
        >
          + Post a Route
        </button>
      </div>

      {/* ── Search ── */}
      <div className="px-6 py-4 max-w-[600px] mx-auto w-full">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search routes, e.g. Vaishali to MI Road…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-700 bg-gray-900 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-red-500 shadow-sm transition-colors"
          />
        </div>
      </div>

      {/* ── Route Cards ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1200px] mx-auto">
          {filtered.length === 0 ? (
            <div className="col-span-3 text-center py-16 flex flex-col items-center gap-3">
              <span className="text-5xl">🛣️</span>
              <strong className="text-gray-500 text-base">
                {search ? "No routes match your search." : "No routes posted yet."}
              </strong>
              <span className="text-sm text-gray-600">
                {search ? "Try a different keyword." : "Be the first — post your route!"}
              </span>
            </div>
          ) : filtered.map(r => {
            const isOwner = r.posterId === currentUser?.id;
            const freqLabel = r.freq === "7" ? "Daily" : `${r.freq}× a week`;
            return (
              <div
                key={r.id}
                className="bg-gray-800 rounded-2xl border border-gray-700 shadow-[0_6px_24px_rgba(0,0,0,0.4)] p-5 flex flex-col gap-3.5 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)] hover:border-gray-600 transition-all"
              >
                {/* Route from → to */}
                <div className="flex items-center gap-2.5">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="w-0.5 h-5 bg-gray-600" />
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{r.from}</p>
                    <p className="text-xs text-gray-400 mt-2 truncate">{r.to}</p>
                  </div>
                  {isOwner && (
                    <span className="text-xs font-bold bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full flex-shrink-0">
                      Your route
                    </span>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: "📅", text: freqLabel },
                    { icon: "🕐", text: r.time || "—" },
                    { icon: "👥", text: `${r.seats} seat${r.seats > 1 ? "s" : ""}` },
                  ].map(({ icon, text }) => (
                    <span
                      key={text}
                      className="inline-flex items-center gap-1 bg-gray-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-300"
                    >
                      {icon} {text}
                    </span>
                  ))}
                </div>

                {r.desc && (
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{r.desc}</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-700 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-red-500/10 text-red-400 text-xs font-bold flex items-center justify-center">
                      {r.posterInitials}
                    </span>
                    <span className="text-xs font-semibold text-gray-300">{r.posterName}</span>
                  </div>

                  {isOwner ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openForm(r)}
                        className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg font-bold cursor-pointer border-none hover:bg-blue-500/20 transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => { setRoutes(p => p.filter(x => x.id !== r.id)); showToast("🗑️ Route removed"); }}
                        className="text-xs bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg font-bold cursor-pointer border-none hover:bg-red-500/20 transition-colors"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-red-400">
                        {r.price > 0 ? `₹${r.price}` : "Free"}
                        <span className="text-xs font-normal text-gray-500">/seat</span>
                      </span>
                      <button
                        onClick={() => {
                          if (!currentUser) { showToast("👋 Please log in first."); return; }
                          showToast("💬 Chat coming soon! Route by " + r.posterName);
                        }}
                        className="text-xs bg-gray-700 text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer border-none hover:bg-green-600 transition-colors"
                      >
                        Contact
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Post / Edit route form overlay ── */}
      {formOpen && (
        <div className="absolute inset-0 z-10 bg-[#0a0a0a] flex flex-col">

          {/* Form header */}
          <div className="h-[70px] flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800 flex-shrink-0">
            <button
              onClick={() => { setFormOpen(false); resetForm(); }}
              className="inline-flex items-center gap-2 bg-gray-800 border-none px-4 py-2 rounded-full text-sm font-bold text-gray-300 cursor-pointer hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              ← Back
            </button>
            <p className="text-base font-black text-white">Post a <span className="text-red-500">Route</span></p>
            <div className="w-20" />
          </div>

          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

            {/* Map pane */}
            <div className="flex-1 relative bg-gray-900 min-h-[200px]">
              {mapSrc && (
                <iframe src={mapSrc} className="w-full h-full border-none" allowFullScreen loading="lazy" />
              )}
              {mapHidden && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900">
                  <span className="text-5xl text-gray-700">🗺️</span>
                  <p className="text-sm text-gray-500 text-center max-w-[180px] leading-snug">
                    Enter your route to preview it on the map
                  </p>
                </div>
              )}
            </div>

            {/* Form pane */}
            <div className="w-full md:w-[400px] flex-shrink-0 bg-gray-900 border-l border-gray-800 overflow-y-auto p-7">
              <h2 className="text-xl font-black text-white mb-1">
                {editingRoute ? "Edit your route" : "Your route details"}
              </h2>
              <p className="text-xs text-gray-500 mb-6">
                Share your regular trip so neighbours can ride along.
              </p>

              {/* From / To inputs */}
              {[
                { label: "🟢 From", id: "rideFrom", val: from, set: setFrom, placeholder: "Starting point, e.g. Vaishali Nagar" },
                { label: "📍 To",   id: "rideTo",   val: to,   set: setTo,   placeholder: "Destination, e.g. MI Road" },
              ].map(({ label, id, val, set, placeholder }) => (
                <div key={id} className="mb-4">
                  <label className="text-xs font-bold text-gray-400 mb-2 block">{label}</label>
                  <input
                    value={val}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-3 rounded-xl border border-gray-700 text-sm bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:bg-gray-750 transition-colors"
                  />
                </div>
              ))}

              {/* Map preview trigger */}
              <button
                onClick={() => {
                  if (!from || !to) { showToast("⚠️ Enter both a starting point and destination first."); return; }
                  const q = encodeURIComponent(from + " to " + to + " Jaipur India");
                  setMapSrc(`https://maps.google.com/maps?q=${q}&z=13&output=embed`);
                  setMapHidden(false);
                }}
                className="w-full py-3 rounded-xl border border-gray-700 bg-gray-800 text-sm font-bold text-gray-300 cursor-pointer hover:border-red-500 hover:text-red-400 transition-colors mb-5"
              >
                🗺️ Preview on Map
              </button>

              <hr className="border-gray-800 my-5" />

              {/* Frequency selector */}
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-400 mb-2 block">📅 Times per week</label>
                <div className="flex gap-2 flex-wrap">
                  {["1","2","3","4","5","6","7"].map(v => (
                    <button
                      key={v}
                      onClick={() => setFreq(v)}
                      className={`px-3 py-2 rounded-xl border text-sm font-bold cursor-pointer transition-colors ${
                        freq === v
                          ? "bg-red-500 border-red-500 text-white"
                          : "border-gray-700 bg-gray-800 text-gray-300 hover:border-red-400 hover:text-red-400"
                      }`}
                    >
                      {v === "7" ? "Daily" : `${v}×`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Departure time + seats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-2 block">🕐 Departs at</label>
                  <input
                    type="time"
                    value={deptTime}
                    onChange={e => setDeptTime(e.target.value)}
                    style={{ colorScheme: "dark" }}
                    className="w-full px-3.5 py-3 rounded-xl border border-gray-700 text-sm bg-gray-800 text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-2 block">👥 Seats available</label>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      onClick={() => setSeats(s => Math.max(1, s - 1))}
                      className="w-8 h-8 rounded-full border border-gray-700 bg-gray-800 text-lg font-bold text-gray-300 flex items-center justify-center cursor-pointer hover:border-red-400 hover:text-red-400 transition-colors"
                    >−</button>
                    <span className="text-xl font-black text-white min-w-[20px] text-center">{seats}</span>
                    <button
                      onClick={() => setSeats(s => Math.min(8, s + 1))}
                      className="w-8 h-8 rounded-full border border-gray-700 bg-gray-800 text-lg font-bold text-gray-300 flex items-center justify-center cursor-pointer hover:border-red-400 hover:text-red-400 transition-colors"
                    >+</button>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-400 mb-2 block">₹ Price per seat</label>
                <input
                  type="number"
                  value={priceVal}
                  onChange={e => setPriceVal(e.target.value)}
                  placeholder="e.g. 50"
                  min="0"
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-700 text-sm bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-400 mb-2 block">📝 Description</label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value.slice(0, 400))}
                  placeholder="e.g. I drive to Malviya Nagar every morning around 8 AM, AC car, non-smoker, happy to drop anyone along the route."
                  rows={4}
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-700 text-sm bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors resize-y leading-relaxed"
                />
                <p className="text-xs text-gray-600 text-right mt-1">{desc.length} / 400</p>
              </div>

              {formError && (
                <p className="text-red-400 text-sm font-semibold mb-3">{formError}</p>
              )}

              <button
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl bg-red-500 text-white text-sm font-bold cursor-pointer border-none hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(239,68,68,0.4)] transition-all"
              >
                {editingRoute ? "💾 Save Changes" : "🚗 Post Route"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────
export default function PadosiListings({ showToast, currentUser, onSelectCategory }) {
  return (
    <>
      <ListingsGrid showToast={showToast} />
      <ServiceListingsPage onSelectCategory={onSelectCategory} />
      <RideSharePage currentUser={currentUser} showToast={showToast} />
    </>
  );
}