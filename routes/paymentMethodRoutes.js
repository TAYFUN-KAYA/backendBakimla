const express = require('express');
const router = express.Router();
const {
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  tokenizeCard,
} = require('../controllers/paymentMethodController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Ödeme yöntemlerini listele
router.get('/', authMiddleware, getPaymentMethods);

// Kart bilgilerini iyzico'ya gönderip token al (kart kaydetme için)
router.post('/tokenize', authMiddleware, tokenizeCard);

// Ödeme yöntemi ekle (tokenize edilmiş kartı kaydet)
router.post('/', authMiddleware, addPaymentMethod);

// Ödeme yöntemini sil
router.delete('/:id', authMiddleware, deletePaymentMethod);

module.exports = router;

