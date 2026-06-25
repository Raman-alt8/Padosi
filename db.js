// db.js  –  SQLite database setup
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const DB_PATH = path.join(__dirname, 'padosi.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌  Could not open database:', err.message);
    process.exit(1);
  }
  console.log('✅  SQLite database connected at', DB_PATH);
});

// Enable WAL mode for better concurrency
db.run('PRAGMA journal_mode=WAL');
db.run('PRAGMA foreign_keys=ON');

// ── Schema ───────────────────────────────────────────
db.serialize(() => {

  // Ride routes table
db.run(`
  CREATE TABLE IF NOT EXISTS ride_routes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    poster_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_place   TEXT    NOT NULL,
    to_place     TEXT    NOT NULL,
    freq         TEXT    NOT NULL,
    depart_time  TEXT    NOT NULL,
    seats        INTEGER NOT NULL DEFAULT 1 CHECK(seats BETWEEN 1 AND 8),
    price        REAL    NOT NULL DEFAULT 0,
    description  TEXT    NOT NULL DEFAULT '',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name     TEXT    NOT NULL,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT,                        -- NULL for OAuth-only accounts
      google_id     TEXT    UNIQUE,              -- NULL for local accounts
      avatar_url    TEXT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tasks table
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text        TEXT    NOT NULL,
      price       REAL    NOT NULL,
      mode        TEXT    NOT NULL CHECK(mode IN ('now','later')),
      scheduled_at DATETIME,                     -- NULL when mode = 'now'
      accepted    INTEGER DEFAULT 0,             -- 0 / 1
      helper_id   INTEGER REFERENCES helpers(id),
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Helpers table (sample verified helpers)
  db.run(`
    CREATE TABLE IF NOT EXISTS helpers (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT    NOT NULL,
      phone     TEXT    NOT NULL,
      initials  TEXT    NOT NULL,
      rating    REAL    DEFAULT 4.5,
      reviews   INTEGER DEFAULT 0
    )
  `);

  // Seed sample helpers (ignore if already present)
  db.run(`
    INSERT OR IGNORE INTO helpers (id, name, phone, initials, rating, reviews)
    VALUES
      (1, 'Vikram Singh',  '+91 98765 43210', 'VS', 4.8, 132),
      (2, 'Anjali Sharma', '+91 91234 56789', 'AS', 4.6,  87),
      (3, 'Rohit Mehra',   '+91 99887 66554', 'RM', 4.9, 210),
      (4, 'Pooja Verma',   '+91 90011 22334', 'PV', 4.7,  64)
  `);
});

// ── Helper wrappers (promise-based) ─────────
db.getAsync = (sql, params = []) =>
  new Promise((res, rej) =>
    db.get(sql, params, (err, row) => (err ? rej(err) : res(row)))
  );

db.allAsync = (sql, params = []) =>
  new Promise((res, rej) =>
    db.all(sql, params, (err, rows) => (err ? rej(err) : res(rows)))
  );

db.runAsync = (sql, params = []) =>
  new Promise((res, rej) =>
    db.run(sql, params, function (err) {
      if (err) rej(err);
      else res({ lastID: this.lastID, changes: this.changes });
    })
  );

module.exports = db;
