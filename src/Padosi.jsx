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

// ─── About Modal ───────────────────────────────────────────────────────────────
const ABOUT_FEATURES = [
  { icon: "🏘️", title: "Hyperlocal help",   desc: "Post tasks and connect with neighbours in your colony or building." },
  { icon: "✅", title: "Verified members",   desc: "Helpers who've added a phone number you can actually call." },
  { icon: "💰", title: "You set the price",  desc: "Name your budget — no commission or hidden platform fees." },
  { icon: "⚡", title: "Now or later",       desc: "Need something done immediately or schedule it ahead of time." },
];

function AboutModal({ open, onClose, dark }) {
  return (
    <Modal open={open} onClose={onClose} dark={dark}>
      <ModalTag dark={dark}>About Padosi</ModalTag>

      <h2 className={`text-xl font-bold mb-2 ${dark ? "text-white" : "text-[#111]"}`}>
        Your neighbourhood, connected.
      </h2>
      <p className={`text-sm leading-relaxed mb-5 ${dark ? "text-[#aaa]" : "text-[#555]"}`}>
        <strong>Padosi</strong> (पड़ोसी) means <em>neighbour</em> in Hindi. We're a community
        marketplace where you can post everyday tasks — groceries, repairs, errands — and get
        help from trusted people close by.
      </p>

      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {ABOUT_FEATURES.map(({ icon, title, desc }) => (
          <div
            key={title}
            className={`rounded-xl p-3.5 border ${
              dark ? "bg-black border-white" : "bg-[#f6f7fb] border-transparent"
            }`}
          >
            <span className="text-xl block mb-1.5">{icon}</span>
            <p className={`text-xs font-bold mb-0.5 ${dark ? "text-white" : "text-[#111]"}`}>{title}</p>
            <p className={`text-xs leading-snug ${dark ? "text-[#888]" : "text-[#777]"}`}>{desc}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-xl p-4 border mb-4 ${
        dark ? "bg-black border-white" : "bg-[#fff0f3] border-transparent"
      }`}>
        <p className={`text-xs font-bold mb-1 ${dark ? "text-white" : "text-[#ff2d55]"}`}>Our mission</p>
        <p className={`text-xs leading-relaxed ${dark ? "text-[#aaa]" : "text-[#555]"}`}>
          To rebuild the spirit of community in Indian neighbourhoods — where asking a neighbour
          for help is completely normal, and helping back feels genuinely rewarding.
        </p>
      </div>

      <p className={`text-xs text-center ${dark ? "text-[#555]" : "text-[#bbb]"}`}>
        Made with ❤️ in India · v1.0
      </p>
    </Modal>
  );
}

// ─── Help Modal ────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "How do I post a task?",
    a: "Log in, then tap 'Post a task' on the home screen. Describe what you need, set a price, and choose whether you want help right now or at a scheduled time. Your task goes live immediately.",
  },
  {
    q: "How does pricing work?",
    a: "You set the price — Padosi doesn't charge any commission or platform fee right now. Pay your helper however you both agree (cash, UPI, etc.).",
  },
  {
    q: "Who can see my task?",
    a: "Tasks are visible to all logged-in users nearby. Once someone accepts, their contact details are shared with you so you can coordinate directly.",
  },
  {
    q: "How are members verified?",
    a: "Members who add a phone number to their profile receive a Verified badge. This gives you an extra layer of trust — you can see at a glance whether your helper is verified.",
  },
  {
    q: "My task hasn't been accepted yet — what do I do?",
    a: "Tasks can take a little time to get picked up, especially scheduled ones. Try increasing your price slightly or switching to 'Now' mode for faster responses.",
  },
  {
    q: "How do I delete or edit a task?",
    a: "Task editing is coming soon. For now, reach out to us at support@padosi.in and we'll sort it out quickly.",
  },
  {
    q: "How do I contact support?",
    a: "Email us at support@padosi.in — we aim to respond within 24 hours. For urgent issues, mention it in the subject line.",
  },
];

function HelpModal({ open, onClose, dark }) {
  const [openIdx, setOpenIdx] = useState(null);
  const toggle = (i) => setOpenIdx((prev) => (prev === i ? null : i));

  return (
    <Modal open={open} onClose={onClose} dark={dark}>
      <ModalTag dark={dark}>Support</ModalTag>

      <h2 className={`text-xl font-bold mb-1 ${dark ? "text-white" : "text-[#111]"}`}>
        Help &amp; FAQ
      </h2>
      <p className={`text-xs mb-5 ${dark ? "text-[#888]" : "text-[#999]"}`}>
        Tap a question to expand it.
      </p>

      <div className="flex flex-col gap-2 mb-5">
        {FAQS.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <div
              key={i}
              className={`rounded-xl border overflow-hidden ${
                dark ? "border-white" : isOpen ? "border-[#ff2d55]" : "border-[#eee]"
              }`}
            >
              <button
                onClick={() => toggle(i)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-left cursor-pointer border-none transition-colors ${
                  dark
                    ? isOpen ? "bg-[#111] text-white" : "bg-black text-white hover:bg-[#111]"
                    : isOpen ? "bg-[#fff0f3] text-[#ff2d55]" : "bg-white text-[#111] hover:bg-[#f6f7fb]"
                }`}
              >
                <span className="pr-3">{faq.q}</span>
                <span className={`flex-shrink-0 text-[11px] transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                } ${dark ? "text-[#888]" : isOpen ? "text-[#ff2d55]" : "text-[#bbb]"}`}>
                  ▾
                </span>
              </button>
              {isOpen && (
                <div className={`px-4 pt-2 pb-4 text-xs leading-relaxed ${
                  dark ? "text-[#aaa] bg-[#111]" : "text-[#555] bg-[#fff8f9]"
                }`}>
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={`rounded-xl p-4 border text-center ${
        dark ? "bg-black border-white" : "bg-[#fff0f3] border-transparent"
      }`}>
        <p className={`text-sm font-bold mb-1 ${dark ? "text-white" : "text-[#ff2d55]"}`}>
          Still need help?
        </p>
        <p className={`text-xs mb-1 ${dark ? "text-[#888]" : "text-[#777]"}`}>
          We're happy to assist — reach us at
        </p>
        <a
          href="mailto:support@padosi.in"
          className={`text-xs font-bold underline ${dark ? "text-white" : "text-[#ff2d55]"}`}
        >
          support@padosi.in
        </a>
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
      <AboutModal    open={aboutOpen}    onClose={() => setAboutOpen(false)}    dark={darkMode} />
      <HelpModal     open={helpOpen}     onClose={() => setHelpOpen(false)}     dark={darkMode} />

      <Toast message={toastMsg} dark={darkMode} />
    </div>
  );
}