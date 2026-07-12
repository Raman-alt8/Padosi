// ChatPage.jsx
import { useEffect, useState } from "react";
import { api } from "../utils";
import ChatWindow from "./ChatWindow";

// Mounted once at the App root (same pattern as WishlistPage). Opens itself
// on "padosi:openChat" (fired by MessageSellerButton with a conversation
// already attached) or "padosi:openInbox" (a plain inbox icon, if you add
// one to the navbar later) — manages its own open/closed state internally.
export default function ChatPage({ currentUser, dark, showToast }) {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  // Demo conversations (from MessageSellerButton's isDemo branch) never
  // exist server-side, so they can't come back from loadConversations() —
  // they're tracked here instead and merged in for display. In-memory only,
  // same "nothing persisted" contract as the rest of the demo flow.
  const [demoConversations, setDemoConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const loadConversations = async () => {
    try {
      const { conversations: list } = await api("GET", "/api/conversations");
      setConversations(list || []);
    } catch (err) {
      console.error("Could not load conversations:", err);
    }
  };

  useEffect(() => {
    const openInbox = () => { setOpen(true); loadConversations(); };
    const openChat = (e) => {
      const convo = e.detail?.conversation;
      const isDemo = !!(e.detail?.isDemo || convo?.is_demo);
      setOpen(true);

      if (isDemo && convo) {
        // Normalize to the same shape real conversations use (other_id /
        // other_name / etc.) so the sidebar and ChatWindow don't need to
        // know or care that this one's fake.
        const normalized = {
          id: convo.id,
          other_id: convo.seller_id,
          other_name: convo.seller_name,
          other_avatar: null,
          last_message: null,
          unread_count: 0,
          is_demo: true,
        };
        setDemoConversations((prev) =>
          prev.some((c) => c.id === normalized.id) ? prev : [...prev, normalized]
        );
        setActiveId(normalized.id);
        return; // nothing to fetch — this conversation has no row to fetch
      }

      loadConversations().then(() => { if (convo) setActiveId(convo.id); });
    };
    window.addEventListener("padosi:openInbox", openInbox);
    window.addEventListener("padosi:openChat", openChat);
    return () => {
      window.removeEventListener("padosi:openInbox", openInbox);
      window.removeEventListener("padosi:openChat", openChat);
    };
  }, []);

  if (!open || !currentUser) return null;

  // Demo threads first so a freshly-opened one is easy to spot at the top.
  const allConversations = [...demoConversations, ...conversations];
  const active = allConversations.find((c) => c.id === activeId);

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/50" onClick={() => setOpen(false)}>
      <div
        className={`w-full max-w-3xl h-full flex shadow-2xl ${dark ? "bg-black" : "bg-white"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-full sm:w-72 flex-shrink-0 border-r overflow-y-auto ${dark ? "border-white" : "border-[#eee]"} ${active ? "hidden sm:block" : ""}`}>
          <div className={`flex items-center justify-between px-4 py-3.5 border-b ${dark ? "border-white" : "border-[#eee]"}`}>
            <span className={`font-black ${dark ? "text-white" : "text-[#111]"}`}>Messages</span>
            <button onClick={() => setOpen(false)} className={`bg-transparent border-none cursor-pointer text-lg ${dark ? "text-white" : "text-[#111]"}`}>✕</button>
          </div>

          {allConversations.length === 0 && (
            <p className={`px-4 py-6 text-sm ${dark ? "text-[#888]" : "text-[#666]"}`}>No conversations yet.</p>
          )}

          {allConversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`w-full text-left px-4 py-3 border-b cursor-pointer transition-colors ${dark ? "border-white" : "border-[#eee]"} ${
                c.id === activeId ? (dark ? "bg-[#1a1a1a]" : "bg-[#f6f7fb]") : "bg-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>{c.other_name}</span>
                {c.unread_count > 0 && (
                  <span className="text-xs font-bold text-white bg-[#ff2d55] rounded-full px-2 py-0.5">{c.unread_count}</span>
                )}
              </div>
              <p className={`text-xs mt-0.5 truncate ${dark ? "text-[#888]" : "text-[#666]"}`}>
                {c.last_message || "Say hello 👋"}
              </p>
            </button>
          ))}
        </div>

        <div className={`flex-1 ${active ? "flex" : "hidden sm:flex"} flex-col`}>
          {active ? (
            <>
              <button onClick={() => setActiveId(null)} className={`sm:hidden text-left px-4 py-2 text-sm ${dark ? "text-white" : "text-[#111]"}`}>
                ← Back
              </button>
              <ChatWindow
                conversationId={active.id}
                currentUser={currentUser}
                otherUser={{ id: active.other_id, full_name: active.other_name, avatar_url: active.other_avatar }}
                dark={dark}
                isDemo={!!active.is_demo}
              />
            </>
          ) : (
            <div className={`hidden sm:flex flex-1 items-center justify-center text-sm ${dark ? "text-[#888]" : "text-[#666]"}`}>
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}