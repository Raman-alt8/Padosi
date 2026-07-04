// VerifiedSection.jsx
import { useState } from "react";
import { Modal, ModalTag } from "./Modal";
import { api } from "../utils";

// ─── Verified Member CTA Section ────────────────────────────────────────────
// "Verified" now requires FOUR things: a profile photo, an email, a username,
// and a phone number. Clicking "Get Verified" opens a step wizard that only
// shows steps for whatever's missing — e.g. most users already have an
// email from signup, so that step is simply skipped for them. Each step
// saves immediately via PUT /api/me (partial update, same pattern as
// before) so progress isn't lost if the user closes the modal partway.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export default function VerifiedSection({ currentUser, showToast, onRequireLogin, onUpdate, dark }) {
  const [showModal, setShowModal] = useState(false);
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);

  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fullyVerified = !!(
    currentUser?.phone &&
    currentUser?.avatar_url &&
    currentUser?.username &&
    currentUser?.email
  );

  if (fullyVerified) return null;

  const buildSteps = (user) => {
    const list = [];
    if (!user?.avatar_url) list.push("photo");
    if (!user?.email) list.push("email");
    if (!user?.username) list.push("username");
    if (!user?.phone) list.push("phone");
    return list;
  };

  const handleGetVerified = () => {
    if (!currentUser) {
      showToast("👋 Please log in first");
      onRequireLogin();
      return;
    }
    const list = buildSteps(currentUser);
    if (list.length === 0) return;
    setSteps(list);
    setStepIndex(0);
    setPhotoUrl("");
    setEmailInput("");
    setUsernameInput("");
    setPhoneInput("");
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError("");
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
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
      setPhotoUrl(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const advance = (user) => {
    onUpdate?.(user);
    const next = stepIndex + 1;
    if (next < steps.length) {
      setStepIndex(next);
      setError("");
    } else {
      setShowModal(false);
      showToast("🎉 You're now a verified member!");
    }
  };

  const handleContinue = async () => {
    const step = steps[stepIndex];
    setError("");

    if (step === "photo") {
      if (!photoUrl) { setError("Please upload a photo to continue."); return; }
      setSaving(true);
      try {
        const { user } = await api("PUT", "/api/me", { avatar_url: photoUrl });
        advance(user);
      } catch (err) { setError(err.message); }
      finally { setSaving(false); }
      return;
    }

    if (step === "email") {
      if (!EMAIL_RE.test(emailInput.trim())) { setError("Please enter a valid email address."); return; }
      setSaving(true);
      try {
        const { user } = await api("PUT", "/api/me", { email: emailInput.trim() });
        advance(user);
      } catch (err) { setError(err.message); }
      finally { setSaving(false); }
      return;
    }

    if (step === "username") {
      const clean = usernameInput.trim().toLowerCase();
      if (!USERNAME_RE.test(clean)) { setError("Username must be 3-20 characters — letters, numbers, and underscores only."); return; }
      setSaving(true);
      try {
        const { user } = await api("PUT", "/api/me", { username: clean });
        advance(user);
      } catch (err) { setError(err.message); }
      finally { setSaving(false); }
      return;
    }

    if (step === "phone") {
      if (phoneInput.length !== 10) { setError("Phone number must be exactly 10 digits."); return; }
      setSaving(true);
      try {
        const { user } = await api("PUT", "/api/me", { phone: phoneInput });
        advance(user);
      } catch (err) { setError(err.message); }
      finally { setSaving(false); }
      return;
    }
  };

  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
    dark
      ? "bg-black border-white text-white placeholder:text-[#666] focus:border-white"
      : "bg-white border-[#ddd] text-[#111] placeholder:text-[#aaa] focus:border-[#ff2d55]"
  }`;

  const currentStep = steps[stepIndex];
  const canContinue =
    currentStep === "photo"    ? !!photoUrl && !uploading :
    currentStep === "email"    ? emailInput.trim().length > 0 :
    currentStep === "username" ? usernameInput.trim().length > 0 :
    currentStep === "phone"    ? phoneInput.length === 10 :
    false;

  return (
    <>
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
              onClick={handleGetVerified}
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

      <Modal open={showModal} onClose={closeModal} maxWidth="max-w-md" dark={dark}>
        <ModalTag dark={dark}>Verification</ModalTag>

        {steps.length > 1 && (
          <div className="flex items-center gap-1.5 mb-4">
            {steps.map((s, i) => (
              <span
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= stepIndex
                    ? dark ? "bg-white" : "bg-[#ff2d55]"
                    : dark ? "bg-[#333]" : "bg-[#eee]"
                }`}
              />
            ))}
          </div>
        )}

        {currentStep === "photo" && (
          <>
            <h2 className={`text-xl font-bold mb-2 ${dark ? "text-white" : "text-[#111]"}`}>Add a photo</h2>
            <p className={`text-sm mb-6 ${dark ? "text-[#aaa]" : "text-[#888]"}`}>
              Neighbours feel safer hiring someone they can see. Upload a clear photo of yourself to continue.
            </p>
            <label className={`relative w-28 h-28 mx-auto rounded-full overflow-hidden flex items-center justify-center border-2 mb-2 transition-colors block ${
              dark ? "border-white bg-black" : "border-[#eee] bg-[#fafafa]"
            } ${uploading ? "cursor-not-allowed" : "cursor-pointer"}`}>
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt=""
                  className={`w-full h-full object-cover transition-opacity ${uploading ? "opacity-40" : ""}`}
                />
              )}
              {!photoUrl && !uploading && (
                <svg
                  viewBox="0 0 24 24"
                  className={`w-8 h-8 ${dark ? "text-white/30" : "text-[#ccc]"}`}
                  fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
              {uploading && (
                <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
                  dark ? "text-white" : "text-[#555]"
                }`}>
                  …
                </span>
              )}
              {photoUrl && !uploading && (
                <span className={`absolute bottom-0 right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                  dark ? "bg-white border-black text-black" : "bg-[#ff2d55] border-white text-white"
                }`}>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              )}
              <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploading} className="hidden" />
            </label>
            <p className={`text-center text-xs font-semibold mb-2 ${dark ? "text-[#666]" : "text-[#aaa]"}`}>
              {uploading ? "Uploading…" : photoUrl ? "Tap photo to change it" : "Tap to upload"}
            </p>
          </>
        )}

        {currentStep === "email" && (
          <>
            <h2 className={`text-xl font-bold mb-2 ${dark ? "text-white" : "text-[#111]"}`}>Add your email</h2>
            <p className={`text-sm mb-6 ${dark ? "text-[#aaa]" : "text-[#888]"}`}>
              We'll use this to send important account updates.
            </p>
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyPress={e => e.key === "Enter" && handleContinue()}
              placeholder="you@gmail.com"
              className={inputCls}
            />
          </>
        )}

        {currentStep === "username" && (
          <>
            <h2 className={`text-xl font-bold mb-2 ${dark ? "text-white" : "text-[#111]"}`}>Choose a username</h2>
            <p className={`text-sm mb-6 ${dark ? "text-[#aaa]" : "text-[#888]"}`}>
              This is how other neighbours will find and recognize you.
            </p>
            <input
              type="text"
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              onKeyPress={e => e.key === "Enter" && handleContinue()}
              placeholder="e.g. rahul_23"
              maxLength={20}
              className={inputCls}
            />
          </>
        )}

        {currentStep === "phone" && (
          <>
            <h2 className={`text-xl font-bold mb-2 ${dark ? "text-white" : "text-[#111]"}`}>Add your phone number</h2>
            <p className={`text-sm mb-6 ${dark ? "text-[#aaa]" : "text-[#888]"}`}>
              Neighbours can only reach verified helpers by phone.
            </p>
            <div className="relative">
              <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none ${dark ? "text-[#888]" : "text-[#555]"}`}>🇮🇳 +91</span>
              <input
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                onKeyPress={e => e.key === "Enter" && handleContinue()}
                maxLength={10}
                placeholder="10-digit mobile number"
                className={`w-full pl-16 pr-10 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
                  dark
                    ? "bg-black border-white text-white placeholder:text-[#666]"
                    : "bg-white border-[#ddd] text-[#111] focus:border-[#ff2d55]"
                }`}
              />
              {phoneInput.length === 10 && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a9e4a]">✓</span>}
            </div>
          </>
        )}

        {error && <p className="text-[#ff2d55] text-xs text-center font-medium mt-4 mb-2">⚠️ {error}</p>}

        <button
          onClick={handleContinue}
          disabled={uploading || saving || !canContinue}
          className={`w-full py-3 rounded-xl font-semibold cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-6 ${
            dark ? "bg-white text-black" : "bg-[#ff2d55] text-white"
          }`}
        >
          {saving ? "Saving…" : stepIndex === steps.length - 1 ? "Finish" : "Continue"}
        </button>
      </Modal>
    </>
  );
}