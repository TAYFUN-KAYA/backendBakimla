const express = require('express');
const router = express.Router();
const {
  createCampaign,
  getCompanyCampaigns,
  getActiveCampaigns,
  updateCampaign,
  deleteCampaign,
  getCosmeticStorePromos,
} = require('../controllers/campaignController');
const { companyMiddleware, authMiddleware } = require('../middleware/authMiddleware');

// ✅ authMiddleware kullan (token-based authentication)
// ÖNEMLİ: Spesifik route'lar parametreli route'lardan ÖNCE olmalı
router.post('/', authMiddleware, createCampaign);
router.get('/active', getActiveCampaigns);
// ✅ Kozmetik store için özel endpoint (/:id'den önce olmalı - route sırası önemli!)
// Bu route public olmalı (userType: 'user' için erişilebilir)
router.get('/cosmetic-store-promos', getCosmeticStorePromos);
router.post('/company', authMiddleware, getCompanyCampaigns);
router.put('/:id', authMiddleware, updateCampaign);
router.delete('/:id', authMiddleware, deleteCampaign);

module.exports = router;

