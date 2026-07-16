// RideSharePage.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import RidePostFormPage from "./RidePostFormPage";
import RideAcceptPage from "./RideAcceptPage";
import RideDetailPage from "./RideDetailPage";
import RideResponsesPage from "./RideResponsesPage";
import RideCard from "./RideCard";
import { useWishlist } from "../WishlistContext";
import { freqLabel, vehicleTypesOf, modeOf } from "./rideHelpers";
import { SORT_OPTIONS, BROWSE_MODES, HIDE_THRESHOLD, REVEAL_THRESHOLD, REOPEN_RESTORE_MS } from "./rideShareConfig";
import RideShareToolbar from "./RideShareToolbar";
import { getDemoRoutes } from "./rideShareDemoData";

// Base URL for API calls — Vite exposes VITE_API_URL from .env
const API_BASE = import.meta.env.VITE_API_URL || "";

// Deterministic placeholder email built from a demo seller's name, e.g.
// "Rohan Mehta" -> "rohan.mehta@example.com". Only ever used for demo
// routes — real routes carry a real poster_contact.email from the API.
function demoEmailFor(name = "") {
  return `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
}

async function readJsonSafely(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

// ── Temporary showcase routes ────────────────────────────────────────────────
// These demo routes are kept in a separate helper so the main page focuses
// on state and behavior instead of bulky static data.
const DEMO_ROUTES = getDemoRoutes();

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

  // ── Toolbar hide-on-scroll + reopen restore ───────────────────────────
  // Scrolling down past HIDE_THRESHOLD slides the toolbar up (transform,
  // not display:none, so it animates); scrolling up past REVEAL_THRESHOLD
  // brings it back. The two thresholds are intentionally different sizes —
  // see the constants above.
  //
  // On close we snapshot the scroll position + whether the toolbar was
  // visible; on reopen within REOPEN_RESTORE_MS we put both back. Two refs
  // drive that restore:
  //   pendingRestoreRef  — "there's a restore to apply" flag, consumed once
  //   restoreTargetRef   — the scrollTop to restore to
  //   sawLoadingRef      — "we've observed a real loading:true tick since
  //                         open" — see the effect below for why this matters
  const [hideToolbar, setHideToolbar]   = useState(false);
  const lastScrollTopRef                = useRef(0);
  const scrollContainerRef              = useRef(null);
  const preservedScrollTopRef           = useRef(0);
  const lastCloseTimeRef                = useRef(0);
  const toolbarWasVisibleRef            = useRef(false);
  const pendingRestoreRef               = useRef(false);
  const restoreTargetRef                = useRef(0);
  const sawLoadingRef                   = useRef(false);

  const handleContentScroll = (e) => {
    const current = e.target.scrollTop;
    const last     = lastScrollTopRef.current;

    if (current < 50) {
      setHideToolbar(false);
      toolbarWasVisibleRef.current = true;
    } else if (current > last + HIDE_THRESHOLD) {
      setHideToolbar(true);   // scrolling down
      toolbarWasVisibleRef.current = false;
    } else if (current < last - REVEAL_THRESHOLD) {
      setHideToolbar(false);  // scrolling up — needs 3x the movement to undo a hide
      toolbarWasVisibleRef.current = true;
    }
    lastScrollTopRef.current = current;
  };

  const rememberCurrentScroll = () => {
    if (scrollContainerRef.current) {
      preservedScrollTopRef.current = scrollContainerRef.current.scrollTop;
    }
    lastCloseTimeRef.current = Date.now();
    toolbarWasVisibleRef.current = !hideToolbar;
  };

  const handleCloseRideShare = () => {
    rememberCurrentScroll();
    setOpen(false);
  };

  // Fires whenever the panel opens or closes. Decides — immediately, not
  // via the next scroll event — whether we're restoring a previous session
  // and what the toolbar should look like right away. Forcing the toolbar
  // visible here unconditionally (the old bug) is what caused the
  // one-frame flash: it would show, then the very next scroll event (fired
  // by the RAF below jumping scrollTop from 0 to the restored value) would
  // immediately hide it again. Setting the correct value up front avoids
  // that round-trip entirely.
  useEffect(() => {
    if (!open) {
      setHideToolbar(false);
      lastScrollTopRef.current = 0;
      pendingRestoreRef.current = false;
      sawLoadingRef.current = false;
      return;
    }

    const shouldRestore = Date.now() - lastCloseTimeRef.current <= REOPEN_RESTORE_MS;

    setHideToolbar(shouldRestore && !toolbarWasVisibleRef.current);

    pendingRestoreRef.current = shouldRestore;
    restoreTargetRef.current  = shouldRestore ? preservedScrollTopRef.current : 0;
    sawLoadingRef.current = false;
  }, [open]);

  // Applies the actual scrollTop restore — separately from the effect
  // above, and gated on `loading`. Reason: signed-in users' routes arrive
  // via an async fetch (see fetchRoutes below), so right when the panel
  // opens the list is still the short "Loading routes…" placeholder.
  // Setting scrollTop against that gets silently clamped back toward 0 by
  // the browser, and nothing would ever retry it. Guests never fetch
  // (fetchRoutes no-ops without a currentUser) so `loading` stays false
  // the whole time and this fires immediately — same as before. Signed-in
  // users wait out one real loading:true → false cycle first, so the
  // restore lands on the fully-rendered list instead of the placeholder.
  useEffect(() => {
    if (!open) return;
    if (loading) { sawLoadingRef.current = true; return; }
    if (!pendingRestoreRef.current) return;
    if (currentUser && !sawLoadingRef.current) return;

    pendingRestoreRef.current = false;
    const targetScrollTop = restoreTargetRef.current;
    lastScrollTopRef.current = targetScrollTop;

    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = targetScrollTop;
      }
    });
  }, [open, loading, currentUser]);

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

  // ── Responses page state ─────────────────────────────────────────────────
  // Opened by tapping a card that's the poster's own AND has at least one
  // acceptance — see RideCard's handleCardClick, which routes there instead
  // of openDetail in that case.
  const [responsesOpen, setResponsesOpen]   = useState(false);
  const [responsesRoute, setResponsesRoute] = useState(null);

  const openResponses = (route) => {
    setResponsesRoute(route);
    setResponsesOpen(true);
  };

  const closeResponses = () => {
    setResponsesOpen(false);
    setResponsesRoute(null);
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

      <RideShareToolbar
        dark={dark}
        search={search}
        setSearch={setSearch}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        sortBy={sortBy}
        setSortBy={setSortBy}
        filterVehicle={filterVehicle}
        setFilterVehicle={setFilterVehicle}
        filterFreq={filterFreq}
        setFilterFreq={setFilterFreq}
        filterGender={filterGender}
        setFilterGender={setFilterGender}
        activeFilterCount={activeFilterCount}
        clearFilters={clearFilters}
        filteredCount={filtered.length}
        sortOptions={SORT_OPTIONS}
        browseModes={BROWSE_MODES}
        pillClassName={hideToolbar ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}
      />

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
            ) : filtered.map(r => (
              <RideCard
                key={r.id}
                route={r}
                currentUser={currentUser}
                dark={dark}
                isWishlisted={isWishlisted}
                toggleWishlist={toggleWishlist}
                buildWishlistEntry={buildWishlistEntry}
                onOpenDetail={openDetail}
                onEdit={openForm}
                onDelete={handleDelete}
                onAccept={openAccept}
                onDecline={handleDecline}
                onHideAccepted={handleHideAccepted}
                onViewResponses={openResponses}
              />
            ))}
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

      {responsesOpen && responsesRoute && (
        <RideResponsesPage
          route={responsesRoute}
          dark={dark}
          onBack={closeResponses}
        />
      )}
    </div>
  );
}