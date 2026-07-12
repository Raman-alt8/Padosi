// MessageSellerButton.jsx
import { useState } from "react";
import { api } from "../utils";

// Drop into a listing card (VehicleCard, ServiceCard, etc.) next to the
// existing Accept/contact controls. Fires "padosi:openChat" with the
// resulting conversation — ChatPage listens for that, the same way
// WishlistPage listens for "padosi:openWishlist".
export default function MessageSellerButton({ listingType, listingId, sellerId, dark }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
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

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-3.5 py-2 rounded-lg text-sm font-semibold border cursor-pointer transition-colors disabled:opacity-60 ${
        dark
          ? "border-white text-white bg-black hover:bg-white hover:text-black"
          : "border-[#eee] text-[#111] bg-white hover:border-[#ff2d55] hover:text-[#ff2d55]"
      }`}
    >
      {loading ? "Opening…" : "Message Seller"}
    </button>
  );
}