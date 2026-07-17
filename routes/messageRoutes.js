// routes/messageRoutes.js
const express = require('express');
const db = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Please log in.' });
  }
  next();
}

const LISTING_TYPES = ['ticket', 'ride', 'service', 'vehicle'];

// POST /api/conversations — get or create a conversation for a listing
router.post('/', requireAuth, async (req, res) => {
  const { listing_type, listing_id, seller_id } = req.body;
  const buyerId = req.user.id;

  if (!LISTING_TYPES.includes(listing_type) || !listing_id || !seller_id) {
    return res.status(400).json({ error: 'listing_type, listing_id and seller_id are required.' });
  }
  if (String(seller_id) === String(buyerId)) {
    return res.status(400).json({ error: "You can't message yourself about your own listing." });
  }

  try {
    // Look up the conversation regardless of which side of buyer/seller
    // each participant was on when it was created. Without the OR here,
    // the poster messaging the accepter creates (buyer=poster,
    // seller=accepter), and the accepter messaging back — where buyerId is
    // now *their* own id — searches for (buyer=accepter, seller=poster),
    // never finds the first row, and creates a second one. Same pair of
    // people + same listing should always resolve to the same thread no
    // matter who started it.
    let convo = await db.getAsync(
      `SELECT * FROM conversations
       WHERE listing_type = ? AND listing_id = ?
         AND (
           (buyer_id = ? AND seller_id = ?) OR
           (buyer_id = ? AND seller_id = ?)
         )`,
      [listing_type, String(listing_id), buyerId, seller_id, seller_id, buyerId]
    );

    if (!convo) {
      const result = await db.runAsync(
        `INSERT INTO conversations (listing_type, listing_id, buyer_id, seller_id)
         VALUES (?, ?, ?, ?)`,
        [listing_type, String(listing_id), buyerId, seller_id]
      );
      convo = await db.getAsync('SELECT * FROM conversations WHERE id = ?', [result.lastID]);
    }

    res.json({ conversation: convo });
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// GET /api/conversations — inbox: every conversation the current user is part of
router.get('/', requireAuth, async (req, res) => {
  const myId = req.user.id;

  try {
    const conversations = await db.allAsync(
      `SELECT
         c.*,
         other.id         AS other_id,
         other.full_name  AS other_name,
         other.avatar_url AS other_avatar,
         lm.content        AS last_message,
         lm.sender_id      AS last_message_sender_id,
         (SELECT COUNT(*) FROM messages
           WHERE conversation_id = c.id AND sender_id != ? AND read_at IS NULL) AS unread_count
       FROM conversations c
       JOIN users other ON other.id = CASE WHEN c.buyer_id = ? THEN c.seller_id ELSE c.buyer_id END
       LEFT JOIN messages lm ON lm.id = (
         SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1
       )
       WHERE c.buyer_id = ? OR c.seller_id = ?
       ORDER BY c.last_message_at DESC`,
      [myId, myId, myId, myId]
    );

    res.json({ conversations });
  } catch (err) {
    console.error('List conversations error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// GET /api/conversations/:id/messages — thread history, marks incoming as read
router.get('/:id/messages', requireAuth, async (req, res) => {
  const myId = req.user.id;
  const conversationId = req.params.id;

  try {
    const convo = await db.getAsync('SELECT * FROM conversations WHERE id = ?', [conversationId]);
    if (!convo || (String(convo.buyer_id) !== String(myId) && String(convo.seller_id) !== String(myId))) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const messages = await db.allAsync(
      `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`,
      [conversationId]
    );

    await db.runAsync(
      `UPDATE messages SET read_at = CURRENT_TIMESTAMP
       WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL`,
      [conversationId, myId]
    );

    res.json({ conversation: convo, messages });
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

module.exports = router;