// ─────────────────────────────────────────────────────────────────────────────
// RIDE SHARE ROUTES
// Add these to server.js, just before the existing 404 /api fallback block:
//
//   app.use('/api', (req, res) => { res.status(404).json(...) });
// ─────────────────────────────────────────────────────────────────────────────

const { body, validationResult } = require('express-validator');
// ^ already imported in your server.js — don't import again, shown for clarity


// ── Validation rules (reused by POST and PUT) ────────────────────────────────
const rideRouteValidation = [
  body('from_place')
    .trim()
    .notEmpty().withMessage('Starting point is required.')
    .isLength({ max: 200 }).withMessage('Starting point is too long.'),

  body('to_place')
    .trim()
    .notEmpty().withMessage('Destination is required.')
    .isLength({ max: 200 }).withMessage('Destination is too long.'),

  body('freq')
    .isIn(['1','2','3','4','5','6','7']).withMessage('Frequency must be 1–7.'),

  body('depart_time')
    .matches(/^\d{2}:\d{2}$/).withMessage('Departure time must be HH:MM.'),

  body('seats')
    .isInt({ min: 1, max: 8 }).withMessage('Seats must be between 1 and 8.'),

  body('price')
    .isFloat({ min: 0 }).withMessage('Price must be 0 or more.'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required.')
    .isLength({ max: 400 }).withMessage('Description must be 400 characters or fewer.'),
];


// ── GET /api/ride-routes — all routes, newest first ─────────────────────────
// Excludes routes the current user has declined.
// Includes their response ('accepted' / 'declined' / null) so the frontend
// can show the contact panel immediately on reload if they already accepted.
app.get('/api/ride-routes', requireAuth, async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT
         r.id,
         r.from_place,
         r.to_place,
         r.freq,
         r.depart_time,
         r.seats,
         r.price,
         r.description,
         r.created_at,
         r.poster_id,
         u.full_name       AS poster_name,
         rr.response       AS my_response
       FROM ride_routes r
       JOIN users u ON u.id = r.poster_id
       LEFT JOIN ride_route_responses rr
         ON rr.route_id = r.id AND rr.user_id = ?
       WHERE (rr.response IS NULL OR rr.response != 'declined')
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json({ routes: rows });
  } catch (err) {
    console.error('Get ride-routes error:', err);
    res.status(500).json({ error: 'Could not load routes.' });
  }
});


// ── POST /api/ride-routes — create a new route ───────────────────────────────
app.post('/api/ride-routes', requireAuth, rideRouteValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { from_place, to_place, freq, depart_time, seats, price, description } = req.body;

  try {
    const result = await db.runAsync(
      `INSERT INTO ride_routes
         (poster_id, from_place, to_place, freq, depart_time, seats, price, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, from_place, to_place, freq, depart_time, Number(seats), Number(price), description]
    );

    const route = await db.getAsync(
      `SELECT r.*, u.full_name AS poster_name
       FROM ride_routes r JOIN users u ON u.id = r.poster_id
       WHERE r.id = ?`,
      [result.lastID]
    );

    res.status(201).json({ route });
  } catch (err) {
    console.error('Create ride-route error:', err);
    res.status(500).json({ error: 'Could not create route.' });
  }
});


// ── PUT /api/ride-routes/:id — edit your own route ──────────────────────────
app.put('/api/ride-routes/:id', requireAuth, rideRouteValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { from_place, to_place, freq, depart_time, seats, price, description } = req.body;
  const routeId = req.params.id;

  try {
    // Ownership check
    const existing = await db.getAsync(
      'SELECT id FROM ride_routes WHERE id = ? AND poster_id = ?',
      [routeId, req.user.id]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Route not found or not yours.' });
    }

    await db.runAsync(
      `UPDATE ride_routes
       SET from_place = ?, to_place = ?, freq = ?, depart_time = ?,
           seats = ?, price = ?, description = ?
       WHERE id = ? AND poster_id = ?`,
      [from_place, to_place, freq, depart_time, Number(seats), Number(price), description, routeId, req.user.id]
    );

    const route = await db.getAsync(
      `SELECT r.*, u.full_name AS poster_name
       FROM ride_routes r JOIN users u ON u.id = r.poster_id
       WHERE r.id = ?`,
      [routeId]
    );

    res.json({ route });
  } catch (err) {
    console.error('Update ride-route error:', err);
    res.status(500).json({ error: 'Could not update route.' });
  }
});


// ── DELETE /api/ride-routes/:id — remove your own route ─────────────────────
app.delete('/api/ride-routes/:id', requireAuth, async (req, res) => {
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
