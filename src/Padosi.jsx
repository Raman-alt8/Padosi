import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "./Components/Navbar";
import PadosiListings from "./Components/PadosiListings";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_CHARS = 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Dark mode token helper ───────────────────────────────────────────────────
// Usage: dm(dark, "dark-class", "light-class")
function dm(dark, darkCls, lightCls) {
  return dark ? darkCls : lightCls;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-white text-black border border-black px-6 py-3 rounded-full text-sm font-semibold z-[9999] pointer-events-none transition-all duration-300 ${
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
function Modal({ open, onClose, children, maxWidth = "max-w-md", dark }) {
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`rounded-2xl p-9 w-full ${maxWidth} relative shadow-2xl border ${
        dark
          ? "bg-black text-white border-white/20"
          : "bg-white text-gray-900 border-transparent"
      }`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-5 text-2xl leading-none bg-transparent border-none cursor-pointer ${
            dark ? "text-white/50 hover:text-white" : "text-gray-400 hover:text-red-500"
          }`}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

function ModalTag({ children, dark }) {
  return (
    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 ${
      dark ? "bg-white/10 text-white" : "bg-red-50 text-red-500"
    }`}>
      {children}
    </span>
  );
}

// ─── Nearby Task Card ─────────────────────────────────────────────────────────
function NearbyTaskCard({ task, showToast, dark }) {
  const [state, setState] = useState("idle");
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
    <div className={`rounded-xl p-2.5 mb-2.5 text-sm ${dm(dark, "bg-white/10", "bg-gray-100")}`}>
      <p className={`font-semibold mb-1.5 leading-snug break-words ${dm(dark, "text-white", "text-gray-900")}`}>{task.text}</p>
      <div className={`flex items-center gap-2 flex-wrap text-xs ${dm(dark, "text-white/60", "text-gray-500")}`}>
        <span className={`font-bold px-2 py-0.5 rounded-lg ${dm(dark, "bg-white/20 text-white", "bg-red-50 text-red-500")}`}>₹{task.price}</span>
        <span>{modeLabel}</span>
      </div>

      {state !== "accepted" ? (
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={handleAccept}
            disabled={state === "loading"}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition-colors disabled:opacity-60 cursor-pointer border-none ${
              dm(dark, "bg-white text-black hover:bg-green-600 hover:text-white", "bg-gray-900 text-white")
            }`}
          >
            {state === "loading" ? "Sending…" : "🤝 Accept"}
          </button>
          <button
            onClick={handleDecline}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border-none ${
              dm(dark, "bg-white/10 text-white/60 hover:bg-red-500/20 hover:text-red-400", "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500")
            }`}
          >
            ✕ Decline
          </button>
        </div>
      ) : (
        <div className="mt-2">
          <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 mb-1.5 ${dm(dark, "bg-white/10", "bg-white")}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${dm(dark, "bg-white/20 text-white", "bg-red-50 text-red-500")}`}>
              {poster?.initials || "U"}
            </span>
            {poster?.phone
              ? <span className={`text-xs font-bold ${dm(dark, "text-white", "text-gray-900")}`}>+91 {poster.phone}</span>
              : <span className={`text-xs italic ${dm(dark, "text-white/40", "text-gray-400")}`}>No phone on file</span>
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
              className={`${poster?.phone ? "flex-1" : "w-full"} py-1.5 rounded-lg text-xs font-bold cursor-pointer border-none transition-colors ${
                dm(dark, "bg-white text-black hover:bg-white/80", "bg-gray-900 text-white hover:bg-gray-700")
              }`}
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
function NearbyPanel({ tasks, showToast, dark }) {
  return (
    <div className={`w-64 rounded-2xl p-4 shadow-xl max-h-[480px] overflow-y-auto flex-shrink-0 border ${
      dm(dark, "bg-black border-white/20", "bg-white border-transparent")
    }`}>
      <div className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${dm(dark, "text-white/40", "text-gray-400")}`}>
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
        Nearby Tasks
      </div>
      {tasks.length === 0
        ? <p className={`text-xs text-center py-4 ${dm(dark, "text-white/40", "text-gray-400")}`}>No nearby tasks right now.</p>
        : tasks.map(t => <NearbyTaskCard key={t.id} task={t} showToast={showToast} dark={dark} />)
      }
    </div>
  );
}

