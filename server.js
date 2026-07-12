// server.js - Padosi backend entry point
require('dotenv').config();

const express     = require('express');
const http        = require('http');
const session     = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const cors        = require('cors');
const path        = require('path');

const db         = require('./db');
const passport   = require('./auth');
const initSocket = require('./socket');

const runMigrations = require('./db/migrations');

const uploadRoutes      = require('./routes/uploadRoutes');
const accountRoutes     = require('./routes/accountRoutes');
const authRoutes        = require('./routes/authRoutes');
const googleAuthRoutes  = require('./routes/googleAuthRoutes');
const taskRoutes        = require('./routes/taskRoutes');
const rideRouteRoutes   = require('./routes/rideRouteRoutes');
const ticketRoutes      = require('./routes/ticketRoutes');
const serviceRoutes     = require('./routes/serviceRoutes');
const vehicleRoutes     = require('./routes/vehicleRoutes');
const wishlistRoutes    = require('./routes/wishlistRoutes');
const messageRoutes     = require('./routes/messageRoutes');

const app    = express();
const server = http.createServer(app); // wraps express so Socket.io can share the same port
const PORT   = process.env.PORT || 3000;

app.set('trust proxy', 1);

// ─── Middleware ───────────────────────────────────────────────────────────────

const isDev = process.env.NODE_ENV !== 'production';

const corsOrigin = isDev
  ? 'http://localhost:5173'
  : (process.env.FRONTEND_URL || 'https://padosi-1.onrender.com');

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pulled into its own variable (instead of inline in app.use) so the exact
// same session store/config can be reused by Socket.io below.
const sessionMiddleware = session({
  store:             new SQLiteStore({ db: 'sessions.db', dir: __dirname }),
  secret:            process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    maxAge:   7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure:   !isDev,
    sameSite: isDev ? 'lax' : 'none',
  },
});

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

// ─── Socket.io ─────────────────────────────────────────────────────────────
// Shares the session + passport middleware above, so a socket connection is
// authenticated the same way as any HTTP request (see socket.js).

initSocket(server, { sessionMiddleware, passport, corsOrigin });

// ─── Static files ─────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'public')));

// ─── DB migrations ────────────────────────────────────────────────────────────

runMigrations(db);

// ─── API routes ───────────────────────────────────────────────────────────────

app.use('/api', uploadRoutes);
app.use('/api', accountRoutes);
app.use('/api', authRoutes);
app.use('/auth', googleAuthRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ride-routes', rideRouteRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/conversations', messageRoutes);

// ─── 404 fallback for unmatched /api/* routes ─────────────────────────────────

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

// ─── Serve React frontend (must be AFTER all API routes) ─────────────────────

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ─── Start server ─────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});