// routes/profileRoutes.js
const express = require('express');
const db = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Please log in.' });
  }
  next();
}

// Listing tables "Active Listings" aggregates across. ride_routes is wired
// up — its schema is confirmed from rideRouteRoutes.js. The vehicle/
// service/ticket tables aren't: I don't have those route files, so I don't
// know their real table/poster-column names. Uncomment and fix each line
// once confirmed — same shape as the ride_routes entry.
const LISTING_SOURCES = [
  { table: 'ride_routes', posterColumn: 'poster_id' },
  // { table: 'vehicles',         posterColumn: 'poster_id' }, // TODO: confirm
  // { table: 'service_listings', posterColumn: 'poster_id' }, // TODO: confirm
  // { table: 'tickets',          posterColumn: 'poster_id' }, // TODO: confirm
];

// GET /api/users/:id/profile — public profile: identity, verification,
// rating aggregate, review count, active-listing count. No auth required —
// anyone should be able to view a public profile, logged in or not.
router.get('/:id/profile', async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await db.getAsync(
      `SELECT id, full_name, username, avatar_url, photo_verified, bio, location, created_at
       FROM users WHERE id = ?`,
      [userId]
    );
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const ratingRow = await db.getAsync(
      `SELECT AVG(rating) AS avg_rating, COUNT(*) AS review_count
       FROM reviews WHERE reviewee_id = ?`,
      [userId]
    );

    let activeListings = 0;
    for (const source of LISTING_SOURCES) {
      const row = await db.getAsync(
        `SELECT COUNT(*) AS count FROM ${source.table} WHERE ${source.posterColumn} = ?`,
        [userId]
      );
      activeListings += Number(row?.count) || 0;
    }

    res.json({
      user: {
        ...user,
        // photo_verified is the only verification flag I've got confirmed
        // (from account-settings work) — if "Verified Member" is meant to
        // cover something broader (e.g. email verified too), OR it in here.
        verified: !!user.photo_verified,
        avg_rating: ratingRow?.avg_rating != null ? Number(ratingRow.avg_rating.toFixed(1)) : null,
        review_count: Number(ratingRow?.review_count) || 0,
        active_listings_count: activeListings,
      },
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Could not load profile.' });
  }
});

// GET /api/users/:id/reviews — reviews left *for* this user, newest first
router.get('/:id/reviews', async (req, res) => {
  const userId = req.params.id;

  try {
    const reviews = await db.allAsync(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.id AS reviewer_id, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       WHERE r.reviewee_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );
    res.json({ reviews });
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: 'Could not load reviews.' });
  }
});

// POST /api/users/:id/reviews — leave/update a review for this user.
// One review per (reviewer, reviewee) pair total — posting again updates
// it in place (via the UNIQUE constraint + ON CONFLICT), rather than
// letting one person stack up multiple reviews of the same person.
router.post('/:id/reviews', requireAuth, async (req, res) => {
  const revieweeId = req.params.id;
  const reviewerId = req.user.id;
  const { rating, comment, listing_type, listing_id } = req.body;

  if (String(revieweeId) === String(reviewerId)) {
    return res.status(400).json({ error: "You can't review yourself." });
  }
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Rating must be a whole number from 1 to 5.' });
  }

  try {
    await db.runAsync(
      `INSERT INTO reviews (reviewer_id, reviewee_id, rating, comment, listing_type, listing_id)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(reviewer_id, reviewee_id) DO UPDATE SET
         rating = excluded.rating,
         comment = excluded.comment,
         listing_type = excluded.listing_type,
         listing_id = excluded.listing_id,
         created_at = CURRENT_TIMESTAMP`,
      [reviewerId, revieweeId, ratingNum, comment || null, listing_type || null, listing_id || null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Post review error:', err);
    res.status(500).json({ error: 'Could not save your review.' });
  }
});

module.exports = router;
