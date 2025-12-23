const express = require('express');
const router = express.Router();
const {
  initializePayment,
  paymentCallback,
  getPaymentStatus,
  getPayments,
  cancelPayment,
} = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Ödeme başlatma
router.post('/initialize', authMiddleware, initializePayment);

// iyzico callback (authenticate gerekmez, iyzico'dan gelir)
// Hem GET hem POST destekle (iyzico farklı şekillerde gönderebilir)
router.post('/callback', paymentCallback);
router.get('/callback', paymentCallback);

// Şirkete ait ödemeleri listele (daha spesifik route önce gelmeli)
router.get('/company/:companyId', authMiddleware, getPayments);

// Ödeme durumu sorgulama
router.get('/:paymentId', authMiddleware, getPaymentStatus);

// Ödeme iptal
router.post('/:paymentId/cancel', authMiddleware, cancelPayment);

module.exports = router;

