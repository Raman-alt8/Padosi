// server.js - Padosi backend entry point
require('dotenv').config();

const express     = require('express');
const session     = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const cors        = require('cors');
const bcrypt      = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const path        = require('path');

const db       = require('./db');
const passport = require('./auth');

const app  = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// ─── Middleware 
const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: isDev
    ? 'http://localhost:5173'
    : (process.env.FRONTEND_URL || 'https://padosi-1.onrender.com'),
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store:             new SQLiteStore({ db: 'sessions.db', dir: __dirname }),
  secret:            process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    maxAge:   7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure:   !isDev,
    sameSite: isDev ? 'lax' : 'none',
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// ─── Serve static files from public (for LOGO.png etc.) 
app.use(express.static(path.join(__dirname, 'public')));


db.run(`
  CREATE TABLE IF NOT EXISTS dismissals (
    user_id  INTEGER NOT NULL,
    task_id  INTEGER NOT NULL,
    PRIMARY KEY (user_id, task_id)
  )
`, err => {
  if (err) console.error('Could not create dismissals table:', err);
});


db.run(`ALTER TABLE users ADD COLUMN phone TEXT`, err => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Could not add phone column:', err);
  }
});

// ─── Auth helper ─────────────────────
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Not authenticated' });
}


// AUTH ROUTES

// GET /api/me — return current session user
app.get('/api/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ user: null });
  const { id, full_name, email, avatar_url, phone } = req.user;
  res.json({ user: { id, full_name, email, avatar_url, phone: phone || null } });
});

// POST /api/me/phone — save phone number for the current user
app.post(
  '/api/me/phone',
  requireAuth,
  [
    body('phone')
      .trim()
      .matches(/^\d{10}$/)
      .withMessage('Phone number must be exactly 10 digits with no spaces or symbols.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { phone } = req.body;

    try {
      await db.runAsync(
        'UPDATE users SET phone = ? WHERE id = ?',
        [phone, req.user.id]
      );
      req.user.phone = phone;
      res.json({ success: true, phone });
    } catch (err) {
      console.error('Save phone error:', err);
      res.status(500).json({ error: 'Could not save phone number.' });
    }
  }
);

// PUT /api/me — update profile fields (full name and/or phone)
app.put(
  '/api/me',
  requireAuth,
  [
    body('full_name')
      .optional({ checkFalsy: true })
      .trim()
      .notEmpty()
      .withMessage('Full name cannot be empty.'),
    body('phone')
      .optional({ checkFalsy: true })
      .trim()
      .matches(/^\d{10}$/)
      .withMessage('Phone number must be exactly 10 digits with no spaces or symbols.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { full_name, phone } = req.body;

    if (full_name === undefined && phone === undefined) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }

    try {
      if (full_name !== undefined) {
        await db.runAsync('UPDATE users SET full_name = ? WHERE id = ?', [full_name, req.user.id]);
        req.user.full_name = full_name;
      }
      if (phone !== undefined) {
        await db.runAsync('UPDATE users SET phone = ? WHERE id = ?', [phone, req.user.id]);
        req.user.phone = phone;
      }

      const { id, full_name: fn, email, avatar_url, phone: ph } = req.user;
      res.json({ user: { id, full_name: fn, email, avatar_url, phone: ph || null } });
    } catch (err) {
      console.error('Update profile error:', err);
      res.status(500).json({ error: 'Could not update account.' });
    }
  }
);

// POST /api/signup — register a new user with email + password
app.post(
  '/api/signup',
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { full_name, email, password } = req.body;

    try {
      const existing = await db.getAsync(
        'SELECT id FROM users WHERE email = ?', [email]
      );
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const hash   = await bcrypt.hash(password, 12);
      const result = await db.runAsync(
        'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
        [full_name, email, hash]
      );

      const user = await db.getAsync('SELECT * FROM users WHERE id = ?', [result.lastID]);

      await new Promise((resolve, reject) =>
        req.login(user, err => (err ? reject(err) : resolve()))
      );

      const { id, avatar_url } = user;
      res.json({ user: { id, full_name, email, avatar_url } });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).json({ error: 'Server error. Please try again.' });
    }
  }
);

// POST /api/login — local email + password login
app.post('/api/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err)   return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Login failed.' });

    req.login(user, loginErr => {
      if (loginErr) return next(loginErr);
      const { id, full_name, email, avatar_url } = user;
      res.json({ user: { id, full_name, email, avatar_url } });
    });
  })(req, res, next);
});

// GET /api/logout
app.get('/api/logout', (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.json({ success: true });
  });
});

// POST /api/logout — frontend calls this
app.post('/api/logout', (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.json({ success: true });
  });
});
// GOOGLE OAUTH ROUTES

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/?auth=failed' }),
  (req, res) => {
    res.redirect('/?auth=success');
  }
);


// TASK ROUTES

