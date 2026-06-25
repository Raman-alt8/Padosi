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
function dm(dark, darkCls, lightCls) {
  return dark ? darkCls : lightCls;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, dark }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-sm font-semibold z-[9999] pointer-events-none transition-all duration-300 ${
        dark ? "bg-white text-black" : "bg-[#111] text-white"
      } ${message ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
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
      <div className={`rounded-2xl p-9 w-full ${maxWidth} relative border ${
        dark
          ? "bg-black text-white border-white shadow-none"
          : "bg-white text-[#111] border-transparent shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
      }`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-5 text-2xl leading-none bg-transparent border-none cursor-pointer ${
            dark ? "text-[#888] hover:text-white" : "text-[#999] hover:text-[#ff2d55]"
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
    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 border ${
      dark
        ? "bg-black text-white border-white"
        : "bg-[#fff0f3] text-[#ff2d55] border-transparent"
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
    <div className={`rounded-xl p-2.5 mb-2.5 text-sm ${
      dark ? "bg-black border border-white" : "bg-[#f4f4f4]"
    }`}>
      <p className={`font-semibold mb-1.5 leading-snug break-words ${dark ? "text-white" : "text-[#111]"}`}>{task.text}</p>
      <div className={`flex items-center gap-2 flex-wrap text-xs ${dark ? "text-[#aaa]" : "text-[#888]"}`}>
        <span className={`font-bold px-2 py-0.5 rounded-lg ${
          dark ? "bg-black text-white border border-white" : "bg-[#fff0f3] text-[#ff2d55]"
        }`}>₹{task.price}</span>
        <span>{modeLabel}</span>
      </div>

      {state !== "accepted" ? (
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={handleAccept}
            disabled={state === "loading"}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-60 cursor-pointer border-none ${
              dark
                ? "bg-white text-black hover:bg-[#1a9e4a] hover:text-white"
                : "bg-[#111] text-white hover:bg-[#1a9e4a]"
            }`}
          >
            {state === "loading" ? "Sending…" : "🤝 Accept"}
          </button>
          <button
            onClick={handleDecline}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
              dark
                ? "bg-black text-[#aaa] border-white hover:bg-white hover:text-black"
                : "bg-[#f0f0f0] text-[#888] border-transparent hover:bg-[#ffe0e6] hover:text-[#ff2d55]"
            }`}
          >
            ✕ Decline
          </button>
        </div>
      ) : (
        <div className="mt-2">
          <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 mb-1.5 border ${
            dark ? "bg-black border-white" : "bg-white border-[#eee]"
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              dark ? "bg-black text-white border border-white" : "bg-[#fff0f3] text-[#ff2d55]"
            }`}>
              {poster?.initials || "U"}
            </span>
            {poster?.phone
              ? <span className={`text-xs font-bold ${dark ? "text-white" : "text-[#111]"}`}>+91 {poster.phone}</span>
              : <span className={`text-xs italic ${dark ? "text-[#666]" : "text-[#aaa]"}`}>No phone on file</span>
            }
          </div>
          <div className="flex gap-1.5">
            {poster?.phone && (
              <a href={`tel:${poster.phone}`} className="flex-1 py-1.5 rounded-lg bg-[#1a9e4a] text-white text-xs font-bold text-center no-underline">📞 Call</a>
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
                dark ? "bg-white text-black hover:bg-[#ddd]" : "bg-[#111] text-white hover:bg-[#2a2a2a]"
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
    <div className={`w-64 rounded-2xl p-4 max-h-[480px] overflow-y-auto flex-shrink-0 border ${
      dark
        ? "bg-black border-white shadow-none"
        : "bg-white border-transparent shadow-[0_15px_40px_rgba(0,0,0,0.1)]"
    }`}>
      <div className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${dark ? "text-[#888]" : "text-[#999]"}`}>
        <span className="w-2 h-2 rounded-full bg-[#1a9e4a] inline-block animate-pulse" />
        Nearby Tasks
      </div>
      {tasks.length === 0
        ? <p className={`text-xs text-center py-4 ${dark ? "text-[#888]" : "text-[#bbb]"}`}>No nearby tasks right now.</p>
        : tasks.map(t => <NearbyTaskCard key={t.id} task={t} showToast={showToast} dark={dark} />)
      }
    </div>
  );
}

// ─── My Task Card ─────────────────────────────────────────────────────────────
function MyTaskCard({ task, onEdit, onDelete, dark }) {
  return (
    <div className={`rounded-xl p-3 mb-2.5 text-sm border ${
      dark ? "bg-black border-white" : "bg-white border-[#eee]"
    }`}>
      <p className={`font-semibold leading-snug mb-1 break-words ${dark ? "text-white" : "text-[#111]"}`}>
        {task.text}
        <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-lg border ${
          task.accepted
            ? dark ? "bg-black text-white border-white" : "bg-[#e3fbe8] text-[#1a9e4a] border-transparent"
            : dark ? "bg-black text-white border-white" : "bg-[#fff3cd] text-[#856404] border-transparent"
        }`}>
          {task.accepted ? "Accepted" : "Pending"}
        </span>
      </p>
      <p className={`text-xs mt-1 ${dark ? "text-[#aaa]" : "text-[#888]"}`}>
        ₹{task.price} • {task.mode === "now" ? "🟢 Now" : "🕒 " + formatDateTime(task.date, task.time)}
      </p>

      {task.accepted && task.helper && (
        <div className={`mt-2 border rounded-xl p-2.5 ${dark ? "border-white" : "border-[#eee]"}`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
              dark ? "bg-black text-white border border-white" : "bg-[#fff0f3] text-[#ff2d55]"
            }`}>
              {task.helper.initials}
            </span>
            <div>
              <p className={`text-xs font-bold ${dark ? "text-white" : "text-[#111]"}`}>{task.helper.name} ✅</p>
              <p className="text-xs text-[#ff9500]">{renderStars(task.helper.rating)} {task.helper.rating.toFixed(1)} ({task.helper.reviews})</p>
            </div>
          </div>
          <div className={`flex justify-between items-center mt-2 pt-2 border-t ${dark ? "border-white" : "border-[#f0f0f0]"}`}>
            <span className={`text-xs font-semibold ${dark ? "text-[#ccc]" : "text-[#555]"}`}>{task.helper.phone}</span>
            <a href={`tel:${task.helper.phone?.replace(/\s/g, "")}`} className="text-xs bg-[#1a9e4a] text-white px-3 py-1.5 rounded-lg no-underline font-bold">📞 Call</a>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-2 flex-wrap">
        <button onClick={() => onEdit(task)} className={`text-xs font-semibold px-3 py-1 rounded-lg cursor-pointer border transition-colors ${
          dark
            ? "bg-black text-white border-white hover:bg-[#1a1a1a]"
            : "bg-[#e8eaff] text-[#4453ff] border-transparent hover:bg-[#d0d3ff]"
        }`}>Edit</button>
        <button onClick={() => onDelete(task.id)} className={`text-xs font-semibold px-3 py-1 rounded-lg cursor-pointer border transition-colors ${
          dark
            ? "bg-black text-white border-white hover:bg-[#1a1a1a]"
            : "bg-[#ffe0e6] text-[#ff2d55] border-transparent hover:bg-[#ffccd5]"
        }`}>Delete</button>
      </div>
    </div>
  );
}

// ─── Tasks Sidebar ────────────────────────────────────────────────────────────
function TasksSidebar({ tasks, visible, onEdit, onDelete, dark }) {
  return (
    <div className={`transition-all duration-500 ease-in-out overflow-hidden flex-shrink-0 ${visible ? "w-[300px] min-w-[300px] opacity-100" : "w-0 min-w-0 opacity-0"}`}>
      <div className="w-[300px] px-5 pt-6 pb-6">
        <h3 className={`text-sm font-bold flex items-center gap-2 mb-1 ${dark ? "text-white" : "text-[#111]"}`}>
          <span className="text-[#ff2d55]">✅</span> My Tasks
        </h3>
        <p className={`text-xs mb-4 ${dark ? "text-[#888]" : "text-[#999]"}`}>Track the tasks you've posted</p>
        <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto">
          {tasks.length === 0
            ? <p className={`text-xs text-center py-5 ${dark ? "text-[#888]" : "text-[#bbb]"}`}>No tasks yet — post one to get started.</p>
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

  // Input class — matches file 2's input styling
  const inputCls = `px-4 py-3.5 rounded-xl border text-sm focus:outline-none transition-colors ${
    dark
      ? "bg-black border-white text-white placeholder:text-[#666] focus:border-white"
      : "bg-white border-[#ddd] text-[#111] placeholder:text-[#aaa] focus:border-[#ff2d55]"
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
            <div className={`rounded-2xl p-8 w-full border ${
              dark
                ? "bg-black border-white shadow-none"
                : "bg-white border-transparent shadow-[0_10px_40px_rgba(0,0,0,0.06)]"
            }`}>
              <div className="flex justify-between items-start gap-10 flex-wrap">
                <div className="flex-1 min-w-0">
                  {/* Location button */}
                  <button
                    onClick={handleLocationClick}
                    className={`inline-flex items-center gap-1.5 border px-4 py-2 rounded-full text-sm font-semibold cursor-pointer mb-4 transition-colors ${
                      dark
                        ? "bg-black text-[#aaa] border-white hover:bg-white hover:text-black"
                        : "bg-[#f3f3f3] text-[#555] border-transparent hover:bg-[#ffe0e6] hover:text-[#ff2d55]"
                    }`}
                  >
                    📍 {locationName}
                  </button>

                  <h1 className={`text-4xl font-bold leading-tight mb-4 ${dark ? "text-white" : "text-[#111]"}`}>
                    Get help nearby with <br />
                    <span className={`text-5xl ${dark ? "text-white underline" : "text-[#ff2d55]"}`}>Padosi</span>
                  </h1>

                  {/* Mode toggle */}
                  <div className={`inline-flex rounded-full p-1 mb-4 border ${
                    dark ? "bg-black border-white" : "bg-[#f3f3f3] border-transparent"
                  }`}>
                    {["now", "later"].map(m => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-4 py-2.5 rounded-full text-sm cursor-pointer border-none transition-all ${
                          mode === m
                            ? dark
                              ? "bg-white text-black font-semibold"
                              : "bg-white shadow text-[#111] font-semibold"
                            : dark
                              ? "text-[#aaa] hover:text-white bg-transparent"
                              : "text-[#555] hover:text-[#111] bg-transparent"
                        }`}
                      >
                        {m === "now" ? "Call now" : "Schedule later"}
                      </button>
                    ))}
                  </div>

                  {/* Input card */}
                  <div className={`mt-2 p-4 rounded-2xl border ${
                    dark ? "bg-black border-white" : "bg-[#fafafa] border-transparent"
                  }`}>
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

                    <p className={`text-xs mt-1.5 ${
                      taskText.length >= MAX_CHARS
                        ? "text-[#ff2d55] font-semibold"
                        : dark ? "text-[#888]" : "text-[#999]"
                    }`}>
                      {taskText.length} / {MAX_CHARS} characters
                    </p>

                    {mode === "later" && (
                      <div className="flex gap-3 flex-wrap mt-3">
                        <input type="date" value={date} min={today} onChange={e => setDate(e.target.value)} className={inputCls} />
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} />
                      </div>
                    )}

                    {error && <p className="text-[#ff2d55] text-xs mt-2 font-medium">⚠️ {error}</p>}

                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-7 py-3.5 rounded-xl bg-[#ff2d55] text-white font-semibold text-sm hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-60 disabled:translate-y-0 cursor-pointer border-none"
                      >
                        {loading ? "Saving…" : editingId ? "Save Changes" : "Find Help"}
                      </button>
                      {editingId && (
                        <button
                          onClick={exitEditMode}
                          className={`px-7 py-3.5 rounded-xl border font-semibold text-sm transition-colors cursor-pointer bg-transparent ${
                            dark
                              ? "border-white text-[#aaa] hover:bg-[#1a1a1a]"
                              : "border-[#ddd] text-[#555] hover:bg-[#f3f3f3]"
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
        <h2 className={`text-xl font-bold mb-4 ${dark ? "text-white" : "text-[#111]"}`}>Choose your location</h2>
        {mapSrc && <iframe src={mapSrc} className="w-full h-80 rounded-xl border-none" allowFullScreen loading="lazy" />}
        <p className={`text-xs mt-2.5 text-center ${dark ? "text-[#888]" : "text-[#888]"}`}>{mapLabel}</p>
        <button
          onClick={() => setShowMap(false)}
          className={`mt-4 w-full py-3 rounded-xl font-semibold cursor-pointer border-none transition-opacity hover:opacity-90 ${
            dark ? "bg-white text-black" : "bg-[#ff2d55] text-white"
          }`}
        >
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

  // Input styling matching file 2
  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
    dark
      ? "bg-black border-white text-white placeholder:text-[#666] focus:border-white"
      : "bg-white border-[#ddd] text-[#111] placeholder:text-[#aaa] focus:border-[#ff2d55]"
  }`;

  // Google button matching file 2's .google-btn
  const GoogleButton = () => (
    <a
      href="/auth/google"
      className={`flex items-center justify-center gap-3 w-full py-3 rounded-xl border-2 text-sm font-semibold transition-all no-underline ${
        dark
          ? "border-white bg-black text-white hover:bg-[#1a1a1a]"
          : "border-[#ddd] bg-white text-[#333] hover:border-[#bbb] hover:shadow-md"
      }`}
    >
      <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 flex-shrink-0" alt="Google" />
      <span>Continue with Google</span>
    </a>
  );

  // Divider matching file 2's .or-divider
  const Divider = () => (
    <div className={`flex items-center gap-2.5 text-xs ${dark ? "text-[#888]" : "text-[#bbb]"}`}>
      <span className={`flex-1 h-px ${dark ? "bg-white" : "bg-[#eee]"}`} />
      or
      <span className={`flex-1 h-px ${dark ? "bg-white" : "bg-[#eee]"}`} />
    </div>
  );

  // Submit button matching file 2's .auth-submit-btn
  const submitBtnCls = `py-3 rounded-xl font-semibold text-sm cursor-pointer border-none transition-opacity disabled:opacity-60 mt-1 ${
    dark ? "bg-white text-black hover:opacity-80" : "bg-[#ff2d55] text-white hover:opacity-90"
  }`;

  return (
    <>
      {/* Login */}
      <Modal open={loginOpen} onClose={() => onClose("login")} dark={dark}>
        <ModalTag dark={dark}>Welcome back</ModalTag>
        <h2 className={`text-xl font-bold mb-4 ${dark ? "text-white" : "text-[#111]"}`}>Log in to Padosi</h2>
        <div className="flex flex-col gap-3">
          <GoogleButton />
          <Divider />
          <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} onKeyPress={e => e.key === "Enter" && handleLogin()} placeholder="Email address" className={inputCls} />
          <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyPress={e => e.key === "Enter" && handleLogin()} placeholder="Password" className={inputCls} />
          {loginError && <p className="text-[#ff2d55] text-xs font-medium">{loginError}</p>}
          <button onClick={handleLogin} disabled={loginLoading} className={submitBtnCls}>
            {loginLoading ? "Logging in…" : "Log in"}
          </button>
        </div>
        <p className={`text-xs text-center mt-3 ${dark ? "text-[#888]" : "text-[#666]"}`}>
          Don't have an account?{" "}
          <button onClick={() => onClose("login")} className={`font-semibold bg-transparent border-none cursor-pointer ${
            dark ? "text-white underline" : "text-[#ff2d55]"
          }`}>Sign up</button>
        </p>
      </Modal>

      {/* Signup */}
      <Modal open={signupOpen} onClose={() => onClose("signup")} dark={dark}>
        <ModalTag dark={dark}>Join Padosi</ModalTag>
        <h2 className={`text-xl font-bold mb-4 ${dark ? "text-white" : "text-[#111]"}`}>Create your account</h2>
        <div className="flex flex-col gap-3">
          <GoogleButton />
          <Divider />
          <input type="text" value={signupName} onChange={e => setSignupName(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSignup()} placeholder="Full name" className={inputCls} />
          <input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSignup()} placeholder="Email address" className={inputCls} />
          <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSignup()} placeholder="Password (min 6 characters)" className={inputCls} />
          {signupError && <p className="text-[#ff2d55] text-xs font-medium">{signupError}</p>}
          <button onClick={handleSignup} disabled={signupLoading} className={submitBtnCls}>
            {signupLoading ? "Creating account…" : "Sign up"}
          </button>
        </div>
        <p className={`text-xs text-center mt-3 ${dark ? "text-[#888]" : "text-[#666]"}`}>
          Already have an account?{" "}
          <button onClick={() => onClose("signup")} className={`font-semibold bg-transparent border-none cursor-pointer ${
            dark ? "text-white underline" : "text-[#ff2d55]"
          }`}>Log in</button>
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

  // Input class — matches file 2 .manage-field input
  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
    dark
      ? "bg-black border-white text-white placeholder:text-[#666] focus:border-white"
      : "bg-white border-[#ddd] text-[#111] focus:border-[#ff2d55]"
  }`;

  return (
    <Modal open={open} onClose={onClose} dark={dark}>
      <ModalTag dark={dark}>Account settings</ModalTag>
      <h2 className={`text-xl font-bold mb-5 ${dark ? "text-white" : "text-[#111]"}`}>Manage account</h2>

      <div className="flex items-center gap-3.5 mb-6">
        <span className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 border ${
          dark ? "bg-black text-white border-white" : "bg-[#fff0f3] text-[#ff2d55] border-transparent"
        }`}>{initial}</span>
        <div>
          <p className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>{currentUser?.full_name || "User"}</p>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 mt-1 border ${
            verified
              ? dark ? "bg-black text-white border-white" : "bg-[#e3fbe8] text-[#1a9e4a] border-transparent"
              : dark ? "bg-black text-white border-white" : "bg-[#fff3cd] text-[#856404] border-transparent"
          }`}>
            {verified ? "✅ Verified member" : "⚠️ Not verified — add a phone"}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ${dark ? "text-[#888]" : "text-[#999]"}`}>Full name</label>
        <input value={name} onChange={e => setName(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSave()} className={inputCls} />
      </div>

      <div className="mb-4">
        <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ${dark ? "text-[#888]" : "text-[#999]"}`}>Email address</label>
        <input
          value={currentUser?.email || ""}
          disabled
          className={`w-full px-4 py-3 rounded-xl border text-sm cursor-not-allowed ${
            dark
              ? "bg-[#1a1a1a] border-[#333] text-[#555]"
              : "bg-[#f6f7fb] border-[#ddd] text-[#999]"
          }`}
        />
        <span className={`text-xs mt-1 block ${dark ? "text-[#666]" : "text-[#bbb]"}`}>Your email can't be changed yet.</span>
      </div>

      <div className="mb-5">
        <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ${dark ? "text-[#888]" : "text-[#999]"}`}>Phone number</label>
        <div className="relative">
          <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none ${dark ? "text-[#888]" : "text-[#555]"}`}>🇮🇳 +91</span>
          <input
            type="tel"
            value={phone}
            onChange={e => { const v = e.target.value.replace(/\D/g, ""); setPhone(v); setPhoneError(v && v.length < 10 ? "Phone must be exactly 10 digits." : ""); }}
            maxLength={10}
            placeholder="10-digit mobile number"
            className={`w-full pl-16 pr-10 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
              dark
                ? "bg-black border-white text-white placeholder:text-[#666]"
                : "bg-white border-[#ddd] text-[#111] focus:border-[#ff2d55]"
            }`}
          />
          {phone.length === 10 && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a9e4a]">✓</span>}
        </div>
        {phoneError && <p className="text-[#ff2d55] text-xs mt-1">{phoneError}</p>}
      </div>

      {error && <p className="text-[#ff2d55] text-xs mb-3">{error}</p>}
      <button onClick={handleSave} disabled={loading} className={`w-full py-3 rounded-xl font-semibold text-sm cursor-pointer border-none transition-opacity disabled:opacity-60 ${
        dark ? "bg-white text-black hover:opacity-80" : "bg-[#ff2d55] text-white hover:opacity-90"
      }`}>
        {loading ? "Saving…" : "Save changes"}
      </button>
    </Modal>
  );
}

// ─── Activity / History Modal ─────────────────────────────────────────────────
function TaskSummaryCard({ task, dark }) {
  const accepted = task.accepted;
  return (
    <div className={`rounded-xl p-3 mb-2.5 text-sm border ${dark ? "bg-black border-white" : "bg-white border-[#eee]"}`}>
      <p className={`font-semibold leading-snug mb-1 break-words ${dark ? "text-white" : "text-[#111]"}`}>
        {task.text}
        <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-lg border ${
          accepted
            ? dark ? "bg-black text-white border-white" : "bg-[#e3fbe8] text-[#1a9e4a] border-transparent"
            : dark ? "bg-black text-white border-white" : "bg-[#fff3cd] text-[#856404] border-transparent"
        }`}>
          {accepted ? "Accepted" : "Pending"}
        </span>
      </p>
      <p className={`text-xs mt-1 ${dark ? "text-[#aaa]" : "text-[#888]"}`}>₹{task.price} • {task.mode === "now" ? "🟢 Now" : "🕒 " + formatDateTime(task.date, task.time)}</p>
      {accepted && task.helper && (
        <p className="text-xs text-[#1a9e4a] font-semibold mt-1">✅ {task.helper.name} • {task.helper.phone}</p>
      )}
      {task.created_at && <p className={`text-xs mt-1 ${dark ? "text-[#555]" : "text-[#bbb]"}`}>{formatPostedDate(task.created_at)}</p>}
    </div>
  );
}

