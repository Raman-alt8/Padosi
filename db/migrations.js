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

  // ── Public profile fields (AccountDetailPage.jsx) ───────────────────────
  // bio/location are new. created_at is guarded the same way in case the
  // base users table (created before this migrations file existed) doesn't
  // already have one — harmless no-op via the duplicate-column check if it
  // does.
  db.run(`ALTER TABLE users ADD COLUMN bio TEXT`, err => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Could not add bio column:', err);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN location TEXT`, err => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Could not add location column:', err);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, err => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Could not add created_at column:', err);
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

  // ── Ride routes: mode, gender_pref, vehicle_types ───────────────────────
  // These three columns were added after ride_routes already existed in
  // production, so they arrive as ALTER TABLE statements rather than being
  // baked into a CREATE TABLE. Nested for the same db.run() ordering reason
  // as vehicles/photo_urls and users/username above — each ALTER must wait
  // for the previous one to actually finish before firing, or a fresh
  // database can hit "no such column" errors.
  db.run(`ALTER TABLE ride_routes ADD COLUMN mode TEXT DEFAULT 'partner'`, err => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Could not add mode column to ride_routes:', err);
    }

    db.run(`ALTER TABLE ride_routes ADD COLUMN gender_pref TEXT`, err2 => {
      if (err2 && !err2.message.includes('duplicate column')) {
        console.error('Could not add gender_pref column to ride_routes:', err2);
      }

      // Stored as a JSON-encoded array (e.g. '["car","bike"]'), same
      // pattern as vehicles.photo_urls — SQLite has no native array type.
      db.run(`ALTER TABLE ride_routes ADD COLUMN vehicle_types TEXT DEFAULT '[]'`, err3 => {
        if (err3 && !err3.message.includes('duplicate column')) {
          console.error('Could not add vehicle_types column to ride_routes:', err3);
        }

        // Set once, in rideRouteRoutes.js's POST /:id/accept, the first
        // time a route is ever accepted by anyone — never updated again
        // after that, even if more people accept or someone re-accepts
        // post-decline. Powers the 10-day "accepted route" auto-expiry on
        // the frontend (RideCard.jsx / RideDetailPage.jsx,
        // ACCEPTED_DELETE_AFTER_DAYS), which needs to count from the true
        // first acceptance rather than general listing activity. NULL
        // means "never accepted yet" — SQLite gives us that distinction
        // for free, so no separate boolean flag is needed alongside it.
        db.run(`ALTER TABLE ride_routes ADD COLUMN accepted_at TEXT`, err4 => {
          if (err4 && !err4.message.includes('duplicate column')) {
            console.error('Could not add accepted_at column to ride_routes:', err4);
          }

          // NULL = still active (or never accepted). Non-NULL = soft-
          // expired: the route was auto-removed 10 days after its first
          // acceptance (see ACCEPTED_DELETE_AFTER_DAYS / rideRouteRoutes.js
          // POST /:id/expire) but kept in the table, rather than hard-
          // deleted, so the poster can still see and recover it. The GET /
          // query in rideRouteRoutes.js hides any route with expired_at set
          // from everyone except its poster.
          db.run(`ALTER TABLE ride_routes ADD COLUMN expired_at TEXT`, err5 => {
            if (err5 && !err5.message.includes('duplicate column')) {
              console.error('Could not add expired_at column to ride_routes:', err5);
            }

            // Bumped by rideRouteRoutes.js's POST /:id/confirm-active
            // whenever the poster taps "I'm here" on a pending route.
            // RideCard.jsx / RideDetailPage.jsx read this (falling back to
            // created_at if it's still NULL, e.g. a route that's never had
            // its activity confirmed) to drive the 15/18-day
            // PENDING_AFTER_DAYS / DELETE_AFTER_DAYS "still interested?"
            // cycle. Deliberately separate from accepted_at/expired_at
            // above: this only affects the unaccepted-listing cycle, never
            // the accepted-route soft-expire/hard-delete clock, and
            // POST /:id/recover deliberately does not touch it either.
            db.run(`ALTER TABLE ride_routes ADD COLUMN last_active_at TEXT`, err6 => {
              if (err6 && !err6.message.includes('duplicate column')) {
                console.error('Could not add last_active_at column to ride_routes:', err6);
              }

              // Set once, in rideRouteRoutes.js's POST /:id/recover, the
              // first (and only) time a lapsed route is successfully
              // recovered — never cleared again afterwards, even though
              // expired_at itself gets cleared back to NULL by that same
              // request. This is what lets the hard-delete logic tell a
              // route apart from a route that's never lapsed at all: once
              // recovered_at is set, the route stops following the 10-day
              // soft-expire / 2-day recovery-window cycle entirely and
              // instead gets one final, absolute cutoff at
              // ACCEPTED_HARD_DELETE_AFTER_DAYS (21) counted from the
              // original accepted_at — see rideRouteRoutes.js POST
              // /:id/recover and sweepAcceptedRideRoutes for the full
              // state machine. NULL means "never recovered" (either still
              // active, or currently lapsed and awaiting a decision).
              db.run(`ALTER TABLE ride_routes ADD COLUMN recovered_at TEXT`, err7 => {
                if (err7 && !err7.message.includes('duplicate column')) {
                  console.error('Could not add recovered_at column to ride_routes:', err7);
                }
              });
            });
          });
        });
      });
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

  // ── Reviews: ratings left by one user for another ───────────────────────
  // Powers the public profile page (AccountDetailPage.jsx) — average rating
  // + review count for a user, independent of which listing prompted it.
  // One row per (reviewer, reviewee) pair; leaving a second review for the
  // same person updates it in place rather than stacking duplicates (see
  // the ON CONFLICT upsert in profileRoutes.js). Index nested inside the
  // CREATE TABLE callback for the same db.run() ordering reason as
  // messages/idx_messages_conversation above.
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_type TEXT,
      listing_id   TEXT,
      reviewer_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reviewee_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment      TEXT,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (reviewer_id, reviewee_id)
    )
  `, err => {
    if (err) {
      console.error('Could not create reviews table:', err);
      return;
    }

    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id)`, err2 => {
      if (err2) console.error('Could not create reviews index:', err2);
    });
  });
}

module.exports = runMigrations;