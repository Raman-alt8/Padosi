// RideSharePage.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import RidePostFormPage from "./RidePostFormPage";
import RideAcceptPage from "./RideAcceptPage";
import RideDetailPage from "./RideDetailPage";
import { useWishlist } from "./WishlistContext";
import { demoSellerFor } from "./demoIdentities";
import { initials, freqLabel, genderLabel, vehicleTypesOf, modeOf } from "./rideHelpers";

// Base URL for API calls — Vite exposes VITE_API_URL from .env
const API_BASE = import.meta.env.VITE_API_URL || "";

// Deterministic placeholder email built from a demo seller's name, e.g.
// "Rohan Mehta" -> "rohan.mehta@example.com". Only ever used for demo
// routes — real routes carry a real poster_contact.email from the API.
function demoEmailFor(name = "") {
  return `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
}

// Simple line-style heart, filled + tinted when a route is saved. Same shape
// as the heart used on ServiceListingsAllPage/WishlistPage, for a consistent
// icon app-wide.
function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
      <path d="M12 21s-6.7-4.3-9.3-8.2C1 10 1.6 6.7 4.4 5.2 6.6 4 9.2 4.7 12 7.5 14.8 4.7 17.4 4 19.6 5.2c2.8 1.5 3.4 4.8 1.7 7.6C18.7 16.7 12 21 12 21z" />
    </svg>
  );
}

async function readJsonSafely(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const SORT_OPTIONS = [
  { key: "newest",     label: "Newest first" },
  { key: "price_low",  label: "Price: Low to High" },
  { key: "price_high", label: "Price: High to Low" },
  { key: "departure",  label: "Departure time" },
];

// ── Browse mode — the two top-level ways to view the page ───────────────
// "partner" = you have a vehicle, browsing/posting as someone offering a
// ride. "ride" = you're looking for someone to share a ride with. This
// drives the header toggle below and is also what every card's mode chip
// reads off of.
const BROWSE_MODES = [
  { key: "partner", label: "🧑‍🤝‍🧑 Offering a ride" },
  { key: "ride",    label: "🙋 Partner to share ride" },
];

// ── Toolbar hide-on-scroll thresholds ─────────────────────────────────────
// Hiding on scroll-down stays sensitive (10px) so the toolbar tucks away
// quickly once you start reading cards. Revealing on scroll-up needs 3x
// that (30px) — a small upward jitter while reading no longer snaps it back;
// you have to actually mean to scroll up before it reappears.
const HIDE_THRESHOLD   = 10;
const REVEAL_THRESHOLD = 30;
const REOPEN_RESTORE_MS = 10000;

// ── Temporary showcase routes ────────────────────────────────────────────────
// Same raw-data → mapped-with-demoSellerFor split RentVehiclePage.jsx and
// ServiceListingsAllPage.jsx both use: RAW_DEMO_ROUTES only carries
// route-specific fields (where it goes, when, how many seats), and the map
// below attaches a deterministic poster identity — id, name, and a matching
// contact card — from demoIdentities, instead of every card sharing one
// generic "Demo Rider" name and a shared "__demo__" sentinel. Same route id
// always resolves to the same poster, so accepting a demo route and hitting
// Chat talks to a consistent named neighbour instead of a placeholder.
//
// Updated to also carry the newer fields (mode, vehicle_types, gender_pref,
// and the weekday/weekend/full_week freq scheme) so the redesigned cards
// and the new Filter panel have real variety to show off, without needing
// the backend/migrations for those columns to exist yet.
//
// `poster_id` still can never collide with a real user id — demoSellerFor
// builds it as `demo-seller-<routeId>`, a shape no real backend user id
// takes — so `isOwner` (computed below as `r.poster_id === currentUser?.id`)
// still never accidentally matches, same guarantee "__demo__" used to give.
//
// Negative sentinel `id`s (-1, -2, ...) are kept so they can never collide
// with a real route id from the server. They behave exactly like a real
// "someone else posted this" card: no isOwner match, so they fall into the
// normal Accept/Decline footer, and accepting one reveals poster contact
// info (now including a real chat button) exactly like a real accepted
// route — except accept/decline never reaches the server, since
// handleConfirmAccept/handleDecline short-circuit on negative ids below.
//
// To remove this showcase content later: delete this block (both
// RAW_DEMO_ROUTES and the DEMO_ROUTES map), the demoAccepted/demoDeclined
// state, and the `demo` half of the `visibleRoutes` useMemo.
const RAW_DEMO_ROUTES = [
  {
    id: -1,
    from_place: "Vaishali Nagar",
    to_place: "MI Road",
    freq: "weekday",
    depart_time: "08:30",
    seats: 3,
    price: 40,
    description: "Sample ride — post your own route to replace this.",
    phone: "+91 90000 00003",
    mode: "partner",
    vehicle_types: ["car"],
    gender_pref: "",
  },
  {
    id: -2,
    from_place: "Malviya Nagar",
    to_place: "Sindhi Camp",
    freq: "full_week",
    depart_time: "18:00",
    seats: 2,
    price: 0,
    description: "Another sample route so you can see how ride cards look.",
    phone: "+91 90000 00004",
    mode: "partner",
    vehicle_types: ["bike"],
    gender_pref: "",
  },
  {
    id: -3,
    from_place: "Mansarovar",
    to_place: "Jaipur Railway Station",
    freq: "full_week",
    depart_time: "07:15",
    seats: 4,
    price: 30,
    description: "Daily office commute, AC car, music on request.",
    phone: "+91 90000 00009",
    mode: "partner",
    vehicle_types: ["car", "bike"],
    gender_pref: "male",
  },
  {
    id: -4,
    from_place: "C-Scheme",
    to_place: "World Trade Park",
    freq: "weekend",
    depart_time: "10:00",
    seats: 2,
    price: 20,
    description: "Weekend shopping run, looking for someone already headed that way.",
    phone: "+91 90000 00010",
    mode: "ride",
    vehicle_types: [],
    gender_pref: "female",
  },
  {
    id: -5,
    from_place: "Jagatpura",
    to_place: "Malviya Nagar Metro",
    freq: "weekday",
    depart_time: "09:00",
    seats: 3,
    price: 25,
    description: "Weekday college commute, punctual departure every time.",
    phone: "+91 90000 00011",
    mode: "partner",
    vehicle_types: ["car"],
    gender_pref: "no_preference",
  },
  {
    id: -6,
    from_place: "Vidhyadhar Nagar",
    to_place: "Sanganer Airport",
    freq: "weekend",
    depart_time: "05:30",
    seats: 1,
    price: 150,
    description: "Early morning airport drop, occasional trips only.",
    phone: "+91 90000 00012",
    mode: "partner",
    vehicle_types: ["car"],
    gender_pref: "",
  },
  {
    id: -7,
    from_place: "Tonk Road",
    to_place: "Amrapali Circle",
    freq: "full_week",
    depart_time: "19:30",
    seats: 3,
    price: 15,
    description: "Evening return commute, bike-friendly boot space.",
    phone: "+91 90000 00013",
    mode: "partner",
    vehicle_types: ["bike"],
    gender_pref: "",
  },
  {
    id: -8,
    from_place: "Raja Park",
    to_place: "SMS Hospital",
    freq: "weekday",
    depart_time: "08:00",
    seats: 2,
    price: 20,
    description: "Regular hospital visit, looking for a lift rather than driving myself.",
    phone: "+91 90000 00014",
    mode: "ride",
    vehicle_types: [],
    gender_pref: "no_preference",
  },
];

// Each raw entry gets its poster identity (id + name) from demoIdentities,
// plus a matching poster_contact card built from that same identity so the
// name shown in the header, the "Email <FirstName>" button, and the chat
// button's sellerName all agree with each other.
const DEMO_ROUTES = RAW_DEMO_ROUTES.map((route) => {
  const seller = demoSellerFor(route.id);
  return {
    ...route,
    isDemo: true,
    poster_id: seller.id,
    poster_name: seller.name,
    poster_contact: {
      name: seller.name,
      email: demoEmailFor(seller.name),
      phone: route.phone,
    },
  };
});

// ─── Ride Share Page ──────
// Opens when the window event "padosi:openRide" is dispatched.
// Props:
//   currentUser  — { id, ... } object from your auth state (or null)
//   showToast    — (msg: string) => void
//   dark         — boolean
export default function RideSharePage({ currentUser, showToast, dark }) {
  const [open, setOpen]           = useState(false);
  const [formOpen, setFormOpen]   = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [routes, setRoutes]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");

  // ── Sort & Filter ────────────────────────────────────────────────────────
  const [activeMenu, setActiveMenu]       = useState(null); // null | "filter" | "sort"
  const [sortBy, setSortBy]               = useState("newest");
  const [filterMode, setFilterMode]       = useState("partner"); // partner | ride
  const [filterVehicle, setFilterVehicle] = useState("all"); // all | car | bike
  const [filterFreq, setFilterFreq]       = useState("all"); // all | weekday | weekend | full_week
  const [filterGender, setFilterGender]   = useState("all"); // all | male | female | no_preference

  const activeFilterCount = [filterVehicle, filterFreq, filterGender]
    .filter(v => v !== "all").length;

  const clearFilters = () => {
    setFilterVehicle("all"); setFilterFreq("all"); setFilterGender("all");
  };

  const pillCls = (active) => `px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
    active
      ? dark ? "bg-white border-white text-black" : "bg-[#ff2d55] border-[#ff2d55] text-white"
      : dark
        ? "border-white/30 bg-black text-white/60 hover:border-white hover:text-white"
        : "border-[#ddd] bg-white text-[#777] hover:border-[#ff2d55] hover:text-[#ff2d55]"
  }`;

  // ── Toolbar hide-on-scroll ────────────────────────────────────────────
  // Scrolling down past HIDE_THRESHOLD slides the toolbar up (transform,
  // not display:none, so it animates); scrolling up past REVEAL_THRESHOLD
  // brings it back. The two thresholds are intentionally different sizes —
  // see the constants above.
  const [hideToolbar, setHideToolbar]   = useState(false);
  const lastScrollTopRef                = useRef(0);
  const scrollContainerRef              = useRef(null);
  const preservedScrollTopRef           = useRef(0);
  const lastCloseTimeRef                = useRef(0);

  const handleContentScroll = (e) => {
    const current = e.target.scrollTop;
    const last     = lastScrollTopRef.current;

    if (current < 50) {
      setHideToolbar(false);
    } else if (current > last + HIDE_THRESHOLD) {
      setHideToolbar(true);   // scrolling down
    } else if (current < last - REVEAL_THRESHOLD) {
      setHideToolbar(false);  // scrolling up — needs 3x the movement to undo a hide
    }
    lastScrollTopRef.current = current;
  };

  const rememberCurrentScroll = () => {
    if (scrollContainerRef.current) {
      preservedScrollTopRef.current = scrollContainerRef.current.scrollTop;
    }
    lastCloseTimeRef.current = Date.now();
  };

  const handleCloseRideShare = () => {
    rememberCurrentScroll();
    setOpen(false);
  };

  useEffect(() => {
    if (!open) {
      setHideToolbar(false);
      lastScrollTopRef.current = 0;
      return;
    }

    setHideToolbar(false);
    lastScrollTopRef.current = 0;

    const shouldRestore = Date.now() - lastCloseTimeRef.current <= REOPEN_RESTORE_MS;
    const targetScrollTop = shouldRestore ? preservedScrollTopRef.current : 0;

    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = targetScrollTop;
      }
    });
  }, [open]);

  // Shared wishlist store — same context every other listing page reads
  // from, so a heart tapped here shows up on WishlistPage instantly.
  const { isWishlisted, toggleWishlist } = useWishlist();

  // Locally-scoped, "this account only" state for demo cards — mirrors
  // ServiceListingsAllPage's declinedIndexes/acceptedIndexes.
  const [demoDeclined, setDemoDeclined] = useState(() => new Set());
  const [demoAccepted, setDemoAccepted] = useState(() => new Set());

  // ── Accept overlay state ────────────────────────────────────────────────
  const [acceptOpen, setAcceptOpen]   = useState(false);
  const [acceptRoute, setAcceptRoute] = useState(null);
  const [acceptStep, setAcceptStep]   = useState("review");

  // ── Detail overlay state ─────────────────────────────────────────────────
  // Opened by tapping a card anywhere outside its interactive controls.
  // Shows the same route full-screen; its own action buttons call straight
  // back into the same handlers the card footer uses (openAccept,
  // handleDecline, openForm, handleDelete, handleHideAccepted), so there's
  // one source of truth for what each action does.
  const [detailOpen, setDetailOpen]   = useState(false);
  const [detailRoute, setDetailRoute] = useState(null);

  const openDetail = (route) => {
    setDetailRoute(route);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailRoute(null);
  };

  // ── Open / close ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("padosi:openRide", handler);
    return () => window.removeEventListener("padosi:openRide", handler);
  }, []);

  // ── Fetch all routes from the API ───────────────────────────────────────────
  const fetchRoutes = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ride-routes`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load routes");
      const data = await readJsonSafely(res);
      setRoutes(data.routes || []);
    } catch (err) {
      console.error(err);
      showToast("⚠️ Could not load routes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentUser, showToast]);

  useEffect(() => {
    if (open) fetchRoutes();
  }, [open, fetchRoutes]);

  useEffect(() => {
    routes.forEach(r => {
      if (r.my_response === "accepted" && !r.poster_contact) {
        fetch(`${API_BASE}/api/ride-routes/${r.id}/accept`, {
          method: "POST",
          credentials: "include",
        })
          .then(res => readJsonSafely(res))
          .then(data => {
            if (data.poster) {
              setRoutes(prev => prev.map(x =>
                x.id === r.id ? { ...x, poster_contact: data.poster } : x
              ));
            }
          })
          .catch(() => {});
      }
    });
  }, [routes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const openForm = (route = null) => {
    setEditingRoute(route);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingRoute(null);
  };

  const handleFormSaved = (route, isEdit) => {
    if (isEdit) {
      setRoutes(prev => prev.map(r => (r.id === route.id ? route : r)));
    } else {
      setRoutes(prev => [route, ...prev]);
    }
  };

  const openAccept = (route) => {
    setAcceptRoute(route);
    setAcceptStep(route.my_response === "accepted" ? "confirmed" : "review");
    setAcceptOpen(true);
  };

  const closeAccept = () => {
    setAcceptOpen(false);
    setAcceptRoute(null);
  };

  const handleConfirmAccept = async (routeId, seats, note) => {
    if (routeId < 0) {
      setDemoAccepted(prev => new Set(prev).add(routeId));
      const demoRoute = DEMO_ROUTES.find(d => d.id === routeId);
      return { poster_contact: demoRoute?.poster_contact };
    }
    const res = await fetch(`${API_BASE}/api/ride-routes/${routeId}/accept`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seats, note }),
    });
    const data = await readJsonSafely(res);
    if (!res.ok) throw new Error(data.error || "Could not accept this route. Please try again.");
    setRoutes(prev => prev.map(r =>
      r.id === routeId
        ? { ...r, my_response: "accepted", poster_contact: data.poster, accepted_seats: seats, accepted_note: note }
        : r
    ));
    return { poster_contact: data.poster };
  };

  const handleDecline = async (routeId) => {
    if (routeId < 0) {
      setDemoDeclined(prev => new Set(prev).add(routeId));
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/ride-routes/${routeId}/decline`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) { const d = await readJsonSafely(res); showToast(`⚠️ ${d.error}`); return; }
      setRoutes(prev => prev.filter(r => r.id !== routeId));
    } catch (err) {
      console.error(err);
      showToast("⚠️ Network error. Please try again.");
    }
  };

  const handleHideAccepted = (routeId) => {
    if (routeId < 0) {
      setDemoDeclined(prev => new Set(prev).add(routeId));
      return;
    }
    setRoutes(prev => prev.filter(r => r.id !== routeId));
  };

  const handleDelete = async (routeId) => {
    if (routeId < 0) return;
    try {
      const res = await fetch(`${API_BASE}/api/ride-routes/${routeId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await readJsonSafely(res);
        showToast(`⚠️ ${data.error || "Could not remove route."}`);
        return;
      }
      setRoutes(prev => prev.filter(r => r.id !== routeId));
      showToast("🗑️ Route removed");
    } catch (err) {
      console.error(err);
      showToast("⚠️ Network error. Please try again.");
    }
  };

  const visibleRoutes = useMemo(() => {
    const demo = DEMO_ROUTES
      .filter(d => !demoDeclined.has(d.id))
      .map(d => ({
        ...d,
        my_response: demoAccepted.has(d.id) ? "accepted" : undefined,
      }));
    return [...routes, ...demo];
  }, [routes, demoDeclined, demoAccepted]);

  const searchMatched = visibleRoutes.filter(r => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return true;
    const haystacks = [r.from_place, r.to_place, r.description]
      .map(value => String(value || "").toLowerCase());
    return haystacks.some(text => text.includes(q));
  });

  const filtered = useMemo(() => {
    const list = searchMatched.filter(r => {
      if (modeOf(r) !== filterMode) return false;
      if (filterVehicle !== "all" && !vehicleTypesOf(r).includes(filterVehicle)) return false;
      if (filterFreq !== "all" && r.freq !== filterFreq) return false;
      if (filterGender !== "all" && (r.gender_pref || "") !== filterGender) return false;
      return true;
    });

    const sorted = [...list];
    switch (sortBy) {
      case "price_low":
        sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price_high":
        sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "departure":
        sorted.sort((a, b) => (a.depart_time || "").localeCompare(b.depart_time || ""));
        break;
      case "newest":
      default:
        break;
    }
    return sorted;
  }, [searchMatched, filterMode, filterVehicle, filterFreq, filterGender, sortBy]);

  const hasActiveQuery = !!search || activeFilterCount > 0;

  const buildWishlistEntry = (r) => ({
    type: "ride",
    id: r.id,
    title: `${r.from_place} → ${r.to_place}`,
    subtitle: r.poster_name ? `Posted by ${r.poster_name}` : undefined,
    meta: [
      `📅 ${freqLabel(r.freq)}`,
      `🕐 ${r.depart_time || "—"}`,
      ...(modeOf(r) === "partner" ? [`👥 ${r.seats} seat${r.seats > 1 ? "s" : ""}`] : []),
    ],
    price: r.price > 0 ? r.price : null,
    priceUnit: "/seat",
    image: null,
    icon: "🛣️",
    badge: r.isDemo ? "Demo" : undefined,
    isDemo: !!r.isDemo,
    raw: r,
  });

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[5000] flex flex-col overflow-hidden ${dark ? "bg-black" : "bg-[#f6f7fb]"}`}>

      {/* ── Header ── */}
      <div className={`h-[80px] shrink-0 flex items-center justify-between px-6 sticky top-0 z-10 border-b ${
        dark ? "bg-black border-white" : "bg-white border-[#eee]"
      }`}>
        <button
          onClick={handleCloseRideShare}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-colors ${
            dark
              ? "bg-black border-white text-white hover:bg-white hover:text-black"
              : "bg-white border-[#ddd] text-[#333] hover:border-[#ff2d55] hover:text-[#ff2d55]"
          }`}
        >
          ← Back
        </button>
        <p className={`text-xl font-black ${dark ? "text-white" : "text-[#111]"}`}>
          Padosi{" "}
          <span className={`underline decoration-2 underline-offset-2 ${dark ? "text-white" : "text-[#ff2d55]"}`}>
            Ride Share
          </span>
        </p>
        <button
          onClick={() => openForm(null)}
          className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold cursor-pointer border transition-all hover:-translate-y-0.5 ${
            dark
              ? "bg-white text-black border-white hover:shadow-[0_8px_24px_rgba(255,255,255,0.2)]"
              : "bg-[#ff2d55] text-white border-[#ff2d55] hover:shadow-[0_8px_24px_rgba(255,45,85,0.25)]"
          }`}
        >
          + Post a Route
        </button>
      </div>

      {/* ── Scrolling column ── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleContentScroll}
        className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >

      {/* ── Toolbar ── */}
      <div
        className={`sticky top-0 z-20 transition-all duration-300 ease-in-out transform ${
          dark ? "bg-black" : "bg-[#f6f7fb]"
        } ${
          hideToolbar
            ? "-translate-y-full opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100"
        }`}
      >

      {/* ── Search ── */}
      <div className="px-6 pt-4 max-w-[600px] mx-auto w-full">
        <div className="relative">
          <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm ${dark ? "text-white/40" : "text-[#bbb]"}`}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search routes, e.g. Vaishali to MI Road…"
            className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm focus:outline-none transition-colors ${
              dark
                ? "bg-black border-white text-white placeholder-white/40 focus:ring-1 focus:ring-white"
                : "bg-white border-[#ddd] text-[#111] placeholder-[#aaa] focus:border-[#ff2d55] shadow-sm"
            }`}
          />
        </div>
      </div>

      {/* ── Browse mode toggle ── */}
      <div className="px-6 pt-3 max-w-[600px] mx-auto w-full">
        <div className={`flex gap-2 p-1 rounded-2xl border ${dark ? "border-white bg-black" : "border-[#eee] bg-white"}`}>
          {BROWSE_MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterMode(key)}
              className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors ${
                filterMode === key
                  ? dark ? "bg-white text-black" : "bg-[#ff2d55] text-white"
                  : dark ? "text-white/60 hover:text-white" : "text-[#777] hover:text-[#ff2d55]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sort & Filter bar ── */}
      <div className="px-6 pb-3 pt-3 max-w-[1200px] mx-auto w-full relative">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className={`text-xs font-semibold ${dark ? "text-white/40" : "text-[#aaa]"}`}>
            {filtered.length} route{filtered.length !== 1 ? "s" : ""} found
          </span>

          <div className="flex gap-2 relative">
            <button
              onClick={() => setActiveMenu(m => (m === "filter" ? null : "filter"))}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold cursor-pointer border transition-colors ${
                activeMenu === "filter"
                  ? dark ? "bg-white text-black border-white" : "bg-[#ff2d55] text-white border-[#ff2d55]"
                  : dark
                    ? "border-white text-white bg-black hover:bg-white/10"
                    : "border-[#ddd] text-[#555] bg-white hover:border-[#ff2d55] hover:text-[#ff2d55]"
              }`}
            >
              ▤ Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
            <button
              onClick={() => setActiveMenu(m => (m === "sort" ? null : "sort"))}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold cursor-pointer border transition-colors ${
                activeMenu === "sort"
                  ? dark ? "bg-white text-black border-white" : "bg-[#ff2d55] text-white border-[#ff2d55]"
                  : dark
                    ? "border-white text-white bg-black hover:bg-white/10"
                    : "border-[#ddd] text-[#555] bg-white hover:border-[#ff2d55] hover:text-[#ff2d55]"
              }`}
            >
              ⇅ Sort
            </button>

            {activeMenu && (
              <button
                aria-label="Close menu"
                onClick={() => setActiveMenu(null)}
                className="fixed inset-0 z-[15] cursor-default"
              />
            )}

            {activeMenu === "filter" && (
              <div className={`absolute right-0 top-full mt-2 w-[280px] z-20 rounded-2xl border p-4 ${
                dark ? "bg-black border-white shadow-[0_12px_32px_rgba(0,0,0,0.6)]" : "bg-white border-[#eee] shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-black ${dark ? "text-white" : "text-[#111]"}`}>Filters</span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className={`text-xs font-bold cursor-pointer ${dark ? "text-white/60 hover:text-white" : "text-[#ff2d55] hover:text-[#e0002b]"}`}
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {filterMode === "partner" && (
                  <>
                    <p className={`text-xs font-bold mb-1.5 ${dark ? "text-white/50" : "text-[#999]"}`}>Vehicle</p>
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {[
                        { key: "all", label: "All" },
                        { key: "car", label: "🚗 Car" },
                        { key: "bike", label: "🏍️ Bike" },
                      ].map(({ key, label }) => (
                        <button key={key} onClick={() => setFilterVehicle(key)} className={pillCls(filterVehicle === key)}>{label}</button>
                      ))}
                    </div>
                  </>
                )}

                <p className={`text-xs font-bold mb-1.5 ${dark ? "text-white/50" : "text-[#999]"}`}>Frequency</p>
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {[
                    { key: "all", label: "All" },
                    { key: "weekday", label: "Weekday" },
                    { key: "weekend", label: "Weekend" },
                    { key: "full_week", label: "Full Week" },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setFilterFreq(key)} className={pillCls(filterFreq === key)}>{label}</button>
                  ))}
                </div>

                <p className={`text-xs font-bold mb-1.5 ${dark ? "text-white/50" : "text-[#999]"}`}>Gender preference</p>
                <div className="flex gap-1.5 flex-wrap mb-4">
                  {[
                    { key: "all", label: "All" },
                    { key: "male", label: "Male" },
                    { key: "female", label: "Female" },
                    { key: "no_preference", label: "Any" },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setFilterGender(key)} className={pillCls(filterGender === key)}>{label}</button>
                  ))}
                </div>

                <button
                  onClick={() => setActiveMenu(null)}
                  className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer border transition-colors ${
                    dark ? "bg-white text-black border-white" : "bg-[#ff2d55] text-white border-[#ff2d55]"
                  }`}
                >
                  Done
                </button>
              </div>
            )}

            {activeMenu === "sort" && (
              <div className={`absolute right-0 top-full mt-2 w-[220px] z-20 rounded-2xl border p-2 ${
                dark ? "bg-black border-white shadow-[0_12px_32px_rgba(0,0,0,0.6)]" : "bg-white border-[#eee] shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
              }`}>
                {SORT_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setSortBy(key); setActiveMenu(null); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      sortBy === key
                        ? dark ? "bg-white text-black" : "bg-[#fff0f3] text-[#ff2d55]"
                        : dark ? "text-white/70 hover:bg-white/10" : "text-[#555] hover:bg-[#f6f7fb]"
                    }`}
                  >
                    {sortBy === key ? "✓ " : ""}{label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      </div>

      {/* ── Route Cards ── */}
      <div className="px-6 pb-10">
        {loading && (
          <div className="flex justify-center items-center py-20">
            <span className={`text-sm animate-pulse ${dark ? "text-white/40" : "text-[#bbb]"}`}>
              Loading routes…
            </span>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1200px] mx-auto">
            {filtered.length === 0 ? (
              <div className="col-span-3 text-center py-16 flex flex-col items-center gap-3">
                <span className="text-5xl">🛣️</span>
                <strong className={`text-base ${dark ? "text-white/40" : "text-[#bbb]"}`}>
                  {hasActiveQuery ? "No routes match your search or filters." : "No routes posted yet."}
                </strong>
                <span className={`text-sm ${dark ? "text-white/30" : "text-[#ccc]"}`}>
                  {hasActiveQuery ? "Try a different keyword or clear a filter." : "Be the first — post your route!"}
                </span>
              </div>
            ) : filtered.map(r => {
              const isOwner   = r.poster_id === currentUser?.id;
              const mode      = modeOf(r);
              const vehicles  = vehicleTypesOf(r);
              const genderTag = genderLabel(r.gender_pref);
              const saved     = isWishlisted("ride", r.id);

              const vehicleTag = vehicles.length === 0
                ? { icon: "🚘", text: "Any vehicle" }
                : vehicles.length > 1
                  ? { icon: "🚘", text: "Car & Bike" }
                  : { icon: vehicles[0] === "car" ? "🚗" : "🏍️", text: vehicles[0] === "car" ? "Car" : "Bike" };

              const tags = mode === "partner"
                ? [
                    { icon: "📅", text: freqLabel(r.freq) },
                    { icon: "🕐", text: r.depart_time || "—" },
                    { icon: "👥", text: `${r.seats} seat${r.seats > 1 ? "s" : ""}` },
                    vehicleTag,
                    { icon: "🚻", text: genderTag || "Any gender" },
                  ]
                : [
                    { icon: "📅", text: freqLabel(r.freq) },
                    { icon: "🕐", text: r.depart_time || "—" },
                    { icon: "🚻", text: genderTag || "Any gender" },
                  ];

              return (
                <div
                  key={r.id}
                  onClick={() => openDetail(r)}
                  className={`relative rounded-2xl border p-5 pt-4 flex flex-col gap-3.5 cursor-pointer hover:-translate-y-1 transition-all ${
                    dark
                      ? "bg-black border-white shadow-[0_6px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(255,255,255,0.1)]"
                      : "bg-white border-[#eee] shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
                  }`}
                >
                  {/* Top-right stack */}
                  <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(buildWishlistEntry(r)); }}
                        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
                        aria-pressed={saved}
                        title={saved ? "Remove from wishlist" : "Save to wishlist"}
                        className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border transition-all active:scale-90 ${
                          saved
                            ? "bg-[#ff2d55] border-[#ff2d55] text-white"
                            : dark
                              ? "bg-black/60 border-white/30 text-white/60 hover:text-[#ff2d55] hover:border-[#ff2d55]/50"
                              : "bg-white/90 border-[#eee] text-[#ccc] hover:text-[#ff2d55] hover:border-[#ff2d55]/40 shadow-sm"
                        }`}
                      >
                        <HeartIcon filled={saved} />
                      </button>

                      {!isOwner && r.my_response === "accepted" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleHideAccepted(r.id); }}
                          aria-label="Remove this route from your view"
                          title="Remove from view"
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-colors ${
                            dark
                              ? "text-white/50 hover:text-white hover:bg-white/10"
                              : "text-[#bbb] hover:text-[#777] hover:bg-[#f0f0f0]"
                          }`}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {isOwner && (
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border ${
                        dark
                          ? "border-white text-white bg-black/60"
                          : "border-[#ff2d55] text-[#ff2d55] bg-[#fff0f3]"
                      }`}>
                        Your route
                      </span>
                    )}
                    {r.isDemo && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border border-purple-300 text-purple-600 bg-purple-50">
                        Sample
                      </span>
                    )}
                  </div>

                  <div className="pr-11">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                      mode === "ride"
                        ? "border-blue-300 text-blue-600 bg-blue-50"
                        : "border-emerald-300 text-emerald-600 bg-emerald-50"
                    }`}>
                      {mode === "ride" ? "🙋 Partner to share ride" : "🧑‍🤝‍🧑 Offering a ride"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 pr-11">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${dark ? "bg-white" : "bg-[#ff2d55]"}`} />
                      <span className={`w-0.5 h-5 ${dark ? "bg-white/30" : "bg-[#eee]"}`} />
                      <span className={`w-2.5 h-2.5 rounded-full border-2 ${dark ? "border-white" : "border-[#ff2d55]"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${dark ? "text-white" : "text-[#111]"}`}>{r.from_place}</p>
                      <p className={`text-xs mt-2 truncate ${dark ? "text-white/50" : "text-[#999]"}`}>{r.to_place}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {tags.map(({ icon, text }, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold border ${
                          dark
                            ? "border-white/40 text-white/70"
                            : "border-[#eee] text-[#888] bg-[#f6f7fb]"
                        }`}
                      >
                        {icon} {text}
                      </span>
                    ))}
                  </div>

                  <p className={`text-xs line-clamp-2 leading-relaxed min-h-[2.5rem] ${dark ? "text-white/50" : "text-[#999]"}`}>
                    {r.description || "No additional details."}
                  </p>

                  {/* Footer */}
                  <div className={`pt-3 border-t ${dark ? "border-white/20" : "border-[#eee]"}`}>

                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-full border text-xs font-bold flex items-center justify-center ${
                          dark ? "border-white text-white" : "border-[#ddd] text-[#555] bg-[#f6f7fb]"
                        }`}>
                          {initials(r.poster_name || "")}
                        </span>
                        <span className={`text-xs font-semibold ${dark ? "text-white/70" : "text-[#777]"}`}>
                          {r.poster_name}
                        </span>
                      </div>
                      <span className={`text-sm font-black ${dark ? "text-white" : "text-[#111]"}`}>
                        {r.price > 0 ? `₹${r.price}` : "Free"}
                        <span className={`text-xs font-normal ${dark ? "text-white/40" : "text-[#bbb]"}`}>/seat</span>
                      </span>
                    </div>

                    {isOwner ? (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openForm(r); }}
                          className={`flex-1 text-xs py-2 rounded-xl font-bold cursor-pointer border transition-colors ${
                            dark
                              ? "border-white text-white bg-black hover:bg-white hover:text-black"
                              : "border-[#ddd] text-[#555] bg-white hover:border-[#ff2d55] hover:text-[#ff2d55]"
                          }`}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                          className={`flex-1 text-xs py-2 rounded-xl font-bold cursor-pointer border transition-colors ${
                            dark
                              ? "border-white/40 text-white/50 bg-black hover:border-white hover:text-white"
                              : "border-[#eee] text-[#bbb] bg-white hover:border-[#ddd] hover:text-[#999]"
                          }`}
                        >
                          🗑️ Remove
                        </button>
                      </div>

                    ) : r.my_response === "accepted" ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); openAccept(r); }}
                        className={`w-full inline-flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-3 rounded-xl border transition-colors ${
                          dark
                            ? "bg-white/5 border-white/20 text-white/80 hover:border-white hover:text-white"
                            : "bg-[#f0fff4] border-[#b2f5c8] text-[#27ae60] hover:border-[#27ae60]"
                        }`}
                      >
                        ✅ Accepted — View contact &amp; chat
                      </button>

                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDecline(r.id); }}
                          className={`flex-1 text-xs py-2.5 rounded-xl font-bold cursor-pointer border transition-colors ${
                            dark
                              ? "border-white/40 text-white/60 bg-black hover:border-white hover:text-white"
                              : "border-[#eee] text-[#aaa] bg-white hover:border-[#ddd] hover:text-[#999]"
                          }`}
                        >
                          ✕ Decline
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openAccept(r); }}
                          className={`flex-1 text-xs py-2.5 rounded-xl font-bold cursor-pointer border transition-all hover:-translate-y-0.5 ${
                            dark
                              ? "border-white bg-white text-black hover:shadow-[0_6px_20px_rgba(255,255,255,0.2)]"
                              : "border-[#ff2d55] bg-[#ff2d55] text-white hover:bg-[#e0002b] hover:shadow-[0_6px_20px_rgba(255,45,85,0.25)]"
                          }`}
                        >
                          ✓ Accept
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      </div>

      {formOpen && (
        <RidePostFormPage
          open={formOpen}
          editingRoute={editingRoute}
          currentUser={currentUser}
          dark={dark}
          showToast={showToast}
          onClose={closeForm}
          onSaved={handleFormSaved}
        />
      )}

      {acceptOpen && acceptRoute && (
        <RideAcceptPage
          open={acceptOpen}
          route={acceptRoute}
          currentUser={currentUser}
          dark={dark}
          showToast={showToast}
          onClose={closeAccept}
          onConfirmAccept={handleConfirmAccept}
          initialStep={acceptStep}
          initialSeats={acceptRoute.accepted_seats || 1}
          initialNote={acceptRoute.accepted_note || ""}
        />
      )}

      {detailOpen && detailRoute && (
        <RideDetailPage
          open={detailOpen}
          route={detailRoute}
          currentUser={currentUser}
          dark={dark}
          onClose={closeDetail}
          onEdit={(route) => { closeDetail(); openForm(route); }}
          onDelete={handleDelete}
          onAccept={(route) => { closeDetail(); openAccept(route); }}
          onDecline={handleDecline}
          onHideAccepted={handleHideAccepted}
          isWishlisted={isWishlisted}
          toggleWishlist={toggleWishlist}
          buildWishlistEntry={buildWishlistEntry}
        />
      )}
    </div>
  );
}