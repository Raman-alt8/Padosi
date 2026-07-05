// SettingsPage.jsx
// Full-screen settings panel — replaces the old small "Manage account" modal.
// Stays inside the single-page app (no routing, no new URL): it's just a
// fixed full-viewport overlay that opens/closes based on the `open` prop.
import { useState, useEffect } from "react";
import { api } from "../utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export function SettingsPage({ open, onClose, currentUser, onUpdate, onDeleteAccount, showToast, dark }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [nameError, setNameError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    if (open && currentUser) {
      setName(currentUser.full_name || "");
      setUsername(currentUser.username || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
      setNameError(""); setUsernameError(""); setEmailError(""); setPhoneError("");
      setSaveError(""); setPhotoError("");
    }
  }, [open, currentUser]);

  if (!open) return null;

  const initial = (currentUser?.full_name || "U").charAt(0).toUpperCase();
  const verified = !!(currentUser?.phone && currentUser?.photo_verified && currentUser?.username && currentUser?.email);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setPhotoError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not upload photo.");

      const { user } = await api("PUT", "/api/me", { avatar_url: data.url });
      onUpdate(user);
      showToast("✅ Photo updated");
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setNameError(""); setUsernameError(""); setEmailError(""); setPhoneError(""); setSaveError("");

    if (!name.trim()) { setNameError("Full name cannot be empty."); return; }
    if (username && !USERNAME_RE.test(username)) {
      setUsernameError("Username must be 3-20 characters — letters, numbers, and underscores only.");
      return;
    }
    if (email && !EMAIL_RE.test(email.trim())) { setEmailError("Please enter a valid email address."); return; }
    if (phone && phone.length !== 10) { setPhoneError("Phone number must be exactly 10 digits."); return; }

    setSaving(true);
    try {
      const { user } = await api("PUT", "/api/me", {
        full_name: name.trim(),
        username: username || undefined,
        email: email.trim() || undefined,
        phone: phone || undefined,
      });
      onUpdate(user);
      showToast("✅ Settings saved");
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const cardCls = `rounded-2xl border p-6 mb-5 ${dark ? "bg-black border-white/10" : "bg-white border-[#eee]"}`;
  const labelCls = `text-xs font-bold uppercase tracking-wider mb-1.5 block ${dark ? "text-[#888]" : "text-[#999]"}`;
  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
    dark
      ? "bg-black border-white/30 text-white placeholder:text-[#666] focus:border-white"
      : "bg-white border-[#ddd] text-[#111] focus:border-[#ff2d55]"
  }`;

  return (
    <div className={`fixed inset-0 z-[2000] overflow-y-auto ${dark ? "bg-black text-white" : "bg-[#f6f7fb] text-[#111]"}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 flex items-center gap-4 px-6 py-4 border-b ${dark ? "bg-black border-white/10" : "bg-white border-[#eee]"}`}>
        <button
          onClick={onClose}
          aria-label="Back"
          className={`w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer text-lg ${
            dark ? "bg-[#111] text-white hover:bg-[#1a1a1a]" : "bg-[#f6f7fb] text-[#111] hover:bg-[#eee]"
          }`}
        >
          ←
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Profile photo card */}
        <div className={cardCls}>
          <div className="flex items-center gap-5">
            <label className={`relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center border-2 flex-shrink-0 block ${
              dark ? "border-white bg-[#111]" : "border-[#eee] bg-[#fafafa]"
            } ${uploading ? "cursor-not-allowed" : "cursor-pointer"}`}>
              {currentUser?.avatar_url ? (
                <img src={currentUser.avatar_url} alt="" className={`w-full h-full object-cover ${uploading ? "opacity-40" : ""}`} />
              ) : (
                <span className={`text-2xl font-bold ${dark ? "text-white" : "text-[#ff2d55]"}`}>{initial}</span>
              )}
              {uploading && (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold bg-black/40 text-white">…</span>
              )}
              <span className={`absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center border-2 text-xs ${
                dark ? "bg-white border-black text-black" : "bg-[#ff2d55] border-white text-white"
              }`}>
                ✎
              </span>
              <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploading} className="hidden" />
            </label>
            <div>
              <p className="text-base font-bold">{currentUser?.full_name || "User"}</p>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 mt-1.5 border ${
                verified
                  ? dark ? "bg-black text-white border-white" : "bg-[#e3fbe8] text-[#1a9e4a] border-transparent"
                  : dark ? "bg-black text-white border-white" : "bg-[#fff3cd] text-[#856404] border-transparent"
              }`}>
                {verified ? "✅ Verified member" : "⚠️ Not verified"}
              </span>
            </div>
          </div>
          {photoError && <p className="text-[#ff2d55] text-xs mt-3">{photoError}</p>}
          <p className={`text-xs mt-3 ${dark ? "text-[#666]" : "text-[#aaa]"}`}>Tap the photo to change it.</p>
        </div>

        {/* Profile fields card */}
        <div className={cardCls}>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4">Profile</h2>

          <div className="mb-4">
            <label className={labelCls}>Full name</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputCls} />
            {nameError && <p className="text-[#ff2d55] text-xs mt-1">{nameError}</p>}
          </div>

          <div className="mb-4">
            <label className={labelCls}>Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="e.g. rahul_23"
              maxLength={20}
              className={inputCls}
            />
            {usernameError && <p className="text-[#ff2d55] text-xs mt-1">{usernameError}</p>}
          </div>

          <div className="mb-4">
            <label className={labelCls}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              className={inputCls}
            />
            {emailError && <p className="text-[#ff2d55] text-xs mt-1">{emailError}</p>}
          </div>

          <div className="mb-2">
            <label className={labelCls}>Phone number</label>
            <div className="relative">
              <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none ${dark ? "text-[#888]" : "text-[#555]"}`}>🇮🇳 +91</span>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                maxLength={10}
                placeholder="10-digit mobile number"
                className={`w-full pl-16 pr-10 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
                  dark ? "bg-black border-white/30 text-white placeholder:text-[#666]" : "bg-white border-[#ddd] text-[#111] focus:border-[#ff2d55]"
                }`}
              />
              {phone.length === 10 && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a9e4a]">✓</span>}
            </div>
            {phoneError && <p className="text-[#ff2d55] text-xs mt-1">{phoneError}</p>}
          </div>

          {saveError && <p className="text-[#ff2d55] text-xs mt-3">{saveError}</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full mt-4 py-3 rounded-xl font-semibold text-sm cursor-pointer border-none transition-opacity disabled:opacity-60 ${
              dark ? "bg-white text-black hover:opacity-80" : "bg-[#ff2d55] text-white hover:opacity-90"
            }`}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>

        {/* Danger zone card */}
        <div className={`rounded-2xl border p-6 ${dark ? "border-[#ff2d55]/40" : "border-[#ffd6dd]"}`}>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2 text-[#ff2d55]">Danger zone</h2>
          <p className={`text-xs mb-4 ${dark ? "text-[#aaa]" : "text-[#888]"}`}>
            Deleting your account permanently removes your profile, tasks, tickets, ride routes, and listings.
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
      </div>
    </div>
  );
}