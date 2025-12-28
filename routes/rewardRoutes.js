const express = require('express');
const router = express.Router();
const { getRewardStats, requestWithdrawal } = require('../controllers/rewardController');
const { companyMiddleware } = require('../middleware/authMiddleware');

router.get('/stats', companyMiddleware, getRewardStats);
router.post('/withdraw', companyMiddleware, requestWithdrawal);

module.exports = router;
