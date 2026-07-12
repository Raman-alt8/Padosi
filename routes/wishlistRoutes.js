// routes/wishlistRoutes.js
//
// Account-connected wishlist API. Mount this in your main server file:
//   app.use("/api/wishlist", require("./routes/wishlistRoutes"));
//
// Assumes:
//   - A `db` module exporting an async `query(sql, params)` — same shape as
//     node-postgres (`pg`)'s pool.query. Adjust the import + call syntax if
//     you're on mysql2, Sequelize, Prisma, etc. — the route logic below
//     stays the same either way, only the query calls change.
//   - A `requireAuth` middleware (same one protecting your other logged-in
//     routes like /api/tasks) that populates `req.user.id` for a logged-in
//     request and responds 401 otherwise. Swap in whatever you already use.
//
// Table schema: see wishlist_schema.sql (run once against your database).

const express = require("express");
const router = express.Router();
const db = require("../db");                    // TODO: point at your actual db module
const requireAuth = require("../middleware/requireAuth"); // TODO: point at your actual auth middleware

// ── GET /api/wishlist — everything saved by the logged-in user ─────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT type, item_id AS id, title, subtitle, meta, price,
              price_unit AS "priceUnit", image, icon, badge,
              is_demo AS "isDemo", raw, saved_at AS "savedAt"
       FROM wishlist_items
       WHERE user_id = $1
       ORDER BY saved_at DESC`,
      [req.user.id]
    );
    res.json({ items: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load wishlist." });
  }
});

// ── POST /api/wishlist — save (or update) one entry ─────────────────────────
// Body matches the wishlist entry shape used on the frontend (see
// WishlistContext.jsx's header comment): { type, id, title, subtitle, meta,
// price, priceUnit, image, icon, badge, isDemo, raw }
router.post("/", requireAuth, async (req, res) => {
  const { type, id, title, subtitle, meta, price, priceUnit, image, icon, badge, isDemo, raw } = req.body;

  if (!type || id === undefined || id === null) {
    return res.status(400).json({ error: "type and id are required." });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO wishlist_items
         (user_id, type, item_id, title, subtitle, meta, price, price_unit, image, icon, badge, is_demo, raw)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (user_id, type, item_id) DO UPDATE SET
         title = EXCLUDED.title,
         subtitle = EXCLUDED.subtitle,
         meta = EXCLUDED.meta,
         price = EXCLUDED.price,
         price_unit = EXCLUDED.price_unit,
         image = EXCLUDED.image,
         icon = EXCLUDED.icon,
         badge = EXCLUDED.badge,
         is_demo = EXCLUDED.is_demo,
         raw = EXCLUDED.raw
       RETURNING type, item_id AS id, title, subtitle, meta, price,
                 price_unit AS "priceUnit", image, icon, badge,
                 is_demo AS "isDemo", raw, saved_at AS "savedAt"`,
      [
        req.user.id,
        type,
        String(id),
        title || null,
        subtitle || null,
        JSON.stringify(meta || []),
        price ?? null,
        priceUnit || null,
        image || null,
        icon || null,
        badge || null,
        !!isDemo,
        JSON.stringify(raw || {}),
      ]
    );
    res.json({ item: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save item." });
  }
});

// ── DELETE /api/wishlist/:type/:id — remove one entry ───────────────────────
router.delete("/:type/:id", requireAuth, async (req, res) => {
  const { type, id } = req.params;
  try {
    await db.query(
      `DELETE FROM wishlist_items WHERE user_id = $1 AND type = $2 AND item_id = $3`,
      [req.user.id, type, String(id)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not remove item." });
  }
});

module.exports = router;
