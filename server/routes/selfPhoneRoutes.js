const express = require('express');
const router = express.Router();
const SelfPhone = require('../models/SelfPhone');
const authenticateJWT = require('../middleware/jwtAuth');

// GET all self phones
router.get('/', authenticateJWT, async (req, res) => {
  const entry = await SelfPhone.findOne({ user: req.user.id });
  res.json(entry ? entry.phones : []);
});

// POST add or update self phones array
router.post('/', authenticateJWT, async (req, res) => {
  const { phones } = req.body; // expect [{ number, verified? }]
  let entry = await SelfPhone.findOneAndUpdate(
    { user: req.user.id },
    { phones },
    { upsert: true, new: true }
  );
  res.json(entry.phones);
});

module.exports = router;
