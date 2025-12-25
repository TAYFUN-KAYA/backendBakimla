const express = require('express');
const router = express.Router();
const {
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
} = require('../controllers/paymentMethodController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Ödeme yöntemlerini listele
router.get('/', authMiddleware, getPaymentMethods);

// Ödeme yöntemi ekle
router.post('/', authMiddleware, addPaymentMethod);

// Ödeme yöntemini sil
router.delete('/:id', authMiddleware, deletePaymentMethod);

module.exports = router;

