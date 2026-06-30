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
  (req, res) => {
    res.redirect('/?auth=success');
  }
);

module.exports = router;
