const express = require('express');
const router = express.Router();
const {
  getUserFavoriteStores,
  getAllStores,
  addFavoriteStore,
  removeFavoriteStore,
  updateFavoriteStoresOrder,
} = require('../controllers/userFavoriteStoreController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Kullanıcının favori işletmelerini getir
router.get('/favorites', authMiddleware, getUserFavoriteStores);

// Tüm işletmeleri getir (favori seçimi için)
router.get('/all', authMiddleware, getAllStores);

// Favori işletme ekle
router.post('/favorites', authMiddleware, addFavoriteStore);

// Favori işletmeyi kaldır
router.delete('/favorites/:storeId', authMiddleware, removeFavoriteStore);

// Favori işletmelerin sırasını güncelle (toplu)
router.put('/favorites/order', authMiddleware, updateFavoriteStoresOrder);

module.exports = router;
