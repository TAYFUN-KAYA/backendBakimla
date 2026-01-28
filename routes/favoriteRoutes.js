const express = require('express');
const router = express.Router();
const {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  checkFavorite,
} = require('../controllers/favoriteController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Favorileri getir
router.get('/', authMiddleware, getFavorites);

// Favorilere ekle
router.post('/add', authMiddleware, addToFavorites);

// Favori toggle (ekle/çıkar)
router.post('/toggle', authMiddleware, toggleFavorite);

// Ürün favorilerde mi kontrol et
router.get('/check/:productId', authMiddleware, checkFavorite);

// Favorilerden çıkar
router.delete('/:productId', authMiddleware, removeFromFavorites);

module.exports = router;
