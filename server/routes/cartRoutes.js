const express = require('express');
const router = express.Router();
const { getCart, updateCart } = require('../controllers/cartController');
const authenticateJWT = require('../middleware/jwtAuth');

router.get('/', authenticateJWT, getCart);
router.post('/', authenticateJWT, updateCart);

module.exports = router;
