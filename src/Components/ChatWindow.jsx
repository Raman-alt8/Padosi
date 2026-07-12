// ChatWindow.jsx
import { useEffect, useRef, useState } from "react";
import { api } from "../utils";
import { useSocket } from "./SocketContext";

const LIMITS = { message: 2000 }; // same input-limiting convention as PostVehiclePage.jsx

export default function ChatWindow({ conversationId, currentUser, otherUser, dark }) {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
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
  }, [conversationId]);

  useEffect(() => {
    if (!socket) return;

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
  }, [socket, conversationId, currentUser.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || !socket) return;
    socket.emit("send_message", { conversationId, content: trimmed }, (res) => {
      if (res?.error) console.error("send_message failed:", res.error);
    });
    setDraft("");
    socket.emit("typing", { conversationId, isTyping: false });
  };

  const handleChange = (e) => {
    setDraft(e.target.value);
    if (!socket) return;
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