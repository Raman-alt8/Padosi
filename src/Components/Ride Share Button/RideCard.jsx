// RideCard.jsx
import { useEffect } from "react";
import { initials, freqLabel, genderLabel, vehicleTypesOf, modeOf } from "./rideHelpers";

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
      <path d="M12 21s-6.7-4.3-9.3-8.2C1 10 1.6 6.7 4.4 5.2 6.6 4 9.2 4.7 12 7.5 14.8 4.7 17.4 4 19.6 5.2c2.8 1.5 3.4 4.8 1.7 7.6C18.7 16.7 12 21 12 21z" />
    </svg>
  );
}

function WarningIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.29 2.26h17.78A1.5 1.5 0 0 0 22.18 18L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PENDING_AFTER_DAYS = 4;
const DELETE_AFTER_DAYS = 5;
// Once someone's accepted a route, it's no longer an abandoned listing, so
// it doesn't follow the urgent 4/5-day "still interested?" cycle above —
// it just quietly disappears after this many days instead, with no warning
// banner in between.
const ACCEPTED_DELETE_AFTER_DAYS = 10;

function daysSinceActivity(route) {
  const last = route.last_active_at || route.created_at;
  if (!last) return 0;
  return (Date.now() - new Date(last).getTime()) / MS_PER_DAY;
}

// Distinct from daysSinceActivity: this counts from the moment a route was
// first accepted (route.accepted_at), not from whatever last touched
// last_active_at/created_at. Requires the backend to set accepted_at once,
// on first acceptance, and never update it again — see the note on
// isAcceptedExpired below. If accepted_at isn't present yet (backend not
// updated), this returns 0 so an accepted route simply never auto-expires,
// rather than expiring on the wrong clock.
function daysSinceAcceptance(route) {
  if (!route.accepted_at) return 0;
  return (Date.now() - new Date(route.accepted_at).getTime()) / MS_PER_DAY;
}

