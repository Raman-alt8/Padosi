// routes/googleAuthRoutes.js
const express  = require('express');
const passport = require('../auth');

const router = express.Router();

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/?auth=failed' }),
  (req, res, next) => {
    // req.login() (called internally by passport.authenticate) sets req.user
    // synchronously, but persisting the session to the store (SQLite, via
    // connect-sqlite3) is async. Without waiting for it, res.redirect() can
    // reach the browser before the session is actually written to disk —
    // so the very next API call (fired immediately on page load, e.g.
    // /api/me or /api/ride-routes) finds no matching session and gets a
    // 401, even though login "succeeded". Explicitly saving the session
    // before redirecting closes that race.
    req.session.save(err => {
      if (err) return next(err);
      res.redirect('/?auth=success');
    });
  }
);

module.exports = router;