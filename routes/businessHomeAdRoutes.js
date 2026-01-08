const express = require('express');
const router = express.Router();
const {
  getActiveBusinessHomeAds,
  getAllBusinessHomeAds,
  createBusinessHomeAd,
  updateBusinessHomeAd,
  deleteBusinessHomeAd,
} = require('../controllers/businessHomeAdController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public endpoint - aktif reklamları getir
router.get('/active', getActiveBusinessHomeAds);

// Admin endpoints - authMiddleware ile korumalı
router.get('/', authMiddleware, getAllBusinessHomeAds);
router.post('/', authMiddleware, createBusinessHomeAd);
router.put('/:id', authMiddleware, updateBusinessHomeAd);
router.delete('/:id', authMiddleware, deleteBusinessHomeAd);

module.exports = router;

