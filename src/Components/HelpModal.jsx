import { useState } from "react";
import { Modal, ModalTag } from "./Modal";

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

      {/* Accordion */}
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
                <span
                  className={`flex-shrink-0 text-[11px] transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  } ${dark ? "text-[#888]" : isOpen ? "text-[#ff2d55]" : "text-[#bbb]"}`}
                >
                  ▾
                </span>
              </button>

              {isOpen && (
                <div
                  className={`px-4 pt-2 pb-4 text-xs leading-relaxed ${
                    dark ? "text-[#aaa] bg-[#111]" : "text-[#555] bg-[#fff8f9]"
                  }`}
                >
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact callout */}
      <div
        className={`rounded-xl p-4 border text-center ${
          dark ? "bg-black border-white" : "bg-[#fff0f3] border-transparent"
        }`}
      >
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
