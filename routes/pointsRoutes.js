const express = require('express');
const router = express.Router();
const { getPoints, getPointsTransactions } = require('../controllers/pointsController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Puan bilgileri
router.get('/', authMiddleware, getPoints);

// Puan işlem geçmişi
router.get('/transactions', authMiddleware, getPointsTransactions);

module.exports = router;

