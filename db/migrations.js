// db/migrations.js
// Runs all one-time table creation / ALTER statements that used to live
// inline in server.js. Call runMigrations(db) once at startup.

function runMigrations(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS dismissals (
      user_id  INTEGER NOT NULL,
      task_id  INTEGER NOT NULL,
      PRIMARY KEY (user_id, task_id)
    )
  `, err => {
    if (err) console.error('Could not create dismissals table:', err);
  });

  // Services table — every posted listing lives here, visible to all users.
  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL,
      category     TEXT    NOT NULL,
      title        TEXT    NOT NULL,
      description  TEXT    NOT NULL,
      price_type   TEXT    DEFAULT 'Monthly',
      price        REAL,
      phone        TEXT,
      experience   TEXT,
      availability TEXT,
      area         TEXT,
      photo_url    TEXT    DEFAULT '',
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, err => {
    if (err) console.error('Could not create services table:', err);
  });

  db.run(`ALTER TABLE users ADD COLUMN phone TEXT`, err => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Could not add phone column:', err);
    }
  });

  db.run(`ALTER TABLE tickets ADD COLUMN image_url TEXT DEFAULT ''`, err => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Could not add image_url column:', err);
    }
  });
}

module.exports = runMigrations;
