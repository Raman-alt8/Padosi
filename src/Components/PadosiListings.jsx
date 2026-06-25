import { useState, useEffect } from "react";

// ─── Padosi Listings Tab ───────────────────────────────────────────────────
// Now fully theme-aware: passes `dark` prop through all sub-components so
// light mode follows Padosi's standard palette (white bg, #111 text, #ff2d55
// accent) and dark mode keeps the all-black / white-border treatment.

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

// ─── Theme helpers ─────────────────────────────────────────────────────────
// Centralised so every sub-component derives from the same source of truth.
function t(dark, darkCls, lightCls) {
  return dark ? darkCls : lightCls;
}

// ─── Listings Grid (the visible tab) ───────────────────────────────────────
function ListingsGrid({ showToast, dark }) {
  const tiles = [
    { icon: "🚗", label: "Rent a Vehicle",   action: () => showToast("🚗 Rent a Vehicle — coming soon!") },
    { icon: "🎟️", label: "Buy Ticket",       action: () => showToast("🎟️ Buy Ticket — coming soon!") },
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

// ─── Service Listings Page ─────────────────────────────────────────────────
function ServiceListingsPage({ onSelectCategory, dark }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("padosi:openServices", handler);
    return () => window.removeEventListener("padosi:openServices", handler);
  }, []);

  return (
    <div className={`fixed inset-0 z-[5000] flex flex-col overflow-y-auto transition-opacity duration-300 ${
      dark ? "bg-black" : "bg-[#f6f7fb]"
    } ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>

      {/* Header */}
      <div className={`h-[70px] flex items-center justify-between px-6 sticky top-0 z-10 border-b ${
        dark ? "bg-black border-white" : "bg-white border-[#eee]"
      }`}>
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
          <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>
            Services
          </span>
        </p>
        <div className="w-20" />
      </div>

      {/* Hero */}
      <div className={`py-14 px-6 text-center ${
        dark ? "bg-white text-black" : "bg-[#ff2d55] text-white"
      }`}>
        <h1 className="text-5xl font-black">Serve</h1>
        <p className={`mt-2.5 text-sm max-w-md mx-auto ${dark ? "opacity-70" : "opacity-90"}`}>
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
                className={`rounded-2xl py-5 px-3 flex flex-col items-center gap-3 cursor-pointer transition-all hover:-translate-y-1 group border ${
                  dark
                    ? "bg-black border-white shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:bg-white hover:shadow-[0_15px_35px_rgba(255,255,255,0.15)]"
                    : "bg-white border-[#eee] shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:bg-[#ff2d55] hover:border-[#ff2d55] hover:shadow-[0_12px_28px_rgba(255,45,85,0.18)]"
                }`}
              >
                <span className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border transition-colors ${
                  dark
                    ? "border-white text-white group-hover:border-black group-hover:text-black"
                    : "border-[#ddd] text-[#555] group-hover:border-white group-hover:text-white"
                }`}>
                  {cat.icon}
                </span>
                <span className={`text-xs font-bold text-center leading-tight transition-colors ${
                  dark
                    ? "text-white group-hover:text-black"
                    : "text-[#333] group-hover:text-white"
                }`}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ride Share Page ───────────────────────────────────────────────────────
function RideSharePage({ currentUser, showToast, dark }) {
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
    const q = search.toLowerCase();
    return !q || r.from.toLowerCase().includes(q) || r.to.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q);
  });

  // Shared input classes
  const inputCls = `w-full px-3.5 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
    dark
      ? "bg-black border-white text-white placeholder-white/30 focus:ring-1 focus:ring-white"
      : "bg-white border-[#ddd] text-[#111] placeholder-[#aaa] focus:border-[#ff2d55]"
  }`;

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[5000] flex flex-col overflow-hidden ${dark ? "bg-black" : "bg-[#f6f7fb]"}`}>

      {/* ── Header ── */}
      <div className={`h-[70px] flex items-center justify-between px-6 flex-shrink-0 border-b ${
        dark ? "bg-black border-white" : "bg-white border-[#eee]"
      }`}>
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
          <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>
            Ride Share
          </span>
        </p>
        <button
          onClick={() => {
            if (!currentUser) { showToast("👋 Please log in to post a route."); return; }
            openForm(null);
          }}
          className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold cursor-pointer border transition-all hover:-translate-y-0.5 ${
            dark
              ? "bg-white text-black border-white hover:shadow-[0_8px_24px_rgba(255,255,255,0.2)]"
              : "bg-[#ff2d55] text-white border-[#ff2d55] hover:shadow-[0_8px_24px_rgba(255,45,85,0.25)]"
          }`}
        >
          + Post a Route
        </button>
      </div>

      {/* ── Search ── */}
      <div className="px-6 py-4 max-w-[600px] mx-auto w-full">
        <div className="relative">
          <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm ${dark ? "text-white/40" : "text-[#bbb]"}`}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search routes, e.g. Vaishali to MI Road…"
            className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm focus:outline-none transition-colors ${
              dark
                ? "bg-black border-white text-white placeholder-white/40 focus:ring-1 focus:ring-white"
                : "bg-white border-[#ddd] text-[#111] placeholder-[#aaa] focus:border-[#ff2d55] shadow-sm"
            }`}
          />
        </div>
      </div>

      {/* ── Route Cards ── */}
      <div className="flex-1 overflow-y-auto px-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1200px] mx-auto">
          {filtered.length === 0 ? (
            <div className="col-span-3 text-center py-16 flex flex-col items-center gap-3">
              <span className="text-5xl">🛣️</span>
              <strong className={`text-base ${dark ? "text-white/40" : "text-[#bbb]"}`}>
                {search ? "No routes match your search." : "No routes posted yet."}
              </strong>
              <span className={`text-sm ${dark ? "text-white/30" : "text-[#ccc]"}`}>
                {search ? "Try a different keyword." : "Be the first — post your route!"}
              </span>
            </div>
          ) : filtered.map(r => {
            const isOwner = r.posterId === currentUser?.id;
            const freqLabel = r.freq === "7" ? "Daily" : `${r.freq}× a week`;
            return (
              <div
                key={r.id}
                className={`rounded-2xl border p-5 flex flex-col gap-3.5 hover:-translate-y-1 transition-all ${
                  dark
                    ? "bg-black border-white shadow-[0_6px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(255,255,255,0.1)]"
                    : "bg-white border-[#eee] shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
                }`}
              >
                {/* Route from → to */}
                <div className="flex items-center gap-2.5">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${dark ? "bg-white" : "bg-[#ff2d55]"}`} />
                    <span className={`w-0.5 h-5 ${dark ? "bg-white/30" : "bg-[#eee]"}`} />
                    <span className={`w-2.5 h-2.5 rounded-full border-2 ${dark ? "border-white" : "border-[#ff2d55]"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${dark ? "text-white" : "text-[#111]"}`}>{r.from}</p>
                    <p className={`text-xs mt-2 truncate ${dark ? "text-white/50" : "text-[#999]"}`}>{r.to}</p>
                  </div>
                  {isOwner && (
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 border ${
                      dark
                        ? "border-white text-white"
                        : "border-[#ff2d55] text-[#ff2d55] bg-[#fff0f3]"
                    }`}>
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
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border ${
                        dark
                          ? "border-white/40 text-white/70"
                          : "border-[#eee] text-[#888] bg-[#f6f7fb]"
                      }`}
                    >
                      {icon} {text}
                    </span>
                  ))}
                </div>

                {r.desc && (
                  <p className={`text-xs line-clamp-2 leading-relaxed ${dark ? "text-white/50" : "text-[#999]"}`}>{r.desc}</p>
                )}

                {/* Footer */}
                <div className={`flex items-center justify-between pt-3 border-t gap-2 ${dark ? "border-white/20" : "border-[#eee]"}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-full border text-xs font-bold flex items-center justify-center ${
                      dark
                        ? "border-white text-white"
                        : "border-[#ddd] text-[#555] bg-[#f6f7fb]"
                    }`}>
                      {r.posterInitials}
                    </span>
                    <span className={`text-xs font-semibold ${dark ? "text-white/70" : "text-[#777]"}`}>{r.posterName}</span>
                  </div>

                  {isOwner ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openForm(r)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer border transition-colors ${
                          dark
                            ? "border-white text-white bg-black hover:bg-white hover:text-black"
                            : "border-[#ddd] text-[#555] bg-white hover:border-[#ff2d55] hover:text-[#ff2d55]"
                        }`}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => { setRoutes(p => p.filter(x => x.id !== r.id)); showToast("🗑️ Route removed"); }}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer border transition-colors ${
                          dark
                            ? "border-white/40 text-white/50 bg-black hover:border-white hover:text-white"
                            : "border-[#eee] text-[#bbb] bg-white hover:border-[#ddd] hover:text-[#999]"
                        }`}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${dark ? "text-white" : "text-[#111]"}`}>
                        {r.price > 0 ? `₹${r.price}` : "Free"}
                        <span className={`text-xs font-normal ${dark ? "text-white/40" : "text-[#bbb]"}`}>/seat</span>
                      </span>
                      <button
                        onClick={() => {
                          if (!currentUser) { showToast("👋 Please log in first."); return; }
                          showToast("💬 Chat coming soon! Route by " + r.posterName);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer border transition-colors ${
                          dark
                            ? "border-white bg-black text-white hover:bg-white hover:text-black"
                            : "border-[#ff2d55] bg-[#ff2d55] text-white hover:bg-[#e0002b] hover:border-[#e0002b]"
                        }`}
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
        <div className={`absolute inset-0 z-10 flex flex-col ${dark ? "bg-black" : "bg-[#f6f7fb]"}`}>

          {/* Form header */}
          <div className={`h-[70px] flex items-center justify-between px-6 flex-shrink-0 border-b ${
            dark ? "bg-black border-white" : "bg-white border-[#eee]"
          }`}>
            <button
              onClick={() => { setFormOpen(false); resetForm(); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
                dark
                  ? "bg-black border-white text-white hover:bg-white hover:text-black"
                  : "bg-white border-[#ddd] text-[#333] hover:border-[#ff2d55] hover:text-[#ff2d55]"
              }`}
            >
              ← Back
            </button>
            <p className={`text-base font-black ${dark ? "text-white" : "text-[#111]"}`}>
              Post a{" "}
              <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>
                Route
              </span>
            </p>
            <div className="w-20" />
          </div>

          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

            {/* Map pane */}
            <div className={`flex-1 relative min-h-[200px] ${dark ? "bg-black" : "bg-[#f0f1f5]"}`}>
              {mapSrc && (
                <iframe src={mapSrc} className="w-full h-full border-none" allowFullScreen loading="lazy" />
              )}
              {mapHidden && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <span className={`text-5xl ${dark ? "text-white/20" : "text-[#ccc]"}`}>🗺️</span>
                  <p className={`text-sm text-center max-w-[180px] leading-snug ${dark ? "text-white/30" : "text-[#bbb]"}`}>
                    Enter your route to preview it on the map
                  </p>
                </div>
              )}
            </div>

            {/* Form pane */}
            <div className={`w-full md:w-[400px] flex-shrink-0 overflow-y-auto p-7 border-l ${
              dark ? "bg-black border-white" : "bg-white border-[#eee]"
            }`}>
              <h2 className={`text-xl font-black mb-1 ${dark ? "text-white" : "text-[#111]"}`}>
                {editingRoute ? "Edit your route" : "Your route details"}
              </h2>
              <p className={`text-xs mb-6 ${dark ? "text-white/40" : "text-[#999]"}`}>
                Share your regular trip so neighbours can ride along.
              </p>

              {/* From / To */}
              {[
                { label: "🟢 From", val: from, set: setFrom, placeholder: "Starting point, e.g. Vaishali Nagar" },
                { label: "📍 To",   val: to,   set: setTo,   placeholder: "Destination, e.g. MI Road" },
              ].map(({ label, val, set, placeholder }) => (
                <div key={label} className="mb-4">
                  <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>{label}</label>
                  <input
                    value={val}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    className={inputCls}
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
                className={`w-full py-3 rounded-xl border text-sm font-bold cursor-pointer transition-colors mb-5 ${
                  dark
                    ? "border-white bg-black text-white hover:bg-white hover:text-black"
                    : "border-[#ddd] bg-white text-[#555] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                }`}
              >
                🗺️ Preview on Map
              </button>

              <hr className={`my-5 ${dark ? "border-white/20" : "border-[#eee]"}`} />

              {/* Frequency */}
              <div className="mb-4">
                <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>📅 Times per week</label>
                <div className="flex gap-2 flex-wrap">
                  {["1","2","3","4","5","6","7"].map(v => (
                    <button
                      key={v}
                      onClick={() => setFreq(v)}
                      className={`px-3 py-2 rounded-xl border text-sm font-bold cursor-pointer transition-colors ${
                        freq === v
                          ? dark
                            ? "bg-white border-white text-black"
                            : "bg-[#ff2d55] border-[#ff2d55] text-white"
                          : dark
                            ? "border-white/40 bg-black text-white/60 hover:border-white hover:text-white"
                            : "border-[#ddd] bg-white text-[#777] hover:border-[#ff2d55] hover:text-[#ff2d55]"
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
                  <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>🕐 Departs at</label>
                  <input
                    type="time"
                    value={deptTime}
                    onChange={e => setDeptTime(e.target.value)}
                    style={{ colorScheme: dark ? "dark" : "light" }}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>👥 Seats available</label>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      onClick={() => setSeats(s => Math.max(1, s - 1))}
                      className={`w-8 h-8 rounded-full border text-lg font-bold flex items-center justify-center cursor-pointer transition-colors ${
                        dark
                          ? "border-white bg-black text-white hover:bg-white hover:text-black"
                          : "border-[#ddd] bg-white text-[#555] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                      }`}
                    >−</button>
                    <span className={`text-xl font-black min-w-[20px] text-center ${dark ? "text-white" : "text-[#111]"}`}>{seats}</span>
                    <button
                      onClick={() => setSeats(s => Math.min(8, s + 1))}
                      className={`w-8 h-8 rounded-full border text-lg font-bold flex items-center justify-center cursor-pointer transition-colors ${
                        dark
                          ? "border-white bg-black text-white hover:bg-white hover:text-black"
                          : "border-[#ddd] bg-white text-[#555] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                      }`}
                    >+</button>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>₹ Price per seat</label>
                <input
                  type="number"
                  value={priceVal}
                  onChange={e => setPriceVal(e.target.value)}
                  placeholder="e.g. 50"
                  min="0"
                  className={inputCls}
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className={`text-xs font-bold mb-2 block ${dark ? "text-white/60" : "text-[#888]"}`}>📝 Description</label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value.slice(0, 400))}
                  placeholder="e.g. I drive to Malviya Nagar every morning around 8 AM, AC car, non-smoker, happy to drop anyone along the route."
                  rows={4}
                  className={`${inputCls} resize-y leading-relaxed`}
                />
                <p className={`text-xs text-right mt-1 ${dark ? "text-white/30" : "text-[#ccc]"}`}>{desc.length} / 400</p>
              </div>

              {formError && (
                <p className={`text-sm font-semibold mb-3 rounded-xl px-3 py-2 border ${
                  dark
                    ? "text-white border-white/40 bg-white/5"
                    : "text-[#ff2d55] border-[#ff2d55]/30 bg-[#fff0f3]"
                }`}>{formError}</p>
              )}

              <button
                onClick={handleSubmit}
                className={`w-full py-4 rounded-2xl text-sm font-bold cursor-pointer border transition-all hover:-translate-y-0.5 ${
                  dark
                    ? "bg-white text-black border-white hover:shadow-[0_8px_24px_rgba(255,255,255,0.2)]"
                    : "bg-[#ff2d55] text-white border-[#ff2d55] hover:shadow-[0_8px_24px_rgba(255,45,85,0.25)] hover:bg-[#e0002b]"
                }`}
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
// Now accepts `dark` prop — pass it from App.jsx alongside the existing props:
//   <PadosiListings showToast={showToast} currentUser={currentUser} onSelectCategory={…} dark={darkMode} />
export default function PadosiListings({ showToast, currentUser, onSelectCategory, dark = false }) {
  return (
    <>
      <ListingsGrid showToast={showToast} dark={dark} />
      <ServiceListingsPage onSelectCategory={onSelectCategory} dark={dark} />
      <RideSharePage currentUser={currentUser} showToast={showToast} dark={dark} />
    </>
  );
}