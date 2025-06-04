const express = require('express');
const { sendOtp, verifyOtp } = require('../controllers/phoneController');
const authenticateJWT = require('../middleware/jwtAuth');
const router = express.Router();

router.post('/send-otp', authenticateJWT, sendOtp);
router.post('/verify-otp', authenticateJWT, verifyOtp);

module.exports = router;
