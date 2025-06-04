// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/jwtAuth');
const User = require('../models/User');

// 🔐 Admin Only Middleware
function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin only.' });
  }
  next();
}

// 📥 GET all users (admin)
router.get('/', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// 🚫 PUT /api/users/:id/ban - Toggle ban status
router.put('/:id/ban', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.banned = !user.banned;
    await user.save();

    res.json({ message: `User has been ${user.banned ? 'banned' : 'unbanned'}` });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

module.exports = router;
