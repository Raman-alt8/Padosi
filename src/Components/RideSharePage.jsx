import { useState, useEffect, useCallback } from "react";

// Base URL for API calls — Vite exposes VITE_API_URL from .env
const API_BASE = import.meta.env.VITE_API_URL || "";

function initials(name = "") {
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Ride Share Page ─────────────────────────────────────────────────────────
// Opens when the window event "padosi:openRide" is dispatched.
// Props:
//   currentUser  — { id, ... } object from your auth state (or null)
//   showToast    — (msg: string) => void
//   dark         — boolean
export default function RideSharePage({ currentUser, showToast, dark }) {
  const [open, setOpen]           = useState(false);
  const [formOpen, setFormOpen]   = useState(false);
  const [routes, setRoutes]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");
  const [editingRoute, setEditingRoute] = useState(null);

  // Form fields
  const [seats, setSeats]         = useState(1);
  const [freq, setFreq]           = useState("");
  const [from, setFrom]           = useState("");
  const [to, setTo]               = useState("");
  const [deptTime, setDeptTime]   = useState("");
  const [priceVal, setPriceVal]   = useState("");
  const [desc, setDesc]           = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Map
  const [mapSrc, setMapSrc]       = useState("");
  const [mapHidden, setMapHidden] = useState(true);

  // ── Open / close ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("padosi:openRide", handler);
    return () => window.removeEventListener("padosi:openRide", handler);
  }, []);

  // ── Fetch all routes from the API ───────────────────────────────────────────
  const fetchRoutes = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ride-routes`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load routes");
      const data = await res.json();
      setRoutes(data.routes || []);
    } catch (err) {
      console.error(err);
      showToast("⚠️ Could not load routes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentUser, showToast]);

  // Fetch whenever the page opens
  useEffect(() => {
    if (open) fetchRoutes();
  }, [open, fetchRoutes]);

  // If any routes come back with my_response='accepted' but no contact info yet,
  // re-fetch the contact so the panel shows correctly on reload.
  useEffect(() => {
    routes.forEach(r => {
      if (r.my_response === "accepted" && !r.poster_contact) {
        fetch(`${API_BASE}/api/ride-routes/${r.id}/accept`, {
          method: "POST",
          credentials: "include",
        })
          .then(res => res.json())
          .then(data => {
            if (data.poster) {
              setRoutes(prev => prev.map(x =>
                x.id === r.id ? { ...x, poster_contact: data.poster } : x
              ));
            }
          })
          .catch(() => {});
      }
    });
  }, [routes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const resetForm = () => {
    setFrom(""); setTo(""); setFreq(""); setDeptTime(""); setPriceVal("");
    setDesc(""); setSeats(1); setFormError(""); setMapSrc(""); setMapHidden(true);
    setEditingRoute(null);
  };

  const openForm = (route = null) => {
    if (route) {
      setEditingRoute(route);
      setFrom(route.from_place);
      setTo(route.to_place);
      setFreq(route.freq);
      setDeptTime(route.depart_time);
      setPriceVal(String(route.price ?? ""));
      setDesc(route.description);
      setSeats(route.seats);
      const q = encodeURIComponent(`${route.from_place} to ${route.to_place} India`);
      setMapSrc(`https://maps.google.com/maps?q=${q}&z=13&output=embed`);
      setMapHidden(false);
    } else {
      resetForm();
    }
    setFormOpen(true);
  };

  // ── Submit (create or edit) ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!from)     { setFormError("⚠️ Please enter a starting point.");          return; }
    if (!to)       { setFormError("⚠️ Please enter a destination.");             return; }
    if (!freq)     { setFormError("⚠️ Please select how many times a week.");    return; }
    if (!deptTime) { setFormError("⚠️ Please enter your usual departure time."); return; }
    if (!desc)     { setFormError("⚠️ Please add a short description.");         return; }

    setSubmitting(true);
    setFormError("");

    const payload = {
      from_place:  from,
      to_place:    to,
      freq,
      depart_time: deptTime,
      seats,
      price:       Number(priceVal) || 0,
      description: desc,
    };

    try {
      const url    = editingRoute
        ? `${API_BASE}/api/ride-routes/${editingRoute.id}`
        : `${API_BASE}/api/ride-routes`;
      const method = editingRoute ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Something went wrong."); return; }

      if (editingRoute) {
        setRoutes(prev => prev.map(r => r.id === editingRoute.id ? data.route : r));
        showToast("✏️ Route updated");
      } else {
        setRoutes(prev => [data.route, ...prev]);
        showToast("🚗 Route posted!");
      }

      setFormOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setFormError("⚠️ Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Accept ──────────────────────────────────────────────────────────────────
  const handleAccept = async (routeId) => {
    try {
      const res = await fetch(`${API_BASE}/api/ride-routes/${routeId}/accept`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { showToast(`⚠️ ${data.error}`); return; }
      setRoutes(prev => prev.map(r =>
        r.id === routeId
          ? { ...r, my_response: "accepted", poster_contact: data.poster }
          : r
      ));
    } catch (err) {
      console.error(err);
      showToast("⚠️ Network error. Please try again.");
    }
  };

  // ── Decline ─────────────────────────────────────────────────────────────────
  const handleDecline = async (routeId) => {
    try {
      const res = await fetch(`${API_BASE}/api/ride-routes/${routeId}/decline`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) { const d = await res.json(); showToast(`⚠️ ${d.error}`); return; }
      setRoutes(prev => prev.filter(r => r.id !== routeId));
    } catch (err) {
      console.error(err);
      showToast("⚠️ Network error. Please try again.");
    }
  };

  // ── Hide an accepted route from this user's screen (local only) ─────────────
  const handleHideAccepted = (routeId) => {
    setRoutes(prev => prev.filter(r => r.id !== routeId));
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (routeId) => {
    try {
      const res = await fetch(`${API_BASE}/api/ride-routes/${routeId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(`⚠️ ${data.error || "Could not remove route."}`);
        return;
      }
      setRoutes(prev => prev.filter(r => r.id !== routeId));
      showToast("🗑️ Route removed");
    } catch (err) {
      console.error(err);
      showToast("⚠️ Network error. Please try again.");
    }
  };

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filtered = routes.filter(r => {
    const q = search.toLowerCase();
    return !q
      || r.from_place.toLowerCase().includes(q)
      || r.to_place.toLowerCase().includes(q)
      || r.description.toLowerCase().includes(q);
  });

  // ── Shared input class ───────────────────────────────────────────────────────
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
        {loading && (
          <div className="flex justify-center items-center py-20">
            <span className={`text-sm animate-pulse ${dark ? "text-white/40" : "text-[#bbb]"}`}>
              Loading routes…
            </span>
          </div>
        )}

        {!loading && (
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
              const isOwner   = r.poster_id === currentUser?.id;
              const freqLabel = r.freq === "7" ? "Daily" : `${r.freq}× a week`;

              return (
                <div
                  key={r.id}
                  className={`relative rounded-2xl border p-5 flex flex-col gap-3.5 hover:-translate-y-1 transition-all ${
                    dark
                      ? "bg-black border-white shadow-[0_6px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(255,255,255,0.1)]"
                      : "bg-white border-[#eee] shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
                  }`}
                >
                  {/* Close button — only on accepted routes */}
                  {!isOwner && r.my_response === "accepted" && (
                    <button
                      onClick={() => handleHideAccepted(r.id)}
                      aria-label="Remove this route from your view"
                      title="Remove from view"
                      className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-colors z-10 ${
                        dark
                          ? "text-white/50 hover:text-white hover:bg-white/10"
                          : "text-[#bbb] hover:text-[#777] hover:bg-[#f0f0f0]"
                      }`}
                    >
                      ✕
                    </button>
                  )}

                  {/* Route from → to */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${dark ? "bg-white" : "bg-[#ff2d55]"}`} />
                      <span className={`w-0.5 h-5 ${dark ? "bg-white/30" : "bg-[#eee]"}`} />
                      <span className={`w-2.5 h-2.5 rounded-full border-2 ${dark ? "border-white" : "border-[#ff2d55]"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${dark ? "text-white" : "text-[#111]"}`}>{r.from_place}</p>
                      <p className={`text-xs mt-2 truncate ${dark ? "text-white/50" : "text-[#999]"}`}>{r.to_place}</p>
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
                      { icon: "🕐", text: r.depart_time || "—" },
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

                  {r.description && (
                    <p className={`text-xs line-clamp-2 leading-relaxed ${dark ? "text-white/50" : "text-[#999]"}`}>
                      {r.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div className={`pt-3 border-t ${dark ? "border-white/20" : "border-[#eee]"}`}>

                    {/* Poster row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-full border text-xs font-bold flex items-center justify-center ${
                          dark ? "border-white text-white" : "border-[#ddd] text-[#555] bg-[#f6f7fb]"
                        }`}>
                          {initials(r.poster_name || "")}
                        </span>
                        <span className={`text-xs font-semibold ${dark ? "text-white/70" : "text-[#777]"}`}>
                          {r.poster_name}
                        </span>
                      </div>
                      <span className={`text-sm font-black ${dark ? "text-white" : "text-[#111]"}`}>
                        {r.price > 0 ? `₹${r.price}` : "Free"}
                        <span className={`text-xs font-normal ${dark ? "text-white/40" : "text-[#bbb]"}`}>/seat</span>
                      </span>
                    </div>

                    {/* Actions */}
                    {isOwner ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openForm(r)}
                          className={`flex-1 text-xs py-2 rounded-xl font-bold cursor-pointer border transition-colors ${
                            dark
                              ? "border-white text-white bg-black hover:bg-white hover:text-black"
                              : "border-[#ddd] text-[#555] bg-white hover:border-[#ff2d55] hover:text-[#ff2d55]"
                          }`}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className={`flex-1 text-xs py-2 rounded-xl font-bold cursor-pointer border transition-colors ${
                            dark
                              ? "border-white/40 text-white/50 bg-black hover:border-white hover:text-white"
                              : "border-[#eee] text-[#bbb] bg-white hover:border-[#ddd] hover:text-[#999]"
                          }`}
                        >
                          🗑️ Remove
                        </button>
                      </div>

                    ) : r.my_response === "accepted" ? (
                      <div className={`rounded-xl p-3 border flex flex-col gap-2 ${
                        dark ? "bg-white/5 border-white/20" : "bg-[#f0fff4] border-[#b2f5c8]"
                      }`}>
                        <p className={`text-xs font-bold ${dark ? "text-white/60" : "text-[#27ae60]"}`}>
                          ✅ Accepted — contact the poster
                        </p>
                        <a
                          href={`mailto:${r.poster_contact?.email || ""}?subject=Ride Share — ${r.from_place} to ${r.to_place}`}
                          className={`inline-flex items-center justify-center gap-2 text-xs font-bold py-2 px-3 rounded-lg border transition-colors ${
                            dark
                              ? "border-white text-white hover:bg-white hover:text-black"
                              : "border-[#ddd] text-[#555] bg-white hover:border-[#ff2d55] hover:text-[#ff2d55]"
                          }`}
                        >
                          ✉️ Email {r.poster_contact?.name?.split(" ")[0] || "poster"}
                        </a>
                        {r.poster_contact?.phone && (
                          <a
                            href={`tel:${r.poster_contact.phone}`}
                            className={`inline-flex items-center justify-center gap-2 text-xs font-bold py-2 px-3 rounded-lg border transition-colors ${
                              dark
                                ? "border-white/40 text-white/70 hover:border-white hover:text-white"
                                : "border-[#ddd] text-[#555] bg-white hover:border-[#27ae60] hover:text-[#27ae60]"
                            }`}
                          >
                            📞 {r.poster_contact.phone}
                          </a>
                        )}
                      </div>

                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDecline(r.id)}
                          className={`flex-1 text-xs py-2.5 rounded-xl font-bold cursor-pointer border transition-colors ${
                            dark
                              ? "border-white/40 text-white/60 bg-black hover:border-white hover:text-white"
                              : "border-[#eee] text-[#aaa] bg-white hover:border-[#ddd] hover:text-[#999]"
                          }`}
                        >
                          ✕ Decline
                        </button>
                        <button
                          onClick={() => handleAccept(r.id)}
                          className={`flex-1 text-xs py-2.5 rounded-xl font-bold cursor-pointer border transition-all hover:-translate-y-0.5 ${
                            dark
                              ? "border-white bg-white text-black hover:shadow-[0_6px_20px_rgba(255,255,255,0.2)]"
                              : "border-[#ff2d55] bg-[#ff2d55] text-white hover:bg-[#e0002b] hover:shadow-[0_6px_20px_rgba(255,45,85,0.25)]"
                          }`}
                        >
                          ✓ Accept
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Post / Edit form ── */}
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
              {editingRoute ? "Edit " : "Post a "}
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
                  const q = encodeURIComponent(`${from} to ${to} India`);
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
                  placeholder="e.g. 50  (leave blank for free)"
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
                disabled={submitting}
                className={`w-full py-4 rounded-2xl text-sm font-bold cursor-pointer border transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 ${
                  dark
                    ? "bg-white text-black border-white hover:shadow-[0_8px_24px_rgba(255,255,255,0.2)]"
                    : "bg-[#ff2d55] text-white border-[#ff2d55] hover:shadow-[0_8px_24px_rgba(255,45,85,0.25)] hover:bg-[#e0002b]"
                }`}
              >
                {submitting
                  ? "Saving…"
                  : editingRoute ? "💾 Save Changes" : "🚗 Post Route"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
