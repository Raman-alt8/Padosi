import { useState, useEffect } from "react";
import { Modal, ModalTag } from "./Modal";
import { api, formatDateTime, formatPostedDate } from "../utils";

// ─── Delete Account Modal ────────────────────────────────────────────────────
export function DeleteAccountModal({ open, onClose, currentUser, onDeleted, showToast, dark }) {
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requiresPassword = !!currentUser?.has_password;

  useEffect(() => {
    if (open) { setPassword(""); setConfirmText(""); setError(""); }
  }, [open]);

  const canSubmit = confirmText === "DELETE" && (!requiresPassword || password.length > 0);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") { setError('Please type "DELETE" to confirm.'); return; }
    if (requiresPassword && !password) { setError("Please enter your password."); return; }

    setLoading(true); setError("");
    try {
      await api("DELETE", "/api/me", { password, confirmation: confirmText });
      showToast("👋 Account deleted. We're sorry to see you go.");
      onDeleted();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
    dark
      ? "bg-black border-white text-white placeholder:text-[#666] focus:border-white"
      : "bg-white border-[#ddd] text-[#111] placeholder:text-[#aaa] focus:border-[#ff2d55]"
  }`;

  return (
    <Modal open={open} onClose={onClose} dark={dark}>
      <ModalTag dark={dark}>Danger zone</ModalTag>
      <h2 className={`text-xl font-bold mb-2 ${dark ? "text-white" : "text-[#111]"}`}>Delete your account</h2>
      <p className={`text-sm leading-relaxed mb-5 ${dark ? "text-[#aaa]" : "text-[#555]"}`}>
        This permanently deletes your profile, tasks, tickets, ride routes, and listings —
        including your linked Gmail account and phone number. <strong>This cannot be undone.</strong>
      </p>

      {requiresPassword && (
        <div className="mb-4">
          <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ${dark ? "text-[#888]" : "text-[#999]"}`}>
            Current password
          </label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                 className={inputCls} placeholder="Enter your password" />
        </div>
      )}

      <div className="mb-5">
        <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ${dark ? "text-[#888]" : "text-[#999]"}`}>
          Type DELETE to confirm
        </label>
        <input value={confirmText} onChange={e => setConfirmText(e.target.value)}
               className={inputCls} placeholder="DELETE" />
      </div>

      {error && <p className="text-[#ff2d55] text-xs mb-3">{error}</p>}

      <button
        onClick={handleDelete}
        disabled={loading || !canSubmit}
        className="w-full py-3 rounded-xl font-semibold text-sm cursor-pointer border-none transition-opacity disabled:opacity-50 bg-[#ff2d55] text-white hover:opacity-90"
      >
        {loading ? "Deleting…" : "Permanently delete my account"}
      </button>
    </Modal>
  );
}

// ─── Shared task summary card (used by Activity + History modals) ──────────
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

// ─── Activity Modal ──────────────────────────────────────────────────────────
export function ActivityModal({ open, onClose, tasks, dark }) {
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

// ─── History Modal ────────────────────────────────────────────────────────────
export function HistoryModal({ open, onClose, tasks, dark }) {
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

export function AboutModal({ open, onClose, dark }) {
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
    a: "Members who add a profile photo, email, username, and phone number receive a Verified badge. This gives you an extra layer of trust — you can see at a glance whether your helper is verified.",
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

export function HelpModal({ open, onClose, dark }) {
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
        <a href="mailto:support@padosi.in" className={`text-xs font-bold underline ${dark ? "text-white" : "text-[#ff2d55]"}`}>
          support@padosi.in
        </a>
      </div>
    </Modal>
  );
}