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

// ─── Trust proxy (required on Render for secure cookies after Google login) ───
app.set('trust proxy', 1);

// ─── Middleware ───────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: isDev
    ? 'http://localhost:3000'
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

app.use(express.static(path.join(__dirname, 'public')));

// ─── Create dismissals table if it doesn't exist ──────────────────────────────
db.run(`
  CREATE TABLE IF NOT EXISTS dismissals (
    user_id  INTEGER NOT NULL,
    task_id  INTEGER NOT NULL,
    PRIMARY KEY (user_id, task_id)
  )
`, err => {
  if (err) console.error('Could not create dismissals table:', err);
});

// ─── Add phone column to users if it doesn't exist yet ───────────────────────
db.run(`ALTER TABLE users ADD COLUMN phone TEXT`, err => {
  // Ignore "duplicate column" errors — means it already exists
  if (err && !err.message.includes('duplicate column')) {
    console.error('Could not add phone column:', err);
  }
});

// ─── Auth helper ──────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

// ═════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═════════════════════════════════════════════════════════════════════════════

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
      // Update the in-session user object so /api/me reflects the change immediately
      req.user.phone = phone;
      res.json({ success: true, phone });
    } catch (err) {
      console.error('Save phone error:', err);
      res.status(500).json({ error: 'Could not save phone number.' });
    }
  }
);

// PUT /api/me — update profile fields (full name and/or phone) from the
// Manage Account modal. Either field can be sent on its own.
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

// GET /api/logout — destroy session
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

// ═════════════════════════════════════════════════════════════════════════════
// GOOGLE OAUTH ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// Step 1: redirect user to Google consent screen
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Step 2: Google redirects back here after login
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/?auth=failed' }),
  (req, res) => {
    res.redirect('/?auth=success');
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// TASK ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/tasks — get all tasks for the logged-in user (joins helper info)
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

    // Shape each row to match what index.html expects
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

    // Build scheduled_at from date + time when mode is 'later'
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

// POST /api/tasks/:id/accept — assign a real helper from the helpers table
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

    // Pick a random helper from the helpers table
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

// POST /api/tasks/:id/offer — a helper offers to take someone else's nearby task.
// Returns the poster's contact details so the frontend can show Call / Chat options.
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

// POST /api/tasks/:id/dismiss — hide a nearby task from the current user's feed
// The task remains active and visible to all other users.
app.post('/api/tasks/:id/dismiss', requireAuth, async (req, res) => {
  const taskId = req.params.id;

  try {
    // Prevent users from dismissing their own tasks
    const ownTask = await db.getAsync(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, req.user.id]
    );
    if (ownTask) {
      return res.status(400).json({ error: 'Cannot dismiss your own task.' });
    }

    // INSERT OR IGNORE so duplicate dismissals don't cause errors
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

// GET /api/tasks/nearby — tasks posted by OTHER users, excluding dismissed ones
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

// ─── 404 fallback for unmatched /api/* routes ─────────────────────────────────
// Returns JSON instead of letting Express fall through to its default HTML
// 404 page, which is what caused the "DOCTYPE" parsing error in the frontend.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