// ─── My Task Card ─────────────────────────────────────────────────────────────
function MyTaskCard({ task, onEdit, onDelete, dark }) {
  return (
    <div className={`rounded-xl p-3 mb-2.5 text-sm border ${
      dm(dark, "bg-white/5 border-white/10", "bg-white border-gray-100")
    }`}>
      <p className={`font-semibold leading-snug mb-1 break-words ${dm(dark, "text-white", "text-gray-900")}`}>
        {task.text}
        <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-lg ${
          task.accepted
            ? dm(dark, "bg-green-500/20 text-green-400", "bg-green-50 text-green-700")
            : dm(dark, "bg-yellow-500/20 text-yellow-400", "bg-yellow-50 text-yellow-700")
        }`}>
          {task.accepted ? "Accepted" : "Pending"}
        </span>
      </p>
      <p className={`text-xs mt-1 ${dm(dark, "text-white/50", "text-gray-500")}`}>
        ₹{task.price} • {task.mode === "now" ? "🟢 Now" : "🕒 " + formatDateTime(task.date, task.time)}
      </p>

      {task.accepted && task.helper && (
        <div className={`mt-2 border rounded-xl p-2.5 ${dm(dark, "border-white/10", "border-gray-100")}`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${dm(dark, "bg-white/20 text-white", "bg-red-50 text-red-500")}`}>
              {task.helper.initials}
            </span>
            <div>
              <p className={`text-xs font-bold ${dm(dark, "text-white", "text-gray-900")}`}>{task.helper.name} ✅</p>
              <p className="text-xs text-yellow-500">{renderStars(task.helper.rating)} {task.helper.rating.toFixed(1)} ({task.helper.reviews})</p>
            </div>
          </div>
          <div className={`flex justify-between items-center mt-2 pt-2 border-t ${dm(dark, "border-white/10", "border-gray-100")}`}>
            <span className={`text-xs font-semibold ${dm(dark, "text-white/70", "text-gray-600")}`}>{task.helper.phone}</span>
            <a href={`tel:${task.helper.phone?.replace(/\s/g, "")}`} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg no-underline font-bold">📞 Call</a>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-2 flex-wrap">
        <button onClick={() => onEdit(task)} className={`text-xs font-semibold px-3 py-1 rounded-lg cursor-pointer border-none transition-colors ${dm(dark, "bg-white/10 text-white hover:bg-white/20", "bg-blue-50 text-blue-600 hover:bg-blue-100")}`}>Edit</button>
        <button onClick={() => onDelete(task.id)} className={`text-xs font-semibold px-3 py-1 rounded-lg cursor-pointer border-none transition-colors ${dm(dark, "bg-white/10 text-red-400 hover:bg-red-500/20", "bg-red-50 text-red-500 hover:bg-red-100")}`}>Delete</button>
      </div>
    </div>
  );
}

// ─── Tasks Sidebar ────────────────────────────────────────────────────────────
function TasksSidebar({ tasks, visible, onEdit, onDelete, dark }) {
  return (
    <div className={`transition-all duration-500 ease-in-out overflow-hidden flex-shrink-0 ${visible ? "w-[300px] min-w-[300px] opacity-100" : "w-0 min-w-0 opacity-0"}`}>
      <div className="w-[300px] px-5 pt-6 pb-6">
        <h3 className={`text-sm font-bold flex items-center gap-2 mb-1 ${dm(dark, "text-white", "text-gray-900")}`}>
          <span className="text-red-500">✅</span> My Tasks
        </h3>
        <p className={`text-xs mb-4 ${dm(dark, "text-white/40", "text-gray-400")}`}>Track the tasks you've posted</p>
        <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto">
          {tasks.length === 0
            ? <p className={`text-xs text-center py-5 ${dm(dark, "text-white/40", "text-gray-400")}`}>No tasks yet — post one to get started.</p>
            : tasks.map(t => <MyTaskCard key={t.id} task={t} onEdit={onEdit} onDelete={onDelete} dark={dark} />)
          }
        </div>
      </div>
    </div>
  );
}

