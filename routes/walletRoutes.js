const express = require('express');
const router = express.Router();
const {
  getWallet,
  getWalletTransactions,
  createWithdrawalRequest,
  getWithdrawalRequests,
} = require('../controllers/walletController');
const { companyMiddleware, authMiddleware } = require('../middleware/authMiddleware');

// Cüzdan bilgileri
router.get('/', companyMiddleware, getWallet);

// Cüzdan işlem geçmişi
router.get('/transactions', companyMiddleware, getWalletTransactions);

// Para çekme talebi oluştur
router.post('/withdrawal', companyMiddleware, createWithdrawalRequest);

// Para çekme taleplerini listele
router.get('/withdrawal-requests', companyMiddleware, getWithdrawalRequests);

module.exports = router;

