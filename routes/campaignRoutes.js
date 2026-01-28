const express = require('express');
const router = express.Router();
const {
  createCampaign,
  getCompanyCampaigns,
  getActiveCampaigns,
  updateCampaign,
  deleteCampaign,
  getCosmeticStorePromos,
  getStoreCampaigns,
} = require('../controllers/campaignController');
const {
  getUserCampaigns,
} = require('../controllers/userCampaignController');
const { companyMiddleware, authMiddleware } = require('../middleware/authMiddleware');

// ✅ authMiddleware kullan (token-based authentication)
// ÖNEMLİ: Spesifik route'lar parametreli route'lardan ÖNCE olmalı
router.post('/', authMiddleware, createCampaign);
router.get('/active', getActiveCampaigns);
// ✅ Kozmetik store için özel endpoint (/:id'den önce olmalı - route sırası önemli!)
// Bu route public olmalı (userType: 'user' için erişilebilir)
router.get('/cosmetic-store-promos', getCosmeticStorePromos);
router.post('/company', authMiddleware, getCompanyCampaigns);
router.get('/user/my-campaigns', authMiddleware, getUserCampaigns);
router.get('/store/:storeId', getStoreCampaigns); // İşletme kampanyaları (public)
router.put('/:id', authMiddleware, updateCampaign);
router.delete('/:id', authMiddleware, deleteCampaign);

module.exports = router;

