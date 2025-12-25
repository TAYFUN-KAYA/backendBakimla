const express = require('express');
const router = express.Router();
const { sendOTPCode, verifyOTP, register, login } = require('../controllers/authController');

// OTP ile kayıt/giriş
router.post('/send-otp', sendOTPCode);
router.post('/verify-otp', verifyOTP);

// Backward compatibility - Eski şifreli kayıt/giriş
router.post('/register', register);
router.post('/login', login);

module.exports = router;

