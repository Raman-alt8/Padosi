// routes/vehicleRoutes.js
const express = require('express');
const { body, validationResult } = require('express-validator');

const db          = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

const MAX_PHOTOS = 6;

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
  body('photo_urls')
    .optional()
    .isArray({ max: MAX_PHOTOS }).withMessage(`You can add up to ${MAX_PHOTOS} photos.`),
  body('photo_urls.*')
    .optional()
    .isString().withMessage('Each photo must be a URL.')
    .trim(),
];

// Normalizes whatever the client sent (a photo_urls array, a legacy single
// photo_url, both, or neither) into one clean array, capped at MAX_PHOTOS.
// photo_urls wins when present since it's the source of truth going forward;
// photo_url is only consulted as a fallback for older clients.
function resolvePhotoUrls(body) {
  const fromArray = Array.isArray(body.photo_urls)
    ? body.photo_urls.map((u) => String(u).trim()).filter(Boolean)
    : null;

  if (fromArray && fromArray.length) return fromArray.slice(0, MAX_PHOTOS);
  if (fromArray) return []; // client explicitly sent an empty array — respect it
  return body.photo_url ? [String(body.photo_url).trim()] : [];
}

// Turns a stored photo_urls JSON string back into an array, falling back to
// the legacy single photo_url column for rows written before this column
// existed (or if the JSON is ever malformed).
function parseStoredPhotoUrls(row) {
  if (row.photoUrlsRaw) {
    try {
      const parsed = JSON.parse(row.photoUrlsRaw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      // fall through to legacy fallback below
    }
  }
  return row.photoUrl ? [row.photoUrl] : [];
}

function shapeVehicleRow(row) {
  const { photoUrlsRaw, ...rest } = row;
  return { ...rest, photoUrls: parseStoredPhotoUrls(row) };
}

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
         v.photo_urls  AS photoUrlsRaw,
         v.created_at,
         u.full_name   AS poster_name
       FROM vehicles v
       JOIN users u ON u.id = v.user_id
       ORDER BY v.created_at DESC`,
      []
    );
    res.json({ vehicles: rows.map(shapeVehicleRow) });
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

  const { title, description, priceType, price, phone, area } = req.body;
  const photoUrls = resolvePhotoUrls(req.body);
  const primaryPhoto = photoUrls[0] || '';

  try {
    const result = await db.runAsync(
      `INSERT INTO vehicles
         (user_id, title, description, price_type, price, phone, area, photo_url, photo_urls)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title,
        description || '',
        priceType || 'Per Day',
        Number(price),
        phone,
        area || '',
        primaryPhoto,
        JSON.stringify(photoUrls),
      ]
    );

    const vehicle = await db.getAsync(
      `SELECT
         v.id, v.user_id, v.title, v.description,
         v.price_type AS priceType, v.price, v.phone,
         v.area, v.photo_url AS photoUrl, v.photo_urls AS photoUrlsRaw, v.created_at,
         u.full_name AS poster_name
       FROM vehicles v JOIN users u ON u.id = v.user_id
       WHERE v.id = ?`,
      [result.lastID]
    );

    res.status(201).json({ vehicle: shapeVehicleRow(vehicle) });
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

  const { title, description, priceType, price, phone, area } = req.body;
  const photoUrls = resolvePhotoUrls(req.body);
  const primaryPhoto = photoUrls[0] || '';
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
       SET title = ?, description = ?, price_type = ?, price = ?, phone = ?, area = ?, photo_url = ?, photo_urls = ?
       WHERE id = ? AND user_id = ?`,
      [
        title,
        description || '',
        priceType || 'Per Day',
        Number(price),
        phone,
        area || '',
        primaryPhoto,
        JSON.stringify(photoUrls),
        vehicleId,
        req.user.id,
      ]
    );

    const vehicle = await db.getAsync(
      `SELECT
         v.id, v.user_id, v.title, v.description,
         v.price_type AS priceType, v.price, v.phone,
         v.area, v.photo_url AS photoUrl, v.photo_urls AS photoUrlsRaw, v.created_at,
         u.full_name AS poster_name
       FROM vehicles v JOIN users u ON u.id = v.user_id
       WHERE v.id = ?`,
      [vehicleId]
    );

    res.json({ vehicle: shapeVehicleRow(vehicle) });
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