const express = require('express');
const router = express.Router();
const {
  createCoupon,
  getCompanyCoupons,
  validateCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');
const { companyMiddleware, authMiddleware } = require('../middleware/authMiddleware');

// ✅ authMiddleware kullan (token-based authentication)
router.post('/', authMiddleware, createCoupon);
router.post('/company', authMiddleware, getCompanyCoupons);
router.post('/validate', authMiddleware, validateCoupon);
router.put('/:id', authMiddleware, updateCoupon);
router.delete('/:id', authMiddleware, deleteCoupon);

module.exports = router;

