const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  processOrderPayment,
} = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Sipariş oluştur
router.post('/', authMiddleware, createOrder);

// Sipariş için ödeme işle
router.post('/:orderId/payment', authMiddleware, processOrderPayment);

// Siparişleri listele
router.get('/', authMiddleware, getOrders);

// Sipariş detayını getir
router.get('/:id', authMiddleware, getOrder);

// Sipariş iptal et
router.put('/:id/cancel', authMiddleware, cancelOrder);

module.exports = router;

