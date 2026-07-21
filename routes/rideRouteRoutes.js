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
         r.recovered_at,
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

// POST /api/ride-routes/:id/confirm-active
// Poster-only. Fired when the poster taps "I'm here" on a pending route
// (RideCard.jsx / RideDetailPage.jsx, PENDING_AFTER_DAYS/DELETE_AFTER_DAYS
// cycle). Bumps last_active_at to now, which is what daysSinceActivity on
// the frontend reads — so this resets the 15/18-day pending/delete clock
// back to 0, exactly like a route that was just posted. Only applies to
// the unaccepted "still interested?" cycle: it has no effect on the
// accepted_at-based soft-expire/hard-delete clock below, which is
// deliberately untouched by activity confirmation.
router.post('/:id/confirm-active', requireAuth, async (req, res) => {
  const routeId = req.params.id;

  try {
    const route = await db.getAsync(
      'SELECT id, poster_id FROM ride_routes WHERE id = ?', [routeId]
    );
    if (!route) {
      return res.status(404).json({ error: 'Route not found.' });
    }
    if (route.poster_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the route poster can confirm this route is active.' });
    }

    await db.runAsync(
      `UPDATE ride_routes SET last_active_at = ?
       WHERE id = ? AND poster_id = ?`,
      [new Date().toISOString(), routeId, req.user.id]
    );

    res.json({ success: true, last_active_at: new Date().toISOString() });
  } catch (err) {
    console.error('Confirm-active ride-route error:', err);
    res.status(500).json({ error: 'Could not confirm route as active.' });
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
    //
    // "AND recovered_at IS NULL" stops a route that's already been through
    // one lapse-and-recover cycle from being soft-expired a second time.
    // Once recovered, accepted_at is still >= ACCEPTED_DELETE_AFTER_DAYS
    // old (that's what triggered the first lapse), so without this guard
    // the frontend's day-10 check would immediately re-trip the moment the
    // route goes back to rendering as a normal RideCard — recovery only
    // buys the route ACCEPTED_HARD_DELETE_AFTER_DAYS (21, absolute, see
    // POST /:id/recover below), not a second run through the 10-day cycle.
    await db.runAsync(
      `UPDATE ride_routes SET expired_at = ?
       WHERE id = ? AND poster_id = ? AND expired_at IS NULL AND recovered_at IS NULL`,
      [new Date().toISOString(), routeId, req.user.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Expire ride-route error:', err);
    res.status(500).json({ error: 'Could not expire route.' });
  }
});

// POST /api/ride-routes/:id/purge
// Hard-delete — called by the poster's own client once one of two
// deadlines has passed (see RideRecoveryCard.jsx / RideRecoveryPage.jsx
// for the never-recovered path, RideCard.jsx / RideDetailPage.jsx for the
// post-recovery path):
//   - Never recovered: ACCEPTED_RECOVERY_WINDOW_DAYS (2 days) after
//     expired_at.
//   - Recovered once: ACCEPTED_HARD_DELETE_AFTER_DAYS (21 days,
//     absolute) after the original accepted_at.
// This endpoint itself doesn't re-check which deadline applies — the
// caller has already decided — it just deletes. Unlike /expire above,
// this is the point of no return: the row is actually removed, not just
// hidden. Ownership check + the explicit delete of ride_route_responses
// first mirror /recover above, rather than assuming an ON DELETE CASCADE
// exists between the two tables. Same "best-effort nudge, not source of
// truth" caveat as /expire and handleAutoExpire — a real cron-based sweep
// would be the more reliable long-term version, since this only fires
// when the poster happens to have the route rendered in their own
// browser. sweepAcceptedRideRoutes below is that reliable version.
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
// Poster-only. Un-hides an expired route and puts it back exactly where
// it was the moment it soft-expired — NOT a fresh start: accepted_at is
// left untouched and every existing accept/decline response is kept, so
// accepted_count/my_response come back unchanged for everyone who'd
// already responded.
//
// The recovery window itself is ACCEPTED_RECOVERY_WINDOW_DAYS (2 days)
// counted from expired_at, not from accepted_at — a route has to be
// recovered within 2 days of actually lapsing, however many days it took
// to get there. The guard below blocks recovering something that's
// already past that window, so this endpoint can't be used to sneak a
// route past the point /purge or the sweep would otherwise have removed
// it at.
//
// Unlike before, recovering now genuinely extends the route's life:
// alongside clearing expired_at, this stamps recovered_at, which switches
// the route onto its final, absolute deadline —
// ACCEPTED_HARD_DELETE_AFTER_DAYS (21 days, counted from the original
// accepted_at) — instead of the 10-day cycle repeating. See
// sweepAcceptedRideRoutes below for how the two deadlines (never-recovered
// vs. recovered) are actually enforced.
router.post('/:id/recover', requireAuth, async (req, res) => {
  const routeId = req.params.id;

  try {
    const route = await db.getAsync(
      'SELECT id, poster_id, expired_at, accepted_at FROM ride_routes WHERE id = ?', [routeId]
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

    const daysSinceExpiry = (Date.now() - new Date(route.expired_at).getTime()) / MS_PER_DAY;
    if (daysSinceExpiry >= ACCEPTED_RECOVERY_WINDOW_DAYS) {
      return res.status(400).json({ error: 'This route is past its recovery window and can no longer be recovered.' });
    }

    await db.runAsync(
      `UPDATE ride_routes SET expired_at = NULL, recovered_at = ?
       WHERE id = ? AND poster_id = ?`,
      [new Date().toISOString(), routeId, req.user.id]
    );

    const recovered = await db.getAsync(
      `SELECT
         r.*,
         u.full_name AS poster_name,
         (SELECT COUNT(*) FROM ride_route_responses rr2
           WHERE rr2.route_id = r.id AND rr2.response = 'accepted') AS accepted_count
       FROM ride_routes r JOIN users u ON u.id = r.poster_id
       WHERE r.id = ?`,
      [routeId]
    );
    recovered.vehicle_types = JSON.parse(recovered.vehicle_types || '[]');
    recovered.accepted_count = Number(recovered.accepted_count) || 0;

    res.json({ route: recovered });
  } catch (err) {
    console.error('Recover ride-route error:', err);
    res.status(500).json({ error: 'Could not recover route.' });
  }
});

// ── Scheduled sweep: accepted-route expiry/purge ────────────────────────
// The client-triggered /expire, /purge, and /recover endpoints above only
// ever fire while the poster happens to have the route rendered in their
// own browser (see the "best-effort nudge" comments on those) — a poster
// who never reopens the app leaves an accepted route sitting there
// forever, past every threshold. This function is called on a timer from
// server.js instead, independent of any request, so the full lifecycle
// actually happens on schedule.
//
// Day math is done in JS against accepted_at/expired_at rather than with
// SQLite's own date functions, for the same reason noted on POST
// /:id/accept above: both are JS-generated ISO strings, and `new Date(...)`
// is what's reliably parsing them here, not something SQL-side needs to
// also get right.
//
// Every accepted route follows one of three states, checked in this order
// so a route that's crossed more than one boundary since the last sweep
// (e.g. the poster hasn't opened the app in weeks) lands on the furthest
// one along rather than getting stuck re-processing an earlier stage:
//
//   1. Recovered (recovered_at set) — past the 10-day cycle entirely.
//      Purged only once ACCEPTED_HARD_DELETE_AFTER_DAYS (21) have passed
//      since the original accepted_at. This is an absolute cutoff — being
//      recovered once does not grant another lapse/recovery cycle.
//   2. Lapsed, never recovered (expired_at set, recovered_at NULL) —
//      purged once ACCEPTED_RECOVERY_WINDOW_DAYS (2) have passed since
//      expired_at itself, i.e. the poster missed the recovery window.
//   3. Still active (neither set) — soft-expired (expired_at stamped) once
//      ACCEPTED_DELETE_AFTER_DAYS (10) have passed since accepted_at,
//      same as before.
const ACCEPTED_DELETE_AFTER_DAYS      = 10; // day 10: first lapse, from accepted_at
const ACCEPTED_RECOVERY_WINDOW_DAYS   = 2;  // grace period to recover, from expired_at
const ACCEPTED_HARD_DELETE_AFTER_DAYS = 21; // absolute cutoff once recovered, from accepted_at
const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function sweepAcceptedRideRoutes() {
  const rows = await db.allAsync(
    `SELECT id, accepted_at, expired_at, recovered_at FROM ride_routes WHERE accepted_at IS NOT NULL`
  );

  let expiredCount = 0;
  let purgedCount  = 0;

  for (const row of rows) {
    if (row.recovered_at) {
      // State 1: recovered — absolute day-21 cutoff off accepted_at.
      const daysSinceAccepted = (Date.now() - new Date(row.accepted_at).getTime()) / MS_PER_DAY;
      if (daysSinceAccepted >= ACCEPTED_HARD_DELETE_AFTER_DAYS) {
        await db.runAsync(`DELETE FROM ride_route_responses WHERE route_id = ?`, [row.id]);
        await db.runAsync(`DELETE FROM ride_routes WHERE id = ?`, [row.id]);
        purgedCount++;
      }
    } else if (row.expired_at) {
      // State 2: lapsed, awaiting recovery — 2-day window off expired_at.
      const daysSinceExpired = (Date.now() - new Date(row.expired_at).getTime()) / MS_PER_DAY;
      if (daysSinceExpired >= ACCEPTED_RECOVERY_WINDOW_DAYS) {
        await db.runAsync(`DELETE FROM ride_route_responses WHERE route_id = ?`, [row.id]);
        await db.runAsync(`DELETE FROM ride_routes WHERE id = ?`, [row.id]);
        purgedCount++;
      }
    } else {
      // State 3: still active — 10-day first-lapse check off accepted_at.
      const daysSinceAccepted = (Date.now() - new Date(row.accepted_at).getTime()) / MS_PER_DAY;
      if (daysSinceAccepted >= ACCEPTED_DELETE_AFTER_DAYS) {
        await db.runAsync(
          `UPDATE ride_routes SET expired_at = ? WHERE id = ? AND expired_at IS NULL`,
          [new Date().toISOString(), row.id]
        );
        expiredCount++;
      }
    }
  }

  if (expiredCount || purgedCount) {
    console.log(`[ride-routes sweep] soft-expired ${expiredCount}, purged ${purgedCount}`);
  }
}

// ── Scheduled sweep: unaccepted stale-route deletion ────────────────────
// Mirrors sweepAcceptedRideRoutes above, but for the *other* lifecycle —
// PENDING_AFTER_DAYS/DELETE_AFTER_DAYS on RideCard.jsx / RideDetailPage.jsx,
// the "still interested?" cycle a route follows before anyone's accepted
// it. handleAutoExpire in RideSharePage.jsx already says outright that its
// own DELETE call is only a best-effort nudge that fires while the poster
// happens to have the card open — a poster who never reopens the app was,
// until this function existed, leaving stale routes sitting past 18 days
// forever, since nothing server-side was checking them. This closes that
// gap the same way the accepted-route sweep does: called on the same timer
// from server.js, independent of any request.
//
// `accepted_at IS NULL` scopes this to routes that have never been
// accepted — the moment a route is accepted it switches to the other
// clock/sweep above and permanently stops following this one (see
// showsPendingState in RideCard.jsx). last_active_at falls back to
// created_at when NULL, same as daysSinceActivity on the frontend — a
// route that's never had its activity confirmed via POST
// /:id/confirm-active just counts from when it was first posted.
//
// There's no soft-expire/recoverable middle state on this path (that's
// specific to the accepted-route clock, via expired_at) — a route that's
// gone PENDING_AFTER_DAYS/DELETE_AFTER_DAYS days without activity just
// gets deleted outright once it crosses DELETE_AFTER_DAYS, same as
// DELETE /:id above.
const PENDING_AFTER_DAYS = 15;
const DELETE_AFTER_DAYS  = 18;

async function sweepStaleRideRoutes() {
  const rows = await db.allAsync(
    `SELECT id, created_at, last_active_at FROM ride_routes WHERE accepted_at IS NULL`
  );

  let purgedCount = 0;

  for (const row of rows) {
    const last = row.last_active_at || row.created_at;
    if (!last) continue;

    const daysSince = (Date.now() - new Date(last).getTime()) / MS_PER_DAY;

    if (daysSince >= DELETE_AFTER_DAYS) {
      // Same explicit-delete-of-dependents pattern as /purge and
      // sweepAcceptedRideRoutes above, rather than assuming an
      // ON DELETE CASCADE exists on ride_route_responses.
      await db.runAsync(`DELETE FROM ride_route_responses WHERE route_id = ?`, [row.id]);
      await db.runAsync(`DELETE FROM ride_routes WHERE id = ?`, [row.id]);
      purgedCount++;
    }
  }

  if (purgedCount) {
    console.log(`[ride-routes sweep] deleted ${purgedCount} stale unaccepted route(s)`);
  }
}

// Attached to the router itself (a Router instance is just a function, so
// this is a harmless extra property) rather than changing what
// module.exports is — server.js does `app.use('/api/ride-routes',
// rideRouteRoutes)`, which needs the export to stay the router itself, not
// wrapped in an object.
router.sweepAcceptedRideRoutes = sweepAcceptedRideRoutes;
router.sweepStaleRideRoutes    = sweepStaleRideRoutes;

module.exports = router;