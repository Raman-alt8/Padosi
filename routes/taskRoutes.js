// routes/taskRoutes.js
const express = require('express');
const { body, validationResult } = require('express-validator');

const db          = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// GET /api/tasks — list all tasks belonging to the current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT
         t.id,
         t.text,
         t.price,
         t.mode,
         t.scheduled_at,
         t.accepted,
         t.created_at,
         h.name     AS helper_name,
         h.initials AS helper_initials,
         h.rating   AS helper_rating,
         h.reviews  AS helper_reviews,
         h.phone    AS helper_phone
       FROM tasks t
       LEFT JOIN helpers h ON h.id = t.helper_id
       WHERE t.user_id = ?
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    const tasks = rows.map(r => {
      const task = {
        id:         r.id,
        text:       r.text,
        price:      r.price,
        mode:       r.mode,
        accepted:   !!r.accepted,
        date:       r.scheduled_at ? r.scheduled_at.split('T')[0] : null,
        time:       r.scheduled_at ? r.scheduled_at.split('T')[1]?.slice(0, 5) : null,
        created_at: r.created_at,
      };
      if (r.accepted && r.helper_name) {
        task.helper = {
          name:     r.helper_name,
          initials: r.helper_initials,
          rating:   r.helper_rating,
          reviews:  r.helper_reviews,
          phone:    r.helper_phone,
        };
      }
      return task;
    });

    res.json({ tasks });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Could not load tasks.' });
  }
});

// GET /api/tasks/nearby — tasks posted by others, excluding dismissed ones
router.get('/nearby', requireAuth, async (req, res) => {
  try {
    const rows = await db.allAsync(
      `SELECT
         t.id,
         t.text,
         t.price,
         t.mode,
         t.scheduled_at,
         t.accepted
       FROM tasks t
       WHERE t.user_id != ?
         AND t.accepted = 0
         AND t.id NOT IN (
           SELECT task_id FROM dismissals WHERE user_id = ?
         )
       ORDER BY t.created_at DESC
       LIMIT 20`,
      [req.user.id, req.user.id]
    );

    const tasks = rows.map(r => ({
      id:    r.id,
      text:  r.text,
      price: r.price,
      mode:  r.mode,
      date:  r.scheduled_at ? r.scheduled_at.split('T')[0] : null,
      time:  r.scheduled_at ? r.scheduled_at.split('T')[1]?.slice(0, 5) : null,
    }));

    res.json({ tasks });
  } catch (err) {
    console.error('Nearby tasks error:', err);
    res.status(500).json({ error: 'Could not load nearby tasks.' });
  }
});

