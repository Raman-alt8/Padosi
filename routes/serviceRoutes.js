// routes/serviceRoutes.js
const express = require('express');
const { body, validationResult } = require('express-validator');

const db          = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

const serviceValidation = [
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required.'),
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required.')
    .isLength({ max: 50 }).withMessage('Title must be 50 characters or fewer.'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required.')
    .isLength({ max: 100 }).withMessage('Description must be 100 characters or fewer.'),
  body('phone')
    .trim()
    .matches(/^\d{10}$/).withMessage('Phone number must be exactly 10 digits.'),
];

// GET /api/services — all listings, shared across every account
router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT
         s.id,
         s.user_id,
         s.category,
         s.title,
         s.description,
         s.price_type  AS priceType,
         s.price,
         s.phone,
         s.experience,
         s.availability,
         s.area,
         s.photo_url   AS photoUrl,
         s.created_at,
         u.full_name   AS poster_name
       FROM services s
       JOIN users u ON u.id = s.user_id
       ORDER BY s.created_at DESC`,
      []
    );
    res.json({ services: rows });
  } catch (err) {
    console.error('Get services error:', err);
    res.status(500).json({ error: 'Could not load service listings.' });
  }
});

// POST /api/services — create a new listing (visible to all users)
router.post('/', requireAuth, serviceValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const {
    category, title, description,
    priceType, price, phone,
    experience, availability, area, photo_url,
  } = req.body;

  try {
    const result = await db.runAsync(
      `INSERT INTO services
         (user_id, category, title, description, price_type, price, phone, experience, availability, area, photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        category,
        title,
        description,
        priceType || 'Monthly',
        price ? Number(price) : null,
        phone,
        experience || '',
        availability || '',
        area || '',
        photo_url || '',
      ]
    );

    const service = await db.getAsync(
      `SELECT
         s.id, s.user_id, s.category, s.title, s.description,
         s.price_type AS priceType, s.price, s.phone, s.experience,
         s.availability, s.area, s.photo_url AS photoUrl, s.created_at,
         u.full_name AS poster_name
       FROM services s JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`,
      [result.lastID]
    );

    res.status(201).json({ service });
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ error: 'Could not post service listing.' });
  }
});

// PUT /api/services/:id — update your own listing
router.put('/:id', requireAuth, serviceValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const {
    category, title, description,
    priceType, price, phone,
    experience, availability, area, photo_url,
  } = req.body;

  const serviceId = req.params.id;

  try {
    const existing = await db.getAsync(
      'SELECT id FROM services WHERE id = ? AND user_id = ?',
      [serviceId, req.user.id]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Listing not found or not yours.' });
    }

    await db.runAsync(
      `UPDATE services
       SET category = ?, title = ?, description = ?, price_type = ?,
           price = ?, phone = ?, experience = ?, availability = ?, area = ?, photo_url = ?
       WHERE id = ? AND user_id = ?`,
      [
        category,
        title,
        description,
        priceType || 'Monthly',
        price ? Number(price) : null,
        phone,
        experience || '',
        availability || '',
        area || '',
        photo_url || '',
        serviceId,
        req.user.id,
      ]
    );

    const service = await db.getAsync(
      `SELECT
         s.id, s.user_id, s.category, s.title, s.description,
         s.price_type AS priceType, s.price, s.phone, s.experience,
         s.availability, s.area, s.photo_url AS photoUrl, s.created_at,
         u.full_name AS poster_name
       FROM services s JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`,
      [serviceId]
    );

    res.json({ service });
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ error: 'Could not update service listing.' });
  }
});

// DELETE /api/services/:id — remove your own listing
router.delete('/:id', requireAuth, async (req, res) => {
  const serviceId = req.params.id;

  try {
    const existing = await db.getAsync(
      'SELECT id FROM services WHERE id = ? AND user_id = ?',
      [serviceId, req.user.id]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Listing not found or not yours.' });
    }

    await db.runAsync(
      'DELETE FROM services WHERE id = ? AND user_id = ?',
      [serviceId, req.user.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ error: 'Could not delete service listing.' });
  }
});

module.exports = router;