function ActivityModal({ open, onClose, tasks, dark }) {
  const pending  = tasks.filter(t => !t.accepted);
  const accepted = tasks.filter(t =>  t.accepted);
  return (
    <Modal open={open} onClose={onClose} dark={dark}>
      <ModalTag dark={dark}>Your Activity</ModalTag>
      <h2 className={`text-xl font-bold mb-4 ${dark ? "text-white" : "text-[#111]"}`}>Task Status</h2>
      {tasks.length === 0 ? (
        <p className={`text-xs ${dark ? "text-[#888]" : "text-[#bbb]"}`}>You haven't posted any tasks yet.</p>
      ) : (
        <>
          {[
            { label: "🕒 Pending", list: pending, empty: "No pending tasks right now." },
            { label: "✅ Accepted", list: accepted, empty: "No accepted tasks yet." }
          ].map(({ label, list, empty }) => (
            <div key={label} className="mb-5">
              <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 ${dark ? "text-[#888]" : "text-[#555]"}`}>
                {label}
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full border ${
                  dark ? "bg-black text-[#aaa] border-white" : "bg-[#f0f0f0] text-[#888] border-transparent"
                }`}>{list.length}</span>
              </div>
              {list.length === 0
                ? <p className={`text-xs ${dark ? "text-[#888]" : "text-[#bbb]"}`}>{empty}</p>
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
      <h2 className={`text-xl font-bold mb-1 ${dark ? "text-white" : "text-[#111]"}`}>Task History</h2>
      <p className={`text-xs mb-4 ${dark ? "text-[#888]" : "text-[#999]"}`}>Your most recent 10 tasks</p>
      <div className="max-h-[420px] overflow-y-auto">
        {tasks.length === 0
          ? <p className={`text-xs ${dark ? "text-[#888]" : "text-[#bbb]"}`}>No task history yet — post your first task to get started.</p>
          : tasks.slice(0, 10).map(t => <TaskSummaryCard key={t.id} task={t} dark={dark} />)
        }
      </div>
    </Modal>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────
function VerifiedSection({ currentUser, showToast, onRequireLogin, onOpenManage, dark }) {
  if (currentUser?.phone) return null;
  return (
    <div className={`mx-auto max-w-[1200px] my-16 rounded-2xl p-10 ${
      dark
        ? "bg-black border border-white text-white"
        : "bg-gradient-to-br from-[#ff2d55] to-[#ff6b81] text-white"
    }`}>
      <div className="flex items-center justify-between gap-10 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold mb-2">Become a Verified Member</h2>
          <p className="mb-5 opacity-90">Earn money by helping people nearby.</p>
          <button
            onClick={() => {
              if (!currentUser) { showToast("👋 Please log in first"); onRequireLogin(); return; }
              onOpenManage();
            }}
            className={`px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer border-none hover:opacity-90 transition-opacity ${
              dark ? "bg-white text-black" : "bg-white text-[#ff2d55]"
            }`}
          >
            Get Verified
          </button>
        </div>
        <img
          src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
          className={`w-48 opacity-90 ${dark ? "invert" : ""}`}
          alt="Verified"
        />
      </div>
    </div>
  );
}

function HowItWorks({ dark }) {
  const steps = [
    { img: "https://cdn-icons-png.flaticon.com/512/1828/1828919.png", label: "Post your task" },
    { img: "https://cdn-icons-png.flaticon.com/512/942/942748.png",   label: "Get responses" },
    { img: "https://cdn-icons-png.flaticon.com/512/190/190411.png",   label: "Get it done" },
  ];

  return (
    <div className={`py-16 px-5 text-center border-t-2 ${dark ? "bg-black border-white" : "bg-white border-[#f0f0f0]"}`}>
      <h2 className={`text-2xl font-bold mb-10 ${dark ? "text-white" : "text-[#111]"}`}>How Padosi works</h2>
      <div className="flex justify-center gap-10 flex-wrap">
        {steps.map(({ img, label }) => (
          <div key={label} className="max-w-[200px] flex flex-col items-center gap-4">
            {dark ? (
              /* In dark mode, file 2 wraps icons in a white circle */
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center p-3.5 box-border">
                <img src={img} className="w-full h-full object-contain" alt={label} />
              </div>
            ) : (
              <img src={img} className="w-20" alt={label} />
            )}
            <h3 className={`font-bold ${dark ? "text-white" : "text-[#111]"}`}>{label}</h3>
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
    // Match file 2: pure #000 body in dark, clear in light
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
    <div className={darkMode ? "bg-black text-white min-h-screen" : "bg-[#f6f7fb] text-[#111] min-h-screen"}>
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
        dark={darkMode}
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

      <Toast message={toastMsg} dark={darkMode} />
    </div>
  );
}