// POST /api/tasks — create a new task
router.post(
  '/',
  requireAuth,
  [
    body('text').trim().notEmpty().withMessage('Task description is required'),
    body('text').isLength({ max: 1000 }).withMessage('Description too long'),
    body('price').isFloat({ gt: 0 }).withMessage('Please enter a valid budget'),
    body('mode').isIn(['now', 'later']).withMessage('Invalid mode'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { text, price, mode, date, time } = req.body;

    const scheduled_at = (mode === 'later' && date && time)
      ? `${date}T${time}`
      : null;

    try {
      const result = await db.runAsync(
        `INSERT INTO tasks (user_id, text, price, mode, scheduled_at)
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.id, text, price, mode, scheduled_at]
      );

      const task = {
        id:         result.lastID,
        text,
        price,
        mode,
        accepted:   false,
        date:       date || null,
        time:       time || null,
        created_at: new Date().toISOString(),
      };

      res.json({ task });
    } catch (err) {
      console.error('Create task error:', err);
      res.status(500).json({ error: 'Could not create task.' });
    }
  }
);

// PUT /api/tasks/:id — edit an existing task
router.put(
  '/:id',
  requireAuth,
  [
    body('text').trim().notEmpty().withMessage('Task description is required'),
    body('text').isLength({ max: 1000 }).withMessage('Description too long'),
    body('price').isFloat({ gt: 0 }).withMessage('Please enter a valid budget'),
    body('mode').isIn(['now', 'later']).withMessage('Invalid mode'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { text, price, mode, date, time } = req.body;
    const taskId = req.params.id;

    const scheduled_at = (mode === 'later' && date && time)
      ? `${date}T${time}`
      : null;

    try {
      const existing = await db.getAsync(
        'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
        [taskId, req.user.id]
      );
      if (!existing) {
        return res.status(404).json({ error: 'Task not found.' });
      }

      await db.runAsync(
        `UPDATE tasks SET text = ?, price = ?, mode = ?, scheduled_at = ?
         WHERE id = ? AND user_id = ?`,
        [text, price, mode, scheduled_at, taskId, req.user.id]
      );

      res.json({ task: { id: Number(taskId), text, price, mode, date: date || null, time: time || null } });
    } catch (err) {
      console.error('Update task error:', err);
      res.status(500).json({ error: 'Could not update task.' });
    }
  }
);

// DELETE /api/tasks/:id — delete a task
router.delete('/:id', requireAuth, async (req, res) => {
  const taskId = req.params.id;

  try {
    const existing = await db.getAsync(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, req.user.id]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    await db.runAsync(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, req.user.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Could not delete task.' });
  }
});

// POST /api/tasks/:id/accept — assign a helper
router.post('/:id/accept', requireAuth, async (req, res) => {
  const taskId = req.params.id;

  try {
    const task = await db.getAsync(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, req.user.id]
    );
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    if (task.accepted) {
      return res.status(400).json({ error: 'Task already accepted.' });
    }

    const helpers = await db.allAsync('SELECT * FROM helpers');

    if (!helpers || helpers.length === 0) {
      return res.status(503).json({ error: 'No helpers are available right now.' });
    }

    const helper = helpers[Math.floor(Math.random() * helpers.length)];

    await db.runAsync(
      'UPDATE tasks SET accepted = 1, helper_id = ? WHERE id = ?',
      [helper.id, taskId]
    );

    res.json({
      helper: {
        name:     helper.name,
        initials: helper.initials,
        rating:   helper.rating,
        reviews:  helper.reviews,
        phone:    helper.phone,
      },
    });
  } catch (err) {
    console.error('Accept task error:', err);
    res.status(500).json({ error: 'Could not accept task.' });
  }
});

// POST /api/tasks/:id/offer — offer to take a nearby task
router.post('/:id/offer', requireAuth, async (req, res) => {
  const taskId = req.params.id;

  try {
    const task = await db.getAsync('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    if (task.user_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot accept your own task.' });
    }
    if (task.accepted) {
      return res.status(400).json({ error: 'This task has already been accepted.' });
    }

    const poster = await db.getAsync(
      'SELECT id, full_name, email, phone FROM users WHERE id = ?',
      [task.user_id]
    );
    if (!poster) {
      return res.status(404).json({ error: 'Could not find the task poster.' });
    }

    const initials = (poster.full_name || 'U')
      .trim()
      .split(/\s+/)
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    res.json({
      poster: {
        initials,
        phone: poster.phone || null,
        email: poster.email,
      },
    });
  } catch (err) {
    console.error('Offer task error:', err);
    res.status(500).json({ error: 'Could not send offer.' });
  }
});

// POST /api/tasks/:id/dismiss — hide a task from the current user's nearby list
router.post('/:id/dismiss', requireAuth, async (req, res) => {
  const taskId = req.params.id;

  try {
    const ownTask = await db.getAsync(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, req.user.id]
    );
    if (ownTask) {
      return res.status(400).json({ error: 'Cannot dismiss your own task.' });
    }

    await db.runAsync(
      'INSERT OR IGNORE INTO dismissals (user_id, task_id) VALUES (?, ?)',
      [req.user.id, taskId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Dismiss task error:', err);
    res.status(500).json({ error: 'Could not dismiss task.' });
  }
});

module.exports = router;
