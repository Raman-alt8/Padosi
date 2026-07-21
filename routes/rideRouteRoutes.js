// routes/rideRouteRoutes.js
const express = require('express');
const { body, validationResult } = require('express-validator');

const db          = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

const rideRouteValidation = [
  body('from_place')
    .trim()
    .notEmpty().withMessage('Starting point is required.')
    .isLength({ max: 200 }).withMessage('Starting point is too long.'),

  body('to_place')
    .trim()
    .notEmpty().withMessage('Destination is required.')
    .isLength({ max: 200 }).withMessage('Destination is too long.'),

  body('mode')
    .isIn(['partner', 'ride']).withMessage('Mode must be partner or ride.'),

  body('freq')
    .isIn(['weekday', 'weekend', 'full_week'])
    .withMessage('Frequency must be weekday, weekend, or full week.'),

  body('depart_time')
    .matches(/^\d{2}:\d{2}$/).withMessage('Departure time must be HH:MM.'),

  // Required for "partner" (offering a ride), must be absent/null for
  // "ride" (requesting one) — mirrors what RidePostFormPage sends, since a
  // ride-seeker isn't the one offering seats.
  body('seats').custom((value, { req }) => {
    if (req.body.mode === 'ride') {
      if (value !== null && value !== undefined) {
        throw new Error('Seats should not be set for a ride request.');
      }
      return true;
    }
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 8) {
      throw new Error('Seats must be between 1 and 8.');
    }
    return true;
  }),

  body('vehicle_types')
    .optional()
    .isArray().withMessage('Vehicle types must be a list.')
    .custom(arr => arr.every(v => ['car', 'bike'].includes(v)))
    .withMessage('Vehicle types can only be car or bike.'),

  body('gender_pref')
    .optional({ nullable: true })
    .isIn(['male', 'female', 'no_preference'])
    .withMessage('Invalid gender preference.'),

  body('price')
    .isFloat({ min: 0 }).withMessage('Price must be 0 or more.'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required.')
    .isLength({ max: 250 }).withMessage('Description must be 250 characters or fewer.'),
];

// GET /api/ride-routes
router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT
         r.id,
         r.from_place,
         r.to_place,
         r.mode,
         r.freq,
         r.gender_pref,
         r.depart_time,
         r.seats,
         r.vehicle_types,
         r.price,
         r.description,
         r.created_at,
         r.accepted_at,
         r.expired_at,
         r.poster_id,
         u.full_name       AS poster_name,
         rr.response       AS my_response,
         (SELECT COUNT(*) FROM ride_route_responses rr2
           WHERE rr2.route_id = r.id AND rr2.response = 'accepted') AS accepted_count
       FROM ride_routes r
       JOIN users u ON u.id = r.poster_id
       LEFT JOIN ride_route_responses rr
         ON rr.route_id = r.id AND rr.user_id = ?
       WHERE (r.expired_at IS NULL OR r.poster_id = ?)
         AND (rr.response IS NULL OR rr.response != 'declined')
       ORDER BY r.created_at DESC`,
      [req.user.id, req.user.id]
    );

    const routes = rows.map(r => ({
      ...r,
      vehicle_types: JSON.parse(r.vehicle_types || '[]'),
      accepted_count: Number(r.accepted_count) || 0,
    }));

    res.json({ routes });
  } catch (err) {
    console.error('Get ride-routes error:', err);
    res.status(500).json({ error: 'Could not load routes.' });
  }
});

// GET /api/ride-routes/:id/responses
// Poster-only: lists everyone who has accepted this route, with contact
// info, so the poster can see who to expect / reach out to. 403s for
// anyone who isn't the poster, same ownership check the PUT/DELETE routes
// use.
router.get('/:id/responses', requireAuth, async (req, res) => {
  const routeId = req.params.id;

  try {
    const route = await db.getAsync(
      'SELECT id, poster_id FROM ride_routes WHERE id = ?',
      [routeId]
    );
    if (!route) {
      return res.status(404).json({ error: 'Route not found.' });
    }
    if (route.poster_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the route poster can view responses.' });
    }

    const responses = await db.allAsync(
      `SELECT u.id, u.full_name, u.email, u.phone
       FROM ride_route_responses rr
       JOIN users u ON u.id = rr.user_id
       WHERE rr.route_id = ? AND rr.response = 'accepted'
       ORDER BY rr.rowid DESC`,
      [routeId]
    );

    res.json({ responses });
  } catch (err) {
    console.error('Get ride-route responses error:', err);
    res.status(500).json({ error: 'Could not load responses.' });
  }
});

// POST /api/ride-routes
router.post('/', requireAuth, rideRouteValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const {
    from_place, to_place, mode, freq, gender_pref,
    depart_time, seats, vehicle_types, price, description,
  } = req.body;

  try {
    const result = await db.runAsync(
      `INSERT INTO ride_routes
         (poster_id, from_place, to_place, mode, freq, gender_pref, depart_time, seats, vehicle_types, price, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        from_place,
        to_place,
        mode,
        freq,
        gender_pref || null,
        depart_time,
        seats === null || seats === undefined ? null : Number(seats),
        JSON.stringify(vehicle_types || []),
        Number(price),
        description,
      ]
    );

    const route = await db.getAsync(
      `SELECT r.*, u.full_name AS poster_name
       FROM ride_routes r JOIN users u ON u.id = r.poster_id
       WHERE r.id = ?`,
      [result.lastID]
    );
    route.vehicle_types = JSON.parse(route.vehicle_types || '[]');

    res.status(201).json({ route });
  } catch (err) {
    console.error('Create ride-route error:', err);
    res.status(500).json({ error: 'Could not create route.' });
  }
});

