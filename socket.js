// socket.js — Socket.io setup: session-authenticated chat sockets
const { Server } = require('socket.io');
const db = require('./db');

function initSocket(server, { sessionMiddleware, passport, corsOrigin }) {
  const io = new Server(server, {
    cors: { origin: corsOrigin, credentials: true },
  });

  // Reuse the same session (and Passport) middleware the Express app uses,
  // so a socket connection is authenticated exactly like an HTTP request —
  // no separate token/login step needed. Requires socket.io >= 4.6.0.
  io.engine.use(sessionMiddleware);
  io.engine.use(passport.initialize());
  io.engine.use(passport.session());

  // Reject the handshake outright if there's no logged-in user on the session.
  io.use((socket, next) => {
    const req = socket.request;
    if (req.user) {
      socket.userId = req.user.id;
      return next();
    }
    next(new Error('unauthorized'));
  });

  io.on('connection', (socket) => {
    // Personal room so we can push events to a user across all their tabs/devices.
    socket.join(`user:${socket.userId}`);

    socket.on('join_conversation', async (conversationId, callback) => {
      try {
        const convo = await db.getAsync('SELECT * FROM conversations WHERE id = ?', [conversationId]);
        const isParticipant = convo && (
          String(convo.buyer_id) === String(socket.userId) ||
          String(convo.seller_id) === String(socket.userId)
        );
        if (!isParticipant) {
          return callback?.({ error: 'Not a participant in this conversation.' });
        }
        socket.join(`conversation:${conversationId}`);
        callback?.({ ok: true });
      } catch (err) {
        console.error('join_conversation error:', err);
        callback?.({ error: 'Server error.' });
      }
    });

    socket.on('send_message', async ({ conversationId, content }, callback) => {
      const trimmed = (content || '').trim();
      if (!trimmed) return callback?.({ error: 'Message cannot be empty.' });
      if (trimmed.length > 2000) return callback?.({ error: 'Message is too long.' });

      try {
        const convo = await db.getAsync('SELECT * FROM conversations WHERE id = ?', [conversationId]);
        const isParticipant = convo && (
          String(convo.buyer_id) === String(socket.userId) ||
          String(convo.seller_id) === String(socket.userId)
        );
        if (!isParticipant) return callback?.({ error: 'Not a participant in this conversation.' });

        const result = await db.runAsync(
          `INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)`,
          [conversationId, socket.userId, trimmed]
        );
        await db.runAsync(
          `UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [conversationId]
        );

        const message = await db.getAsync('SELECT * FROM messages WHERE id = ?', [result.lastID]);

        io.to(`conversation:${conversationId}`).emit('receive_message', message);

        // Also notify the other party's personal room, in case they don't
        // have the conversation open yet (e.g. for an inbox unread badge).
        const otherId = String(convo.buyer_id) === String(socket.userId) ? convo.seller_id : convo.buyer_id;
        io.to(`user:${otherId}`).emit('new_message_notification', { conversationId, message });

        callback?.({ ok: true, message });
      } catch (err) {
        console.error('send_message error:', err);
        callback?.({ error: 'Server error.' });
      }
    });

    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        userId: socket.userId,
        isTyping: !!isTyping,
      });
    });
  });

  return io;
}

module.exports = initSocket;