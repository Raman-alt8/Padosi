// routes/authRoutes.js
const express     = require('express');
const bcrypt      = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const db       = require('../db');
const passport = require('../auth');

const router = express.Router();

// POST /api/signup — register a new user with email + password
router.post(
  '/signup',
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

      const { id, avatar_url, password_hash, photo_verified } = user;
      res.json({
        user: {
          id, full_name, email, avatar_url,
          has_password: !!password_hash,
          photo_verified: !!photo_verified,
        },
      });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).json({ error: 'Server error. Please try again.' });
    }
  }
);

// POST /api/login — local email + password login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err)   return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Login failed.' });

    req.login(user, loginErr => {
      if (loginErr) return next(loginErr);
      const { id, full_name, email, avatar_url, password_hash, photo_verified } = user;
      res.json({
        user: {
          id, full_name, email, avatar_url,
          has_password: !!password_hash,
          photo_verified: !!photo_verified,
        },
      });
    });
  })(req, res, next);
});

// GET /api/logout
router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.json({ success: true });
  });
});

// POST /api/logout — frontend calls this
router.post('/logout', (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.json({ success: true });
  });
});

module.exports = router;