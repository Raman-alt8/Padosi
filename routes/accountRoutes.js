// routes/accountRoutes.js
const express   = require('express');
const bcrypt    = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const db          = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
const isDev  = process.env.NODE_ENV !== 'production';

const deleteAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
});

// GET /api/me — return current session user
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ user: null });
  const { id, full_name, email, avatar_url, phone, username, password_hash, photo_verified } = req.user;
  res.json({
    user: {
      id,
      full_name,
      email,
      avatar_url,
      phone: phone || null,
      username: username || null,
      has_password: !!password_hash,
      photo_verified: !!photo_verified,
    },
  });
});

// POST /api/me/phone — save phone number for the current user
router.post(
  '/me/phone',
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

// PUT /api/me — update profile fields (full name, phone, avatar_url, email, username).
// Setting avatar_url through this route always marks photo_verified = 1, since
// reaching this route means the user actually completed the upload step in
// VerifiedSection.jsx — as opposed to Google OAuth, which sets avatar_url
// directly in auth.js without ever touching photo_verified.
router.put(
  '/me',
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
    body('avatar_url')
      .optional({ checkFalsy: true })
      .trim()
      .isURL()
      .withMessage('Avatar URL must be a valid URL.'),
    body('email')
      .optional({ checkFalsy: true })
      .trim()
      .isEmail()
      .withMessage('Please enter a valid email address.'),
    body('username')
      .optional({ checkFalsy: true })
      .trim()
      .customSanitizer(v => v.toLowerCase())
      .matches(/^[a-z0-9_]{3,20}$/)
      .withMessage('Username must be 3-20 characters — letters, numbers, and underscores only.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { full_name, phone, avatar_url, username } = req.body;
    const email = req.body.email !== undefined ? req.body.email.toLowerCase() : undefined;

    if (full_name === undefined && phone === undefined && avatar_url === undefined && email === undefined && username === undefined) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }

    if (email !== undefined && req.user.email) {
      return res.status(400).json({ error: 'Your email can only be set once and is already on file.' });
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
      if (avatar_url !== undefined) {
        await db.runAsync('UPDATE users SET avatar_url = ?, photo_verified = 1 WHERE id = ?', [avatar_url, req.user.id]);
        req.user.avatar_url = avatar_url;
        req.user.photo_verified = 1;
      }
      if (email !== undefined) {
        await db.runAsync('UPDATE users SET email = ? WHERE id = ?', [email, req.user.id]);
        req.user.email = email;
      }
      if (username !== undefined) {
        await db.runAsync('UPDATE users SET username = ? WHERE id = ?', [username, req.user.id]);
        req.user.username = username;
      }

      const { id, full_name: fn, email: em, avatar_url: av, phone: ph, username: un, password_hash, photo_verified } = req.user;
      res.json({
        user: {
          id,
          full_name: fn,
          email: em,
          avatar_url: av,
          phone: ph || null,
          username: un || null,
          has_password: !!password_hash,
          photo_verified: !!photo_verified,
        },
      });
    } catch (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed') && err.message.includes('username')) {
        return res.status(409).json({ error: 'That username is already taken.' });
      }
      console.error('Update profile error:', err);
      res.status(500).json({ error: 'Could not update account.' });
    }
  }
);

// DELETE /api/me — permanently delete the current user's account and every
// record tied to it. Requires re-authentication:
//   - Local accounts: req.body.password must match
//   - Google-only accounts: req.body.confirmation must be "DELETE"
router.delete('/me', requireAuth, deleteAccountLimiter, async (req, res) => {
  const userId = req.user.id;
  const { password, confirmation } = req.body;

  try {
    const user = await db.getAsync('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'Account not found.' });

    if (user.password_hash) {
      if (!password) {
        return res.status(400).json({ error: 'Please enter your password to confirm.' });
      }
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Incorrect password.' });
      }
    } else if (confirmation !== 'DELETE') {
      return res.status(400).json({ error: 'Please type DELETE to confirm.' });
    }

    await db.runAsync('BEGIN TRANSACTION');
    try {
      await db.runAsync('DELETE FROM vehicles   WHERE user_id = ?', [userId]);
      await db.runAsync('DELETE FROM services   WHERE user_id = ?', [userId]);
      await db.runAsync('DELETE FROM dismissals WHERE user_id = ?', [userId]);
      await db.runAsync(
        'DELETE FROM dismissals WHERE task_id IN (SELECT id FROM tasks WHERE user_id = ?)',
        [userId]
      );
      await db.runAsync('DELETE FROM users WHERE id = ?', [userId]);
      await db.runAsync('COMMIT');
    } catch (err) {
      await db.runAsync('ROLLBACK');
      throw err;
    }

    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie('connect.sid', {
          httpOnly: true,
          secure:   !isDev,
          sameSite: isDev ? 'lax' : 'none',
        });
        res.json({ success: true });
      });
    });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Could not delete account. Please try again.' });
  }
});

module.exports = router;