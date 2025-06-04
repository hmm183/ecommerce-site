const express = require('express');
const router = express.Router();
const GiftPhone = require('../models/GiftPhone');
const authenticateJWT = require('../middleware/jwtAuth');

// GET gift phone entries
router.get('/', authenticateJWT, async (req, res) => {
  const entry = await GiftPhone.findOne({ user: req.user.id });
  res.json(entry ? entry.gifts : []);
});

// POST add or update gift entries array
router.post('/', authenticateJWT, async (req, res) => {
  const { gifts } = req.body; // expect [{ number, recipientName, verified? }]
  let entry = await GiftPhone.findOneAndUpdate(
    { user: req.user.id },
    { gifts },
    { upsert: true, new: true }
  );
  res.json(entry.gifts);
});

module.exports = router;
