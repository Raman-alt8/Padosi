// server.js - Padosi backend entry point
require('dotenv').config();

const express     = require('express');
const session     = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const cors        = require('cors');
const bcrypt      = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const path        = require('path');
const multer      = require('multer');
const cloudinary  = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const db       = require('./db');
const passport = require('./auth');

const app  = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// ─── Cloudinary ───────────────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder:          'padosi-tickets',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation:  [{ width: 1200, crop: 'limit' }],
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ─── Middleware ───────────────────────────────────────────────────────────────

const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: isDev
    ? 'http://localhost:5173'
    : (process.env.FRONTEND_URL || 'https://padosi-1.onrender.com'),
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
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
}));

app.use(passport.initialize());
app.use(passport.session());

// ─── Static files ─────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'public')));

// ─── DB migrations ────────────────────────────────────────────────────────────

db.run(`
  CREATE TABLE IF NOT EXISTS dismissals (
    user_id  INTEGER NOT NULL,
    task_id  INTEGER NOT NULL,
    PRIMARY KEY (user_id, task_id)
  )
`, err => { if (err) console.error('Could not create dismissals table:', err); });

db.run(`ALTER TABLE users ADD COLUMN phone TEXT`, err => {
  if (err && !err.message.includes('duplicate column')) console.error('Could not add phone column:', err);
});

db.run(`ALTER TABLE tickets ADD COLUMN image_url TEXT DEFAULT ''`, err => {
  if (err && !err.message.includes('duplicate column')) console.error('Could not add image_url column:', err);
});

// ─── Auth helper ──────────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

// ─── Mount route files ────────────────────────────────────────────────────────

const authRoutes     = require('./routes-auth')(passport, db, bcrypt, body, validationResult, requireAuth, upload);
const listingRoutes  = require('./routes-listings')(db, body, validationResult, requireAuth);

app.use('/api', authRoutes);
app.use('/api', listingRoutes);

// ─── 404 fallback for unmatched /api/* routes ─────────────────────────────────

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

// ─── Serve React frontend ─────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ─── Start server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
