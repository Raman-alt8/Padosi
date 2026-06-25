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
    <div className="bg-black rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-6 border border-white">
      <p className="text-lg font-black text-white mb-4">
        Padosi <span className="text-white underline decoration-2 underline-offset-2">Listings</span>
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map(({ icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            className="bg-black border border-white rounded-2xl p-5 flex flex-col items-center gap-2.5 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:-translate-y-1 hover:bg-white hover:shadow-[0_15px_35px_rgba(255,255,255,0.15)] transition-all group"
          >
            <span className="w-12 h-12 rounded-full border border-white text-white flex items-center justify-center text-xl group-hover:border-black group-hover:text-black transition-colors">{icon}</span>
            <span className="text-sm font-bold text-white text-center leading-tight group-hover:text-black transition-colors">{label}</span>
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
    <div className={`fixed inset-0 z-[5000] bg-black flex flex-col overflow-y-auto transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
      {/* Header */}
      <div className="h-[70px] flex items-center justify-between px-6 bg-black border-b border-white sticky top-0 z-10">
        <button
          onClick={() => setOpen(false)}
          className="inline-flex items-center gap-2 bg-black border border-white px-4 py-2 rounded-full text-sm font-bold text-white cursor-pointer hover:bg-white hover:text-black transition-colors"
        >
          ← Back
        </button>
        <p className="text-base font-black text-white">Padosi <span className="underline decoration-2 underline-offset-2">Services</span></p>
        <div className="w-20" />
      </div>

      {/* Hero */}
      <div className="bg-white text-black py-14 px-6 text-center">
        <h1 className="text-5xl font-black">Serve</h1>
        <p className="mt-2.5 text-sm opacity-70 max-w-md mx-auto">
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
                className="bg-black border border-white rounded-2xl py-5 px-3 flex flex-col items-center gap-3 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:-translate-y-1 hover:bg-white hover:shadow-[0_15px_35px_rgba(255,255,255,0.15)] transition-all group"
              >
                <span className="w-12 h-12 rounded-full border border-white text-white flex items-center justify-center text-2xl group-hover:border-black group-hover:text-black transition-colors">{cat.icon}</span>
                <span className="text-xs font-bold text-white text-center leading-tight group-hover:text-black transition-colors">{cat.label}</span>
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
    <div className="fixed inset-0 z-[5000] bg-black flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="h-[70px] flex items-center justify-between px-6 bg-black border-b border-white flex-shrink-0">
        <button
          onClick={() => setOpen(false)}
          className="inline-flex items-center gap-2 bg-black border border-white px-4 py-2 rounded-full text-sm font-bold text-white cursor-pointer hover:bg-white hover:text-black transition-colors"
        >
          ← Back
        </button>
        <p className="text-base font-black text-white">Padosi <span className="underline decoration-2 underline-offset-2">Ride Share</span></p>
        <button
          onClick={() => {
            if (!currentUser) { showToast("👋 Please log in to post a route."); return; }
            openForm(null);
          }}
          className="inline-flex items-center gap-2 bg-white text-black border border-white px-5 py-2 rounded-full text-sm font-bold cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,255,255,0.2)] transition-all"
        >
          + Post a Route
        </button>
      </div>

      {/* ── Search ── */}
      <div className="px-6 py-4 max-w-[600px] mx-auto w-full">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search routes, e.g. Vaishali to MI Road…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white bg-black text-white placeholder-white/40 text-sm focus:outline-none focus:ring-1 focus:ring-white shadow-sm transition-colors"
          />
        </div>
      </div>

      {/* ── Route Cards ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1200px] mx-auto">
          {filtered.length === 0 ? (
            <div className="col-span-3 text-center py-16 flex flex-col items-center gap-3">
              <span className="text-5xl">🛣️</span>
              <strong className="text-white/40 text-base">
                {search ? "No routes match your search." : "No routes posted yet."}
              </strong>
              <span className="text-sm text-white/30">
                {search ? "Try a different keyword." : "Be the first — post your route!"}
              </span>
            </div>
          ) : filtered.map(r => {
            const isOwner = r.posterId === currentUser?.id;
            const freqLabel = r.freq === "7" ? "Daily" : `${r.freq}× a week`;
            return (
              <div
                key={r.id}
                className="bg-black rounded-2xl border border-white shadow-[0_6px_24px_rgba(0,0,0,0.6)] p-5 flex flex-col gap-3.5 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(255,255,255,0.1)] transition-all"
              >
                {/* Route from → to */}
                <div className="flex items-center gap-2.5">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    <span className="w-0.5 h-5 bg-white/30" />
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{r.from}</p>
                    <p className="text-xs text-white/50 mt-2 truncate">{r.to}</p>
                  </div>
                  {isOwner && (
                    <span className="text-xs font-bold border border-white text-white px-2.5 py-0.5 rounded-full flex-shrink-0">
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
                      className="inline-flex items-center gap-1 border border-white/40 rounded-lg px-2.5 py-1 text-xs font-semibold text-white/70"
                    >
                      {icon} {text}
                    </span>
                  ))}
                </div>

                {r.desc && (
                  <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">{r.desc}</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/20 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full border border-white text-white text-xs font-bold flex items-center justify-center">
                      {r.posterInitials}
                    </span>
                    <span className="text-xs font-semibold text-white/70">{r.posterName}</span>
                  </div>

                  {isOwner ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openForm(r)}
                        className="text-xs border border-white text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer bg-black hover:bg-white hover:text-black transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => { setRoutes(p => p.filter(x => x.id !== r.id)); showToast("🗑️ Route removed"); }}
                        className="text-xs border border-white/40 text-white/50 px-3 py-1.5 rounded-lg font-bold cursor-pointer bg-black hover:border-white hover:text-white transition-colors"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">
                        {r.price > 0 ? `₹${r.price}` : "Free"}
                        <span className="text-xs font-normal text-white/40">/seat</span>
                      </span>
                      <button
                        onClick={() => {
                          if (!currentUser) { showToast("👋 Please log in first."); return; }
                          showToast("💬 Chat coming soon! Route by " + r.posterName);
                        }}
                        className="text-xs border border-white bg-black text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer hover:bg-white hover:text-black transition-colors"
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
        <div className="absolute inset-0 z-10 bg-black flex flex-col">

          {/* Form header */}
          <div className="h-[70px] flex items-center justify-between px-6 bg-black border-b border-white flex-shrink-0">
            <button
              onClick={() => { setFormOpen(false); resetForm(); }}
              className="inline-flex items-center gap-2 bg-black border border-white px-4 py-2 rounded-full text-sm font-bold text-white cursor-pointer hover:bg-white hover:text-black transition-colors"
            >
              ← Back
            </button>
            <p className="text-base font-black text-white">Post a <span className="underline decoration-2 underline-offset-2">Route</span></p>
            <div className="w-20" />
          </div>

          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

            {/* Map pane */}
            <div className="flex-1 relative bg-black min-h-[200px]">
              {mapSrc && (
                <iframe src={mapSrc} className="w-full h-full border-none" allowFullScreen loading="lazy" />
              )}
              {mapHidden && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
                  <span className="text-5xl text-white/20">🗺️</span>
                  <p className="text-sm text-white/30 text-center max-w-[180px] leading-snug">
                    Enter your route to preview it on the map
                  </p>
                </div>
              )}
            </div>

            {/* Form pane */}
            <div className="w-full md:w-[400px] flex-shrink-0 bg-black border-l border-white overflow-y-auto p-7">
              <h2 className="text-xl font-black text-white mb-1">
                {editingRoute ? "Edit your route" : "Your route details"}
              </h2>
              <p className="text-xs text-white/40 mb-6">
                Share your regular trip so neighbours can ride along.
              </p>

              {/* From / To inputs */}
              {[
                { label: "🟢 From", id: "rideFrom", val: from, set: setFrom, placeholder: "Starting point, e.g. Vaishali Nagar" },
                { label: "📍 To",   id: "rideTo",   val: to,   set: setTo,   placeholder: "Destination, e.g. MI Road" },
              ].map(({ label, id, val, set, placeholder }) => (
                <div key={id} className="mb-4">
                  <label className="text-xs font-bold text-white/60 mb-2 block">{label}</label>
                  <input
                    value={val}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-3 rounded-xl border border-white text-sm bg-black text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white transition-colors"
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
                className="w-full py-3 rounded-xl border border-white bg-black text-sm font-bold text-white cursor-pointer hover:bg-white hover:text-black transition-colors mb-5"
              >
                🗺️ Preview on Map
              </button>

              <hr className="border-white/20 my-5" />

              {/* Frequency selector */}
              <div className="mb-4">
                <label className="text-xs font-bold text-white/60 mb-2 block">📅 Times per week</label>
                <div className="flex gap-2 flex-wrap">
                  {["1","2","3","4","5","6","7"].map(v => (
                    <button
                      key={v}
                      onClick={() => setFreq(v)}
                      className={`px-3 py-2 rounded-xl border text-sm font-bold cursor-pointer transition-colors ${
                        freq === v
                          ? "bg-white border-white text-black"
                          : "border-white/40 bg-black text-white/60 hover:border-white hover:text-white"
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
                  <label className="text-xs font-bold text-white/60 mb-2 block">🕐 Departs at</label>
                  <input
                    type="time"
                    value={deptTime}
                    onChange={e => setDeptTime(e.target.value)}
                    style={{ colorScheme: "dark" }}
                    className="w-full px-3.5 py-3 rounded-xl border border-white text-sm bg-black text-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/60 mb-2 block">👥 Seats available</label>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      onClick={() => setSeats(s => Math.max(1, s - 1))}
                      className="w-8 h-8 rounded-full border border-white bg-black text-lg font-bold text-white flex items-center justify-center cursor-pointer hover:bg-white hover:text-black transition-colors"
                    >−</button>
                    <span className="text-xl font-black text-white min-w-[20px] text-center">{seats}</span>
                    <button
                      onClick={() => setSeats(s => Math.min(8, s + 1))}
                      className="w-8 h-8 rounded-full border border-white bg-black text-lg font-bold text-white flex items-center justify-center cursor-pointer hover:bg-white hover:text-black transition-colors"
                    >+</button>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <label className="text-xs font-bold text-white/60 mb-2 block">₹ Price per seat</label>
                <input
                  type="number"
                  value={priceVal}
                  onChange={e => setPriceVal(e.target.value)}
                  placeholder="e.g. 50"
                  min="0"
                  className="w-full px-3.5 py-3 rounded-xl border border-white text-sm bg-black text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="text-xs font-bold text-white/60 mb-2 block">📝 Description</label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value.slice(0, 400))}
                  placeholder="e.g. I drive to Malviya Nagar every morning around 8 AM, AC car, non-smoker, happy to drop anyone along the route."
                  rows={4}
                  className="w-full px-3.5 py-3 rounded-xl border border-white text-sm bg-black text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white transition-colors resize-y leading-relaxed"
                />
                <p className="text-xs text-white/30 text-right mt-1">{desc.length} / 400</p>
              </div>

              {formError && (
                <p className="text-white text-sm font-semibold mb-3 border border-white/40 rounded-xl px-3 py-2 bg-white/5">{formError}</p>
              )}

              <button
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl bg-white text-black text-sm font-bold cursor-pointer border border-white hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,255,255,0.2)] transition-all"
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