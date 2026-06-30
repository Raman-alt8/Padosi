// routes/accountRoutes.js
const express     = require('express');
const { body, validationResult } = require('express-validator');

const db          = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// GET /api/me — return current session user
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ user: null });
  const { id, full_name, email, avatar_url, phone } = req.user;
  res.json({ user: { id, full_name, email, avatar_url, phone: phone || null } });
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

// PUT /api/me — update profile fields (full name and/or phone)
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

module.exports = router;
