const express = require('express');
const router = express.Router();
const {
  getActiveClientCenterAds,
  getAllClientCenterAds,
  createClientCenterAd,
  updateClientCenterAd,
  deleteClientCenterAd,
} = require('../controllers/clientCenterAdController');
// const { adminMiddleware } = require('../middleware/authMiddleware'); // Admin middleware gerekirse eklenebilir

// Public route - Aktif reklamları getir
router.get('/active', getActiveClientCenterAds);

// Admin routes (şimdilik middleware olmadan, gerekirse eklenebilir)
router.get('/', getAllClientCenterAds);
router.post('/', createClientCenterAd);
router.put('/:id', updateClientCenterAd);
router.delete('/:id', deleteClientCenterAd);

module.exports = router;

