// AccountDetailPage.jsx
import { useEffect, useState } from "react";
import { api } from "../utils";

// Base URL for API calls — same pattern used elsewhere in the app
const API_BASE = import.meta.env.VITE_API_URL || "";

// Mounted once at the App root — same pattern as ChatPage/WishlistPage.
// Opens on "padosi:openProfile" with { detail: { userId } }, e.g.:
//   window.dispatchEvent(new CustomEvent("padosi:openProfile", { detail: { userId: route.poster_id } }))
//
// Demo/sample routes (RideCard, RideDetailPage) carry a synthetic poster_id
// that doesn't exist in the real users table, so they instead dispatch:
//   { detail: { userId, isDemo: true, demoProfile: { full_name } } }
// When isDemo is set, this page skips the API entirely and renders a small
// local profile built from demoProfile — no network call, no 404, and the
// overlay still opens and behaves like a real profile card.
//
// Props:
//   currentUser — { id, ... } or null
//   dark        — boolean
function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("") || "?";
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function StarIcon({ filled }) {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4" fill={filled ? "#ffb400" : "none"} stroke={filled ? "#ffb400" : "currentColor"} strokeWidth={1.2}>
      <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.2 1.3 6-5.4-3.1-5.4 3.1 1.3-6L1.3 7.7l6.1-.6z" />
    </svg>
  );
}

function StarRating({ value, size = "w-4 h-4" }) {
  const rounded = Math.round(value || 0);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={size}><StarIcon filled={n <= rounded} /></span>
      ))}
    </span>
  );
}

// Small inline star-picker used in the review form below.
function StarPicker({ value, onChange, dark }) {
  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="cursor-pointer p-0.5"
        >
          <span className="w-6 h-6 block"><StarIcon filled={n <= value} /></span>
        </button>
      ))}
    </span>
  );
}

