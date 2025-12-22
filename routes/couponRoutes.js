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

router.post('/', companyMiddleware, createCoupon);
router.post('/company', companyMiddleware, getCompanyCoupons);
router.post('/validate', authMiddleware, validateCoupon);
router.put('/:id', companyMiddleware, updateCoupon);
router.delete('/:id', companyMiddleware, deleteCoupon);

module.exports = router;

