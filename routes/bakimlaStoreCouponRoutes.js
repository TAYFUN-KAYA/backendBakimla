const express = require('express');
const router = express.Router();
const {
  getActiveCoupons,
  getAllCoupons,
  getCouponByCode,
  createCoupon,
} = require('../controllers/bakimlaStoreCouponController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public routes - aktif kuponları getir
router.get('/active', getActiveCoupons);
router.get('/code/:code', getCouponByCode);

// Admin routes - tüm kuponları getir ve oluştur
router.get('/all', authMiddleware, getAllCoupons);
router.post('/', authMiddleware, createCoupon);

module.exports = router;
