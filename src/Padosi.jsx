import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "./Components/Navbar";
import HowItWorks from "./Components/HowItWorks";
import HeroSection from "./Components/HeroSection";
import VerifiedSection from "./Components/VerifiedSection";
import { Modal, ModalTag } from "./Components/Modal";
import { DeleteAccountModal, ActivityModal, HistoryModal, AboutModal, HelpModal } from "./Components/AccountModals";
import { SettingsPage } from "./Components/SettingsPage";
import { api } from "./utils";
import { useWishlist } from "./Components/WishlistContext";
import WishlistPage from "./Components/WishlistPage";

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
    <a href="/auth/google" className={`flex items-center justify-center gap-3 w-full py-3 rounded-xl border-2 text-sm font-semibold transition-all no-underline ${
      dark
        ? "border-white bg-black text-white hover:bg-[#1a1a1a]"
        : "border-[#ddd] bg-white text-[#333] hover:border-[#bbb] hover:shadow-md"
    }`}>
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

// ─── Root App ───
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [nearbyTasks, setNearbyTasks] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("padosi-theme") === "dark");
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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

  const handleAccountDeleted = () => {
    setCurrentUser(null);
    setTasks([]);
    setNearbyTasks([]);
    setDeleteAccountOpen(false);
    setSettingsOpen(false);
  };

  return (
    // WishlistProvider wraps the whole tree so any card anywhere — vehicle,
    // ticket, service — can call useWishlist(), and the navbar heart /
    // WishlistPage below always see the same shared, localStorage-backed list.
    <WishlistProvider>
      <div className={darkMode ? "bg-black text-white min-h-screen" : "bg-[#f6f7fb] text-[#111] min-h-screen"}>
        <Navbar
          currentUser={currentUser}
          onLogin={() => setLoginOpen(true)}
          onSignup={() => setSignupOpen(true)}
          onSignout={handleSignout}
          onManageAccount={() => setSettingsOpen(true)}
          onMyTasks={() => setHistoryOpen(true)}
          onActivity={() => setActivityOpen(true)}
          showToast={showToast}
          darkMode={darkMode}
          onToggleDark={setDarkMode}
          onAbout={() => setAboutOpen(true)}
          onHelp={() => setHelpOpen(true)}
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
          onUpdate={setCurrentUser}
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

        <SettingsPage
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          currentUser={currentUser}
          onUpdate={setCurrentUser}
          onDeleteAccount={() => setDeleteAccountOpen(true)}
          showToast={showToast}
          dark={darkMode}
        />
        <DeleteAccountModal
          open={deleteAccountOpen}
          onClose={() => setDeleteAccountOpen(false)}
          currentUser={currentUser}
          onDeleted={handleAccountDeleted}
          showToast={showToast}
          dark={darkMode}
        />
        <ActivityModal open={activityOpen} onClose={() => setActivityOpen(false)} tasks={tasks} dark={darkMode} />
        <HistoryModal  open={historyOpen}  onClose={() => setHistoryOpen(false)}  tasks={tasks} dark={darkMode} />
        <AboutModal    open={aboutOpen}    onClose={() => setAboutOpen(false)}    dark={darkMode} />
        <HelpModal     open={helpOpen}     onClose={() => setHelpOpen(false)}     dark={darkMode} />

        {/* Opens on the navbar heart's "padosi:openWishlist" event. Mounted
            here at the root (rather than inside PadosiListings) so it's
            reachable no matter where PadosiListings itself is rendered in
            the tree. */}
        <WishlistPage dark={darkMode} showToast={showToast} />

        <Toast message={toastMsg} dark={darkMode} />
      </div>
    </WishlistProvider>
  );
}