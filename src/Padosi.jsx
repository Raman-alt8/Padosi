import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "./Components/Navbar";
import PadosiListings from "./Components/PadosiListings";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_CHARS = 1000;

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
function HeroSection({ currentUser, tasks, setTasks, nearbyTasks, showToast, onRequireLogin }) {
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
                        className="flex-1 min-w-[200px] px-4 py-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-red-400 bg-white"
                      />
                      <input
                        type="text"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        onKeyPress={e => e.key === "Enter" && handleSubmit()}
                        placeholder="Your budget (₹)"
                        className="w-40 px-4 py-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-red-400 bg-white"
                      />
                    </div>

                    <p className={`text-xs mt-1.5 ${taskText.length >= MAX_CHARS ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                      {taskText.length} / {MAX_CHARS} characters
                    </p>

                    {mode === "later" && (
                      <div className="flex gap-3 flex-wrap mt-3">
                        <input type="date" value={date} min={today} onChange={e => setDate(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-red-400 bg-white" />
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-red-400 bg-white" />
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
            <PadosiListings showToast={showToast} currentUser={currentUser} onSelectCategory={prefillCategory} />

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
    </>
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

  // ── Shared Google button ────────────────────────────────────────────
  const GoogleButton = () => (
    <a
      href="/auth/google"
      className="flex items-center justify-center gap-3 w-full py-3 rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-gray-300 hover:shadow-md transition-all no-underline"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
    >
      <img
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        className="w-5 h-5 flex-shrink-0"
        alt="Google"
      />
      <span>Continue with Google</span>
    </a>
  );

  // ── Divider ─────────────────────────────────────────────────────────
  const Divider = () => (
    <div className="flex items-center gap-2.5 text-xs text-gray-300">
      <span className="flex-1 h-px bg-gray-100" /> or <span className="flex-1 h-px bg-gray-100" />
    </div>
  );

  return (
    <>
      {/* ── Login modal ── */}
      <Modal open={loginOpen} onClose={() => onClose("login")}>
        <ModalTag>Welcome back</ModalTag>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Log in to Padosi</h2>
        <div className="flex flex-col gap-3">
          <GoogleButton />
          <Divider />
          <input
            type="email"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            onKeyPress={e => e.key === "Enter" && handleLogin()}
            placeholder="Email address"
            className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-red-400"
          />
          <input
            type="password"
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
            onKeyPress={e => e.key === "Enter" && handleLogin()}
            placeholder="Password"
            className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-red-400"
          />
          {loginError && <p className="text-red-500 text-xs font-medium">{loginError}</p>}
          <button
            onClick={handleLogin}
            disabled={loginLoading}
            className="py-3 rounded-xl bg-red-500 text-white font-semibold text-sm cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-60 mt-1"
          >
            {loginLoading ? "Logging in…" : "Log in"}
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-3">
          Don't have an account?{" "}
          <button onClick={() => onClose("login")} className="text-red-500 font-semibold bg-transparent border-none cursor-pointer">
            Sign up
          </button>
        </p>
      </Modal>

      {/* ── Signup modal ── */}
      <Modal open={signupOpen} onClose={() => onClose("signup")}>
        <ModalTag>Join Padosi</ModalTag>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create your account</h2>
        <div className="flex flex-col gap-3">
          <GoogleButton />
          <Divider />
          <input
            type="text"
            value={signupName}
            onChange={e => setSignupName(e.target.value)}
            onKeyPress={e => e.key === "Enter" && handleSignup()}
            placeholder="Full name"
            className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-red-400"
          />
          <input
            type="email"
            value={signupEmail}
            onChange={e => setSignupEmail(e.target.value)}
            onKeyPress={e => e.key === "Enter" && handleSignup()}
            placeholder="Email address"
            className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-red-400"
          />
          <input
            type="password"
            value={signupPassword}
            onChange={e => setSignupPassword(e.target.value)}
            onKeyPress={e => e.key === "Enter" && handleSignup()}
            placeholder="Password (min 6 characters)"
            className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-red-400"
          />
          {signupError && <p className="text-red-500 text-xs font-medium">{signupError}</p>}
          <button
            onClick={handleSignup}
            disabled={signupLoading}
            className="py-3 rounded-xl bg-red-500 text-white font-semibold text-sm cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-60 mt-1"
          >
            {signupLoading ? "Creating account…" : "Sign up"}
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-3">
          Already have an account?{" "}
          <button onClick={() => onClose("signup")} className="text-red-500 font-semibold bg-transparent border-none cursor-pointer">
            Log in
          </button>
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
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyPress={e => e.key === "Enter" && handleSave()}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-red-400"
        />
      </div>

      <div className="mb-4">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Email address</label>
        <input
          value={currentUser?.email || ""}
          disabled
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
        />
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
            className="w-full pl-16 pr-10 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-red-400"
          />
          {phone.length === 10 && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">✓</span>}
        </div>
        {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
      </div>

      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold text-sm cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-60"
      >
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
          {[
            { label: "🕒 Pending", list: pending, empty: "No pending tasks right now." },
            { label: "✅ Accepted", list: accepted, empty: "No accepted tasks yet." }
          ].map(({ label, list, empty }) => (
            <div key={label} className="mb-5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                {label}
                <span className="ml-auto bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">{list.length}</span>
              </div>
              {list.length === 0
                ? <p className="text-xs text-gray-400">{empty}</p>
                : list.map(t => <TaskSummaryCard key={t.id} task={t} />)
              }
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
      />

      <VerifiedSection
        currentUser={currentUser}
        showToast={showToast}
        onRequireLogin={() => setLoginOpen(true)}
        onOpenManage={() => setManageOpen(true)}
      />
      <HowItWorks />

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