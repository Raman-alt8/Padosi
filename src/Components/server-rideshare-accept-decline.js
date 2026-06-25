// ─────────────────────────────────────────────────────────────────────────────
// RIDE SHARE — Accept / Decline routes
// Add these to server.js alongside the existing ride-share routes,
// before the 404 fallback block.
//
// Also add this table creation to db.js inside db.serialize(),
// after the ride_routes table:
//
//   db.run(`
//     CREATE TABLE IF NOT EXISTS ride_route_responses (
//       user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//       route_id  INTEGER NOT NULL REFERENCES ride_routes(id) ON DELETE CASCADE,
//       response  TEXT    NOT NULL CHECK(response IN ('accepted','declined')),
//       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//       PRIMARY KEY (user_id, route_id)
//     )
//   `);
// ─────────────────────────────────────────────────────────────────────────────


// ── POST /api/ride-routes/:id/accept ────────────────────────────────────────
// Records the acceptance and returns the poster's contact details.
app.post('/api/ride-routes/:id/accept', requireAuth, async (req, res) => {
  const routeId = req.params.id;

  try {
    // Can't accept your own route
    const route = await db.getAsync(
      'SELECT * FROM ride_routes WHERE id = ?', [routeId]
    );
    if (!route) {
      return res.status(404).json({ error: 'Route not found.' });
    }
    if (route.poster_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot accept your own route.' });
    }

    // Upsert response (if they previously declined, now they accept)
    await db.runAsync(
      `INSERT INTO ride_route_responses (user_id, route_id, response)
       VALUES (?, ?, 'accepted')
       ON CONFLICT(user_id, route_id) DO UPDATE SET response = 'accepted'`,
      [req.user.id, routeId]
    );

    // Return poster contact info
    const poster = await db.getAsync(
      'SELECT full_name, email, phone FROM users WHERE id = ?',
      [route.poster_id]
    );

    res.json({
      poster: {
        name:  poster.full_name,
        email: poster.email,
        phone: poster.phone || null,   // null if they haven't added one
      },
    });
  } catch (err) {
    console.error('Accept ride-route error:', err);
    res.status(500).json({ error: 'Could not accept route.' });
  }
});


// ── POST /api/ride-routes/:id/decline ───────────────────────────────────────
// Records the decline — frontend will hide the card from this user's view.
app.post('/api/ride-routes/:id/decline', requireAuth, async (req, res) => {
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
