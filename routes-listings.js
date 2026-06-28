// routes-listings.js — Ticket / marketplace routes
const { Router } = require('express');

module.exports = function (db, body, validationResult, requireAuth, upload) {
  const router = Router();

  // ─── UPLOAD ────────────────────────────────────────────────────────────────

  // POST /api/upload — upload image to Cloudinary, return URL
  router.post('/upload', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    res.json({ url: req.file.path });
  });

  // ─── TICKETS ───────────────────────────────────────────────────────────────

  // GET /api/tickets — all listings
  router.get('/tickets', requireAuth, async (req, res) => {
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

  // POST /api/tickets — post a new ticket
  router.post(
    '/tickets',
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

      const { title, category, date, venue, price, qty, description, contact, image_url } = req.body;

      try {
        const result = await db.runAsync(
          `INSERT INTO tickets (user_id, title, category, date, venue, price, qty, description, contact, image_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [req.user.id, title, category, date, venue, Number(price), Number(qty), description || '', contact, image_url || '']
        );
        const ticket = await db.getAsync('SELECT * FROM tickets WHERE id = ?', [result.lastID]);
        res.status(201).json({ ticket });
      } catch (err) {
        console.error('Create ticket error:', err);
        res.status(500).json({ error: 'Could not post ticket.' });
      }
    }
  );

  // DELETE /api/tickets/:id — remove your own listing
  router.delete('/tickets/:id', requireAuth, async (req, res) => {
    try {
      const existing = await db.getAsync(
        'SELECT id FROM tickets WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      if (!existing) return res.status(404).json({ error: 'Ticket not found or not yours.' });

      await db.runAsync(
        'DELETE FROM tickets WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Delete ticket error:', err);
      res.status(500).json({ error: 'Could not delete ticket.' });
    }
  });

  // PATCH /api/tickets/:id — edit your own listing
  router.patch(
    '/tickets/:id',
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

      const { title, category, date, venue, price, qty, description, contact, image_url } = req.body;

      try {
        const existing = await db.getAsync(
          'SELECT id FROM tickets WHERE id = ? AND user_id = ?',
          [req.params.id, req.user.id]
        );
        if (!existing) return res.status(404).json({ error: 'Ticket not found or not yours.' });

        await db.runAsync(
          `UPDATE tickets
           SET title = ?, category = ?, date = ?, venue = ?,
               price = ?, qty = ?, description = ?, contact = ?, image_url = ?
           WHERE id = ? AND user_id = ?`,
          [title, category, date, venue, Number(price), Number(qty),
           description || '', contact, image_url || '', req.params.id, req.user.id]
        );

        const ticket = await db.getAsync('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
        res.json({ ticket });
      } catch (err) {
        console.error('Update ticket error:', err);
        res.status(500).json({ error: 'Could not update ticket.' });
      }
    }
  );

  // GET /api/tickets/:id/reveal — buyer calls this to get image + contact
  router.get('/tickets/:id/reveal', requireAuth, async (req, res) => {
    try {
      const ticket = await db.getAsync(
        'SELECT image_url, contact FROM tickets WHERE id = ?',
        [req.params.id]
      );
      if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
      res.json({ image_url: ticket.image_url || null, contact: ticket.contact });
    } catch (err) {
      console.error('Reveal ticket error:', err);
      res.status(500).json({ error: 'Could not load ticket details.' });
    }
  });

  return router;
};
