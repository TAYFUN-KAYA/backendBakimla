const express = require('express');
const router = express.Router();
const { getRewardStats, requestWithdrawal } = require('../controllers/rewardController');
const { companyMiddleware, authMiddleware } = require('../middleware/authMiddleware');

// ✅ authMiddleware kullan (token-based authentication)
router.get('/stats', authMiddleware, getRewardStats);
router.post('/withdraw', authMiddleware, requestWithdrawal);

module.exports = router;
