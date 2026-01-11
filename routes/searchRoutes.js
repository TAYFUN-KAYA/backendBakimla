const express = require('express');
const router = express.Router();
const { searchStores } = require('../controllers/searchController');

// Public route - İşletme arama
router.get('/stores', searchStores);

module.exports = router;

