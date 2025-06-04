const express = require('express');
const router = express.Router();
const authenticateJWT= require('../middleware/jwtAuth');
const {
  getAddresses,
  saveAddress,
  deleteAddress
} = require('../controllers/addressController');

router.get('/', authenticateJWT, getAddresses);
router.post('/', authenticateJWT, saveAddress);
router.delete('/:id', authenticateJWT, deleteAddress);

module.exports = router;
