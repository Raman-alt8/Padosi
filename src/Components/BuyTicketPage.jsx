import { useState, useEffect } from "react";
import { EVENT_CATEGORIES, ImageUploadField, LIMITS, LimitNote } from "./ticketShared";
import PostPanel from "./PostTicketPanel";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Reveal Modal ─────────────────────────────────────────────────────────────
// Shown to buyer after clicking Buy — displays ticket image + seller contact

function RevealModal({ data, dark, onClose }) {
  if (!data) return null;
  return (
    <div
      className="fixed inset-0 z-[6000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className={`relative z-10 w-full max-w-sm rounded-2xl border p-5 flex flex-col gap-4 shadow-2xl ${
          dark ? "bg-black border-white/20" : "bg-white border-[#eee]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className={`text-base font-black ${dark ? "text-white" : "text-[#111]"}`}>
            🎟️ Ticket Details
          </p>
          <button
            onClick={onClose}
            className={`text-xl leading-none cursor-pointer ${dark ? "text-white/50 hover:text-white" : "text-[#bbb] hover:text-[#333]"}`}
          >
            ✕
          </button>
        </div>

        {/* Ticket image */}
        {data.image_url ? (
          <img
            src={data.image_url}
            alt="Ticket"
            className="w-full rounded-xl object-contain max-h-64 border"
            style={{ borderColor: dark ? "rgba(255,255,255,0.1)" : "#eee" }}
          />
        ) : (
          <div
            className={`w-full h-36 rounded-xl flex items-center justify-center text-sm ${
              dark ? "bg-white/5 text-white/30" : "bg-[#f6f7fb] text-[#bbb]"
            }`}
          >
            No image uploaded
          </div>
        )}

        {/* Seller contact */}
        <div
          className={`rounded-xl p-4 flex flex-col gap-2 ${
            dark ? "bg-white/5" : "bg-[#f6f7fb]"
          }`}
        >
          <p className={`text-xs font-bold uppercase tracking-wide ${dark ? "text-white/40" : "text-[#bbb]"}`}>
            Seller Contact
          </p>
          <p className={`text-sm font-black ${dark ? "text-white" : "text-[#111]"}`}>
            {data.contact}
          </p>
          {/* WhatsApp deep-link if it looks like a phone number */}
          {/\d{10}/.test(data.contact) && (
            <a
              href={`https://wa.me/91${data.contact.replace(/\D/g, "").slice(-10)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                dark
                  ? "bg-white text-black border-white hover:bg-white/80"
                  : "bg-[#25d366] text-white border-[#25d366] hover:bg-[#1ebe5d]"
              }`}
            >
              💬 Message on WhatsApp
            </a>
          )}
        </div>

        <p className={`text-xs text-center ${dark ? "text-white/30" : "text-[#ccc]"}`}>
          Contact the seller directly to arrange payment &amp; handover.
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TabBar({ tab, setTab, dark }) {
  const tabs = [
    { key: "buy",  label: "Buy Tickets"   },
    { key: "post", label: "Post a Ticket" },
  ];
  return (
    <div
      className={`flex gap-1 p-1 rounded-xl border ${
        dark ? "bg-white/10 border-white/20" : "bg-[#f0f0f5] border-[#e0e0ea]"
      }`}
    >
      {tabs.map(({ key, label }) => {
        const active = tab === key;
        return (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              active
                ? dark
                  ? "bg-white text-black shadow-sm"
                  : "bg-white text-[#111] shadow-sm border border-[#e0e0ea]"
                : dark
                ? "text-white/60 hover:text-white"
                : "text-[#888] hover:text-[#333]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function BadgePill({ text, dark }) {
  if (!text) return null;
  const isUrgent = text === "Hot" || text === "Last one" || text === "2 left";
  return (
    <span
      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
        isUrgent
          ? dark
            ? "bg-white text-black"
            : "bg-[#ff2d55] text-white"
          : dark
          ? "bg-white/20 text-white"
          : "bg-[#f0f0f5] text-[#555]"
      }`}
    >
      {text}
    </span>
  );
}

// ─── Inline Edit Form ─────────────────────────────────────────────────────────

function InlineEditForm({ listing, dark, onSave, onCancel }) {
  const [form, setForm] = useState({
    title:       listing.title,
    category:    listing.category,
    date:        listing.date,
    venue:       listing.venue,
    price:       String(listing.price),
    qty:         String(listing.qty),
    description: listing.description ?? "",
    contact:     listing.contact ?? "",
  });
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl]   = useState(listing.image_url ?? null);
  const [preview, setPreview]     = useState(listing.image_url ?? null);

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const inputBase = `w-full rounded-xl px-3 py-2 text-sm border outline-none transition-colors ${
    dark
      ? "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white"
      : "bg-[#f6f7fb] border-[#e0e0ea] text-[#111] placeholder:text-[#bbb] focus:border-[#ff2d55]"
  }`;

  const labelBase = `text-[10px] font-bold mb-0.5 block uppercase tracking-wide ${
    dark ? "text-white/50" : "text-[#aaa]"
  }`;

  const handleImageUpload = async (file) => {
    if (!file) { setImageUrl(null); setPreview(null); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res  = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Upload failed."); return; }
      setImageUrl(data.url);
      setPreview(data.url);
    } catch { alert("Upload failed. Please try again."); }
    finally  { setUploading(false); }
  };

  const handleSave = async () => {
    const required = ["title", "category", "date", "venue", "price", "contact"];
    if (required.some((k) => !form[k])) { alert("Please fill in all required fields."); return; }
    if (form.date < todayISO())          { alert("Event date cannot be in the past.");   return; }
    setSaving(true);
    await onSave(listing.id, {
      ...form,
      price:     Number(form.price),
      qty:       Number(form.qty) || 1,
      image_url: imageUrl ?? "",
    });
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-3 pt-1">
      <div>
        <label className={labelBase}>Event name *</label>
        <input className={inputBase} value={form.title} onChange={set("title")} maxLength={LIMITS.title} />
        {form.title.length >= LIMITS.title && <LimitNote />}
      </div>
      <div>
        <label className={labelBase}>Category *</label>
        <select className={inputBase} value={form.category} onChange={set("category")}>
          <option value="">Select a category</option>
          {EVENT_CATEGORIES.map((c) => (
            <option key={c.label} value={c.label}>{c.icon} {c.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelBase}>Date *</label>
          <input type="date" className={inputBase} value={form.date} min={todayISO()} onChange={set("date")} />
        </div>
        <div>
          <label className={labelBase}>Venue *</label>
          <input className={inputBase} placeholder="Venue name" value={form.venue} onChange={set("venue")} maxLength={LIMITS.venue} />
          {form.venue.length >= LIMITS.venue && <LimitNote />}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelBase}>Price (₹) *</label>
          <input type="text" inputMode="numeric" className={inputBase} value={form.price} onChange={set("price")} maxLength={LIMITS.price} />
          {form.price.length >= LIMITS.price && <LimitNote />}
        </div>
        <div>
          <label className={labelBase}>Qty</label>
          <input type="number" min="1" max="20" className={inputBase} value={form.qty} onChange={set("qty")} />
        </div>
      </div>
      <div>
        <label className={labelBase}>Details</label>
        <textarea rows={2} className={`${inputBase} resize-none`} placeholder="Seat details, reason for selling…" value={form.description} onChange={set("description")} maxLength={LIMITS.description} />
        {form.description.length >= LIMITS.description && <LimitNote />}
      </div>
      <div>
        <label className={labelBase}>Contact *</label>
        <input className={inputBase} placeholder="+91 98765 43210" value={form.contact} onChange={set("contact")} maxLength={LIMITS.contact} />
        {form.contact.length >= LIMITS.contact && <LimitNote />}
      </div>

      {/* Image upload in edit mode */}
      <ImageUploadField dark={dark} onUpload={handleImageUpload} uploading={uploading} preview={preview} />

      <div className="flex gap-2 mt-1">
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className={`flex-1 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all border ${
            saving || uploading
              ? dark ? "bg-white/20 text-white/40 border-white/10" : "bg-[#ffa0b0] text-white border-[#ffa0b0]"
              : dark ? "bg-white text-black border-white hover:bg-white/80"
                     : "bg-[#ff2d55] text-white border-[#ff2d55] hover:bg-[#e0254c]"
          }`}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all border ${
            dark
              ? "bg-transparent text-white/60 border-white/20 hover:border-white hover:text-white"
              : "bg-white text-[#888] border-[#ddd] hover:border-[#999] hover:text-[#333]"
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── TicketCard ───────────────────────────────────────────────────────────────

function TicketCard({ listing, dark, currentUserId, onBuy, onRemove, onEdit }) {
  const isOwner  = !!currentUserId && String(listing.userId) === String(currentUserId);
  const [editing, setEditing] = useState(false);

  const handleSaveEdit = async (id, fields) => {
    await onEdit(id, fields);
    setEditing(false);
  };

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${
        editing
          ? dark ? "border-white/60" : "border-[#ff2d55] shadow-[0_8px_24px_rgba(255,45,85,0.12)]"
          : dark ? "bg-black border-white/20 hover:border-white/60"
                 : "bg-white border-[#eee] hover:-translate-y-0.5 hover:border-[#ff2d55] hover:shadow-[0_8px_24px_rgba(255,45,85,0.10)]"
      } ${dark ? "bg-black" : "bg-white"}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border ${dark ? "border-white/20" : "border-[#eee]"}`}>
            {listing.icon}
          </span>
          <div>
            <p className={`text-sm font-black leading-tight ${dark ? "text-white" : "text-[#111]"}`}>{listing.title}</p>
            <p className={`text-xs mt-0.5 ${dark ? "text-white/50" : "text-[#999]"}`}>{listing.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${dark ? "bg-white/10 text-white/60" : "bg-[#f0f0f5] text-[#999]"}`}>
              Your listing
            </span>
          )}
          <BadgePill text={listing.badge} dark={dark} />
        </div>
      </div>

      {editing ? (
        <InlineEditForm listing={listing} dark={dark} onSave={handleSaveEdit} onCancel={() => setEditing(false)} />
      ) : (
        <>
          <div className={`text-xs flex flex-col gap-1 ${dark ? "text-white/60" : "text-[#777]"}`}>
            <span>📅 {listing.date}</span>
            <span>📍 {listing.venue}</span>
            <span>🎟️ {listing.qty} ticket{listing.qty > 1 ? "s" : ""} available · by {listing.seller}</span>
            {/* Show image indicator to owner only */}
            {isOwner && (
              <span className={listing.image_url ? (dark ? "text-white/40" : "text-[#bbb]") : (dark ? "text-white/20" : "text-[#ddd]")}>
                {listing.image_url ? "📷 Ticket photo attached" : "📷 No ticket photo"}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-1">
            <div>
              <p className={`text-xs ${dark ? "text-white/40" : "text-[#bbb]"}`}>per ticket</p>
              <p className={`text-lg font-black ${dark ? "text-white" : "text-[#111]"}`}>
                ₹{listing.price.toLocaleString("en-IN")}
              </p>
            </div>

            {isOwner ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all border ${
                    dark
                      ? "bg-transparent text-white border-white/40 hover:border-white hover:bg-white/10"
                      : "bg-white text-[#ff2d55] border-[#ff2d55] hover:bg-[#fff0f3]"
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => onRemove(listing.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all border ${
                    dark
                      ? "bg-transparent text-white/50 border-white/20 hover:border-white/60 hover:text-white/80"
                      : "bg-white text-[#aaa] border-[#ddd] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                  }`}
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => onBuy(listing)}
                className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all border ${
                  dark
                    ? "bg-white text-black border-white hover:bg-white/80"
                    : "bg-[#ff2d55] text-white border-[#ff2d55] hover:bg-[#e0254c]"
                }`}
              >
                Buy
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── BuyPanel ─────────────────────────────────────────────────────────────────

function BuyPanel({ dark, showToast, user }) {
  const [search, setSearch]               = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [listings, setListings]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [reveal, setReveal]               = useState(null);   // data for RevealModal
  const [revealing, setRevealing]         = useState(null);   // id currently loading

  const toCard = (t) => {
    const catObj = EVENT_CATEGORIES.find((c) => c.label === t.category);
    return {
      id:          t.id,
      userId:      t.user_id,
      title:       t.title,
      category:    t.category,
      icon:        catObj?.icon ?? "🎟️",
      date:        t.date,
      venue:       t.venue,
      price:       t.price,
      qty:         t.qty,
      seller:      t.seller_name ?? "Anonymous",
      badge:       t.qty === 1 ? "Last one" : null,
      description: t.description ?? "",
      contact:     t.contact ?? "",
      image_url:   t.image_url ?? null,
    };
  };

  useEffect(() => {
    if (!user) return;
    fetch("/api/tickets", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setListings((data.tickets ?? []).map(toCard)))
      .catch(() => showToast("⚠️ Could not load tickets."))
      .finally(() => setLoading(false));
  }, [user]);

  // ── Buy → reveal ticket image + contact ──────────────────────────────────
  const handleBuy = async (listing) => {
    setRevealing(listing.id);
    try {
      const res  = await fetch(`/api/tickets/${listing.id}/reveal`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) { showToast(`⚠️ ${data.error || "Could not load ticket details."}`); return; }
      setReveal(data);
    } catch { showToast("⚠️ Network error. Please try again."); }
    finally  { setRevealing(null); }
  };

  // ── Remove ────────────────────────────────────────────────────────────────
  const handleRemove = async (id) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(`⚠️ ${data.error || "Could not remove ticket."}`);
        return;
      }
      setListings((prev) => prev.filter((l) => l.id !== id));
      showToast("✅ Ticket listing removed.");
    } catch { showToast("⚠️ Network error. Please try again."); }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEdit = async (id, fields) => {
    try {
      const res  = await fetch(`/api/tickets/${id}`, {
        method:      "PATCH",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify(fields),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { showToast(`⚠️ ${data.error || "Could not update ticket."}`); return; }
      setListings((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l;
          const catObj = EVENT_CATEGORIES.find((c) => c.label === fields.category);
          return { ...l, ...fields, icon: catObj?.icon ?? l.icon, badge: fields.qty === 1 ? "Last one" : null };
        })
      );
      showToast("✅ Ticket listing updated.");
    } catch { showToast("⚠️ Network error. Please try again."); }
  };

  const categories = ["All", ...EVENT_CATEGORIES.map((c) => c.label)];
  const filtered = listings.filter((l) => {
    const matchCat    = activeCategory === "All" || l.category === activeCategory;
    const matchSearch = search === "" || l.title.toLowerCase().includes(search.toLowerCase()) || l.venue.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      {/* Reveal modal */}
      <RevealModal data={reveal} dark={dark} onClose={() => setReveal(null)} />

      <div className="flex flex-col gap-5">
        <input
          type="text"
          placeholder="Search events, venues…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full rounded-xl px-4 py-2.5 text-sm border outline-none transition-colors ${
            dark
              ? "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/60"
              : "bg-[#f6f7fb] border-[#e0e0ea] text-[#111] placeholder:text-[#bbb] focus:border-[#ff2d55]"
          }`}
        />

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const active = activeCategory === cat;
            const catObj = EVENT_CATEGORIES.find((c) => c.label === cat);
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all ${
                  active
                    ? dark ? "bg-white text-black border-white" : "bg-[#ff2d55] text-white border-[#ff2d55]"
                    : dark ? "bg-transparent text-white/60 border-white/20 hover:border-white/50"
                           : "bg-transparent text-[#777] border-[#ddd] hover:border-[#ff2d55] hover:text-[#ff2d55]"
                }`}
              >
                {catObj && <span>{catObj.icon}</span>}
                {cat}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className={`text-center py-16 text-sm ${dark ? "text-white/40" : "text-[#bbb]"}`}>Loading tickets…</div>
        ) : filtered.length === 0 ? (
          <div className={`text-center py-16 text-sm ${dark ? "text-white/40" : "text-[#bbb]"}`}>No tickets found. Try a different search or category.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((listing) => (
              <TicketCard
                key={listing.id}
                listing={listing}
                dark={dark}
                currentUserId={user?.id ?? null}
                onBuy={handleBuy}
                onRemove={handleRemove}
                onEdit={handleEdit}
                revealing={revealing === listing.id}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function BuyTicketPage({ showToast, dark = false, user = null }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState("buy");

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("padosi:openTickets", handler);
    return () => window.removeEventListener("padosi:openTickets", handler);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[5000] flex flex-col overflow-y-auto transition-opacity duration-300 ${
        dark ? "bg-black" : "bg-[#f6f7fb]"
      } ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      <div className={`h-[70px] flex items-center justify-between px-6 sticky top-0 z-10 border-b ${dark ? "bg-black border-white/20" : "bg-white border-[#eee]"}`}>
        <button
          onClick={() => setOpen(false)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
            dark ? "bg-black border-white text-white hover:bg-white hover:text-black" : "bg-white border-[#ddd] text-[#333] hover:border-[#ff2d55] hover:text-[#ff2d55]"
          }`}
        >
          ← Back
        </button>
        <p className={`text-base font-black ${dark ? "text-white" : "text-[#111]"}`}>
          Padosi <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>Tickets</span>
        </p>
        <div className="w-20" />
      </div>

      <div className={`py-12 px-6 text-center ${dark ? "bg-white text-black" : "bg-[#ff2d55] text-white"}`}>
        <h1 className="text-5xl font-black">🎟️</h1>
        <h2 className="text-3xl font-black mt-2">Tickets</h2>
        <p className={`mt-2 text-sm max-w-sm mx-auto ${dark ? "opacity-60" : "opacity-90"}`}>
          Buy tickets from neighbours or post your extras — no middlemen, no markup.
        </p>
      </div>

      <div className="flex justify-center px-4 pb-16">
        <div className="w-full max-w-3xl -mt-6">
          <div className={`rounded-2xl border p-5 shadow-[0_10px_40px_rgba(0,0,0,0.08)] ${dark ? "bg-black border-white/20" : "bg-white border-[#eee]"}`}>
            <div className="mb-5">
              <TabBar tab={tab} setTab={setTab} dark={dark} />
            </div>
            {tab === "buy" ? (
              <BuyPanel dark={dark} showToast={showToast} user={user} />
            ) : (
              <PostPanel dark={dark} showToast={showToast} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}