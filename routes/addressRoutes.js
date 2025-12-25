const express = require('express');
const router = express.Router();
const {
  createAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
} = require('../controllers/addressController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Adres oluştur
router.post('/', authMiddleware, createAddress);

// Adresleri listele
router.get('/', authMiddleware, getAddresses);

// Adres güncelle
router.put('/:id', authMiddleware, updateAddress);

// Adres sil
router.delete('/:id', authMiddleware, deleteAddress);

module.exports = router;

