// SettingsPage.jsx
// Full-screen settings panel — replaces the old small "Manage account" modal.
// Stays inside the single-page app (no routing, no new URL): it's just a
// fixed full-viewport overlay that opens/closes based on the `open` prop.
//
// Visual language: flat list rows grouped under section headers, a top tab
// strip, and click-to-expand inline editors — matching a Reddit-style
// settings page instead of the old boxed-card layout.
import { useState, useEffect } from "react";
import { api } from "../utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

function Chevron({ open, dark }) {
  return (
    <span
      className={`inline-block transition-transform duration-150 ${open ? "rotate-90" : ""} ${dark ? "text-[#666]" : "text-[#b0b0b0]"}`}
      aria-hidden="true"
    >
      ›
    </span>
  );
}

export function SettingsPage({
  open,
  onClose,
  currentUser,
  onUpdate,
  onDeleteAccount,
  showToast,
  dark,
}) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [nameError, setNameError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const [expanded, setExpanded] = useState(null); // 'name' | 'username' | 'email' | 'phone' | null

  useEffect(() => {
    if (open && currentUser) {
      setName(currentUser.full_name || "");
      setUsername(currentUser.username || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
      setNameError("");
      setUsernameError("");
      setEmailError("");
      setPhoneError("");
      setPhotoError("");
      setExpanded(null);
    }
  }, [open, currentUser]);

  if (!open) return null;

  const initial = (currentUser?.full_name || "U").charAt(0).toUpperCase();
  const verified = !!(
    currentUser?.phone &&
    currentUser?.photo_verified &&
    currentUser?.username &&
    currentUser?.email
  );

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

  const validateField = (field) => {
    if (field === "name" && !name.trim()) {
      setNameError("Full name cannot be empty.");
      return false;
    }
    if (field === "username" && username && !USERNAME_RE.test(username)) {
      setUsernameError(
        "Username must be 3-20 characters — letters, numbers, and underscores only.",
      );
      return false;
    }
    if (field === "email" && email && !EMAIL_RE.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    if (field === "phone" && phone && phone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits.");
      return false;
    }
    return true;
  };

  const saveField = async (field) => {
    setNameError("");
    setUsernameError("");
    setEmailError("");
    setPhoneError("");
    if (!validateField(field)) return;

    setSaving(true);
    try {
      const { user } = await api("PUT", "/api/me", {
        full_name: name.trim(),
        username: username || undefined,
        email: email.trim() || undefined,
        phone: phone || undefined,
      });
      onUpdate(user);
      setExpanded(null);
      showToast("✅ Settings saved");
    } catch (err) {
      if (field === "name") setNameError(err.message);
      else if (field === "username") setUsernameError(err.message);
      else if (field === "email") setEmailError(err.message);
      else setPhoneError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleRow = (field) => setExpanded(expanded === field ? null : field);

  const pageCls = dark ? "bg-black text-white" : "bg-white text-[#1a1a1a]";
  const headerCls = dark
    ? "bg-black border-white/10"
    : "bg-white border-[#eee]";
  const sectionHeadCls = "text-lg font-bold mb-1 mt-9 first:mt-0";
  const rowBorderCls = dark ? "border-white/10" : "border-[#eee]";
  const rowLabelCls = "text-[15px] font-medium";
  const rowValueCls = dark ? "text-[#888] text-sm" : "text-[#8a8a8a] text-sm";
  const inputCls = `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors ${
    dark
      ? "bg-black border-white/30 text-white placeholder:text-[#666] focus:border-white"
      : "bg-white border-[#ddd] text-[#111] focus:border-[#ff2d55]"
  }`;
  const saveBtnCls = `px-4 py-2 rounded-full text-sm font-semibold cursor-pointer border-none transition-opacity disabled:opacity-50 ${
    dark
      ? "bg-white text-black hover:opacity-80"
      : "bg-[#ff2d55] text-white hover:opacity-90"
  }`;
  const cancelBtnCls = `px-4 py-2 rounded-full text-sm font-semibold cursor-pointer border transition-colors ${
    dark
      ? "border-white/30 text-white hover:bg-white/10"
      : "border-[#ddd] text-[#444] hover:bg-[#f6f6f6]"
  }`;

  const Row = ({ field, label, sublabel, displayValue, children }) => {
    const isOpen = expanded === field;
    return (
      <div className={`border-b ${rowBorderCls}`}>
        <button
          type="button"
          onClick={() => toggleRow(field)}
          className="w-full flex items-center justify-between gap-4 py-4 text-left cursor-pointer bg-transparent border-none"
        >
          <div>
            <p className={rowLabelCls}>{label}</p>
            {sublabel && (
              <p className={`text-xs mt-0.5 ${rowValueCls}`}>{sublabel}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={rowValueCls}>{displayValue}</span>
            <Chevron open={isOpen} dark={dark} />
          </div>
        </button>
        {isOpen && <div className="pb-5 -mt-1">{children}</div>}
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-[2000] overflow-y-auto ${pageCls}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 border-b ${headerCls}`}>
        <div className="flex items-center gap-4 px-6 py-4">
          <button
            onClick={onClose}
            aria-label="Back"
            className={`w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer text-lg ${
              dark
                ? "bg-[#111] text-white hover:bg-[#1a1a1a]"
                : "bg-[#f6f7fb] text-[#111] hover:bg-[#eee]"
            }`}
          >
            ←
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Profile summary */}
        <div className="flex items-center gap-5 pb-8">
          <label
            className={`relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center border-2 flex-shrink-0 block ${
              dark ? "border-white bg-[#111]" : "border-[#eee] bg-[#fafafa]"
            } ${uploading ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt=""
                className={`w-full h-full object-cover ${uploading ? "opacity-40" : ""}`}
              />
            ) : (
              <span
                className={`text-xl font-bold ${dark ? "text-white" : "text-[#ff2d55]"}`}
              >
                {initial}
              </span>
            )}
            {uploading && (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold bg-black/40 text-white">
                …
              </span>
            )}
            <span
              className={`absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center border-2 text-[10px] ${
                dark
                  ? "bg-white border-black text-black"
                  : "bg-[#ff2d55] border-white text-white"
              }`}
            >
              ✎
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <div>
            <p className="text-base font-bold">
              {currentUser?.full_name || "User"}
            </p>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 mt-1.5 ${
                verified
                  ? dark
                    ? "bg-white/10 text-white"
                    : "bg-[#e3fbe8] text-[#1a9e4a]"
                  : dark
                    ? "bg-white/10 text-white"
                    : "bg-[#fff3cd] text-[#856404]"
              }`}
            >
              {verified ? "✅ Verified member" : "⚠️ Not verified"}
            </span>
            {photoError && (
              <p className="text-[#ff2d55] text-xs mt-2">{photoError}</p>
            )}
          </div>
        </div>

        {/* General section */}
        <h2 className={sectionHeadCls}>General</h2>
        <div>
          <Row field="name" label="Full name" displayValue={name || "Not set"}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 50))}
              maxLength={50}
              className={inputCls}
              autoFocus
            />
            <p className={`text-xs mt-1 text-right ${rowValueCls}`}>
              {name.length}/50
            </p>
            {nameError && (
              <p className="text-[#ff2d55] text-xs mt-2">{nameError}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => saveField("name")}
                disabled={saving}
                className={saveBtnCls}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setExpanded(null)}
                className={cancelBtnCls}
              >
                Cancel
              </button>
            </div>
          </Row>

          <Row
            field="username"
            label="Username"
            displayValue={username ? `@${username}` : "Not set"}
          >
            <input
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                )
              }
              placeholder="e.g. rahul_23"
              maxLength={20}
              className={inputCls}
              autoFocus
            />
            <p className={`text-xs mt-1 text-right ${rowValueCls}`}>
              {username.length}/20
            </p>
            {usernameError && (
              <p className="text-[#ff2d55] text-xs mt-2">{usernameError}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => saveField("username")}
                disabled={saving}
                className={saveBtnCls}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setExpanded(null)}
                className={cancelBtnCls}
              >
                Cancel
              </button>
            </div>
          </Row>

          <Row
            field="email"
            label="Email address"
            displayValue={email || "Not set"}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.slice(0, 100))}
              placeholder="you@gmail.com"
              maxLength={100}
              className={inputCls}
              autoFocus
            />
            <p className={`text-xs mt-1 text-right ${rowValueCls}`}>
              {email.length}/100
            </p>
            {emailError && (
              <p className="text-[#ff2d55] text-xs mt-2">{emailError}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => saveField("email")}
                disabled={saving}
                className={saveBtnCls}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setExpanded(null)}
                className={cancelBtnCls}
              >
                Cancel
              </button>
            </div>
          </Row>

          <Row
            field="phone"
            label="Phone number"
            displayValue={phone ? `+91 ${phone}` : "Not set"}
          >
            <div className="relative">
              <span
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none ${dark ? "text-[#888]" : "text-[#555]"}`}
              >
                🇮🇳 +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                maxLength={10}
                placeholder="10-digit mobile number"
                className={`w-full pl-16 pr-3.5 py-2.5 rounded-lg border text-sm focus:outline-none transition-colors ${
                  dark
                    ? "bg-black border-white/30 text-white placeholder:text-[#666]"
                    : "bg-white border-[#ddd] text-[#111] focus:border-[#ff2d55]"
                }`}
                autoFocus
              />
            </div>
            <p className={`text-xs mt-1 text-right ${rowValueCls}`}>
              {phone.length}/10
            </p>
            {phoneError && (
              <p className="text-[#ff2d55] text-xs mt-2">{phoneError}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => saveField("phone")}
                disabled={saving}
                className={saveBtnCls}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setExpanded(null)}
                className={cancelBtnCls}
              >
                Cancel
              </button>
            </div>
          </Row>
        </div>

        {/* Danger zone */}
        <h2 className={sectionHeadCls}>Danger zone</h2>
        <div>
          <button
            type="button"
            onClick={onDeleteAccount}
            className="w-full flex items-center justify-between gap-4 py-4 text-left cursor-pointer bg-transparent border-none"
          >
            <p className={`${rowLabelCls} text-[#ff2d55]`}>Delete account</p>
            <Chevron open={false} dark={dark} />
          </button>
        </div>
      </div>
    </div>
  );
}