const express = require('express');
const router = express.Router();
const {
  getActiveClientHomeAds,
  getAllClientHomeAds,
  createClientHomeAd,
  updateClientHomeAd,
  deleteClientHomeAd,
} = require('../controllers/clientHomeAdController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public endpoint - aktif reklamları getir
router.get('/active', getActiveClientHomeAds);

// Admin endpoints - authMiddleware ile korumalı
router.get('/', authMiddleware, getAllClientHomeAds);
router.post('/', authMiddleware, createClientHomeAd);
router.put('/:id', authMiddleware, updateClientHomeAd);
router.delete('/:id', authMiddleware, deleteClientHomeAd);

module.exports = router;

