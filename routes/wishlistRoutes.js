// routes/wishlistRoutes.js
//
// Account-connected wishlist API. Mount this in your main server file:
//   app.use("/api/wishlist", require("./routes/wishlistRoutes"));
//
// Uses the project's actual db.js (SQLite via the sqlite3 package), through
// its promisified helpers — db.getAsync/allAsync/runAsync — the same way
// other routes in this project already do. Table: wishlist_items, created
// by db/migrations.js's runMigrations(db).
//
// requireAuth is the same middleware protecting /api/tasks etc.; it
// populates req.user.id for a logged-in request and responds 401 otherwise.

const express = require("express");
const router = express.Router();
const db = require("../db");
const requireAuth = require("../middleware/requireAuth");

function parseRow(row) {
  if (!row) return null;
  return {
    ...row,
    meta: JSON.parse(row.meta || "[]"),
    raw: JSON.parse(row.raw || "{}"),
    isDemo: !!row.isDemo,
  };
}

// ── GET /api/wishlist — everything saved by the logged-in user ─────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT type, item_id AS id, title, subtitle, meta, price,
              price_unit AS priceUnit, image, icon, badge,
              is_demo AS isDemo, raw, saved_at AS savedAt
       FROM wishlist_items
       WHERE user_id = ?
       ORDER BY saved_at DESC`,
      [req.user.id]
    );
    res.json({ items: rows.map(parseRow) });
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
    await db.runAsync(
      `INSERT INTO wishlist_items
         (user_id, type, item_id, title, subtitle, meta, price, price_unit, image, icon, badge, is_demo, raw)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(user_id, type, item_id) DO UPDATE SET
         title      = excluded.title,
         subtitle   = excluded.subtitle,
         meta       = excluded.meta,
         price      = excluded.price,
         price_unit = excluded.price_unit,
         image      = excluded.image,
         icon       = excluded.icon,
         badge      = excluded.badge,
         is_demo    = excluded.is_demo,
         raw        = excluded.raw`,
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
        isDemo ? 1 : 0,
        JSON.stringify(raw || {}),
      ]
    );

    // sqlite3's run() doesn't hand back RETURNING rows, so re-select the row
    // to get the final saved_at (unchanged on update, set on insert) back
    // to the frontend.
    const row = await db.getAsync(
      `SELECT type, item_id AS id, title, subtitle, meta, price,
              price_unit AS priceUnit, image, icon, badge,
              is_demo AS isDemo, raw, saved_at AS savedAt
       FROM wishlist_items
       WHERE user_id = ? AND type = ? AND item_id = ?`,
      [req.user.id, type, String(id)]
    );

    res.json({ item: parseRow(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save item." });
  }
});

// ── DELETE /api/wishlist/:type/:id — remove one entry ───────────────────────
router.delete("/:type/:id", requireAuth, async (req, res) => {
  const { type, id } = req.params;
  try {
    await db.runAsync(
      `DELETE FROM wishlist_items WHERE user_id = ? AND type = ? AND item_id = ?`,
      [req.user.id, type, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not remove item." });
  }
});

module.exports = router;