// MessageSellerButton.jsx
import { useState } from "react";
import { api } from "../utils";

// Drop into a listing card (VehicleCard, ServiceCard, etc.) next to the
// existing Accept/contact controls, or into a detail page as a full-width
// action. Fires "padosi:openChat" with the resulting conversation —
// ChatPage listens for that, the same way WishlistPage listens for
// "padosi:openWishlist".
//
// Demo listings (isDemo=true) aren't backed by a real seller row in the DB,
// so POSTing to /api/conversations for one would fail a foreign-key check
// server-side. Instead, for demo listings this button builds a conversation
// object entirely client-side and hands it straight to ChatPage — no
// network call, nothing persisted, just enough shape for the chat window to
// open and let someone type.
//
// IMPORTANT: ChatPage/ChatWindow need to check `conversation.is_demo` and
// treat it as local-only — no socket room join, no message-history fetch,
// no persistence to the real messages table. That part lives in those
// files, not here.
export default function MessageSellerButton({
  listingType,
  listingId,
  sellerId,
  sellerName,
  isDemo = false,
  dark,
  label = "Message Seller",
  className = "",
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (isDemo) {
      const conversation = {
        id: `demo-${listingType}-${listingId}`,
        listing_type: listingType,
        listing_id: String(listingId),
        seller_id: sellerId ?? `demo-seller-${listingId}`,
        seller_name: sellerName ?? "Demo Seller",
        is_demo: true,
        created_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      };
      window.dispatchEvent(new CustomEvent("padosi:openChat", { detail: { conversation, isDemo: true } }));
      return;
    }

    setLoading(true);
    try {
      const { conversation } = await api("POST", "/api/conversations", {
        listing_type: listingType,
        listing_id: listingId,
        seller_id: sellerId,
      });
      window.dispatchEvent(new CustomEvent("padosi:openChat", { detail: { conversation } }));
    } catch (err) {
      console.error("MessageSellerButton error:", err);
    } finally {
      setLoading(false);
    }
  };

  const defaultClasses = `px-3.5 py-2 rounded-lg text-sm font-semibold border cursor-pointer transition-colors disabled:opacity-60 ${
    dark
      ? "border-white text-white bg-black hover:bg-white hover:text-black"
      : "border-[#eee] text-[#111] bg-white hover:border-[#ff2d55] hover:text-[#ff2d55]"
  }`;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className || defaultClasses}
    >
      {loading ? "Opening…" : label}
    </button>
  );
}