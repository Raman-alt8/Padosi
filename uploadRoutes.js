// routes/uploadRoutes.js
const express     = require('express');
const requireAuth = require('../middleware/requireAuth');
const { upload }  = require('../config/cloudinary');

const router = express.Router();

// POST /api/upload — upload image to Cloudinary, return URL
router.post('/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  res.json({ url: req.file.path });
});

module.exports = router;
