// routes/accountRoutes.js
const express     = require('express');
const { body, validationResult } = require('express-validator');

const db          = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// GET /api/me — return current session user
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ user: null });
  const { id, full_name, email, avatar_url, phone, username } = req.user;
  res.json({ user: { id, full_name, email, avatar_url, phone: phone || null, username: username || null } });
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
// Every field is optional and only touched if present in the body, so a caller
// can update just one field (e.g. VerifiedSection.jsx's step wizard sending a
// single field per step) without needing to resend the others.
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

    // Email can only be set once — an existing email can't be overwritten here.
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
        await db.runAsync('UPDATE users SET avatar_url = ? WHERE id = ?', [avatar_url, req.user.id]);
        req.user.avatar_url = avatar_url;
      }
      if (email !== undefined) {
        await db.runAsync('UPDATE users SET email = ? WHERE id = ?', [email, req.user.id]);
        req.user.email = email;
      }
      if (username !== undefined) {
        await db.runAsync('UPDATE users SET username = ? WHERE id = ?', [username, req.user.id]);
        req.user.username = username;
      }

      const { id, full_name: fn, email: em, avatar_url: av, phone: ph, username: un } = req.user;
      res.json({ user: { id, full_name: fn, email: em, avatar_url: av, phone: ph || null, username: un || null } });
    } catch (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed') && err.message.includes('username')) {
        return res.status(409).json({ error: 'That username is already taken.' });
      }
      console.error('Update profile error:', err);
      res.status(500).json({ error: 'Could not update account.' });
    }
  }
);

module.exports = router;