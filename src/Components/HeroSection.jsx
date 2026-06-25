import { useState, useCallback } from "react";
import PadosiListings from "./PadosiListings";
import { Modal, ModalTag } from "./Modal";
import { api, formatDateTime, MAX_CHARS, renderStars } from "../utils";

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
export default function HeroSection({ currentUser, tasks, setTasks, nearbyTasks, showToast, onRequireLogin, dark }) {
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
