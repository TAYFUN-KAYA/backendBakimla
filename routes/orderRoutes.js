const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  initializeOrderPayment,
} = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Sipariş oluştur
router.post('/', authMiddleware, createOrder);

// Sipariş için ödeme başlat
router.post('/:orderId/payment', authMiddleware, initializeOrderPayment);

// Siparişleri listele
router.get('/', authMiddleware, getOrders);

// Sipariş detayını getir
router.get('/:id', authMiddleware, getOrder);

// Sipariş iptal et
router.put('/:id/cancel', authMiddleware, cancelOrder);

module.exports = router;