// ─── Hero / Task Form ─────────────────────────────────────────────────────────
function HeroSection({ currentUser, tasks, setTasks, nearbyTasks, showToast, onRequireLogin, dark }) {
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

  // Shared input class
  const inputCls = `px-4 py-3.5 rounded-xl border text-sm text-gray-900 focus:outline-none transition-colors ${
    dark
      ? "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white"
      : "bg-white border-gray-200 text-gray-900 focus:border-red-400"
  }`;

  return (
    <>
      <div className="flex gap-0">
        <TasksSidebar
          tasks={tasks}
          visible={!!currentUser && tasks.length > 0}
          onEdit={enterEditMode}
          onDelete={handleDelete}
          dark={dark}
        />

        <div className="flex-1 min-w-0 p-6 flex justify-center">
          <div className="w-full max-w-[1200px] flex flex-col gap-5">

            {/* Hero card */}
            <div className={`rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] p-8 w-full border ${
              dm(dark, "bg-black border-white/15", "bg-white border-transparent")
            }`}>
              <div className="flex justify-between items-start gap-10 flex-wrap">
                <div className="flex-1 min-w-0">
                  <button
                    onClick={handleLocationClick}
                    className={`inline-flex items-center gap-1.5 border-none px-4 py-2 rounded-full text-sm font-semibold cursor-pointer mb-4 transition-colors ${
                      dm(dark, "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white", "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500")
                    }`}
                  >
                    📍 {locationName}
                  </button>

                  <h1 className={`text-4xl font-bold leading-tight mb-4 ${dm(dark, "text-white", "text-gray-900")}`}>
                    Get help nearby with <br />
                    <span className="text-red-500 text-5xl">Padosi</span>
                  </h1>

                  {/* Mode toggle */}
                  <div className={`inline-flex rounded-full p-1 mb-4 ${dm(dark, "bg-white/10", "bg-gray-100")}`}>
                    {["now", "later"].map(m => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-4 py-2.5 rounded-full text-sm cursor-pointer border-none transition-all ${
                          mode === m
                            ? dm(dark, "bg-white text-black font-semibold shadow", "bg-white shadow text-gray-900 font-semibold")
                            : dm(dark, "text-white/60 hover:text-white bg-transparent", "text-gray-600 hover:text-gray-900 bg-transparent")
                        }`}
                      >
                        {m === "now" ? "Call now" : "Schedule later"}
                      </button>
                    ))}
                  </div>

                  {/* Input card */}
                  <div className={`mt-2 p-4 rounded-2xl ${dm(dark, "bg-white/5", "bg-gray-50")}`}>
                    <div className="flex gap-3 flex-wrap">
                      <input
                        type="text"
                        value={taskText}
                        onChange={e => setTaskText(e.target.value)}
                        onKeyPress={e => e.key === "Enter" && handleSubmit()}
                        placeholder="What do you need help with"
                        maxLength={MAX_CHARS}
                        className={`flex-1 min-w-[200px] ${inputCls}`}
                      />
                      <input
                        type="text"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        onKeyPress={e => e.key === "Enter" && handleSubmit()}
                        placeholder="Your budget (₹)"
                        className={`w-40 ${inputCls}`}
                      />
                    </div>

                    <p className={`text-xs mt-1.5 ${taskText.length >= MAX_CHARS ? "text-red-500 font-semibold" : dm(dark, "text-white/40", "text-gray-400")}`}>
                      {taskText.length} / {MAX_CHARS} characters
                    </p>

                    {mode === "later" && (
                      <div className="flex gap-3 flex-wrap mt-3">
                        <input type="date" value={date} min={today} onChange={e => setDate(e.target.value)} className={inputCls} />
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} />
                      </div>
                    )}

                    {error && <p className="text-red-400 text-xs mt-2 font-medium">⚠️ {error}</p>}

                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-7 py-3.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-60 disabled:translate-y-0 cursor-pointer border-none"
                      >
                        {loading ? "Saving…" : editingId ? "Save Changes" : "Find Help"}
                      </button>
                      {editingId && (
                        <button
                          onClick={exitEditMode}
                          className={`px-7 py-3.5 rounded-xl border font-semibold text-sm transition-colors cursor-pointer ${
                            dm(dark, "border-white/20 bg-transparent text-white/70 hover:bg-white/10", "border-gray-200 bg-white text-gray-600 hover:bg-gray-50")
                          }`}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="hidden md:block flex-shrink-0">
                  <NearbyPanel tasks={nearbyTasks} showToast={showToast} dark={dark} />
                </div>
              </div>
            </div>

            <PadosiListings showToast={showToast} currentUser={currentUser} onSelectCategory={prefillCategory} dark={dark} />
          </div>
        </div>
      </div>

      {/* Location map modal */}
      <Modal open={showMap} onClose={() => setShowMap(false)} maxWidth="max-w-xl" dark={dark}>
        <ModalTag dark={dark}>Your Location</ModalTag>
        <h2 className={`text-xl font-bold mb-4 ${dm(dark, "text-white", "text-gray-900")}`}>Choose your location</h2>
        {mapSrc && <iframe src={mapSrc} className="w-full h-80 rounded-xl border-none" allowFullScreen loading="lazy" />}
        <p className={`text-xs mt-2.5 text-center ${dm(dark, "text-white/40", "text-gray-400")}`}>{mapLabel}</p>
        <button onClick={() => setShowMap(false)} className="mt-4 w-full py-3 bg-red-500 text-white rounded-xl font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity">
          ✓ Confirm Location
        </button>
      </Modal>
    </>
  );
}

// ─── Auth Modals ──────────────────────────────────────────────────────────────
function AuthModals({ loginOpen, signupOpen, onClose, onLogin, onSignup, showToast, dark }) {
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

  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
    dark
      ? "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white"
      : "bg-white border-gray-200 text-gray-900 focus:border-red-400"
  }`;

  const GoogleButton = () => (
    <a
      href="/auth/google"
      className={`flex items-center justify-center gap-3 w-full py-3 rounded-xl border-2 text-sm font-semibold transition-all no-underline ${
        dark
          ? "border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/40"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-md"
      }`}
      style={{ boxShadow: dark ? "none" : "0 1px 3px rgba(0,0,0,0.08)" }}
    >
      <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 flex-shrink-0" alt="Google" />
      <span>Continue with Google</span>
    </a>
  );

  const Divider = () => (
    <div className={`flex items-center gap-2.5 text-xs ${dm(dark, "text-white/30", "text-gray-300")}`}>
      <span className={`flex-1 h-px ${dm(dark, "bg-white/10", "bg-gray-100")}`} />
      or
      <span className={`flex-1 h-px ${dm(dark, "bg-white/10", "bg-gray-100")}`} />
    </div>
  );

  return (
    <>
      {/* Login */}
      <Modal open={loginOpen} onClose={() => onClose("login")} dark={dark}>
        <ModalTag dark={dark}>Welcome back</ModalTag>
        <h2 className={`text-xl font-bold mb-4 ${dm(dark, "text-white", "text-gray-900")}`}>Log in to Padosi</h2>
        <div className="flex flex-col gap-3">
          <GoogleButton />
          <Divider />
          <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} onKeyPress={e => e.key === "Enter" && handleLogin()} placeholder="Email address" className={inputCls} />
          <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyPress={e => e.key === "Enter" && handleLogin()} placeholder="Password" className={inputCls} />
          {loginError && <p className="text-red-400 text-xs font-medium">{loginError}</p>}
          <button onClick={handleLogin} disabled={loginLoading} className="py-3 rounded-xl bg-red-500 text-white font-semibold text-sm cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-60 mt-1">
            {loginLoading ? "Logging in…" : "Log in"}
          </button>
        </div>
        <p className={`text-xs text-center mt-3 ${dm(dark, "text-white/50", "text-gray-500")}`}>
          Don't have an account?{" "}
          <button onClick={() => onClose("login")} className={`font-semibold bg-transparent border-none cursor-pointer ${dm(dark, "text-white hover:text-red-400", "text-red-500")}`}>Sign up</button>
        </p>
      </Modal>

      {/* Signup */}
      <Modal open={signupOpen} onClose={() => onClose("signup")} dark={dark}>
        <ModalTag dark={dark}>Join Padosi</ModalTag>
        <h2 className={`text-xl font-bold mb-4 ${dm(dark, "text-white", "text-gray-900")}`}>Create your account</h2>
        <div className="flex flex-col gap-3">
          <GoogleButton />
          <Divider />
          <input type="text" value={signupName} onChange={e => setSignupName(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSignup()} placeholder="Full name" className={inputCls} />
          <input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSignup()} placeholder="Email address" className={inputCls} />
          <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSignup()} placeholder="Password (min 6 characters)" className={inputCls} />
          {signupError && <p className="text-red-400 text-xs font-medium">{signupError}</p>}
          <button onClick={handleSignup} disabled={signupLoading} className="py-3 rounded-xl bg-red-500 text-white font-semibold text-sm cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-60 mt-1">
            {signupLoading ? "Creating account…" : "Sign up"}
          </button>
        </div>
        <p className={`text-xs text-center mt-3 ${dm(dark, "text-white/50", "text-gray-500")}`}>
          Already have an account?{" "}
          <button onClick={() => onClose("signup")} className={`font-semibold bg-transparent border-none cursor-pointer ${dm(dark, "text-white hover:text-red-400", "text-red-500")}`}>Log in</button>
        </p>
      </Modal>
    </>
  );
}

// ─── Manage Account Modal ─────────────────────────────────────────────────────
function ManageAccountModal({ open, onClose, currentUser, onUpdate, showToast, dark }) {
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

  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
    dark
      ? "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white"
      : "bg-white border-gray-200 text-gray-900 focus:border-red-400"
  }`;

  return (
    <Modal open={open} onClose={onClose} dark={dark}>
      <ModalTag dark={dark}>Account settings</ModalTag>
      <h2 className={`text-xl font-bold mb-5 ${dm(dark, "text-white", "text-gray-900")}`}>Manage account</h2>

      <div className="flex items-center gap-3.5 mb-6">
        <span className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 ${dm(dark, "bg-white/20 text-white", "bg-red-50 text-red-500")}`}>{initial}</span>
        <div>
          <p className={`text-sm font-bold ${dm(dark, "text-white", "text-gray-900")}`}>{currentUser?.full_name || "User"}</p>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 mt-1 ${
            verified
              ? dm(dark, "bg-green-500/20 text-green-400", "bg-green-50 text-green-700")
              : dm(dark, "bg-yellow-500/20 text-yellow-400", "bg-yellow-50 text-yellow-700")
          }`}>
            {verified ? "✅ Verified member" : "⚠️ Not verified — add a phone"}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ${dm(dark, "text-white/40", "text-gray-400")}`}>Full name</label>
        <input value={name} onChange={e => setName(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSave()} className={inputCls} />
      </div>

      <div className="mb-4">
        <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ${dm(dark, "text-white/40", "text-gray-400")}`}>Email address</label>
        <input
          value={currentUser?.email || ""}
          disabled
          className={`w-full px-4 py-3 rounded-xl border text-sm cursor-not-allowed ${
            dm(dark, "bg-white/5 border-white/10 text-white/30", "bg-gray-50 border-gray-200 text-gray-400")
          }`}
        />
        <span className={`text-xs mt-1 block ${dm(dark, "text-white/30", "text-gray-300")}`}>Your email can't be changed yet.</span>
      </div>

      <div className="mb-5">
        <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ${dm(dark, "text-white/40", "text-gray-400")}`}>Phone number</label>
        <div className="relative">
          <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none ${dm(dark, "text-white/50", "text-gray-500")}`}>🇮🇳 +91</span>
          <input
            type="tel"
            value={phone}
            onChange={e => { const v = e.target.value.replace(/\D/g, ""); setPhone(v); setPhoneError(v && v.length < 10 ? "Phone must be exactly 10 digits." : ""); }}
            maxLength={10}
            placeholder="10-digit mobile number"
            className={`w-full pl-16 pr-10 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
              dark
                ? "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white"
                : "bg-white border-gray-200 text-gray-900 focus:border-red-400"
            }`}
          />
          {phone.length === 10 && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>}
        </div>
        {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
      </div>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
      <button onClick={handleSave} disabled={loading} className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold text-sm cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-60">
        {loading ? "Saving…" : "Save changes"}
      </button>
    </Modal>
  );
}

// ─── Activity / History Modal ─────────────────────────────────────────────────
function TaskSummaryCard({ task, dark }) {
  const accepted = task.accepted;
  return (
    <div className={`rounded-xl p-3 mb-2.5 text-sm border ${dm(dark, "bg-white/5 border-white/10", "bg-white border-gray-100")}`}>
      <p className={`font-semibold leading-snug mb-1 break-words ${dm(dark, "text-white", "text-gray-900")}`}>
        {task.text}
        <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-lg ${
          accepted
            ? dm(dark, "bg-green-500/20 text-green-400", "bg-green-50 text-green-700")
            : dm(dark, "bg-yellow-500/20 text-yellow-400", "bg-yellow-50 text-yellow-700")
        }`}>
          {accepted ? "Accepted" : "Pending"}
        </span>
      </p>
      <p className={`text-xs mt-1 ${dm(dark, "text-white/50", "text-gray-500")}`}>₹{task.price} • {task.mode === "now" ? "🟢 Now" : "🕒 " + formatDateTime(task.date, task.time)}</p>
      {accepted && task.helper && (
        <p className="text-xs text-green-500 font-semibold mt-1">✅ {task.helper.name} • {task.helper.phone}</p>
      )}
      {task.created_at && <p className={`text-xs mt-1 ${dm(dark, "text-white/25", "text-gray-300")}`}>{formatPostedDate(task.created_at)}</p>}
    </div>
  );
}

