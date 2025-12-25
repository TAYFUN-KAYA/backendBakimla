const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Sepeti getir
router.get('/', authMiddleware, getCart);

// Sepete ürün ekle
router.post('/add', authMiddleware, addToCart);

// Sepet ürününü güncelle
router.put('/item/:itemId', authMiddleware, updateCartItem);

// Sepetten ürün çıkar
router.delete('/item/:itemId', authMiddleware, removeFromCart);

// Sepeti temizle
router.delete('/clear', authMiddleware, clearCart);

module.exports = router;

