// ChatWindow.jsx
import { useEffect, useRef, useState } from "react";
import { api } from "../utils";
import { useSocket } from "./SocketContext";

const LIMITS = { message: 2000 }; // same input-limiting convention as PostVehiclePage.jsx

// isDemo: true for conversations MessageSellerButton built client-side for
// isDemo listings. Those have no row in the conversations/messages tables
// and no socket room, so this component takes a different path for them —
// no GET for history, no join_conversation, no send_message over the
// socket. Instead messages live only in local state and "sending" just
// appends locally (with a short canned reply so the thread doesn't feel
// dead), matching the "nothing persisted" contract from that file's
// comment.
export default function ChatWindow({ conversationId, currentUser, otherUser, dark, isDemo = false }) {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(!isDemo);
  const [typingUser, setTypingUser] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const replyTimeout = useRef(null);

  // Demo thread: seed a friendly opener instead of fetching history that
  // doesn't exist, so the window doesn't just open on an empty void.
  useEffect(() => {
    if (!isDemo) return;
    setMessages([
      {
        id: `demo-greeting-${conversationId}`,
        conversation_id: conversationId,
        sender_id: otherUser?.id,
        content: "Hey! Thanks for reaching out — happy to answer any questions about the listing 🙂",
        created_at: new Date().toISOString(),
      },
    ]);
    setLoading(false);
  }, [isDemo, conversationId, otherUser?.id]);

  // Real thread: fetch actual history as before.
  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api("GET", `/api/conversations/${conversationId}/messages`);
        if (!cancelled) setMessages(data.messages || []);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [conversationId, isDemo]);

  useEffect(() => {
    if (isDemo || !socket) return; // demo threads never join a real socket room

    socket.emit("join_conversation", conversationId, (res) => {
      if (res?.error) console.error("join_conversation failed:", res.error);
    });

    const handleReceive = (message) => {
      if (message.conversation_id !== conversationId) return;
      setMessages((prev) => [...prev, message]);
    };
    const handleTyping = ({ conversationId: cid, userId, isTyping }) => {
      if (cid !== conversationId || userId === currentUser.id) return;
      setTypingUser(isTyping);
    };

    socket.on("receive_message", handleReceive);
    socket.on("typing", handleTyping);
    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("typing", handleTyping);
    };
  }, [socket, conversationId, currentUser.id, isDemo]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  // Clean up a pending canned reply if the window unmounts mid-timeout.
  useEffect(() => () => clearTimeout(replyTimeout.current), []);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;

    if (isDemo) {
      const mine = {
        id: `demo-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content: trimmed,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, mine]);
      setDraft("");

      // Canned reply so the thread feels alive when showing off the
      // feature — not a real seller, just enough to demo both sides.
      setTypingUser(true);
      clearTimeout(replyTimeout.current);
      replyTimeout.current = setTimeout(() => {
        setTypingUser(false);
        setMessages((prev) => [...prev, {
          id: `demo-reply-${Date.now()}`,
          conversation_id: conversationId,
          sender_id: otherUser?.id,
          content: "Sounds good — this is a demo listing, so replies here are canned, but this is how a real chat would look!",
          created_at: new Date().toISOString(),
        }]);
      }, 1200);
      return;
    }

    if (!socket) return;
    socket.emit("send_message", { conversationId, content: trimmed }, (res) => {
      if (res?.error) console.error("send_message failed:", res.error);
    });
    setDraft("");
    socket.emit("typing", { conversationId, isTyping: false });
  };

  const handleChange = (e) => {
    setDraft(e.target.value);
    if (isDemo || !socket) return; // no typing indicator to broadcast for a local-only thread
    socket.emit("typing", { conversationId, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing", { conversationId, isTyping: false });
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between px-4 py-3 border-b ${dark ? "border-white" : "border-[#eee]"}`}>
        <span className={`font-bold ${dark ? "text-white" : "text-[#111]"}`}>
          {otherUser?.full_name || "Chat"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <p className={`text-sm ${dark ? "text-[#888]" : "text-[#666]"}`}>Loading messages…</p>
        ) : (
          messages.map((m) => {
            const mine = String(m.sender_id) === String(currentUser.id);
            return (
              <div key={m.id} className={`flex mb-2 ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                  mine
                    ? "bg-[#ff2d55] text-white"
                    : dark ? "bg-[#1a1a1a] text-white" : "bg-[#f2f2f2] text-[#111]"
                }`}>
                  {m.content}
                </div>
              </div>
            );
          })
        )}
        {typingUser && (
          <p className={`text-xs ${dark ? "text-[#888]" : "text-[#999]"}`}>
            {otherUser?.full_name} is typing…
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className={`flex gap-2 px-4 py-3 border-t ${dark ? "border-white" : "border-[#eee]"}`}>
        <input
          value={draft}
          onChange={handleChange}
          maxLength={LIMITS.message}
          placeholder="Type a message…"
          className={`flex-1 px-4 py-2.5 rounded-full border text-sm focus:outline-none transition-colors ${
            dark
              ? "bg-black border-white text-white placeholder:text-[#666] focus:border-white"
              : "bg-white border-[#ddd] text-[#111] placeholder:text-[#aaa] focus:border-[#ff2d55]"
          }`}
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="px-5 py-2.5 rounded-full font-semibold text-sm cursor-pointer border-none bg-[#ff2d55] text-white transition-opacity disabled:opacity-50 hover:opacity-90"
        >
          Send
        </button>
      </form>
    </div>
  );
}