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

  // Wishlist table — one row per (user, listing). type + item_id together
  // identify the underlying listing (a ticket "12" and a vehicle "12" don't
  // collide), and the UNIQUE constraint below is what lets the upsert in
  // POST /api/wishlist work. Scoped entirely by user_id, so one account can
  // never see or touch another account's saved items.
  db.run(`
    CREATE TABLE IF NOT EXISTS wishlist_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type       TEXT    NOT NULL,
      item_id    TEXT    NOT NULL,
      title      TEXT,
      subtitle   TEXT,
      meta       TEXT    DEFAULT '[]',      -- JSON-encoded array of strings
      price      REAL,
      price_unit TEXT,
      image      TEXT,
      icon       TEXT,
      badge      TEXT,
      is_demo    INTEGER DEFAULT 0,         -- 0 / 1
      raw        TEXT    DEFAULT '{}',      -- JSON-encoded object
      saved_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, type, item_id)
    )
  `, err => {
    if (err) console.error('Could not create wishlist_items table:', err);
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

  // Vehicles table — every posted rental listing lives here, visible to all users.
  db.run(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL,
      title        TEXT    NOT NULL,
      description  TEXT    DEFAULT '',
      price_type   TEXT    DEFAULT 'Per Day',
      price        REAL    NOT NULL,
      phone        TEXT    NOT NULL,
      area         TEXT    DEFAULT '',
      photo_url    TEXT    DEFAULT '',
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, err => {
    if (err) {
      console.error('Could not create vehicles table:', err);
      return; // bail — the ALTER below would fail too without the table existing
    }

    // Holds every photo on a vehicle listing as a JSON-encoded array (e.g.
    // '["url1","url2"]'), index 0 being the thumbnail. photo_url is left in
    // place and kept in sync with index 0 by vehicleRoutes.js, so anything
    // still reading the single old column keeps working untouched.
    //
    // Must be nested inside the CREATE TABLE callback above, not fired as a
    // sibling db.run(): node's sqlite3 driver does not guarantee that queued
    // db.run() calls execute in the order they were fired unless the
    // connection is serialized. On a fresh database this ALTER can otherwise
    // run before CREATE TABLE IF NOT EXISTS vehicles has actually finished,
    // failing with "no such table: vehicles" — which is what was happening
    // before this fix (same class of bug as the users/username fix below).
    db.run(`ALTER TABLE vehicles ADD COLUMN photo_urls TEXT DEFAULT '[]'`, err2 => {
      if (err2 && !err2.message.includes('duplicate column')) {
        console.error('Could not add photo_urls column:', err2);
      }
    });
  });

  db.run(`ALTER TABLE users ADD COLUMN phone TEXT`, err => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Could not add phone column:', err);
    }
  });

  // Tracks whether the user has actually completed the in-app photo upload
  // step in VerifiedSection.jsx — separate from `avatar_url`, which Google
  // OAuth also populates automatically from the person's Google profile
  // photo (auth.js). Without this flag, a Google sign-in would appear
  // "photo verified" without ever going through the upload step.
  db.run(`ALTER TABLE users ADD COLUMN photo_verified INTEGER DEFAULT 0`, err => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Could not add photo_verified column:', err);
    }
  });

  db.run(`ALTER TABLE tickets ADD COLUMN image_url TEXT DEFAULT ''`, err => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Could not add image_url column:', err);
    }
  });

  // IMPORTANT: node's sqlite3 driver does not guarantee that queued db.run()
  // calls execute in the order they were fired unless the connection is
  // serialized. The index creation below depends on the ALTER TABLE having
  // actually finished, so it must be nested inside that callback rather than
  // fired as a sibling call — otherwise it can run first and fail with
  // "no such column: username" (which is what was happening before this fix).
  db.run(`ALTER TABLE users ADD COLUMN username TEXT`, err => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Could not add username column:', err);
      return; // bail — creating the index would fail anyway without the column
    }

    // SQLite allows multiple NULL usernames in a unique index (NULLs are
    // never considered equal), so users without one yet won't conflict.
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`, err2 => {
      if (err2) console.error('Could not create username unique index:', err2);
    });
  });

  // ── Chat: conversations + messages ──────────────────────────────────────
  // A conversation is scoped to one listing + one buyer + one seller, so the
  // same two users messaging about two different listings get two separate
  // threads. messages must nest inside the conversations callback — same
  // ordering issue as vehicles/photo_urls above: node's sqlite3 driver
  // doesn't guarantee db.run() calls fire in order unless nested.
  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_type    TEXT    NOT NULL,   -- 'ticket' | 'ride' | 'service' | 'vehicle'
      listing_id      TEXT    NOT NULL,
      buyer_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seller_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (listing_type, listing_id, buyer_id, seller_id)
    )
  `, err => {
    if (err) {
      console.error('Could not create conversations table:', err);
      return;
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content         TEXT    NOT NULL,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        read_at         DATETIME
      )
    `, err2 => {
      if (err2) {
        console.error('Could not create messages table:', err2);
        return;
      }

      db.run(
        `CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`,
        err3 => {
          if (err3) console.error('Could not create messages index:', err3);
        }
      );
    });
  });
}

module.exports = runMigrations;