function ReviewForm({ revieweeId, dark, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rating < 1) { setError("Pick a star rating first."); return; }
    setSubmitting(true);
    setError("");
    try {
      await api("POST", `/api/users/${revieweeId}/reviews`, { rating, comment });
      setRating(0);
      setComment("");
      onSubmitted();
    } catch (err) {
      setError(err.message || "Could not save your review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${
      dark ? "bg-black border-white/20" : "bg-white border-[#eee]"
    }`}>
      <p className={`text-xs font-bold uppercase tracking-wide ${dark ? "text-white/50" : "text-[#999]"}`}>
        Leave a review
      </p>
      <StarPicker value={rating} onChange={setRating} dark={dark} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share how it went (optional)"
        rows={3}
        maxLength={500}
        className={`w-full rounded-xl px-3 py-2 text-sm resize-none border ${
          dark
            ? "bg-black border-white/20 text-white placeholder:text-white/30"
            : "bg-[#fafafa] border-[#eee] text-[#111] placeholder:text-[#bbb]"
        }`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className={`self-start px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-60 ${
          dark ? "bg-white text-black hover:bg-white/90" : "bg-[#ff2d55] text-white hover:bg-[#e0002b]"
        }`}
      >
        {submitting ? "Saving…" : "Submit review"}
      </button>
    </div>
  );
}

// A small fixed pool of sample reviews used for demo/sample posters. Which
// review + verified status a given demo poster gets is picked
// deterministically from their id, so the same sample poster always shows
// the same review rather than a different one every time you open them.
const DEMO_REVIEW_POOL = [
  { reviewer_name: "Priya Singh",  rating: 5, comment: "Always on time and super friendly — would ride with them again!" },
  { reviewer_name: "Karan Mehta",  rating: 4, comment: "Smooth ride, good communication before pickup." },
  { reviewer_name: "Ananya Rao",   rating: 5, comment: "Very reliable, exactly as described in the post." },
  { reviewer_name: "Vikram Joshi", rating: 4, comment: "Comfortable ride, would recommend to others nearby." },
];

// Builds a lightweight, entirely local profile object for demo/sample
// posters — same shape the real API returns, filled in with one
// deterministic sample review/rating/verified-status so the profile page
// doesn't look empty, plus a small "Sample account" tag so it stays honest
// about not being a real, reviewable user.
function buildDemoProfile(userId, demoProfile) {
  const h = Math.abs(Number(userId) || 0);
  const review = DEMO_REVIEW_POOL[h % DEMO_REVIEW_POOL.length];
  const verified = h % 2 === 0; // alternates per poster id — some verified, some not

  return {
    id: userId,
    isDemo: true,
    full_name: demoProfile?.full_name || "Sample Poster",
    username: null,
    bio: "This is a sample account included so you can see how ride cards look before you post your own route.",
    avatar_url: null,
    verified,
    avg_rating: review.rating,
    review_count: 1,
    active_listings_count: null,
    created_at: null,
    location: null,
    demoReviews: [
      { id: `demo-review-${h}`, reviewer_name: review.reviewer_name, rating: review.rating, comment: review.comment },
    ],
  };
}

export default function AccountDetailPage({ currentUser, dark }) {
  const [open, setOpen]       = useState(false);
  const [userId, setUserId]   = useState(null);
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const load = async (id) => {
    setLoading(true);
    setError("");
    try {
      const [{ user }, { reviews: reviewList }] = await Promise.all([
        api("GET", `/api/users/${id}/profile`),
        api("GET", `/api/users/${id}/reviews`),
      ]);
      setProfile(user);
      setReviews(reviewList || []);
    } catch (err) {
      setError(err.message || "Could not load this profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      const id = e.detail?.userId;
      if (!id) return;
      setUserId(id);
      setOpen(true);

      if (e.detail?.isDemo) {
        // Synthetic poster — skip the API entirely, render locally.
        setError("");
        setReviews([]);
        setProfile(buildDemoProfile(id, e.detail.demoProfile));
        setLoading(false);
        return;
      }

      load(id);
    };
    window.addEventListener("padosi:openProfile", handler);
    return () => window.removeEventListener("padosi:openProfile", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    setOpen(false);
    setUserId(null);
    setProfile(null);
    setReviews([]);
  };

  if (!open) return null;

  const isDemoProfile = !!profile?.isDemo;
  const isSelf = currentUser && profile && !isDemoProfile && String(currentUser.id) === String(profile.id);

  const avatarSrc = profile?.avatar_url
    ? (profile.avatar_url.startsWith("http") ? profile.avatar_url : `${API_BASE}${profile.avatar_url}`)
    : null;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <div className={`fixed inset-0 z-[9500] overflow-y-auto ${dark ? "bg-[#111111]" : "bg-[#f6f7fb]"}`}>

      {/* Header */}
      <div className={`h-[72px] shrink-0 flex items-center justify-between px-5 border-b sticky top-0 ${
        dark ? "bg-[#111111] border-white/10" : "bg-white border-[#eee]"
      }`}>
        <button
          onClick={close}
          aria-label="Close"
          className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
            dark ? "text-white/70 hover:bg-white/10" : "text-[#333] hover:bg-black/5"
          }`}
        >
          <CloseIcon />
        </button>
        <p className={`text-base font-bold ${dark ? "text-white" : "text-[#111]"}`}>Profile</p>
        <div className="w-10 h-10" />
      </div>

      <div className="max-w-[560px] mx-auto px-5 py-6 flex flex-col gap-6">

        {loading && (
          <div className={`text-sm text-center py-16 ${dark ? "text-white/40" : "text-[#bbb]"}`}>
            Loading profile…
          </div>
        )}

        {!loading && error && (
          <div className={`text-sm text-center py-16 ${dark ? "text-red-300" : "text-red-500"}`}>
            {error}
          </div>
        )}

        {!loading && !error && profile && (
          <>
            {/* Identity block */}
            <div className="flex flex-col items-center text-center gap-3">
              <span className={`w-20 h-20 rounded-full border-2 text-2xl font-bold flex items-center justify-center bg-gradient-to-br overflow-hidden ${
                dark
                  ? "from-white/20 to-white/5 border-white text-white"
                  : "from-[#ffe1e8] to-[#fff0f3] border-[#ff2d55]/30 text-[#ff2d55]"
              }`}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  initials(profile.full_name || "")
                )}
              </span>

              <div>
                <p className={`text-lg font-black ${dark ? "text-white" : "text-[#111]"}`}>{profile.full_name}</p>
                {profile.username && (
                  <p className={`text-sm ${dark ? "text-white/40" : "text-[#999]"}`}>@{profile.username}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {profile.verified && (
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${
                    dark ? "bg-white/10 text-white" : "bg-[#e7faf0] text-[#0f9d58]"
                  }`}>
                    ✅ Verified Member
                  </span>
                )}
                {isDemoProfile && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-600">
                    Sample account
                  </span>
                )}
              </div>

              {profile.review_count > 0 ? (
                <div className="flex items-center gap-1.5">
                  <StarRating value={profile.avg_rating} />
                  <span className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>{profile.avg_rating}</span>
                  <span className={`text-sm ${dark ? "text-white/40" : "text-[#999]"}`}>({profile.review_count} review{profile.review_count > 1 ? "s" : ""})</span>
                </div>
              ) : (
                <p className={`text-sm ${dark ? "text-white/40" : "text-[#999]"}`}>No ratings yet</p>
              )}

              {!isDemoProfile && (memberSince || profile.location) && (
                <div className={`flex items-center gap-4 text-xs ${dark ? "text-white/40" : "text-[#999]"}`}>
                  {memberSince && <span>📅 Member since {memberSince}</span>}
                  {profile.location && <span>📍 {profile.location}</span>}
                </div>
              )}
            </div>

            {/* About */}
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${dark ? "text-white/50" : "text-[#999]"}`}>
                About
              </p>
              <div className={`rounded-2xl border p-4 ${dark ? "bg-black border-white/20" : "bg-white border-[#eee]"}`}>
                <p className={`text-sm leading-relaxed ${dark ? "text-white/75" : "text-[#555]"}`}>
                  {profile.bio || "No bio yet."}
                </p>
              </div>
            </div>

            {/* Active Listings — skipped for demo posters, they don't have
                a real listings count to show. */}
            {!isDemoProfile && (
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${dark ? "text-white/50" : "text-[#999]"}`}>
                  Active Listings ({profile.active_listings_count})
                </p>
                <div className={`rounded-2xl border p-4 flex items-center gap-3 ${dark ? "bg-black border-white/20" : "bg-white border-[#eee]"}`}>
                  <span className="text-2xl">📋</span>
                  <p className={`text-sm ${dark ? "text-white/70" : "text-[#555]"}`}>
                    {profile.active_listings_count > 0
                      ? `${profile.active_listings_count} active listing${profile.active_listings_count > 1 ? "s" : ""} across Padosi`
                      : "No active listings right now."}
                  </p>
                </div>
              </div>
            )}

            {/* Reviews — demo posters get a short explainer instead of the
                real reviews list/form, since posting a review against a
                synthetic user id would just fail against the API. */}
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${dark ? "text-white/50" : "text-[#999]"}`}>
                Reviews
              </p>

              {isDemoProfile ? (
                <div className="flex flex-col gap-3">
                  {profile.demoReviews.map((r) => (
                    <div key={r.id} className={`rounded-2xl border p-4 ${dark ? "bg-black border-white/20" : "bg-white border-[#eee]"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${
                            dark ? "bg-white/10 text-white" : "bg-[#f0f0f5] text-[#555]"
                          }`}>
                            {initials(r.reviewer_name || "")}
                          </span>
                          <span className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>{r.reviewer_name}</span>
                        </div>
                        <StarRating value={r.rating} size="w-3.5 h-3.5" />
                      </div>
                      {r.comment && (
                        <p className={`text-sm leading-relaxed ${dark ? "text-white/70" : "text-[#555]"}`}>{r.comment}</p>
                      )}
                    </div>
                  ))}
                  <p className={`text-xs ${dark ? "text-white/30" : "text-[#bbb]"}`}>
                    Sample review — you can't leave a review on a demo account.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 mb-3">
                    {reviews.length === 0 && (
                      <p className={`text-sm ${dark ? "text-white/40" : "text-[#999]"}`}>No reviews yet.</p>
                    )}
                    {reviews.map((r) => (
                      <div key={r.id} className={`rounded-2xl border p-4 ${dark ? "bg-black border-white/20" : "bg-white border-[#eee]"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${
                              dark ? "bg-white/10 text-white" : "bg-[#f0f0f5] text-[#555]"
                            }`}>
                              {initials(r.reviewer_name || "")}
                            </span>
                            <span className={`text-sm font-bold ${dark ? "text-white" : "text-[#111]"}`}>{r.reviewer_name}</span>
                          </div>
                          <StarRating value={r.rating} size="w-3.5 h-3.5" />
                        </div>
                        {r.comment && (
                          <p className={`text-sm leading-relaxed ${dark ? "text-white/70" : "text-[#555]"}`}>{r.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {currentUser && !isSelf && (
                    <ReviewForm revieweeId={profile.id} dark={dark} onSubmitted={() => load(profile.id)} />
                  )}
                  {!currentUser && (
                    <p className={`text-xs ${dark ? "text-white/40" : "text-[#999]"}`}>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent("padosi:openLogin"))}
                        className="underline cursor-pointer"
                      >
                        Log in
                      </button>{" "}
                      to leave a review.
                    </p>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}