// PUT /api/ride-routes/:id
router.put('/:id', requireAuth, rideRouteValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const {
    from_place, to_place, mode, freq, gender_pref,
    depart_time, seats, vehicle_types, price, description,
  } = req.body;
  const routeId = req.params.id;

  try {
    const existing = await db.getAsync(
      'SELECT id FROM ride_routes WHERE id = ? AND poster_id = ?',
      [routeId, req.user.id]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Route not found or not yours.' });
    }

    await db.runAsync(
      `UPDATE ride_routes
       SET from_place = ?, to_place = ?, mode = ?, freq = ?, gender_pref = ?, depart_time = ?,
           seats = ?, vehicle_types = ?, price = ?, description = ?
       WHERE id = ? AND poster_id = ?`,
      [
        from_place,
        to_place,
        mode,
        freq,
        gender_pref || null,
        depart_time,
        seats === null || seats === undefined ? null : Number(seats),
        JSON.stringify(vehicle_types || []),
        Number(price),
        description,
        routeId,
        req.user.id,
      ]
    );

    const route = await db.getAsync(
      `SELECT r.*, u.full_name AS poster_name
       FROM ride_routes r JOIN users u ON u.id = r.poster_id
       WHERE r.id = ?`,
      [routeId]
    );
    route.vehicle_types = JSON.parse(route.vehicle_types || '[]');

    res.json({ route });
  } catch (err) {
    console.error('Update ride-route error:', err);
    res.status(500).json({ error: 'Could not update route.' });
  }
});

// DELETE /api/ride-routes/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const routeId = req.params.id;

  try {
    const existing = await db.getAsync(
      'SELECT id FROM ride_routes WHERE id = ? AND poster_id = ?',
      [routeId, req.user.id]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Route not found or not yours.' });
    }

    await db.runAsync(
      'DELETE FROM ride_routes WHERE id = ? AND poster_id = ?',
      [routeId, req.user.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Delete ride-route error:', err);
    res.status(500).json({ error: 'Could not delete route.' });
  }
});

// POST /api/ride-routes/:id/accept
router.post('/:id/accept', requireAuth, async (req, res) => {
  const routeId = req.params.id;

  try {
    const route = await db.getAsync(
      'SELECT * FROM ride_routes WHERE id = ?', [routeId]
    );
    if (!route) {
      return res.status(404).json({ error: 'Route not found.' });
    }
    if (route.poster_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot accept your own route.' });
    }

    await db.runAsync(
      `INSERT INTO ride_route_responses (user_id, route_id, response)
       VALUES (?, ?, 'accepted')
       ON CONFLICT(user_id, route_id) DO UPDATE SET response = 'accepted'`,
      [req.user.id, routeId]
    );

    // Stamp accepted_at the first time this route is ever accepted by
    // anyone, and never again — the "accepted_at IS NULL" guard makes this
    // a no-op on every later acceptance (a 2nd/3rd person accepting, or
    // someone re-accepting after a decline), so the 10-day accepted-route
    // expiry clock on the frontend (RideCard.jsx / RideDetailPage.jsx,
    // ACCEPTED_DELETE_AFTER_DAYS) always counts from the true first
    // acceptance rather than resetting. Generated in JS as an ISO string
    // rather than using SQLite's CURRENT_TIMESTAMP, since that format
    // isn't reliably parsed by `new Date(...)` the same way everywhere.
    await db.runAsync(
      `UPDATE ride_routes SET accepted_at = ?
       WHERE id = ? AND accepted_at IS NULL`,
      [new Date().toISOString(), routeId]
    );

    const poster = await db.getAsync(
      'SELECT full_name, email, phone FROM users WHERE id = ?',
      [route.poster_id]
    );

    res.json({
      poster: {
        name:  poster.full_name,
        email: poster.email,
        phone: poster.phone || null,
      },
    });
  } catch (err) {
    console.error('Accept ride-route error:', err);
    res.status(500).json({ error: 'Could not accept route.' });
  }
});

