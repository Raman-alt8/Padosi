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
         r.poster_id,
         u.full_name       AS poster_name,
         rr.response       AS my_response,
         (SELECT COUNT(*) FROM ride_route_responses rr2
           WHERE rr2.route_id = r.id AND rr2.response = 'accepted') AS accepted_count
       FROM ride_routes r
       JOIN users u ON u.id = r.poster_id
       LEFT JOIN ride_route_responses rr
         ON rr.route_id = r.id AND rr.user_id = ?
       WHERE (rr.response IS NULL OR rr.response != 'declined')
       ORDER BY r.created_at DESC`,
      [req.user.id]
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

module.exports = router;