export default function RideCard({
  route: r,
  currentUser,
  dark,
  isWishlisted,
  toggleWishlist,
  buildWishlistEntry,
  onOpenDetail,
  onEdit,
  onDelete,
  onAccept,
  onDecline,
  onHideAccepted,
  onViewResponses,
  onConfirmActive,
  onAutoExpire,
  onAcceptedExpire,
}) {
  // `forceOwnerDemo` lets a specific demo route (see rideShareDemoData.js,
  // ownerMode: "force") always render the owner UI regardless of who's
  // logged in — used for recruiter/demo browsing where there's no real
  // account to match against.
  const isOwner   = r.poster_id === currentUser?.id || !!r.forceOwnerDemo;
  const mode      = modeOf(r);
  const vehicles  = vehicleTypesOf(r);
  const genderTag = genderLabel(r.gender_pref);
  const saved     = isWishlisted("ride", r.id);

  const acceptedCount = isOwner ? (r.accepted_count || 0) : 0;

  const hasAccepted = isOwner && acceptedCount > 0;

  // Accepted routes skip the pending/warning cycle entirely — see
  // ACCEPTED_DELETE_AFTER_DAYS above — and get their own longer, silent
  // expiry instead.
  const showsPendingState = (isOwner || r.isDemo) && !hasAccepted;
  const daysSince  = daysSinceActivity(r);
  const isPending  = showsPendingState && daysSince >= PENDING_AFTER_DAYS && daysSince < DELETE_AFTER_DAYS;
  // `!r.isDemo` guard: hardcoded roster cards (rideShareDemoData.js) are
  // never real backend rows, so they must never trip the accepted-expiry
  // clock or fire onAcceptedExpire — regardless of what accepted_at ends
  // up being set to for demo purposes. Mirrors how RideSharePage.jsx's
  // handleAutoExpire bails out on `routeId < 0` for the other expiry path.
  const isAcceptedExpired = hasAccepted && !r.isDemo && daysSinceAcceptance(r) >= ACCEPTED_DELETE_AFTER_DAYS;
  // Renamed from the old combined isExpired: this is specifically the
  // "nobody ever responded" path, which still hard-deletes via
  // onAutoExpire, unchanged. isAcceptedExpired is handled separately below
  // — it soft-expires (recoverable) instead of deleting outright.
  const isStaleExpired = showsPendingState && daysSince >= DELETE_AFTER_DAYS;
  const hoursLeft  = isPending ? Math.max(0, Math.ceil((DELETE_AFTER_DAYS - daysSince) * 24)) : 0;

  useEffect(() => {
    if (isAcceptedExpired) {
      onAcceptedExpire?.(r.id);
    } else if (isStaleExpired) {
      onAutoExpire?.(r.id);
    }
  }, [isAcceptedExpired, isStaleExpired, r.id, onAcceptedExpire, onAutoExpire]);

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

  const handleCardClick = () => {
    onOpenDetail(r);
  };

  const openPosterProfile = (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent("padosi:openProfile", {
      detail: {
        userId: r.poster_id,
        isDemo: !!r.isDemo,
        demoProfile: r.isDemo ? { full_name: r.poster_name } : undefined,
      },
    }));
  };

  return (
    <div
      onClick={handleCardClick}
      className={`relative overflow-hidden rounded-2xl border p-5 pt-4 flex flex-col gap-3.5 cursor-pointer hover:-translate-y-1 transition-all ${
        isPending
          ? dark
            ? "bg-black border-red-500/60 shadow-[0_0_26px_rgba(248,113,113,0.22)] ring-1 ring-red-500/40 hover:shadow-[0_0_36px_rgba(248,113,113,0.3)]"
            : "bg-white border-red-200 shadow-[0_0_22px_rgba(220,38,38,0.14)] ring-1 ring-red-200 hover:shadow-[0_0_30px_rgba(220,38,38,0.2)]"
          : hasAccepted
            ? dark
              ? "bg-black border-white shadow-[0_6px_24px_rgba(255,255,255,0.14)] hover:shadow-[0_14px_36px_rgba(255,255,255,0.2)] ring-1 ring-white/40"
              : "bg-white border-[#b2f5c8] shadow-[0_6px_22px_rgba(39,174,96,0.16)] hover:shadow-[0_14px_34px_rgba(39,174,96,0.22)] ring-1 ring-[#b2f5c8]"
            : dark
              ? "bg-black border-white shadow-[0_6px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(255,255,255,0.1)]"
              : "bg-white border-[#eee] shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
      }`}
    >
      {isPending ? (
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          dark
            ? "bg-gradient-to-r from-red-500/10 via-red-500/70 to-red-500/10"
            : "bg-gradient-to-r from-red-200 via-red-500 to-red-200"
        }`} />
      ) : hasAccepted && (
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          dark
            ? "bg-gradient-to-r from-white/20 via-white to-white/20"
            : "bg-gradient-to-r from-[#b2f5c8] via-[#27ae60] to-[#b2f5c8]"
        }`} />
      )}

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
              onClick={(e) => { e.stopPropagation(); onHideAccepted(r.id); }}
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
        {isPending && (
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border ${
            dark
              ? "border-red-400 text-red-300 bg-black/60"
              : "border-red-300 text-red-600 bg-red-50"
          }`}>
            <WarningIcon /> Pending removal
          </span>
        )}
        {isOwner && acceptedCount > 0 && (
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border ${
            dark
              ? "border-white/60 text-white bg-black/60"
              : "border-[#b2f5c8] text-[#27ae60] bg-[#f0fff4]"
          }`}>
            🎉 {acceptedCount} accepted
          </span>
        )}
      </div>

      <div className="pr-11 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${
          mode === "ride"
            ? "border-blue-300 text-blue-600 bg-blue-50"
            : "border-emerald-300 text-emerald-600 bg-emerald-50"
        }`}>
          {mode === "ride" ? "🙋 Partner to share ride" : "🧑‍🤝‍🧑 Offering a ride"}
        </span>
        {r.isDemo && (
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border border-purple-300 text-purple-600 bg-purple-50 shrink-0">
            Sample
          </span>
        )}
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

      <div className={`pt-3 border-t ${dark ? "border-white/20" : "border-[#eee]"}`}>

        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            onClick={openPosterProfile}
            aria-label={`View ${r.poster_name}'s profile`}
            className={`flex items-center gap-2 -m-1 p-1 rounded-full cursor-pointer transition-colors ${
              dark ? "hover:bg-white/10" : "hover:bg-black/5"
            }`}
          >
            <span className={`w-7 h-7 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${
              dark ? "border-white text-white" : "border-[#ddd] text-[#555] bg-[#f6f7fb]"
            }`}>
              {initials(r.poster_name || "")}
            </span>
            <span className={`text-xs font-semibold ${dark ? "text-white/70" : "text-[#777]"}`}>
              {r.poster_name}
            </span>
          </button>
          <span className={`text-sm font-black ${dark ? "text-white" : "text-[#111]"}`}>
            {r.price > 0 ? `₹${r.price}` : "Free"}
            <span className={`text-xs font-normal ${dark ? "text-white/40" : "text-[#bbb]"}`}>/seat</span>
          </span>
        </div>

        {isPending && (
          <div className={`rounded-xl border px-3 py-2.5 mb-2 flex items-center justify-between gap-2.5 ${
            dark ? "bg-red-950/20 border-red-500/40" : "bg-red-50 border-red-200"
          }`}>
            <p className={`text-[11px] leading-snug ${dark ? "text-red-300" : "text-red-600"}`}>
              No activity in {PENDING_AFTER_DAYS} days.<br />
              Deletes in ~{hoursLeft}h.
            </p>
            {/* "I'm here" is an owner-only action on real routes (only the
                poster can confirm their own listing is still active), so it
                stays owner-gated in demo mode too. Non-owner demo pending
                cards (e.g. -3, -10) still show the banner/message above —
                that's just illustrating what the state looks like — but
                shouldn't expose an action a real non-owner viewer would
                never have. */}
            {isOwner && (
              <button
                onClick={(e) => { e.stopPropagation(); onConfirmActive?.(r.id); }}
                className={`shrink-0 text-xs font-bold py-2 px-3 rounded-lg cursor-pointer border transition-colors ${
                  dark
                    ? "border-red-400 text-white bg-red-500/10 hover:bg-red-500/20"
                    : "border-red-300 text-red-700 bg-white hover:bg-red-100"
                }`}
              >
                I'm here
              </button>
            )}
          </div>
        )}

        {isOwner ? (
          <div className="flex flex-col gap-2">
            {acceptedCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onViewResponses(r); }}
                className={`w-full inline-flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-3 rounded-xl border transition-colors ${
                  dark
                    ? "bg-white/5 border-white/20 text-white/80 hover:border-white hover:text-white"
                    : "bg-[#f0fff4] border-[#b2f5c8] text-[#27ae60] hover:border-[#27ae60]"
                }`}
              >
                🎉 {acceptedCount} accepted — View responses
              </button>
            )}
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(r); }}
                className={`flex-1 text-xs py-2 rounded-xl font-bold cursor-pointer border transition-colors ${
                  dark
                    ? "border-white text-white bg-black hover:bg-white hover:text-black"
                    : "border-[#ddd] text-[#555] bg-white hover:border-[#ff2d55] hover:text-[#ff2d55]"
                }`}
              >
                ✏️ Edit
              </button>
              {acceptedCount > 0 ? (
                // A route with an accepted rider represents a ride that
                // actually happened, not just a stale listing — "Complete
                // Ride" still removes it the same way Remove does, but also
                // opens a short thank-you page instead of just vanishing.
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(r.id);
                    window.dispatchEvent(new CustomEvent("padosi:openRideComplete", {
                      detail: { fromPlace: r.from_place, toPlace: r.to_place },
                    }));
                  }}
                  className={`flex-1 text-xs py-2 rounded-xl font-bold cursor-pointer border transition-colors ${
                    dark
                      ? "border-white/60 text-white bg-black hover:bg-white/10"
                      : "border-[#b2f5c8] text-[#27ae60] bg-[#f0fff4] hover:border-[#27ae60]"
                  }`}
                >
                  ✅ Complete Ride
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
                  className={`flex-1 text-xs py-2 rounded-xl font-bold cursor-pointer border transition-colors ${
                    dark
                      ? "border-white/40 text-white/50 bg-black hover:border-white hover:text-white"
                      : "border-[#eee] text-[#bbb] bg-white hover:border-[#ddd] hover:text-[#999]"
                  }`}
                >
                  🗑️ Remove
                </button>
              )}
            </div>
          </div>

        ) : r.my_response === "accepted" ? (
          <button
            onClick={(e) => { e.stopPropagation(); onAccept(r); }}
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
              onClick={(e) => { e.stopPropagation(); onDecline(r.id); }}
              className={`flex-1 text-xs py-2.5 rounded-xl font-bold cursor-pointer border transition-colors ${
                dark
                  ? "border-white/40 text-white/60 bg-black hover:border-white hover:text-white"
                  : "border-[#eee] text-[#aaa] bg-white hover:border-[#ddd] hover:text-[#999]"
              }`}
            >
              ✕ Decline
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onAccept(r); }}
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
}