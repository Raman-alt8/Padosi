// VerifiedSection.jsx
import { useState } from "react";
import { Modal, ModalTag } from "./Modal";
import { api } from "../utils";

// ─── Verified Member CTA Section ────────────────────────────────────────────
// "Verified" now requires BOTH a phone number and a profile photo. Clicking
// "Get Verified" opens a photo step first; once uploaded (via the same
// two-step Cloudinary flow used elsewhere: POST /api/upload → get a hosted
// URL → save it), it's saved straight to the user's profile with
// PUT /api/me. If the user already has a phone number, that alone completes
// verification and we just show a success toast. If not, we still hand off
// to onOpenManage() so they can add one, same as the flow already did before
// this photo step existed.
//
// Confirmed against the real routes/accountRoutes.js: the users table column
// is avatar_url (not photo_url), and PUT /api/me does a genuine partial
// update — sending { avatar_url } alone here is safe and won't touch
// full_name or phone.
export default function VerifiedSection({ currentUser, showToast, onRequireLogin, onOpenManage, onUpdate, dark }) {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (currentUser?.phone && currentUser?.avatar_url) return null;

  const handleGetVerified = () => {
    if (!currentUser) {
      showToast("👋 Please log in first");
      onRequireLogin();
      return;
    }
    setError("");
    setPhotoUrl("");
    setShowPhotoModal(true);
  };

  const closeModal = () => {
    setShowPhotoModal(false);
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

  const handleContinue = async () => {
    if (!photoUrl) { setError("Please upload a photo to continue."); return; }
    setSaving(true);
    setError("");
    try {
      const { user } = await api("PUT", "/api/me", { avatar_url: photoUrl });
      onUpdate?.(user);
      setShowPhotoModal(false);
      if (user?.phone) {
        showToast("🎉 You're now a verified member!");
      } else {
        showToast("📸 Photo saved — add a phone number to finish verifying.");
        onOpenManage();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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

      {/* Photo step */}
      <Modal open={showPhotoModal} onClose={closeModal} maxWidth="max-w-md" dark={dark}>
        <ModalTag dark={dark}>Verification</ModalTag>
        <h2 className={`text-xl font-bold mb-2 ${dark ? "text-white" : "text-[#111]"}`}>
          Add a photo
        </h2>
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
        <p className={`text-center text-xs font-semibold mb-6 ${dark ? "text-[#666]" : "text-[#aaa]"}`}>
          {uploading ? "Uploading…" : photoUrl ? "Tap photo to change it" : "Tap to upload"}
        </p>

        {error && <p className="text-[#ff2d55] text-xs text-center font-medium mb-4">⚠️ {error}</p>}

        <button
          onClick={handleContinue}
          disabled={uploading || saving || !photoUrl}
          className={`w-full py-3 rounded-xl font-semibold cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${
            dark ? "bg-white text-black" : "bg-[#ff2d55] text-white"
          }`}
        >
          {saving ? "Saving…" : "Continue"}
        </button>
      </Modal>
    </>
  );
}