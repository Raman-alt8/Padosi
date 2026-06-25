import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_CHARS = 1000;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function api(method, path, body) {
  const opts = { method, credentials: "include", headers: {} };
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) throw new Error(`Server error (${res.status})`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T" + (timeStr || "00:00"));
  return (
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
    (timeStr ? " at " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "")
  );
}

function formatPostedDate(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    return (
      "Posted " +
      d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
      " at " +
      d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    );
  } catch { return ""; }
}

function renderStars(rating) {
  const full = Math.round(rating);
  return Array.from({ length: 5 }, (_, i) => (i < full ? "★" : "☆")).join("");
}

function initials(name = "") {
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-semibold z-[9999] pointer-events-none transition-all duration-300 ${
        message ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {message}
    </div>
  );
}

function useToast() {
  const [message, setMessage] = useState("");
  const timerRef = useRef(null);
  const showToast = useCallback((msg, duration = 2800) => {
    setMessage(msg);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMessage(""), duration);
  }, []);
  return [message, showToast];
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, children, maxWidth = "max-w-md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/45 z-[2000] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-white rounded-2xl p-9 w-full ${maxWidth} relative shadow-2xl`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-gray-400 hover:text-red-500 text-2xl leading-none bg-transparent border-none cursor-pointer"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

function ModalTag({ children }) {
  return (
    <span className="inline-block bg-red-50 text-red-500 text-xs font-semibold px-3 py-1 rounded-full mb-4">
      {children}
    </span>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ currentUser, onLogin, onSignup, onSignout, onManageAccount, onMyTasks, onActivity, showToast, darkMode, onToggleDark }) {
  const [dropOpen, setDropOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
        setThemeOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const name = (currentUser?.full_name || "User").trim();
  const first = name.split(" ")[0];
  const initial = name.charAt(0).toUpperCase();

  return (
    <nav className="h-[70px] flex justify-center sticky top-0 z-[1000] bg-white border-b border-gray-100">
      <div className="w-full max-w-[1300px] px-5 flex justify-between items-center relative">
        {/* Logo */}
        <button
          onClick={() => window.location.reload()}
          className="text-2xl font-black tracking-tight text-gray-900 bg-transparent border-none cursor-pointer"
        >
          Padosi
        </button>

        {/* Nav links */}
        <div className="flex gap-5 text-sm items-center">
          <button onClick={() => {}} className="text-gray-800 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer">About</button>
          <button onClick={() => {}} className="text-gray-800 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer">Help</button>

          {!currentUser && (
            <>
              <button onClick={onLogin} className="text-gray-800 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer">Log in</button>
              <button onClick={onSignup} className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold hover:-translate-y-0.5 transition-transform border-none cursor-pointer">
                Sign up
              </button>
            </>
          )}

          {currentUser && (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => { setDropOpen(o => !o); setThemeOpen(false); }}
                className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-full pl-2 pr-4 py-2 text-sm font-semibold hover:bg-gray-700 transition-colors border-none cursor-pointer"
              >
                <span className="w-7 h-7 rounded-full bg-gray-500 flex items-center justify-center text-xs font-bold text-white">
                  {initial}
                </span>
                {first}
                <span className={`text-[11px] transition-transform ${dropOpen ? "rotate-180" : ""}`}>▾</span>
              </button>

              {dropOpen && (
                <div className="absolute top-14 right-0 bg-white rounded-2xl shadow-2xl w-80 p-6 z-[1500] border border-gray-100">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-gray-900">{name}</h3>
                    <span className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-xl text-gray-400 font-bold">
                      {initial}
                    </span>
                  </div>

                  {/* Quick grid */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    {[
                      { icon: "❓", label: "Help" },
                      { icon: "💳", label: "Wallet", action: () => { setDropOpen(false); showToast("💳 Wallet — coming soon!"); } },
                      { icon: "✅", label: "Activity", action: () => { setDropOpen(false); onActivity(); } },
                    ].map(({ icon, label, action }) => (
                      <button
                        key={label}
                        onClick={action}
                        className="bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-xl p-3.5 flex flex-col items-center gap-2 text-xs font-semibold cursor-pointer border-none transition-colors"
                      >
                        <span className="text-lg">{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>

                  <hr className="border-gray-100 my-3.5" />

                  {[
                    { icon: "⚙️", label: "Manage account", action: () => { setDropOpen(false); onManageAccount(); } },
                    { icon: "📋", label: "My tasks", action: () => { setDropOpen(false); onMyTasks(); } },
                  ].map(({ icon, label, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="w-full flex items-center gap-3.5 px-1.5 py-3 text-sm font-medium text-gray-800 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer bg-transparent border-none text-left"
                    >
                      <span className="w-5 text-center text-gray-500">{icon}</span>
                      {label}
                    </button>
                  ))}

                  {/* Theme toggle */}
                  <button
                    onClick={() => setThemeOpen(o => !o)}
                    className="w-full flex items-center gap-3.5 px-1.5 py-3 text-sm font-medium text-gray-800 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer bg-transparent border-none text-left"
                  >
                    <span className="w-5 text-center text-gray-500">🎨</span>
                    Theme
                    <span className="ml-auto text-xs text-gray-400">{darkMode ? "Dark" : "Default"}</span>
                    <span className={`text-[11px] transition-transform ${themeOpen ? "rotate-180" : ""}`}>▾</span>
                  </button>
                  {themeOpen && (
                    <div className="flex flex-col gap-1 pl-2">
                      {["Default", "Dark"].map(t => (
                        <button
                          key={t}
                          onClick={() => { onToggleDark(t === "Dark"); setThemeOpen(false); showToast(`🎨 Theme set to ${t}`); }}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer border transition-colors ${
                            (t === "Dark") === darkMode
                              ? "border-red-500 bg-red-50 text-red-500"
                              : "border-transparent hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          {t === "Dark" ? "🌙" : "☀️"} {t}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => { setDropOpen(false); showToast("💸 Earn with Padosi — coming soon!"); }}
                    className="w-full flex items-center gap-3.5 px-1.5 py-3 text-sm font-medium text-gray-800 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer bg-transparent border-none text-left"
                  >
                    <span className="w-5 text-center text-gray-500">💰</span>
                    Earn with Padosi
                  </button>

                  <hr className="border-gray-100 my-3.5" />
                  <button
                    onClick={() => { setDropOpen(false); onSignout(); }}
                    className="w-full flex items-center gap-3.5 px-1.5 py-3 text-sm font-semibold text-red-500 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer bg-transparent border-none text-left"
                  >
                    <span className="w-5 text-center">🚪</span>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// ─── Nearby Task Card ─────────────────────────────────────────────────────────
function NearbyTaskCard({ task, showToast }) {
  const [state, setState] = useState("idle"); // idle | loading | accepted
  const [poster, setPoster] = useState(null);
  const [removing, setRemoving] = useState(false);

  const handleAccept = async () => {
    setState("loading");
    try {
      const data = await api("POST", `/api/tasks/${task.id}/offer`);
      setPoster(data.poster);
      setState("accepted");
      showToast("🙋 Offer sent!");
    } catch (err) {
      showToast("❌ " + err.message);
      setState("idle");
    }
  };

  const handleDecline = async () => {
    setRemoving(true);
    try { await api("POST", `/api/tasks/${task.id}/dismiss`); } catch {}
  };

  if (removing) return null;

  const modeLabel = task.mode === "now" ? "🟢 Now" : "🕒 Scheduled";

  return (
    <div className="bg-gray-100 rounded-xl p-2.5 mb-2.5 text-sm">
      <p className="font-semibold text-gray-900 mb-1.5 leading-snug break-words">{task.text}</p>
      <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
        <span className="bg-red-50 text-red-500 font-bold px-2 py-0.5 rounded-lg">₹{task.price}</span>
        <span>{modeLabel}</span>
      </div>

      {state !== "accepted" ? (
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={handleAccept}
            disabled={state === "loading"}
            className="flex-1 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-green-600 transition-colors disabled:opacity-60 cursor-pointer border-none"
          >
            {state === "loading" ? "Sending…" : "🤝 Accept"}
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer border-none"
          >
            ✕ Decline
          </button>
        </div>
      ) : (
        <div className="mt-2">
          <div className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5 mb-1.5">
            <span className="w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {poster?.initials || "U"}
            </span>
            {poster?.phone
              ? <span className="text-xs font-bold text-gray-900">+91 {poster.phone}</span>
              : <span className="text-xs text-gray-400 italic">No phone on file</span>
            }
          </div>
          <div className="flex gap-1.5">
            {poster?.phone && (
              <a href={`tel:${poster.phone}`} className="flex-1 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold text-center no-underline">📞 Call</a>
            )}
            <button
              onClick={() => {
                if (poster?.email) {
                  const sub = encodeURIComponent("Padosi — about your task");
                  window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(poster.email)}&su=${sub}`, "_blank", "noopener");
                } else {
                  showToast("💬 Chat — coming soon!");
                }
              }}
              className={`${poster?.phone ? "flex-1" : "w-full"} py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold cursor-pointer border-none hover:bg-gray-700 transition-colors`}
            >
              💬 Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Nearby Panel ─────────────────────────────────────────────────────────────
function NearbyPanel({ tasks, showToast }) {
  return (
    <div className="w-64 bg-white rounded-2xl p-4 shadow-xl max-h-[480px] overflow-y-auto flex-shrink-0">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-600 inline-block animate-pulse" />
        Nearby Tasks
      </div>
      {tasks.length === 0
        ? <p className="text-xs text-gray-400 text-center py-4">No nearby tasks right now.</p>
        : tasks.map(t => <NearbyTaskCard key={t.id} task={t} showToast={showToast} />)
      }
    </div>
  );
}

// ─── My Task Card ─────────────────────────────────────────────────────────────
function MyTaskCard({ task, onEdit, onDelete }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 mb-2.5 text-sm">
      <p className="font-semibold text-gray-900 leading-snug mb-1 break-words">
        {task.text}
        <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-lg ${task.accepted ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
          {task.accepted ? "Accepted" : "Pending"}
        </span>
      </p>
      <p className="text-xs text-gray-500 mt-1">
        ₹{task.price} • {task.mode === "now" ? "🟢 Now" : "🕒 " + formatDateTime(task.date, task.time)}
      </p>

      {task.accepted && task.helper && (
        <div className="mt-2 border border-gray-100 rounded-xl p-2.5">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {task.helper.initials}
            </span>
            <div>
              <p className="text-xs font-bold text-gray-900">{task.helper.name} ✅</p>
              <p className="text-xs text-yellow-500">{renderStars(task.helper.rating)} {task.helper.rating.toFixed(1)} ({task.helper.reviews})</p>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-600">{task.helper.phone}</span>
            <a href={`tel:${task.helper.phone?.replace(/\s/g, "")}`} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg no-underline font-bold">📞 Call</a>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-2 flex-wrap">
        <button onClick={() => onEdit(task)} className="bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-lg cursor-pointer border-none hover:bg-blue-100 transition-colors">Edit</button>
        <button onClick={() => onDelete(task.id)} className="bg-red-50 text-red-500 text-xs font-semibold px-3 py-1 rounded-lg cursor-pointer border-none hover:bg-red-100 transition-colors">Delete</button>
      </div>
    </div>
  );
}

// ─── Tasks Sidebar ────────────────────────────────────────────────────────────
function TasksSidebar({ tasks, visible, onEdit, onDelete }) {
  return (
    <div className={`transition-all duration-500 ease-in-out overflow-hidden flex-shrink-0 ${visible ? "w-[300px] min-w-[300px] opacity-100" : "w-0 min-w-0 opacity-0"}`}>
      <div className="w-[300px] px-5 pt-6 pb-6">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1">
          <span className="text-red-500">✅</span> My Tasks
        </h3>
        <p className="text-xs text-gray-400 mb-4">Track the tasks you've posted</p>
        <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto">
          {tasks.length === 0
            ? <p className="text-xs text-gray-400 text-center py-5">No tasks yet — post one to get started.</p>
            : tasks.map(t => <MyTaskCard key={t.id} task={t} onEdit={onEdit} onDelete={onDelete} />)
          }
        </div>
      </div>
    </div>
  );
}

// ─── Hero / Task Form ─────────────────────────────────────────────────────────
function HeroSection({ currentUser, tasks, setTasks, nearbyTasks, showToast, onRequireLogin, onServiceListings, onRideShare }) {
  const [taskText, setTaskText] = useState("");
  const [price, setPrice] = useState("");
  const [mode, setMode] = useState("now");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState("Change Location");
  const [showMap, setShowMap] = useState(false);
  const [mapSrc, setMapSrc] = useState("");
  const [mapLabel, setMapLabel] = useState("Detecting your location…");

  const today = new Date().toISOString().split("T")[0];

  const enterEditMode = useCallback((task) => {
    setEditingId(task.id);
    setTaskText(task.text);
    setPrice(String(task.price));
    if (task.mode === "later") {
      setMode("later");
      setDate(task.date || "");
      setTime(task.time || "");
    } else {
      setMode("now");
    }
  }, []);

  const exitEditMode = useCallback(() => {
    setEditingId(null);
    setTaskText("");
    setPrice("");
    setDate("");
    setTime("");
    setMode("now");
    setError("");
  }, []);

  const handleSubmit = async () => {
    if (!currentUser) { onRequireLogin(); return; }
    const text = taskText.trim();
    const p = Number(price.trim());
    if (!text) { setError("Please describe what you need help with."); return; }
    if (text.length > MAX_CHARS) { setError("Description too long."); return; }
    if (!p || p <= 0) { setError("Please enter a valid budget."); return; }
    if (mode === "later") {
      if (!date || !time) { setError("Please pick a date and time."); return; }
      if (new Date(`${date}T${time}`) <= new Date()) { setError("Please pick a future date and time."); return; }
    }
    setError("");
    setLoading(true);
    try {
      const body = { text, price: p, mode, date: date || undefined, time: time || undefined };
      if (editingId !== null) {
        await api("PUT", `/api/tasks/${editingId}`, body);
        setTasks(prev => prev.map(t => t.id === editingId ? { ...t, ...body } : t));
        showToast("✏️ Task updated");
      } else {
        const data = await api("POST", "/api/tasks", body);
        setTasks(prev => [data.task, ...prev]);
        showToast("🎉 Task posted!");
      }
      exitEditMode();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api("DELETE", `/api/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
      if (editingId === id) exitEditMode();
      showToast("🗑️ Task deleted");
    } catch (err) { showToast("❌ " + err.message); }
  };

  const handleLocationClick = () => {
    setShowMap(true);
    setMapLabel("Detecting your location…");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude, lng = pos.coords.longitude;
          setMapSrc(`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`);
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
            .then(r => r.json())
            .then(d => {
              const a = d.address;
              const label = a.suburb || a.neighbourhood || a.city || a.town || "Your Location";
              setMapLabel("📍 " + label + (a.city ? ", " + a.city : ""));
              setLocationName(label.slice(0, 22));
            })
            .catch(() => setMapLabel(`📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`));
        },
        () => {
          setMapSrc("https://maps.google.com/maps?q=26.9124,75.7873&z=15&output=embed");
          setMapLabel("📍 Jaipur, Rajasthan (default)");
        }
      );
    } else {
      setMapSrc("https://maps.google.com/maps?q=26.9124,75.7873&z=15&output=embed");
      setMapLabel("📍 Jaipur, Rajasthan (default)");
    }
  };

  const prefillCategory = (cat) => {
    setTaskText(cat.prompt);
    setMode("now");
    showToast("🛠️ " + cat.label + " — tell us what you need");
  };

  return (
    <>
      <div className="flex gap-0">
        {/* Sidebar */}
        <TasksSidebar
          tasks={tasks}
          visible={!!currentUser && tasks.length > 0}
          onEdit={enterEditMode}
          onDelete={handleDelete}
        />

        {/* Main */}
        <div className="flex-1 min-w-0 p-6 flex justify-center">
          <div className="w-full max-w-[1200px] flex flex-col gap-5">

            {/* Hero card */}
            <div className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8 w-full">
              <div className="flex justify-between items-start gap-10 flex-wrap">
                <div className="flex-1 min-w-0">
                  <button
                    onClick={handleLocationClick}
                    className="inline-flex items-center gap-1.5 bg-gray-100 border-none px-4 py-2 rounded-full text-sm font-semibold text-gray-600 cursor-pointer mb-4 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    📍 {locationName}
                  </button>

                  <h1 className="text-4xl font-bold leading-tight text-gray-900 mb-4">
                    Get help nearby with <br />
                    <span className="text-red-500 text-5xl">Padosi</span>
                  </h1>

                  {/* Mode toggle */}
                  <div className="inline-flex bg-gray-100 rounded-full p-1 mb-4">
                    {["now", "later"].map(m => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-4 py-2.5 rounded-full text-sm cursor-pointer border-none transition-all ${
                          mode === m ? "bg-white shadow text-gray-900 font-semibold" : "text-gray-600 hover:text-gray-900 bg-transparent"
                        }`}
                      >
                        {m === "now" ? "Call now" : "Schedule later"}
                      </button>
                    ))}
                  </div>

                  {/* Input card */}
                  <div className="mt-2 p-4 rounded-2xl bg-gray-50">
                    <div className="flex gap-3 flex-wrap">
                      <input
                        type="text"
                        value={taskText}
                        onChange={e => setTaskText(e.target.value)}
                        onKeyPress={e => e.key === "Enter" && handleSubmit()}
                        placeholder="What do you need help with"
                        maxLength={MAX_CHARS}
                        className="flex-1 min-w-[200px] px-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 bg-white"
                      />
                      <input
                        type="text"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        onKeyPress={e => e.key === "Enter" && handleSubmit()}
                        placeholder="Your budget (₹)"
                        className="w-40 px-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 bg-white"
                      />
                    </div>

                    <p className={`text-xs mt-1.5 ${taskText.length >= MAX_CHARS ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                      {taskText.length} / {MAX_CHARS} characters
                    </p>

                    {mode === "later" && (
                      <div className="flex gap-3 flex-wrap mt-3">
                        <input type="date" value={date} min={today} onChange={e => setDate(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 bg-white" />
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 bg-white" />
                      </div>
                    )}

                    {error && <p className="text-red-500 text-xs mt-2 font-medium">⚠️ {error}</p>}

                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-7 py-3.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-60 disabled:translate-y-0 cursor-pointer border-none"
                      >
                        {loading ? "Saving…" : editingId ? "Save Changes" : "Find Help"}
                      </button>
                      {editingId && (
                        <button onClick={exitEditMode} className="px-7 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nearby panel */}
                <div className="hidden md:block flex-shrink-0">
                  <NearbyPanel tasks={nearbyTasks} showToast={showToast} />
                </div>
              </div>
            </div>

            {/* Listings tabs */}
            <div className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-6">
              <p className="text-lg font-black text-gray-900 mb-4">
                Padosi <span className="text-red-500">Listings</span>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: "🚗", label: "Rent a Vehicle", action: () => showToast("🚗 Rent a Vehicle — coming soon!") },
                  { icon: "🎟️", label: "Buy Ticket",     action: () => showToast("🎟️ Buy Ticket — coming soon!") },
                  { icon: "🔧", label: "Service Listings", action: onServiceListings },
                  { icon: "🛣️", label: "Ride Share",     action: onRideShare },
                ].map(({ icon, label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="bg-white border-none rounded-2xl p-5 flex flex-col items-center gap-2.5 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.1)] transition-all"
                  >
                    <span className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-xl">{icon}</span>
                    <span className="text-sm font-bold text-gray-900 text-center leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Location map modal */}
      <Modal open={showMap} onClose={() => setShowMap(false)} maxWidth="max-w-xl">
        <ModalTag>Your Location</ModalTag>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Choose your location</h2>
        {mapSrc && <iframe src={mapSrc} className="w-full h-80 rounded-xl border-none" allowFullScreen loading="lazy" />}
        <p className="text-xs text-gray-400 mt-2.5 text-center">{mapLabel}</p>
        <button onClick={() => setShowMap(false)} className="mt-4 w-full py-3 bg-red-500 text-white rounded-xl font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity">
          ✓ Confirm Location
        </button>
      </Modal>

      {/* Service category modal */}
      <ServiceListingsPage onSelectCategory={prefillCategory} />
    </>
  );
}

// ─── Service Listings Page ────────────────────────────────────────────────────
function ServiceListingsPage({ onSelectCategory }) {
  // Exposed via event, not prop drilling — using custom event pattern
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("padosi:openServices", handler);
    return () => window.removeEventListener("padosi:openServices", handler);
  }, []);

  return (
    <div className={`fixed inset-0 z-[5000] bg-gray-50 flex flex-col overflow-y-auto transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
      <div className="h-[70px] flex items-center justify-between px-6 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button onClick={() => setOpen(false)} className="inline-flex items-center gap-2 bg-gray-100 border-none px-4 py-2 rounded-full text-sm font-bold text-gray-600 cursor-pointer hover:bg-red-50 hover:text-red-500 transition-colors">
          ← Back
        </button>
        <p className="text-base font-black text-gray-900">Padosi <span className="text-red-500">Services</span></p>
        <div className="w-20" />
      </div>

      <div className="bg-gradient-to-br from-red-500 to-red-400 text-white py-14 px-6 text-center">
        <h1 className="text-5xl font-black">Serve</h1>
        <p className="mt-2.5 text-sm opacity-90 max-w-md mx-auto">Pick what you need help with — we'll get your task ready to post to neighbours nearby.</p>
      </div>

      <div className="flex justify-center px-6 pb-16">
        <div className="w-full max-w-[1100px] -mt-9">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {SERVICE_CATEGORIES.map((cat, i) => (
              <button
                key={i}
                onClick={() => { setOpen(false); onSelectCategory(cat); }}
                className="bg-white border-none rounded-2xl py-5 px-3 flex flex-col items-center gap-3 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.1)] transition-all"
              >
                <span className="w-13 h-13 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl w-12 h-12">{cat.icon}</span>
                <span className="text-xs font-bold text-gray-900 text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ride Share ───────────────────────────────────────────────────────────────
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
    if (!from) { setFormError("⚠️ Please enter a starting point."); return; }
    if (!to)   { setFormError("⚠️ Please enter a destination."); return; }
    if (!freq) { setFormError("⚠️ Please select how many times a week."); return; }
    if (!deptTime) { setFormError("⚠️ Please enter your usual departure time."); return; }
    if (!desc) { setFormError("⚠️ Please add a short description."); return; }

    const name = currentUser?.full_name || "User";
    const inits = initials(name);

    if (editingRoute) {
      setRoutes(prev => prev.map(r => r.id === editingRoute.id
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
    <div className="fixed inset-0 z-[5000] bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-[70px] flex items-center justify-between px-6 bg-white border-b border-gray-100 flex-shrink-0">
        <button onClick={() => setOpen(false)} className="inline-flex items-center gap-2 bg-gray-100 border-none px-4 py-2 rounded-full text-sm font-bold text-gray-600 cursor-pointer hover:bg-red-50 hover:text-red-500 transition-colors">
          ← Back
        </button>
        <p className="text-base font-black text-gray-900">Padosi <span className="text-red-500">Ride Share</span></p>
        <button
          onClick={() => {
            if (!currentUser) { showToast("👋 Please log in to post a route."); return; }
            openForm(null);
          }}
          className="inline-flex items-center gap-2 bg-red-500 text-white border-none px-5 py-2 rounded-full text-sm font-bold cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all"
        >
          + Post a Route
        </button>
      </div>

      {/* Search */}
      <div className="px-6 py-4 max-w-[600px] mx-auto w-full">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search routes, e.g. Vaishali to MI Road…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-red-400 shadow-sm"
          />
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1200px] mx-auto">
          {filtered.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-300 flex flex-col items-center gap-3">
              <span className="text-5xl">🛣️</span>
              <strong className="text-gray-400 text-base">{search ? "No routes match your search." : "No routes posted yet."}</strong>
              <span className="text-sm">{search ? "Try a different keyword." : "Be the first — post your route!"}</span>
            </div>
          ) : filtered.map(r => {
            const isOwner = r.posterId === currentUser?.id;
            const freqLabel = r.freq === "7" ? "Daily" : `${r.freq}× a week`;
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_6px_24px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-3.5 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.09)] transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
                    <span className="w-0.5 h-5 bg-gray-200" />
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{r.from}</p>
                    <p className="text-xs text-gray-500 mt-2 truncate">{r.to}</p>
                  </div>
                  {isOwner && <span className="text-xs font-bold bg-red-50 text-red-500 px-2.5 py-0.5 rounded-full flex-shrink-0">Your route</span>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {[{ icon: "📅", text: freqLabel }, { icon: "🕐", text: r.time || "—" }, { icon: "👥", text: `${r.seats} seat${r.seats > 1 ? "s" : ""}` }].map(({ icon, text }) => (
                    <span key={text} className="inline-flex items-center gap-1 bg-gray-50 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-600">
                      {icon} {text}
                    </span>
                  ))}
                </div>

                {r.desc && <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{r.desc}</p>}

                <div className="flex items-center justify-between pt-3 border-t border-gray-50 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-red-50 text-red-500 text-xs font-bold flex items-center justify-center">{r.posterInitials}</span>
                    <span className="text-xs font-semibold text-gray-700">{r.posterName}</span>
                  </div>
                  {isOwner ? (
                    <div className="flex gap-2">
                      <button onClick={() => openForm(r)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold cursor-pointer border-none hover:bg-blue-100 transition-colors">✏️ Edit</button>
                      <button onClick={() => { setRoutes(p => p.filter(x => x.id !== r.id)); showToast("🗑️ Route removed"); }} className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg font-bold cursor-pointer border-none hover:bg-red-100 transition-colors">🗑️ Remove</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-red-500">{r.price > 0 ? `₹${r.price}` : "Free"}<span className="text-xs font-normal text-gray-400">/seat</span></span>
                      <button onClick={() => { if (!currentUser) { showToast("👋 Please log in first."); return; } showToast("💬 Chat coming soon! Route by " + r.posterName); }} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer border-none hover:bg-green-600 transition-colors">Contact</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post form overlay */}
      {formOpen && (
        <div className="absolute inset-0 z-10 bg-gray-50 flex flex-col">
          <div className="h-[70px] flex items-center justify-between px-6 bg-white border-b border-gray-100 flex-shrink-0">
            <button onClick={() => { setFormOpen(false); resetForm(); }} className="inline-flex items-center gap-2 bg-gray-100 border-none px-4 py-2 rounded-full text-sm font-bold text-gray-600 cursor-pointer hover:bg-red-50 hover:text-red-500 transition-colors">
              ← Back
            </button>
            <p className="text-base font-black text-gray-900">Post a <span className="text-red-500">Route</span></p>
            <div className="w-20" />
          </div>

          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Map */}
            <div className="flex-1 relative bg-gray-100 min-h-[200px]">
              {mapSrc && <iframe src={mapSrc} className="w-full h-full border-none" allowFullScreen loading="lazy" />}
              {mapHidden && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50">
                  <span className="text-5xl text-gray-200">🗺️</span>
                  <p className="text-sm text-gray-400 text-center max-w-[180px] leading-snug">Enter your route to preview it on the map</p>
                </div>
              )}
            </div>

            {/* Form */}
            <div className="w-full md:w-[400px] flex-shrink-0 bg-white border-l border-gray-100 overflow-y-auto p-7">
              <h2 className="text-xl font-black text-gray-900 mb-1">{editingRoute ? "Edit your route" : "Your route details"}</h2>
              <p className="text-xs text-gray-400 mb-6">Share your regular trip so neighbours can ride along.</p>

              {[
                { label: "🟢 From", id: "rideFrom", val: from, set: setFrom, placeholder: "Starting point, e.g. Vaishali Nagar" },
                { label: "📍 To",   id: "rideTo",   val: to,   set: setTo,   placeholder: "Destination, e.g. MI Road" },
              ].map(({ label, id, val, set, placeholder }) => (
                <div key={id} className="mb-4">
                  <label className="text-xs font-bold text-gray-600 mb-2 block">{label}</label>
                  <input value={val} onChange={e => set(e.target.value)} placeholder={placeholder} className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-red-400 focus:bg-white transition-colors" />
                </div>
              ))}

              <button
                onClick={() => {
                  if (!from || !to) { showToast("⚠️ Enter both a starting point and destination first."); return; }
                  const q = encodeURIComponent(from + " to " + to + " Jaipur India");
                  setMapSrc(`https://maps.google.com/maps?q=${q}&z=13&output=embed`);
                  setMapHidden(false);
                }}
                className="w-full py-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 cursor-pointer hover:border-red-400 hover:text-red-500 transition-colors mb-5"
              >
                🗺️ Preview on Map
              </button>

              <hr className="border-gray-100 my-5" />

              <div className="mb-4">
                <label className="text-xs font-bold text-gray-600 mb-2 block">📅 Times per week</label>
                <div className="flex gap-2 flex-wrap">
                  {["1","2","3","4","5","6","7"].map(v => (
                    <button
                      key={v}
                      onClick={() => setFreq(v)}
                      className={`px-3 py-2 rounded-xl border text-sm font-bold cursor-pointer transition-colors ${freq === v ? "bg-red-500 border-red-500 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-red-400 hover:text-red-500"}`}
                    >
                      {v === "7" ? "Daily" : `${v}×`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-2 block">🕐 Departs at</label>
                  <input type="time" value={deptTime} onChange={e => setDeptTime(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-red-400 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-2 block">👥 Seats available</label>
                  <div className="flex items-center gap-3 mt-1">
                    <button onClick={() => setSeats(s => Math.max(1, s - 1))} className="w-8 h-8 rounded-full border border-gray-200 bg-white text-lg font-bold text-gray-600 flex items-center justify-center cursor-pointer hover:border-red-400 hover:text-red-500 transition-colors">−</button>
                    <span className="text-xl font-black text-gray-900 min-w-[20px] text-center">{seats}</span>
                    <button onClick={() => setSeats(s => Math.min(8, s + 1))} className="w-8 h-8 rounded-full border border-gray-200 bg-white text-lg font-bold text-gray-600 flex items-center justify-center cursor-pointer hover:border-red-400 hover:text-red-500 transition-colors">+</button>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold text-gray-600 mb-2 block">₹ Price per seat</label>
                <input type="number" value={priceVal} onChange={e => setPriceVal(e.target.value)} placeholder="e.g. 50" min="0" className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-red-400 focus:bg-white transition-colors" />
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold text-gray-600 mb-2 block">📝 Description</label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value.slice(0, 400))}
                  placeholder="e.g. I drive to Malviya Nagar every morning around 8 AM, AC car, non-smoker, happy to drop anyone along the route."
                  rows={4}
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:border-red-400 focus:bg-white transition-colors resize-y leading-relaxed"
                />
                <p className="text-xs text-gray-300 text-right mt-1">{desc.length} / 400</p>
              </div>

              {formError && <p className="text-red-500 text-sm font-semibold mb-3">{formError}</p>}

              <button
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl bg-red-500 text-white text-sm font-bold cursor-pointer border-none hover:-translate-y-0.5 hover:shadow-lg transition-all"
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

// ─── Auth Modals ──────────────────────────────────────────────────────────────
function AuthModals({ loginOpen, signupOpen, onClose, onLogin, onSignup, showToast }) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) { setLoginError("Please enter email and password."); return; }
    setLoginLoading(true); setLoginError("");
    try {
      const { user } = await api("POST", "/api/login", { email: loginEmail, password: loginPassword });
      onLogin(user);
      onClose("login");
      showToast("👋 Welcome back, " + user.full_name.split(" ")[0] + "!");
      setLoginEmail(""); setLoginPassword("");
    } catch (err) { setLoginError(err.message); }
    finally { setLoginLoading(false); }
  };

  const handleSignup = async () => {
    if (!signupName || !signupEmail || !signupPassword) { setSignupError("Please fill in all fields."); return; }
    if (signupPassword.length < 6) { setSignupError("Password must be at least 6 characters."); return; }
    setSignupLoading(true); setSignupError("");
    try {
      const { user } = await api("POST", "/api/signup", { full_name: signupName, email: signupEmail, password: signupPassword });
      onSignup(user);
      onClose("signup");
      showToast("🎉 Welcome to Padosi, " + user.full_name.split(" ")[0] + "!");
      setSignupName(""); setSignupEmail(""); setSignupPassword("");
    } catch (err) { setSignupError(err.message); }
    finally { setSignupLoading(false); }
  };

  return (
    <>
      <Modal open={loginOpen} onClose={() => onClose("login")}>
        <ModalTag>Welcome back</ModalTag>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Log in to Padosi</h2>
        <div className="flex flex-col gap-3">
          <a href="/auth/google" className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors no-underline">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4.5" alt="Google" />
            Continue with Google
          </a>
          <div className="flex items-center gap-2.5 text-xs text-gray-300">
            <span className="flex-1 h-px bg-gray-100" /> or <span className="flex-1 h-px bg-gray-100" />
          </div>
          <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} onKeyPress={e => e.key === "Enter" && handleLogin()} placeholder="Email address" className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
          <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyPress={e => e.key === "Enter" && handleLogin()} placeholder="Password" className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
          {loginError && <p className="text-red-500 text-xs font-medium">{loginError}</p>}
          <button onClick={handleLogin} disabled={loginLoading} className="py-3 rounded-xl bg-red-500 text-white font-semibold text-sm cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-60 mt-1">
            {loginLoading ? "Logging in…" : "Log in"}
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-3">
          Don't have an account? <button onClick={() => { onClose("login"); }} className="text-red-500 font-semibold bg-transparent border-none cursor-pointer">Sign up</button>
        </p>
      </Modal>

      <Modal open={signupOpen} onClose={() => onClose("signup")}>
        <ModalTag>Join Padosi</ModalTag>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create your account</h2>
        <div className="flex flex-col gap-3">
          <a href="/auth/google" className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors no-underline">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4.5" alt="Google" />
            Continue with Google
          </a>
          <div className="flex items-center gap-2.5 text-xs text-gray-300">
            <span className="flex-1 h-px bg-gray-100" /> or <span className="flex-1 h-px bg-gray-100" />
          </div>
          <input type="text" value={signupName} onChange={e => setSignupName(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSignup()} placeholder="Full name" className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
          <input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSignup()} placeholder="Email address" className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
          <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSignup()} placeholder="Password (min 6 characters)" className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
          {signupError && <p className="text-red-500 text-xs font-medium">{signupError}</p>}
          <button onClick={handleSignup} disabled={signupLoading} className="py-3 rounded-xl bg-red-500 text-white font-semibold text-sm cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-60 mt-1">
            {signupLoading ? "Creating account…" : "Sign up"}
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-3">
          Already have an account? <button onClick={() => { onClose("signup"); }} className="text-red-500 font-semibold bg-transparent border-none cursor-pointer">Log in</button>
        </p>
      </Modal>
    </>
  );
}

// ─── Manage Account Modal ─────────────────────────────────────────────────────
function ManageAccountModal({ open, onClose, currentUser, onUpdate, showToast }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && currentUser) {
      setName(currentUser.full_name || "");
      setPhone(currentUser.phone || "");
      setError(""); setPhoneError("");
    }
  }, [open, currentUser]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Full name cannot be empty."); return; }
    if (phone && phone.length !== 10) { setPhoneError("Phone number must be exactly 10 digits."); return; }
    setLoading(true); setError("");
    try {
      const { user } = await api("PUT", "/api/me", { full_name: name.trim(), phone: phone || undefined });
      onUpdate(user);
      onClose();
      showToast("✅ Account updated");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const initial = (currentUser?.full_name || "U").charAt(0).toUpperCase();
  const verified = !!(currentUser?.phone);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalTag>Account settings</ModalTag>
      <h2 className="text-xl font-bold text-gray-900 mb-5">Manage account</h2>

      <div className="flex items-center gap-3.5 mb-6">
        <span className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl font-bold flex-shrink-0">{initial}</span>
        <div>
          <p className="text-sm font-bold text-gray-900">{currentUser?.full_name || "User"}</p>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 mt-1 ${verified ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
            {verified ? "✅ Verified member" : "⚠️ Not verified — add a phone"}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Full name</label>
        <input value={name} onChange={e => setName(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSave()} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400" />
      </div>

      <div className="mb-4">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Email address</label>
        <input value={currentUser?.email || ""} disabled className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
        <span className="text-xs text-gray-300 mt-1 block">Your email can't be changed yet.</span>
      </div>

      <div className="mb-5">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Phone number</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500 pointer-events-none">🇮🇳 +91</span>
          <input
            type="tel"
            value={phone}
            onChange={e => { const v = e.target.value.replace(/\D/g, ""); setPhone(v); setPhoneError(v && v.length < 10 ? "Phone must be exactly 10 digits." : ""); }}
            maxLength={10}
            placeholder="10-digit mobile number"
            className="w-full pl-16 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400"
          />
          {phone.length === 10 && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">✓</span>}
        </div>
        {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
      </div>

      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
      <button onClick={handleSave} disabled={loading} className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold text-sm cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-60">
        {loading ? "Saving…" : "Save changes"}
      </button>
    </Modal>
  );
}

// ─── Activity / History Modal ─────────────────────────────────────────────────
function TaskSummaryCard({ task }) {
  const accepted = task.accepted;
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 mb-2.5 text-sm">
      <p className="font-semibold text-gray-900 leading-snug mb-1 break-words">
        {task.text}
        <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-lg ${accepted ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
          {accepted ? "Accepted" : "Pending"}
        </span>
      </p>
      <p className="text-xs text-gray-500 mt-1">₹{task.price} • {task.mode === "now" ? "🟢 Now" : "🕒 " + formatDateTime(task.date, task.time)}</p>
      {accepted && task.helper && (
        <p className="text-xs text-green-700 font-semibold mt-1">✅ {task.helper.name} • {task.helper.phone}</p>
      )}
      {task.created_at && <p className="text-xs text-gray-300 mt-1">{formatPostedDate(task.created_at)}</p>}
    </div>
  );
}

function ActivityModal({ open, onClose, tasks }) {
  const pending  = tasks.filter(t => !t.accepted);
  const accepted = tasks.filter(t =>  t.accepted);
  return (
    <Modal open={open} onClose={onClose}>
      <ModalTag>Your Activity</ModalTag>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Task Status</h2>
      {tasks.length === 0 ? (
        <p className="text-xs text-gray-400">You haven't posted any tasks yet.</p>
      ) : (
        <>
          {[{ label: "🕒 Pending", list: pending, empty: "No pending tasks right now." }, { label: "✅ Accepted", list: accepted, empty: "No accepted tasks yet." }].map(({ label, list, empty }) => (
            <div key={label} className="mb-5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                {label}
                <span className="ml-auto bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">{list.length}</span>
              </div>
              {list.length === 0 ? <p className="text-xs text-gray-400">{empty}</p> : list.map(t => <TaskSummaryCard key={t.id} task={t} />)}
            </div>
          ))}
        </>
      )}
    </Modal>
  );
}

function HistoryModal({ open, onClose, tasks }) {
  return (
    <Modal open={open} onClose={onClose}>
      <ModalTag>My Tasks</ModalTag>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Task History</h2>
      <p className="text-xs text-gray-400 mb-4">Your most recent 10 tasks</p>
      <div className="max-h-[420px] overflow-y-auto">
        {tasks.length === 0
          ? <p className="text-xs text-gray-400">No task history yet — post your first task to get started.</p>
          : tasks.slice(0, 10).map(t => <TaskSummaryCard key={t.id} task={t} />)
        }
      </div>
    </Modal>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────
function VerifiedSection({ currentUser, showToast, onRequireLogin, onOpenManage }) {
  if (currentUser?.phone) return null;
  return (
    <div className="mx-auto max-w-[1200px] my-16 bg-gradient-to-br from-red-500 to-red-400 rounded-2xl p-10 text-white">
      <div className="flex items-center justify-between gap-10 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold mb-2">Become a Verified Member</h2>
          <p className="mb-5 opacity-90">Earn money by helping people nearby.</p>
          <button
            onClick={() => {
              if (!currentUser) { showToast("👋 Please log in first"); onRequireLogin(); return; }
              onOpenManage();
            }}
            className="px-6 py-3 bg-white text-red-500 rounded-xl font-semibold text-sm cursor-pointer border-none hover:opacity-90 transition-opacity"
          >
            Get Verified
          </button>
        </div>
        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" className="w-48 opacity-90" alt="Verified" />
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <div className="py-16 px-5 text-center bg-white border-t-2 border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-10">How Padosi works</h2>
      <div className="flex justify-center gap-10 flex-wrap">
        {[
          { img: "https://cdn-icons-png.flaticon.com/512/1828/1828919.png", label: "Post your task" },
          { img: "https://cdn-icons-png.flaticon.com/512/942/942748.png",   label: "Get responses" },
          { img: "https://cdn-icons-png.flaticon.com/512/190/190411.png",   label: "Get it done" },
        ].map(({ img, label }) => (
          <div key={label} className="max-w-[200px] flex flex-col items-center gap-4">
            <img src={img} className="w-20" alt={label} />
            <h3 className="font-bold text-gray-900">{label}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [nearbyTasks, setNearbyTasks] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("padosi-theme") === "dark");
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toastMsg, showToast] = useToast();

  // Apply dark mode class
  useEffect(() => {
    document.body.classList.toggle("bg-black", darkMode);
    document.body.classList.toggle("text-white", darkMode);
    localStorage.setItem("padosi-theme", darkMode ? "dark" : "default");
  }, [darkMode]);

  // Session check
  useEffect(() => {
    (async () => {
      try {
        const { user } = await api("GET", "/api/me");
        if (user) {
          setCurrentUser(user);
          loadTasks();
          loadNearbyTasks();
        }
      } catch {}
    })();
  }, []);

  const loadTasks = async () => {
    try { const d = await api("GET", "/api/tasks"); setTasks(d.tasks || []); } catch {}
  };

  const loadNearbyTasks = async () => {
    try { const d = await api("GET", "/api/tasks/nearby"); setNearbyTasks(d.tasks || []); } catch { setNearbyTasks([]); }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    loadTasks();
    loadNearbyTasks();
  };

  const handleSignout = async () => {
    try { await api("POST", "/api/logout"); } catch {}
    setCurrentUser(null);
    setTasks([]);
    setNearbyTasks([]);
    showToast("👋 Signed out successfully");
  };

  const handleUserUpdate = (user) => {
    setCurrentUser(user);
  };

  return (
    <div className={darkMode ? "bg-black text-white min-h-screen" : "bg-[#f6f7fb] text-gray-900 min-h-screen"}>
      <Navbar
        currentUser={currentUser}
        onLogin={() => setLoginOpen(true)}
        onSignup={() => setSignupOpen(true)}
        onSignout={handleSignout}
        onManageAccount={() => setManageOpen(true)}
        onMyTasks={() => setHistoryOpen(true)}
        onActivity={() => setActivityOpen(true)}
        showToast={showToast}
        darkMode={darkMode}
        onToggleDark={setDarkMode}
      />

      <HeroSection
        currentUser={currentUser}
        tasks={tasks}
        setTasks={setTasks}
        nearbyTasks={nearbyTasks}
        showToast={showToast}
        onRequireLogin={() => setLoginOpen(true)}
        onServiceListings={() => window.dispatchEvent(new Event("padosi:openServices"))}
        onRideShare={() => window.dispatchEvent(new Event("padosi:openRide"))}
      />

      <VerifiedSection
        currentUser={currentUser}
        showToast={showToast}
        onRequireLogin={() => setLoginOpen(true)}
        onOpenManage={() => setManageOpen(true)}
      />
      <HowItWorks />

      {/* Full-page overlays */}
      <ServiceListingsPage onSelectCategory={() => {}} />
      <RideSharePage currentUser={currentUser} showToast={showToast} />

      {/* Modals */}
      <AuthModals
        loginOpen={loginOpen}
        signupOpen={signupOpen}
        onClose={type => type === "login" ? setLoginOpen(false) : setSignupOpen(false)}
        onLogin={handleLogin}
        onSignup={handleLogin}
        showToast={showToast}
      />
      <ManageAccountModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        currentUser={currentUser}
        onUpdate={handleUserUpdate}
        showToast={showToast}
      />
      <ActivityModal open={activityOpen} onClose={() => setActivityOpen(false)} tasks={tasks} />
      <HistoryModal  open={historyOpen}  onClose={() => setHistoryOpen(false)}  tasks={tasks} />

      <Toast message={toastMsg} />
    </div>
  );
}