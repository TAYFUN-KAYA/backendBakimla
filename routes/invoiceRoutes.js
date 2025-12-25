const express = require('express');
const router = express.Router();
const { getInvoices, getInvoice } = require('../controllers/invoiceController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Faturaları listele
router.get('/', authMiddleware, getInvoices);

// Fatura detayını getir
router.get('/:id', authMiddleware, getInvoice);

module.exports = router;

