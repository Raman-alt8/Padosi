import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "./Components/Navbar";
import HowItWorks from "./Components/HowItWorks";
import HeroSection from "./Components/HeroSection";
import VerifiedSection from "./Components/VerifiedSection";
import { Modal, ModalTag } from "./Components/Modal";
import { api, formatDateTime, formatPostedDate } from "./utils";

// ─── Toast ───────────────────────────────────────────────────
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
      ? "bg-black border-white text-white placeholder:text-[#666] focus:border-white"
      : "bg-white border-[#ddd] text-[#111] placeholder:text-[#aaa] focus:border-[#ff2d55]"
  }`;

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

  const Divider = () => (
    <div className={`flex items-center gap-2.5 text-xs ${dark ? "text-[#888]" : "text-[#bbb]"}`}>
      <span className={`flex-1 h-px ${dark ? "bg-white" : "bg-[#eee]"}`} />
      or
      <span className={`flex-1 h-px ${dark ? "bg-white" : "bg-[#eee]"}`} />
    </div>
  );

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

// ─── Manage Account Modal ──
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

// ─── Activity / History Modal ──────────
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

// ─── Root App ───
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
        onAbout={() => showToast("ℹ️ About — coming soon!")}
        onHelp={() => showToast("❓ Help — coming soon!")}
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