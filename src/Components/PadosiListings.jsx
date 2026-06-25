bash

cat > /mnt/user-data/outputs/PadosiListings.jsx << 'ENDOFFILE'
import { useState, useEffect } from "react";

// ─── Padosi Listings Tab ───────────────────────────────────────────────────
// Dark theme: pure #000 / #fff colour profile matching body.theme-dark CSS.

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
    // listings-section dark: bg:#000, border:1px solid #fff, box-shadow:none
    <div className="bg-black rounded-2xl border border-white p-6">
      {/* listings-title dark: color:#fff  |  span: color:#fff, text-decoration:underline */}
      <p className="text-lg font-black text-white mb-4">
        Padosi <span className="text-white underline">Listings</span>
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map(({ icon, label, action }) => (
          // quick-tab-item dark: bg:#000, border:1px solid #fff, box-shadow:none, hover:bg:#1a1a1a
          <button
            key={label}
            onClick={action}
            className="bg-black border border-white rounded-2xl p-5 flex flex-col items-center gap-2.5 cursor-pointer hover:bg-[#1a1a1a] transition-colors"
          >
            {/* quick-tab-icon dark: bg:#000, color:#fff, border:1px solid #fff */}
            <span className="w-12 h-12 rounded-full bg-black border border-white text-white flex items-center justify-center text-xl">
              {icon}
            </span>
            {/* quick-tab-label dark: color:#fff */}
            <span className="text-sm font-bold text-white text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Service Listings Page ─────────────────────────────────────────────────
function ServiceListingsPage({ onSelectCategory }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("padosi:openServices", handler);
    return () => window.removeEventListener("padosi:openServices", handler);
  }, []);

  return (
    // service-page dark: bg:#000
    <div className={`fixed inset-0 z-[5000] bg-black flex flex-col overflow-y-auto transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>

      {/* service-page-header dark: bg:#000, border-bottom-color:#fff */}
      <div className="h-[70px] flex items-center justify-between px-6 bg-black border-b border-white sticky top-0 z-10">
        {/* service-back-btn dark: bg:#000, color:#fff, border:1px solid #fff */}
        <button
          onClick={() => setOpen(false)}
          className="inline-flex items-center gap-2 bg-black border border-white px-4 py-2 rounded-full text-sm font-bold text-white cursor-pointer hover:bg-[#1a1a1a] transition-colors"
        >
          ← Back
        </button>
        {/* service-page-title dark: color:#fff  |  span: color:#fff, underline */}
        <p className="text-base font-black text-white">
          Padosi <span className="text-white underline">Services</span>
        </p>
        <div className="w-20" />
      </div>

      {/* serve-hero dark: bg:#000, border-bottom:1px solid #fff, color:#fff — NO gradient */}
      <div className="bg-black border-b border-white text-white py-14 px-6 text-center">
        <h1 className="text-5xl font-black">Serve</h1>
        <p className="mt-2.5 text-sm opacity-90 max-w-md mx-auto">
          Pick what you need help with — we'll get your task ready to post to neighbours nearby.
        </p>
      </div>

      <div className="flex justify-center px-6 pb-16">
        <div className="w-full max-w-[1100px] -mt-9">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {SERVICE_CATEGORIES.map((cat, i) => (
              // service-card dark: bg:#000, border:1px solid #fff, box-shadow:none, hover:bg:#1a1a1a
              <button
                key={i}
                onClick={() => { setOpen(false); onSelectCategory(cat); }}
                className="bg-black border border-white rounded-2xl py-5 px-3 flex flex-col items-center gap-3 cursor-pointer hover:bg-[#1a1a1a] transition-colors"
              >
                {/* service-card-icon dark: bg:#000, color:#fff, border:1px solid #fff */}
                <span className="w-12 h-12 rounded-full bg-black border border-white text-white flex items-center justify-center text-2xl">
                  {cat.icon}
                </span>
                {/* service-card-label dark: color:#fff */}
                <span className="text-xs font-bold text-white text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ride Share Page ──────────────────────────────────────────────────────
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

    const name  = currentUser?.full_name || "User";
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
    // service-page dark: bg:#000
    <div className="fixed inset-0 z-[5000] bg-black flex flex-col overflow-hidden">

      {/* ── Header ── service-page-header dark: bg:#000, border-bottom:#fff */}
      <div className="h-[70px] flex items-center justify-between px-6 bg-black border-b border-white flex-shrink-0">
        {/* service-back-btn dark: bg:#000, color:#fff, border:1px solid #fff */}
        <button
          onClick={() => setOpen(false)}
          className="inline-flex items-center gap-2 bg-black border border-white px-4 py-2 rounded-full text-sm font-bold text-white cursor-pointer hover:bg-[#1a1a1a] transition-colors"
        >
          ← Back
        </button>
        <p className="text-base font-black text-white">
          Padosi <span className="text-white underline">Ride Share</span>
        </p>
        {/* ride-post-btn dark: bg:#fff, color:#000 */}
        <button
          onClick={() => {
            if (!currentUser) { showToast("👋 Please log in to post a route."); return; }
            openForm(null);
          }}
          className="inline-flex items-center gap-2 bg-white text-black border-none px-5 py-2 rounded-full text-sm font-bold cursor-pointer hover:bg-gray-200 transition-colors"
        >
          + Post a Route
        </button>
      </div>

      {/* ── Search ── ride-search-input dark: bg:#000, border-color:#fff, color:#fff */}
      <div className="px-6 py-4 max-w-[600px] mx-auto w-full">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-sm">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search routes, e.g. Vaishali to MI Road…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-white bg-black text-white placeholder-[#555] text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* ── Route Cards ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1200px] mx-auto">
          {filtered.length === 0 ? (
            // ride-empty dark: icon color:#333, strong color:#666
            <div className="col-span-3 text-center py-16 flex flex-col items-center gap-3">
              <span className="text-5xl text-[#333]">🛣️</span>
              <strong className="text-[#666] text-base">
                {search ? "No routes match your search." : "No routes posted yet."}
              </strong>
              <span className="text-sm text-[#555]">
                {search ? "Try a different keyword." : "Be the first — post your route!"}
              </span>
            </div>
          ) : filtered.map(r => {
            const isOwner   = r.posterId === currentUser?.id;
            const freqLabel = r.freq === "7" ? "Daily" : `${r.freq}× a week`;
            return (
              // ride-card dark: bg:#000, border-color:#fff, box-shadow:none
              <div
                key={r.id}
                className="bg-black rounded-2xl border border-white p-5 flex flex-col gap-3.5 hover:bg-[#1a1a1a] transition-colors"
              >
                {/* Route from → to */}
                <div className="flex items-center gap-2.5">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1a9e4a]" />
                    {/* ride-dot-line dark: bg:#555 */}
                    <span className="w-0.5 h-5 bg-[#555]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff2d55]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* ride-card-from dark: color:#fff */}
                    <p className="text-sm font-bold text-white truncate">{r.from}</p>
                    {/* ride-card-to dark: color:#ccc */}
                    <p className="text-xs text-[#ccc] mt-2 truncate">{r.to}</p>
                  </div>
                  {/* ride-owner-badge dark: bg:#000, color:#fff, border:1px solid #fff */}
                  {isOwner && (
                    <span className="text-xs font-bold bg-black text-white border border-white px-2.5 py-0.5 rounded-full flex-shrink-0">
                      Your route
                    </span>
                  )}
                </div>

                {/* ride-chip dark: bg:#111, color:#fff, border:1px solid #fff */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: "📅", text: freqLabel },
                    { icon: "🕐", text: r.time || "—" },
                    { icon: "👥", text: `${r.seats} seat${r.seats > 1 ? "s" : ""}` },
                  ].map(({ icon, text }) => (
                    <span
                      key={text}
                      className="inline-flex items-center gap-1 bg-[#111] border border-white rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
                    >
                      {icon} {text}
                    </span>
                  ))}
                </div>

                {/* ride-card-desc dark: color:#ccc */}
                {r.desc && (
                  <p className="text-xs text-[#ccc] line-clamp-2 leading-relaxed">{r.desc}</p>
                )}

                {/* ride-card-footer dark: border-top-color:#333 */}
                <div className="flex items-center justify-between pt-3 border-t border-[#333] gap-2">
                  <div className="flex items-center gap-2">
                    {/* ride-card-avatar dark: bg:#222, color:#fff, border:1px solid #fff */}
                    <span className="w-7 h-7 rounded-full bg-[#222] border border-white text-white text-xs font-bold flex items-center justify-center">
                      {r.posterInitials}
                    </span>
                    {/* ride-card-poster-name dark: color:#fff */}
                    <span className="text-xs font-semibold text-white">{r.posterName}</span>
                  </div>

                  {isOwner ? (
                    <div className="flex gap-2">
                      {/* ride-edit-btn dark: bg:#000, color:#fff, border:1px solid #fff, hover:bg:#1a1a1a */}
                      <button
                        onClick={() => openForm(r)}
                        className="text-xs bg-black text-white border border-white px-3 py-1.5 rounded-lg font-bold cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      {/* ride-delete-btn dark: bg:#000, color:#fff, border:1px solid #fff, hover:bg:#1a1a1a */}
                      <button
                        onClick={() => { setRoutes(p => p.filter(x => x.id !== r.id)); showToast("🗑️ Route removed"); }}
                        className="text-xs bg-black text-white border border-white px-3 py-1.5 rounded-lg font-bold cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {/* ride-card-price: kept as red (not overridden in original dark CSS) */}
                      <span className="text-sm font-black text-[#ff2d55]">
                        {r.price > 0 ? `₹${r.price}` : "Free"}
                        <span className="text-xs font-normal text-[#999]">/seat</span>
                      </span>
                      {/* ride-card-contact-btn dark: bg:#fff, color:#000 */}
                      <button
                        onClick={() => {
                          if (!currentUser) { showToast("👋 Please log in first."); return; }
                          showToast("💬 Chat coming soon! Route by " + r.posterName);
                        }}
                        className="text-xs bg-white text-black px-3 py-1.5 rounded-lg font-bold cursor-pointer border-none hover:bg-gray-200 transition-colors"
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

      {/* ── Post / Edit Route Form Overlay ── */}
      {formOpen && (
        <div className="absolute inset-0 z-10 bg-black flex flex-col">

          {/* Form header */}
          <div className="h-[70px] flex items-center justify-between px-6 bg-black border-b border-white flex-shrink-0">
            <button
              onClick={() => { setFormOpen(false); resetForm(); }}
              className="inline-flex items-center gap-2 bg-black border border-white px-4 py-2 rounded-full text-sm font-bold text-white cursor-pointer hover:bg-[#1a1a1a] transition-colors"
            >
              ← Back
            </button>
            <p className="text-base font-black text-white">
              Post a <span className="text-white underline">Route</span>
            </p>
            <div className="w-20" />
          </div>

          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

            {/* Map pane — ride-map-placeholder dark: bg:#111, text color:#555 */}
            <div className="flex-1 relative bg-[#111] min-h-[200px]">
              {mapSrc && (
                <iframe src={mapSrc} className="w-full h-full border-none" allowFullScreen loading="lazy" />
              )}
              {mapHidden && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#111]">
                  <span className="text-5xl text-[#333]">🗺️</span>
                  <p className="text-sm text-[#555] text-center max-w-[180px] leading-snug">
                    Enter your route to preview it on the map
                  </p>
                </div>
              )}
            </div>

            {/* Form pane — ride-form-panel dark: bg:#000, border-left:1px solid #fff */}
            <div className="w-full md:w-[400px] flex-shrink-0 bg-black border-l border-white overflow-y-auto p-7">
              {/* ride-form-title dark: color:#fff */}
              <h2 className="text-xl font-black text-white mb-1">
                {editingRoute ? "Edit your route" : "Your route details"}
              </h2>
              {/* ride-form-sub dark: color:#ccc */}
              <p className="text-xs text-[#ccc] mb-6">
                Share your regular trip so neighbours can ride along.
              </p>

              {/* From / To — ride-label dark: color:#fff  |  ride-input dark: bg:#000, border-color:#fff, color:#fff */}
              {[
                { label: "🟢 From", id: "rideFrom", val: from, set: setFrom, placeholder: "Starting point, e.g. Vaishali Nagar" },
                { label: "📍 To",   id: "rideTo",   val: to,   set: setTo,   placeholder: "Destination, e.g. MI Road" },
              ].map(({ label, id, val, set, placeholder }) => (
                <div key={id} className="mb-4">
                  <label className="text-xs font-bold text-white mb-2 block">{label}</label>
                  <input
                    value={val}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-3 rounded-xl border border-white text-sm bg-black text-white placeholder-[#555] focus:outline-none transition-colors"
                  />
                </div>
              ))}

              {/* ride-map-preview-btn dark: bg:#000, border-color:#fff, color:#fff */}
              <button
                onClick={() => {
                  if (!from || !to) { showToast("⚠️ Enter both a starting point and destination first."); return; }
                  const q = encodeURIComponent(from + " to " + to + " Jaipur India");
                  setMapSrc(`https://maps.google.com/maps?q=${q}&z=13&output=embed`);
                  setMapHidden(false);
                }}
                className="w-full py-3 rounded-xl border border-white bg-black text-sm font-bold text-white cursor-pointer hover:bg-[#1a1a1a] transition-colors mb-5"
              >
                🗺️ Preview on Map
              </button>

              {/* ride-divider dark: border-top-color:#333 */}
              <hr className="border-[#333] my-5" />

              {/* Frequency — ride-freq-btn dark: bg:#000, border-color:#fff, color:#fff  |  active: bg:#fff, color:#000 */}
              <div className="mb-4">
                <label className="text-xs font-bold text-white mb-2 block">📅 Times per week</label>
                <div className="flex gap-2 flex-wrap">
                  {["1","2","3","4","5","6","7"].map(v => (
                    <button
                      key={v}
                      onClick={() => setFreq(v)}
                      className={`px-3 py-2 rounded-xl border text-sm font-bold cursor-pointer transition-colors ${
                        freq === v
                          ? "bg-white border-white text-black"
                          : "bg-black border-white text-white hover:bg-[#1a1a1a]"
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
                  <label className="text-xs font-bold text-white mb-2 block">🕐 Departs at</label>
                  {/* ride-input dark */}
                  <input
                    type="time"
                    value={deptTime}
                    onChange={e => setDeptTime(e.target.value)}
                    style={{ colorScheme: "dark" }}
                    className="w-full px-3.5 py-3 rounded-xl border border-white text-sm bg-black text-white focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white mb-2 block">👥 Seats available</label>
                  {/* ride-seat-btn dark: bg:#000, border:#fff, color:#fff  |  ride-seats-val dark: color:#fff */}
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      onClick={() => setSeats(s => Math.max(1, s - 1))}
                      className="w-8 h-8 rounded-full border border-white bg-black text-lg font-bold text-white flex items-center justify-center cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                    >−</button>
                    <span className="text-xl font-black text-white min-w-[20px] text-center">{seats}</span>
                    <button
                      onClick={() => setSeats(s => Math.min(8, s + 1))}
                      className="w-8 h-8 rounded-full border border-white bg-black text-lg font-bold text-white flex items-center justify-center cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                    >+</button>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <label className="text-xs font-bold text-white mb-2 block">₹ Price per seat</label>
                <input
                  type="number"
                  value={priceVal}
                  onChange={e => setPriceVal(e.target.value)}
                  placeholder="e.g. 50"
                  min="0"
                  className="w-full px-3.5 py-3 rounded-xl border border-white text-sm bg-black text-white placeholder-[#555] focus:outline-none transition-colors"
                />
              </div>

              {/* Description — ride-textarea dark: bg:#000, border:#fff, color:#fff  |  ride-char-count dark: color:#555 */}
              <div className="mb-4">
                <label className="text-xs font-bold text-white mb-2 block">📝 Description</label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value.slice(0, 400))}
                  placeholder="e.g. I drive to Malviya Nagar every morning around 8 AM, AC car, non-smoker, happy to drop anyone along the route."
                  rows={4}
                  className="w-full px-3.5 py-3 rounded-xl border border-white text-sm bg-black text-white placeholder-[#555] focus:outline-none transition-colors resize-y leading-relaxed"
                />
                <p className="text-xs text-[#555] text-right mt-1">{desc.length} / 400</p>
              </div>

              {formError && (
                <p className="text-[#ff2d55] text-sm font-semibold mb-3">{formError}</p>
              )}

              {/* ride-submit-btn dark: bg:#fff, color:#000, box-shadow:none */}
              <button
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl bg-white text-black text-sm font-bold cursor-pointer border-none hover:bg-gray-200 transition-colors"
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
