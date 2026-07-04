// routes/vehicleRoutes.js
const express = require('express');
const { body, validationResult } = require('express-validator');

const db          = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

const vehicleValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Vehicle name is required.')
    .isLength({ max: 50 }).withMessage('Vehicle name must be 50 characters or fewer.'),
  body('description')
    .trim()
    .optional({ checkFalsy: true })
    .isLength({ max: 200 }).withMessage('Description must be 200 characters or fewer.'),
  body('price')
    .isFloat({ gt: 0 }).withMessage('Please enter a valid rental price.'),
  body('phone')
    .trim()
    .matches(/^\d{10}$/).withMessage('Phone number must be exactly 10 digits.'),
];

// GET /api/vehicles — all listings, shared across every account
router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT
         v.id,
         v.user_id,
         v.title,
         v.description,
         v.price_type  AS priceType,
         v.price,
         v.phone,
         v.area,
         v.photo_url   AS photoUrl,
         v.created_at,
         u.full_name   AS poster_name
       FROM vehicles v
       JOIN users u ON u.id = v.user_id
       ORDER BY v.created_at DESC`,
      []
    );
    res.json({ vehicles: rows });
  } catch (err) {
    console.error('Get vehicles error:', err);
    res.status(500).json({ error: 'Could not load vehicle listings.' });
  }
});

// POST /api/vehicles — create a new listing (visible to all users)
router.post('/', requireAuth, vehicleValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { title, description, priceType, price, phone, area, photo_url } = req.body;

  try {
    const result = await db.runAsync(
      `INSERT INTO vehicles
         (user_id, title, description, price_type, price, phone, area, photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title,
        description || '',
        priceType || 'Per Day',
        Number(price),
        phone,
        area || '',
        photo_url || '',
      ]
    );

    const vehicle = await db.getAsync(
      `SELECT
         v.id, v.user_id, v.title, v.description,
         v.price_type AS priceType, v.price, v.phone,
         v.area, v.photo_url AS photoUrl, v.created_at,
         u.full_name AS poster_name
       FROM vehicles v JOIN users u ON u.id = v.user_id
       WHERE v.id = ?`,
      [result.lastID]
    );

    res.status(201).json({ vehicle });
  } catch (err) {
    console.error('Create vehicle error:', err);
    res.status(500).json({ error: 'Could not post vehicle listing.' });
  }
});

// PUT /api/vehicles/:id — update your own listing
router.put('/:id', requireAuth, vehicleValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { title, description, priceType, price, phone, area, photo_url } = req.body;
  const vehicleId = req.params.id;

  try {
    const existing = await db.getAsync(
      'SELECT id FROM vehicles WHERE id = ? AND user_id = ?',
      [vehicleId, req.user.id]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Listing not found or not yours.' });
    }

    await db.runAsync(
      `UPDATE vehicles
       SET title = ?, description = ?, price_type = ?, price = ?, phone = ?, area = ?, photo_url = ?
       WHERE id = ? AND user_id = ?`,
      [
        title,
        description || '',
        priceType || 'Per Day',
        Number(price),
        phone,
        area || '',
        photo_url || '',
        vehicleId,
        req.user.id,
      ]
    );

    const vehicle = await db.getAsync(
      `SELECT
         v.id, v.user_id, v.title, v.description,
         v.price_type AS priceType, v.price, v.phone,
         v.area, v.photo_url AS photoUrl, v.created_at,
         u.full_name AS poster_name
       FROM vehicles v JOIN users u ON u.id = v.user_id
       WHERE v.id = ?`,
      [vehicleId]
    );

    res.json({ vehicle });
  } catch (err) {
    console.error('Update vehicle error:', err);
    res.status(500).json({ error: 'Could not update vehicle listing.' });
  }
});

// DELETE /api/vehicles/:id — remove your own listing
router.delete('/:id', requireAuth, async (req, res) => {
  const vehicleId = req.params.id;

  try {
    const existing = await db.getAsync(
      'SELECT id FROM vehicles WHERE id = ? AND user_id = ?',
      [vehicleId, req.user.id]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Listing not found or not yours.' });
    }

    await db.runAsync(
      'DELETE FROM vehicles WHERE id = ? AND user_id = ?',
      [vehicleId, req.user.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Delete vehicle error:', err);
    res.status(500).json({ error: 'Could not delete vehicle listing.' });
  }
});

module.exports = router;
