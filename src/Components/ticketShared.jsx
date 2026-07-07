import { useRef } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

export const EVENT_CATEGORIES = [
  { icon: "🎵", label: "Concert" },
  { icon: "🏏", label: "Cricket" },
  { icon: "⚽", label: "Football" },
  { icon: "🎭", label: "Theatre" },
  { icon: "🎬", label: "Movie" },
  { icon: "🎪", label: "Festival" },
  { icon: "🏋️", label: "Sports" },
  { icon: "🎓", label: "Workshop" },
  { icon: "🎤", label: "Comedy" },
  { icon: "🍽️", label: "Dining" },
  { icon: "🎨", label: "Exhibition" },
  { icon: "🎰", label: "Other" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Image Upload Field ───────────────────────────────────────────────────────
// Shared by PostPanel (new listing) and InlineEditForm (editing a listing)

export function ImageUploadField({ dark, onUpload, uploading, preview }) {
  const inputRef = useRef(null);

  return (
    <div>
      <label className={`text-xs font-bold mb-1 block ${dark ? "text-white/60" : "text-[#888]"}`}>
        Ticket photo <span className={`font-normal ${dark ? "text-white/30" : "text-[#bbb]"}`}>(shown to buyer after purchase)</span>
      </label>

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Ticket preview"
            className="w-full max-h-48 object-contain rounded-xl border"
            style={{ borderColor: dark ? "rgba(255,255,255,0.15)" : "#e0e0ea" }}
          />
          <button
            onClick={() => onUpload(null)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80 cursor-pointer"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`w-full rounded-xl border-2 border-dashed py-8 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
            uploading
              ? dark ? "border-white/10 text-white/20" : "border-[#ddd] text-[#ccc]"
              : dark
              ? "border-white/20 text-white/40 hover:border-white/50 hover:text-white/60"
              : "border-[#ddd] text-[#bbb] hover:border-[#ff2d55] hover:text-[#ff2d55]"
          }`}
        >
          <span className="text-2xl">{uploading ? "⏳" : "📷"}</span>
          <span className="text-sm font-bold">
            {uploading ? "Uploading…" : "Upload ticket image"}
          </span>
          <span className="text-xs">JPG, PNG, WEBP · max 5 MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
