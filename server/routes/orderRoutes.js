const express = require('express');
const router  = express.Router();
const authenticateJWT = require('../middleware/jwtAuth');
const {
  createOrder,
  getOrders,
  getOrdersByUser,
  updateStatus,
  getOrderById
} = require('../controllers/orderController');

// 1) Customer places order
router.post('/', authenticateJWT, createOrder);

router.get('/me', authenticateJWT, getOrdersByUser);

router.get('/:id', authenticateJWT, getOrderById);
// 2) Admin fetches all orders
router.get('/', authenticateJWT, getOrders);


// 3) Admin updates status
router.put(
  '/:id/status',
  authenticateJWT,
  (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  },
  updateStatus
);

module.exports = router;