// POST /api/ride-routes/:id/decline
router.post('/:id/decline', requireAuth, async (req, res) => {
  const routeId = req.params.id;

  try {
    const route = await db.getAsync(
      'SELECT id, poster_id FROM ride_routes WHERE id = ?', [routeId]
    );
    if (!route) {
      return res.status(404).json({ error: 'Route not found.' });
    }
    if (route.poster_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot decline your own route.' });
    }

    await db.runAsync(
      `INSERT INTO ride_route_responses (user_id, route_id, response)
       VALUES (?, ?, 'declined')
       ON CONFLICT(user_id, route_id) DO UPDATE SET response = 'declined'`,
      [req.user.id, routeId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Decline ride-route error:', err);
    res.status(500).json({ error: 'Could not decline route.' });
  }
});

// POST /api/ride-routes/:id/expire
// Soft-expire — called by the poster's own client (RideCard.jsx /
// RideDetailPage.jsx) once ACCEPTED_DELETE_AFTER_DAYS has passed since
// accepted_at with nobody confirming activity. Unlike DELETE below, this
// doesn't remove the row: it just stamps expired_at, which the GET /
// query above uses to hide the route from everyone except the poster, so
// it can be shown as a recovery card instead of vanishing outright. Same
// "best-effort nudge, not source of truth" caveat as onAutoExpire — a
// real cron-based sweep would be the more reliable long-term version of
// this check, since it currently only fires when the poster happens to
// have the route rendered in their own browser.
router.post('/:id/expire', requireAuth, async (req, res) => {
  const routeId = req.params.id;

  try {
    const route = await db.getAsync(
      'SELECT id, poster_id FROM ride_routes WHERE id = ?', [routeId]
    );
    if (!route) {
      return res.status(404).json({ error: 'Route not found.' });
    }
    if (route.poster_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the route poster can expire this route.' });
    }

    // "AND expired_at IS NULL" makes this idempotent — a second call (e.g.
    // from a re-render before the frontend has caught up to the new state)
    // is a harmless no-op instead of re-stamping the timestamp.
    await db.runAsync(
      `UPDATE ride_routes SET expired_at = ?
       WHERE id = ? AND poster_id = ? AND expired_at IS NULL`,
      [new Date().toISOString(), routeId, req.user.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Expire ride-route error:', err);
    res.status(500).json({ error: 'Could not expire route.' });
  }
});

// POST /api/ride-routes/:id/purge
// Hard-delete — called by the poster's own client (RideCard.jsx /
// RideDetailPage.jsx, or RideRecoveryCard.jsx / RideRecoveryPage.jsx once
// the route has already soft-expired) once
// ACCEPTED_HARD_DELETE_AFTER_DAYS (12 days since accepted_at) has passed.
// Unlike /expire above, this is the point of no return: the row is
// actually removed, not just hidden. Ownership check + the explicit
// delete of ride_route_responses first mirror /recover above, rather than
// assuming an ON DELETE CASCADE exists between the two tables. Same
// "best-effort nudge, not source of truth" caveat as /expire and
// handleAutoExpire — a real cron-based sweep would be the more reliable
// long-term version, since this only fires when the poster happens to
// have the route rendered in their own browser.
router.post('/:id/purge', requireAuth, async (req, res) => {
  const routeId = req.params.id;

  try {
    const route = await db.getAsync(
      'SELECT id, poster_id FROM ride_routes WHERE id = ?', [routeId]
    );
    if (!route) {
      return res.status(404).json({ error: 'Route not found.' });
    }
    if (route.poster_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the route poster can delete this route.' });
    }

    await db.runAsync(
      `DELETE FROM ride_route_responses WHERE route_id = ?`,
      [routeId]
    );

    await db.runAsync(
      'DELETE FROM ride_routes WHERE id = ? AND poster_id = ?',
      [routeId, req.user.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Purge ride-route error:', err);
    res.status(500).json({ error: 'Could not delete route.' });
  }
});

// POST /api/ride-routes/:id/recover
// Poster-only. Brings an expired route back — but as a genuine fresh
// start rather than just un-hiding it: clears expired_at and accepted_at,
// and wipes every existing accept/decline response on the route, so it
// re-enters the pool as a brand-new unmatched listing (subject to the
// normal 4/5-day pending cycle again, and acceptable by anyone, including
// whoever had accepted it before). This is a deliberate design choice —
// see the note in the conversation this was built from if that ever needs
// revisiting for a quieter "just reset the 10-day clock, keep the
// acceptance" version instead.
router.post('/:id/recover', requireAuth, async (req, res) => {
  const routeId = req.params.id;

  try {
    const route = await db.getAsync(
      'SELECT id, poster_id, expired_at FROM ride_routes WHERE id = ?', [routeId]
    );
    if (!route) {
      return res.status(404).json({ error: 'Route not found.' });
    }
    if (route.poster_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the route poster can recover this route.' });
    }
    if (!route.expired_at) {
      return res.status(400).json({ error: 'This route has not expired.' });
    }

    await db.runAsync(
      `UPDATE ride_routes SET expired_at = NULL, accepted_at = NULL
       WHERE id = ? AND poster_id = ?`,
      [routeId, req.user.id]
    );

    // Fresh start: clear prior responses so accepted_count/my_response
    // reset to 0/null for everyone — the route looks exactly like a newly
    // posted, never-responded-to listing again.
    await db.runAsync(
      `DELETE FROM ride_route_responses WHERE route_id = ?`,
      [routeId]
    );

    const recovered = await db.getAsync(
      `SELECT r.*, u.full_name AS poster_name
       FROM ride_routes r JOIN users u ON u.id = r.poster_id
       WHERE r.id = ?`,
      [routeId]
    );
    recovered.vehicle_types = JSON.parse(recovered.vehicle_types || '[]');

    res.json({ route: recovered });
  } catch (err) {
    console.error('Recover ride-route error:', err);
    res.status(500).json({ error: 'Could not recover route.' });
  }
});

// ── Scheduled sweep: accepted-route expiry/purge ────────────────────────
// The client-triggered /expire and /purge endpoints above only ever fire
// while the poster happens to have the route rendered in their own
// browser (see the "best-effort nudge" comments on those two) — a poster
// who never reopens the app leaves an accepted route sitting there
// forever, past both thresholds. This function is called on a timer from
// server.js instead, independent of any request, so the 10-day soft-expire
// and 30-day hard-delete actually happen on schedule.
//
// Day math is done in JS against accepted_at rather than with SQLite's own
// date functions, for the same reason noted on POST /:id/accept above:
// accepted_at is a JS-generated ISO string, and `new Date(...)` is what's
// reliably parsing it here, not something SQL-side needs to also get right.
const ACCEPTED_DELETE_AFTER_DAYS      = 10;
const ACCEPTED_HARD_DELETE_AFTER_DAYS = 12;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function sweepAcceptedRideRoutes() {
  const rows = await db.allAsync(
    `SELECT id, accepted_at, expired_at FROM ride_routes WHERE accepted_at IS NOT NULL`
  );

  let expiredCount = 0;
  let purgedCount  = 0;

  for (const row of rows) {
    const daysSince = (Date.now() - new Date(row.accepted_at).getTime()) / MS_PER_DAY;

    if (daysSince >= ACCEPTED_HARD_DELETE_AFTER_DAYS) {
      // Same explicit-delete-of-dependents pattern as /purge above, rather
      // than assuming an ON DELETE CASCADE exists on ride_route_responses.
      await db.runAsync(`DELETE FROM ride_route_responses WHERE route_id = ?`, [row.id]);
      await db.runAsync(`DELETE FROM ride_routes WHERE id = ?`, [row.id]);
      purgedCount++;
    } else if (daysSince >= ACCEPTED_DELETE_AFTER_DAYS && !row.expired_at) {
      await db.runAsync(
        `UPDATE ride_routes SET expired_at = ? WHERE id = ? AND expired_at IS NULL`,
        [new Date().toISOString(), row.id]
      );
      expiredCount++;
    }
  }

  if (expiredCount || purgedCount) {
    console.log(`[ride-routes sweep] soft-expired ${expiredCount}, purged ${purgedCount}`);
  }
}

// Attached to the router itself (a Router instance is just a function, so
// this is a harmless extra property) rather than changing what
// module.exports is — server.js does `app.use('/api/ride-routes',
// rideRouteRoutes)`, which needs the export to stay the router itself, not
// wrapped in an object.
router.sweepAcceptedRideRoutes = sweepAcceptedRideRoutes;

module.exports = router;