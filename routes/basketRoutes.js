const express = require('express');
const router = express.Router();
const {
  getBasket,
  addToBasket,
  updateBasketItem,
  removeFromBasket,
  clearBasket,
} = require('../controllers/basketController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Sepeti getir
router.get('/', authMiddleware, getBasket);

// Sepete ürün ekle
router.post('/add', authMiddleware, addToBasket);

// Sepet ürününü güncelle
router.put('/item/:itemId', authMiddleware, updateBasketItem);

// Sepetten ürün çıkar
router.delete('/item/:itemId', authMiddleware, removeFromBasket);

// Sepeti temizle
router.delete('/clear', authMiddleware, clearBasket);

module.exports = router;
