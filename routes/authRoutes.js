const express = require('express');
const router = express.Router();
const { sendOTPCode, verifyOTP, register, login, checkUserByPhone } = require('../controllers/authController');

// OTP ile kayıt/giriş
router.post('/send-otp', sendOTPCode);
router.post('/verify-otp', verifyOTP);

// Kullanıcı kontrolü (telefon numarasına göre)
router.get('/check-user/:phoneNumber', checkUserByPhone);

// Backward compatibility - Eski şifreli kayıt/giriş
router.post('/register', register);
router.post('/login', login);

module.exports = router;

