import { useState, useEffect } from "react";
import { Modal, ModalTag } from "./Modal";
import { api, formatDateTime, formatPostedDate } from "../utils";

// ─── Manage Account Modal ───────────────────────────────────────────────────
export function ManageAccountModal({ open, onClose, currentUser, onUpdate, onDeleteAccount, showToast, dark }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && currentUser) {
      setName(currentUser.full_name || "");
      setPhone(currentUser.phone || "");
      setUsername(currentUser.username || "");
      setError(""); setPhoneError(""); setUsernameError("");
    }
  }, [open, currentUser]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Full name cannot be empty."); return; }
    if (phone && phone.length !== 10) { setPhoneError("Phone number must be exactly 10 digits."); return; }
    if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
      setUsernameError("Username must be 3-20 characters — letters, numbers, and underscores only.");
      return;
    }
    setLoading(true); setError("");
    try {
      const { user } = await api("PUT", "/api/me", {
        full_name: name.trim(),
        phone: phone || undefined,
        username: username || undefined,
      });
      onUpdate(user);
      onClose();
      showToast("✅ Account updated");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const initial = (currentUser?.full_name || "U").charAt(0).toUpperCase();
  const verified = !!(currentUser?.phone && currentUser?.photo_verified && currentUser?.username && currentUser?.email);
  const missingLabel = !currentUser?.photo_verified ? "add a photo"
    : !currentUser?.email ? "add an email"
    : !currentUser?.username ? "add a username"
    : "add a phone";

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
        <span className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 border overflow-hidden ${
          dark ? "bg-black text-white border-white" : "bg-[#fff0f3] text-[#ff2d55] border-transparent"
        }`}>
          {currentUser?.avatar_url ? (
            <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </span>
        <div>
          <p className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>{currentUser?.full_name || "User"}</p>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 mt-1 border ${
            verified
              ? dark ? "bg-black text-white border-white" : "bg-[#e3fbe8] text-[#1a9e4a] border-transparent"
              : dark ? "bg-black text-white border-white" : "bg-[#fff3cd] text-[#856404] border-transparent"
          }`}>
            {verified ? "✅ Verified member" : `⚠️ Not verified — ${missingLabel}`}
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

      <div className="mb-4">
        <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ${dark ? "text-[#888]" : "text-[#999]"}`}>Username</label>
        <input
          value={username}
          onChange={e => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")); setUsernameError(""); }}
          onKeyPress={e => e.key === "Enter" && handleSave()}
          placeholder="e.g. rahul_23"
          maxLength={20}
          className={inputCls}
        />
        {usernameError && <p className="text-[#ff2d55] text-xs mt-1">{usernameError}</p>}
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

      <div className={`mt-6 pt-5 border-t ${dark ? "border-white/20" : "border-[#eee]"}`}>
        <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${dark ? "text-[#888]" : "text-[#999]"}`}>
          Danger zone
        </p>
        <button
          onClick={onDeleteAccount}
          className={`w-full py-3 rounded-xl font-semibold text-sm cursor-pointer border transition-colors ${
            dark
              ? "border-[#ff2d55] text-[#ff2d55] bg-transparent hover:bg-[#ff2d55]/10"
              : "border-[#ffd6dd] text-[#ff2d55] bg-[#fff5f7] hover:bg-[#ffe5ea]"
          }`}
        >
          Delete account
        </button>
      </div>
    </Modal>
  );
}

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