function ActivityModal({ open, onClose, tasks, dark }) {
  const pending  = tasks.filter(t => !t.accepted);
  const accepted = tasks.filter(t =>  t.accepted);
  return (
    <Modal open={open} onClose={onClose} dark={dark}>
      <ModalTag dark={dark}>Your Activity</ModalTag>
      <h2 className={`text-xl font-bold mb-4 ${dm(dark, "text-white", "text-gray-900")}`}>Task Status</h2>
      {tasks.length === 0 ? (
        <p className={`text-xs ${dm(dark, "text-white/40", "text-gray-400")}`}>You haven't posted any tasks yet.</p>
      ) : (
        <>
          {[
            { label: "🕒 Pending", list: pending, empty: "No pending tasks right now." },
            { label: "✅ Accepted", list: accepted, empty: "No accepted tasks yet." }
          ].map(({ label, list, empty }) => (
            <div key={label} className="mb-5">
              <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 ${dm(dark, "text-white/40", "text-gray-500")}`}>
                {label}
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${dm(dark, "bg-white/10 text-white/60", "bg-gray-100 text-gray-500")}`}>{list.length}</span>
              </div>
              {list.length === 0
                ? <p className={`text-xs ${dm(dark, "text-white/40", "text-gray-400")}`}>{empty}</p>
                : list.map(t => <TaskSummaryCard key={t.id} task={t} dark={dark} />)
              }
            </div>
          ))}
        </>
      )}
    </Modal>
  );
}

