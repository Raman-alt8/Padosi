// auth.js  –  Passport strategy configuration
const passport       = require('passport');
const LocalStrategy  = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt         = require('bcryptjs');
const db             = require('./db');

// ── Serialise / Deserialise ──────────
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.getAsync('SELECT * FROM users WHERE id = ?', [id]);
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

// ── Local strategy  (email + password) ──────────────────────────────
passport.use(new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },
  async (email, password, done) => {
    try {
      const user = await db.getAsync(
        'SELECT * FROM users WHERE email = ?', [email.toLowerCase()]
      );

      if (!user) {
        return done(null, false, { message: 'No account found with that email.' });
      }
      if (!user.password_hash) {
        return done(null, false, { message: 'This account uses Google Sign-In. Please log in with Google.' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// ── Google OAuth2 strategy 
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  'https://padosi-1.onrender.com/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email     = profile.emails?.[0]?.value?.toLowerCase();
      const fullName  = profile.displayName || 'Padosi User';
      const avatarUrl = profile.photos?.[0]?.value;
      const googleId  = profile.id;

      // Try to find by google_id first
      let user = await db.getAsync(
        'SELECT * FROM users WHERE google_id = ?', [googleId]
      );

      if (!user && email) {
        // Try to find existing local account with same email → link it
        user = await db.getAsync(
          'SELECT * FROM users WHERE email = ?', [email]
        );
        if (user) {
          // Link Google to existing local account
          await db.runAsync(
            'UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?',
            [googleId, avatarUrl, user.id]
          );
          user = await db.getAsync('SELECT * FROM users WHERE id = ?', [user.id]);
        }
      }

      if (!user) {
        // Create new account
        const result = await db.runAsync(
          `INSERT INTO users (full_name, email, google_id, avatar_url)
           VALUES (?, ?, ?, ?)`,
          [fullName, email || `${googleId}@google.com`, googleId, avatarUrl]
        );
        user = await db.getAsync('SELECT * FROM users WHERE id = ?', [result.lastID]);
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

module.exports = passport;
