import { useRef, useState, useEffect } from "react";

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

export const COUNTRY_CODES = [
  { name: "India",                code: "91"  , flag: "🇮🇳" },
  { name: "United States",        code: "1"   , flag: "🇺🇸" },
  { name: "United Kingdom",       code: "44"  , flag: "🇬🇧" },
  { name: "Canada",               code: "1"   , flag: "🇨🇦" },
  { name: "Australia",            code: "61"  , flag: "🇦🇺" },
  { name: "United Arab Emirates", code: "971" , flag: "🇦🇪" },
  { name: "Singapore",            code: "65"  , flag: "🇸🇬" },
  { name: "Germany",              code: "49"  , flag: "🇩🇪" },
  { name: "France",               code: "33"  , flag: "🇫🇷" },
  { name: "Nepal",                code: "977" , flag: "🇳🇵" },
  { name: "Bangladesh",           code: "880" , flag: "🇧🇩" },
  { name: "Sri Lanka",            code: "94"  , flag: "🇱🇰" },
  { name: "Pakistan",             code: "92"  , flag: "🇵🇰" },
  { name: "China",                code: "86"  , flag: "🇨🇳" },
  { name: "Japan",                code: "81"  , flag: "🇯🇵" },
  { name: "South Korea",          code: "82"  , flag: "🇰🇷" },
  { name: "Saudi Arabia",         code: "966" , flag: "🇸🇦" },
  { name: "Qatar",                code: "974" , flag: "🇶🇦" },
  { name: "Kuwait",               code: "965" , flag: "🇰🇼" },
  { name: "Oman",                 code: "968" , flag: "🇴🇲" },
  { name: "South Africa",         code: "27"  , flag: "🇿🇦" },
  { name: "New Zealand",          code: "64"  , flag: "🇳🇿" },
  { name: "Italy",                code: "39"  , flag: "🇮🇹" },
  { name: "Spain",                code: "34"  , flag: "🇪🇸" },
  { name: "Netherlands",          code: "31"  , flag: "🇳🇱" },
  { name: "Switzerland",          code: "41"  , flag: "🇨🇭" },
  { name: "Brazil",               code: "55"  , flag: "🇧🇷" },
  { name: "Mexico",               code: "52"  , flag: "🇲🇽" },
  { name: "Russia",               code: "7"   , flag: "🇷🇺" },
  { name: "Indonesia",            code: "62"  , flag: "🇮🇩" },
  { name: "Malaysia",             code: "60"  , flag: "🇲🇾" },
  { name: "Thailand",             code: "66"  , flag: "🇹🇭" },
  { name: "Philippines",          code: "63"  , flag: "🇵🇭" },
  { name: "Vietnam",              code: "84"  , flag: "🇻🇳" },
  { name: "Egypt",                code: "20"  , flag: "🇪🇬" },
  { name: "Nigeria",              code: "234" , flag: "🇳🇬" },
  { name: "Kenya",                code: "254" , flag: "🇰🇪" },
  { name: "Turkey",               code: "90"  , flag: "🇹🇷" },
  { name: "Ireland",              code: "353" , flag: "🇮🇪" },
  { name: "Sweden",               code: "46"  , flag: "🇸🇪" },
  { name: "Norway",               code: "47"  , flag: "🇳🇴" },
];

// ─── Character Limits ────────────────────────────────────────────────────────
// Enforced two ways: maxLength stops typing past the limit (so there's never
// a need for a running counter), and a small red note appears under a field
// only while it's sitting exactly at its limit — it disappears the moment a
// character is deleted, since the length check stops matching.

export const LIMITS = {
  title:       60,
  description: 150,
  price:       8,
  venue:       60,
  contact:     15,   // max digits in the local number, excluding country code
  contactMin:  8,    // min digits in the local number, excluding country code
  search:      100,
};

// Small red "you've hit the limit" note. Only rendered by the caller when the
// field's current length has reached its cap, so no state or timers are
// needed for it to disappear — it just stops being rendered.
export function LimitNote() {
  return (
    <p className="text-[#ff2d55] text-[11px] font-semibold mt-1">
      Character limit reached.
    </p>
  );
}

// ─── Country Code Select ─────────────────────────────────────────────────────
// A small button showing the currently chosen country's flag + dial code.
// Clicking it opens a scrollable list of countries; picking one calls
// onChange with just the digits of that country's code (no "+").

export function CountryCodeSelect({ dark, value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = COUNTRY_CODES.find((c) => c.code === value) ?? COUNTRY_CODES[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 h-full px-3 rounded-xl border text-sm font-bold cursor-pointer transition-colors whitespace-nowrap ${
          dark
            ? "bg-white/10 border-white/20 text-white hover:border-white"
            : "bg-[#f6f7fb] border-[#e0e0ea] text-[#111] hover:border-[#ff2d55]"
        }`}
      >
        <span>{selected.flag}</span>
        <span>+{selected.code}</span>
        <span className={`text-[9px] ${dark ? "text-white/40" : "text-[#bbb]"}`}>▼</span>
      </button>

      {open && (
        <div
          className={`absolute z-20 top-full left-0 mt-1 w-60 max-h-56 overflow-y-auto rounded-xl border shadow-xl ${
            dark ? "bg-black border-white/20" : "bg-white border-[#e0e0ea]"
          }`}
        >
          {COUNTRY_CODES.map((c) => (
            <button
              key={`${c.name}-${c.code}`}
              type="button"
              onClick={() => { onChange(c.code); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm cursor-pointer transition-colors ${
                dark ? "hover:bg-white/10 text-white" : "hover:bg-[#fff0f3] text-[#111]"
              }`}
            >
              <span>{c.flag}</span>
              <span className="flex-1 truncate">{c.name}</span>
              <span className={dark ? "text-white/40" : "text-[#999]"}>+{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Splits a saved "+<code> <number>" contact string back into its parts for
// the edit form. Falls back to India (91) if the string has no "+" prefix,
// which covers listings saved before the country picker existed.
export function parseContact(contact) {
  if (!contact) return { countryCode: "91", contact: "" };
  const match = /^\+(\d{1,4})\s?(.*)$/.exec(contact.trim());
  if (match) return { countryCode: match[1], contact: match[2].replace(/\D/g, "") };
  return { countryCode: "91", contact: contact.replace(/\D/g, "") };
}
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