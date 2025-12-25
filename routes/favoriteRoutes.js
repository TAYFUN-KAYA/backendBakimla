const express = require('express');
const router = express.Router();
const { addFavorite, removeFavorite, getFavorites } = require('../controllers/favoriteController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Favori ekle
router.post('/', authMiddleware, addFavorite);

// Favorileri listele
router.get('/', authMiddleware, getFavorites);

// Favoriden çıkar
router.delete('/:id', authMiddleware, removeFavorite);

module.exports = router;