function HistoryModal({ open, onClose, tasks, dark }) {
  return (
    <Modal open={open} onClose={onClose} dark={dark}>
      <ModalTag dark={dark}>My Tasks</ModalTag>
      <h2 className={`text-xl font-bold mb-1 ${dm(dark, "text-white", "text-gray-900")}`}>Task History</h2>
      <p className={`text-xs mb-4 ${dm(dark, "text-white/40", "text-gray-400")}`}>Your most recent 10 tasks</p>
      <div className="max-h-[420px] overflow-y-auto">
        {tasks.length === 0
          ? <p className={`text-xs ${dm(dark, "text-white/40", "text-gray-400")}`}>No task history yet — post your first task to get started.</p>
          : tasks.slice(0, 10).map(t => <TaskSummaryCard key={t.id} task={t} dark={dark} />)
        }
      </div>
    </Modal>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────
function VerifiedSection({ currentUser, showToast, onRequireLogin, onOpenManage }) {
  if (currentUser?.phone) return null;
  return (
    <div className="mx-auto max-w-[1200px] my-16 bg-gradient-to-br from-red-600 to-red-400 rounded-2xl p-10 text-white">
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

function HowItWorks({ dark }) {
  return (
    <div className={`py-16 px-5 text-center border-t-2 ${dm(dark, "bg-black border-white/10", "bg-white border-gray-100")}`}>
      <h2 className={`text-2xl font-bold mb-10 ${dm(dark, "text-white", "text-gray-900")}`}>How Padosi works</h2>
      <div className="flex justify-center gap-10 flex-wrap">
        {[
          { img: "https://cdn-icons-png.flaticon.com/512/1828/1828919.png", label: "Post your task" },
          { img: "https://cdn-icons-png.flaticon.com/512/942/942748.png",   label: "Get responses" },
          { img: "https://cdn-icons-png.flaticon.com/512/190/190411.png",   label: "Get it done" },
        ].map(({ img, label }) => (
          <div key={label} className="max-w-[200px] flex flex-col items-center gap-4">
            <img src={img} className={`w-20 ${dm(dark, "invert opacity-80", "")}`} alt={label} />
            <h3 className={`font-bold ${dm(dark, "text-white", "text-gray-900")}`}>{label}</h3>
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

  useEffect(() => {
    // Only set body background — all component colors are handled via dark prop
    document.body.style.background = darkMode ? "#000000" : "";
    localStorage.setItem("padosi-theme", darkMode ? "dark" : "default");
  }, [darkMode]);

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
        dark={darkMode}
      />

      <VerifiedSection
        currentUser={currentUser}
        showToast={showToast}
        onRequireLogin={() => setLoginOpen(true)}
        onOpenManage={() => setManageOpen(true)}
      />
      <HowItWorks dark={darkMode} />

      <AuthModals
        loginOpen={loginOpen}
        signupOpen={signupOpen}
        onClose={type => type === "login" ? setLoginOpen(false) : setSignupOpen(false)}
        onLogin={handleLogin}
        onSignup={handleLogin}
        showToast={showToast}
        dark={darkMode}
      />
      <ManageAccountModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        currentUser={currentUser}
        onUpdate={setCurrentUser}
        showToast={showToast}
        dark={darkMode}
      />
      <ActivityModal open={activityOpen} onClose={() => setActivityOpen(false)} tasks={tasks} dark={darkMode} />
      <HistoryModal  open={historyOpen}  onClose={() => setHistoryOpen(false)}  tasks={tasks} dark={darkMode} />

      <Toast message={toastMsg} />
    </div>
  );
}