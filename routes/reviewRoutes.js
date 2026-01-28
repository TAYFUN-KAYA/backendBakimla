const express = require('express');
const router = express.Router();
const { createReview, getReviews, getStoreReviews } = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Yorum oluştur
router.post('/', authMiddleware, createReview);

// Yorumları listele
router.get('/', getReviews);

// İşletme yorumları (public)
router.get('/store/:storeId', getStoreReviews);

module.exports = router;

