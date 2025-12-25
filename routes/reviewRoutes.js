const express = require('express');
const router = express.Router();
const { createReview, getReviews } = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Yorum oluştur
router.post('/', authMiddleware, createReview);

// Yorumları listele
router.get('/', getReviews);

module.exports = router;