app.get('/api/tasks', requireAuth, async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT
         t.id,
         t.text,
         t.price,
         t.mode,
         t.scheduled_at,
         t.accepted,
         t.created_at,
         h.name     AS helper_name,
         h.initials AS helper_initials,
         h.rating   AS helper_rating,
         h.reviews  AS helper_reviews,
         h.phone    AS helper_phone
       FROM tasks t
       LEFT JOIN helpers h ON h.id = t.helper_id
       WHERE t.user_id = ?
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    const tasks = rows.map(r => {
      const task = {
        id:         r.id,
        text:       r.text,
        price:      r.price,
        mode:       r.mode,
        accepted:   !!r.accepted,
        date:       r.scheduled_at ? r.scheduled_at.split('T')[0] : null,
        time:       r.scheduled_at ? r.scheduled_at.split('T')[1]?.slice(0, 5) : null,
        created_at: r.created_at,
      };
      if (r.accepted && r.helper_name) {
        task.helper = {
          name:     r.helper_name,
          initials: r.helper_initials,
          rating:   r.helper_rating,
          reviews:  r.helper_reviews,
          phone:    r.helper_phone,
        };
      }
      return task;
    });

    res.json({ tasks });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Could not load tasks.' });
  }
});

// POST /api/tasks — create a new task
app.post(
  '/api/tasks',
  requireAuth,
  [
    body('text').trim().notEmpty().withMessage('Task description is required'),
    body('text').isLength({ max: 1000 }).withMessage('Description too long'),
    body('price').isFloat({ gt: 0 }).withMessage('Please enter a valid budget'),
    body('mode').isIn(['now', 'later']).withMessage('Invalid mode'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { text, price, mode, date, time } = req.body;

    const scheduled_at = (mode === 'later' && date && time)
      ? `${date}T${time}`
      : null;

    try {
      const result = await db.runAsync(
        `INSERT INTO tasks (user_id, text, price, mode, scheduled_at)
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.id, text, price, mode, scheduled_at]
      );

      const task = {
        id:         result.lastID,
        text,
        price,
        mode,
        accepted:   false,
        date:       date || null,
        time:       time || null,
        created_at: new Date().toISOString(),
      };

      res.json({ task });
    } catch (err) {
      console.error('Create task error:', err);
      res.status(500).json({ error: 'Could not create task.' });
    }
  }
);

// PUT /api/tasks/:id — edit an existing task
app.put(
  '/api/tasks/:id',
  requireAuth,
  [
    body('text').trim().notEmpty().withMessage('Task description is required'),
    body('text').isLength({ max: 1000 }).withMessage('Description too long'),
    body('price').isFloat({ gt: 0 }).withMessage('Please enter a valid budget'),
    body('mode').isIn(['now', 'later']).withMessage('Invalid mode'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { text, price, mode, date, time } = req.body;
    const taskId = req.params.id;

    const scheduled_at = (mode === 'later' && date && time)
      ? `${date}T${time}`
      : null;

    try {
      const existing = await db.getAsync(
        'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
        [taskId, req.user.id]
      );
      if (!existing) {
        return res.status(404).json({ error: 'Task not found.' });
      }

      await db.runAsync(
        `UPDATE tasks SET text = ?, price = ?, mode = ?, scheduled_at = ?
         WHERE id = ? AND user_id = ?`,
        [text, price, mode, scheduled_at, taskId, req.user.id]
      );

      res.json({ task: { id: Number(taskId), text, price, mode, date: date || null, time: time || null } });
    } catch (err) {
      console.error('Update task error:', err);
      res.status(500).json({ error: 'Could not update task.' });
    }
  }
);

// DELETE /api/tasks/:id — delete a task
app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
  const taskId = req.params.id;

  try {
    const existing = await db.getAsync(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, req.user.id]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    await db.runAsync(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, req.user.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Could not delete task.' });
  }
});

// POST /api/tasks/:id/accept — assign a helper
app.post('/api/tasks/:id/accept', requireAuth, async (req, res) => {
  const taskId = req.params.id;

  try {
    const task = await db.getAsync(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, req.user.id]
    );
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    if (task.accepted) {
      return res.status(400).json({ error: 'Task already accepted.' });
    }

    const helpers = await db.allAsync('SELECT * FROM helpers');
    const helper  = helpers[Math.floor(Math.random() * helpers.length)];

    await db.runAsync(
      'UPDATE tasks SET accepted = 1, helper_id = ? WHERE id = ?',
      [helper.id, taskId]
    );

    res.json({
      helper: {
        name:     helper.name,
        initials: helper.initials,
        rating:   helper.rating,
        reviews:  helper.reviews,
        phone:    helper.phone,
      },
    });
  } catch (err) {
    console.error('Accept task error:', err);
    res.status(500).json({ error: 'Could not accept task.' });
  }
});

// POST /api/tasks/:id/offer — helper offers to take a nearby task
app.post('/api/tasks/:id/offer', requireAuth, async (req, res) => {
  const taskId = req.params.id;

  try {
    const task = await db.getAsync('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    if (task.user_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot accept your own task.' });
    }
    if (task.accepted) {
      return res.status(400).json({ error: 'This task has already been accepted.' });
    }

    const poster = await db.getAsync(
      'SELECT id, full_name, email, phone FROM users WHERE id = ?',
      [task.user_id]
    );
    if (!poster) {
      return res.status(404).json({ error: 'Could not find the task poster.' });
    }

    const initials = (poster.full_name || 'U')
      .trim()
      .split(/\s+/)
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    res.json({
      poster: {
        initials,
        phone: poster.phone || null,
        email: poster.email,
      },
    });
  } catch (err) {
    console.error('Offer task error:', err);
    res.status(500).json({ error: 'Could not send offer.' });
  }
});

// POST /api/tasks/:id/dismiss — hide a task from me
app.post('/api/tasks/:id/dismiss', requireAuth, async (req, res) => {
  const taskId = req.params.id;

  try {
    const ownTask = await db.getAsync(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, req.user.id]
    );
    if (ownTask) {
      return res.status(400).json({ error: 'Cannot dismiss your own task.' });
    }

    await db.runAsync(
      'INSERT OR IGNORE INTO dismissals (user_id, task_id) VALUES (?, ?)',
      [req.user.id, taskId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Dismiss task error:', err);
    res.status(500).json({ error: 'Could not dismiss task.' });
  }
});

// GET /api/tasks/nearby — tasks posted by me, excluding dismissed ones
app.get('/api/tasks/nearby', requireAuth, async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT
         t.id,
         t.text,
         t.price,
         t.mode,
         t.scheduled_at,
         t.accepted
       FROM tasks t
       WHERE t.user_id != ?
         AND t.accepted = 0
         AND t.id NOT IN (
           SELECT task_id FROM dismissals WHERE user_id = ?
         )
       ORDER BY t.created_at DESC
       LIMIT 20`,
      [req.user.id, req.user.id]
    );

    const tasks = rows.map(r => ({
      id:    r.id,
      text:  r.text,
      price: r.price,
      mode:  r.mode,
      date:  r.scheduled_at ? r.scheduled_at.split('T')[0] : null,
      time:  r.scheduled_at ? r.scheduled_at.split('T')[1]?.slice(0, 5) : null,
    }));

    res.json({ tasks });
  } catch (err) {
    console.error('Nearby tasks error:', err);
    res.status(500).json({ error: 'Could not load nearby tasks.' });
  }
});




// ─────────────────────────────────────────────────────────────────────────────
// RIDE SHARE ROUTES
// Add these to server.js, just before the existing 404 /api fallback block:
//
//   app.use('/api', (req, res) => { res.status(404).json(...) });
// ─────────────────────────────────────────────────────────────────────────────


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
// ── GET /api/tickets — all listings (visible to everyone logged in) ──────────
app.get('/api/tickets', requireAuth, async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT t.*, u.full_name AS seller_name
       FROM tickets t
       JOIN users u ON u.id = t.user_id
       ORDER BY t.created_at DESC`,
      []
    );
    res.json({ tickets: rows });
  } catch (err) {
    console.error('Get tickets error:', err);
    res.status(500).json({ error: 'Could not load tickets.' });
  }
});

// ── POST /api/tickets — post a new ticket ────────────────────────────────────
app.post(
  '/api/tickets',
  requireAuth,
  [
    body('title').trim().notEmpty().withMessage('Event name is required.'),
    body('category').trim().notEmpty().withMessage('Category is required.'),
    body('date').trim().notEmpty().withMessage('Date is required.'),
    body('venue').trim().notEmpty().withMessage('Venue is required.'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0.'),
    body('qty').isInt({ min: 1, max: 20 }).withMessage('Qty must be 1–20.'),
    body('contact').trim().notEmpty().withMessage('Contact is required.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { title, category, date, venue, price, qty, description, contact } = req.body;

    try {
      const result = await db.runAsync(
        `INSERT INTO tickets (user_id, title, category, date, venue, price, qty, description, contact)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, title, category, date, venue, Number(price), Number(qty), description || '', contact]
      );
      const ticket = await db.getAsync('SELECT * FROM tickets WHERE id = ?', [result.lastID]);
      res.status(201).json({ ticket });
    } catch (err) {
      console.error('Create ticket error:', err);
      res.status(500).json({ error: 'Could not post ticket.' });
    }
  }
);

// ── DELETE /api/tickets/:id — remove your own listing ────────────────────────
app.delete('/api/tickets/:id', requireAuth, async (req, res) => {
  try {
    const existing = await db.getAsync(
      'SELECT id FROM tickets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!existing) return res.status(404).json({ error: 'Ticket not found or not yours.' });

    await db.runAsync('DELETE FROM tickets WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete ticket error:', err);
    res.status(500).json({ error: 'Could not delete ticket.' });
  }
});

// ─── Serve React frontend (must be AFTER all API routes) ─────// ─── 404 fallback for unmatched /api/* routes ──
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ─── Start server ──────────
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});