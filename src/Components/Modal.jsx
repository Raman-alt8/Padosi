import { useEffect } from "react";

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, children, maxWidth = "max-w-md", dark }) {
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`rounded-2xl p-9 w-full ${maxWidth} relative border ${
        dark
          ? "bg-black text-white border-white shadow-none"
          : "bg-white text-[#111] border-transparent shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
      }`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-5 text-2xl leading-none bg-transparent border-none cursor-pointer ${
            dark ? "text-[#888] hover:text-white" : "text-[#999] hover:text-[#ff2d55]"
          }`}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

export function ModalTag({ children, dark }) {
  return (
    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 border ${
      dark
        ? "bg-black text-white border-white"
        : "bg-[#fff0f3] text-[#ff2d55] border-transparent"
    }`}>
      {children}
    </span>
  );
}
