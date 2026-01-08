const express = require('express');
const router = express.Router();
const {
  initializePayment,
  paymentCallback,
  getPaymentStatus,
  getPayments,
  cancelPayment,
  sendPaymentLinkViaSMS,
  createPayment,
  createPaymentLink,
  iyzicoWebhook,
} = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Ödeme başlatma
router.post('/initialize', authMiddleware, initializePayment);

// Nakit veya IBAN ödemesi için direkt payment kaydı oluştur
router.post('/create', authMiddleware, createPayment);

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

// Ödeme linkini SMS ile gönder
router.post('/send-link-sms', authMiddleware, sendPaymentLinkViaSMS);

// Iyzico payment link oluştur (SMS ile gönderilecek)
router.post('/create-link', authMiddleware, createPaymentLink);

// Iyzico webhook (authenticate gerekmez, Iyzico'dan gelir)
router.post('/iyzico/webhook', iyzicoWebhook);

module.exports = router;

