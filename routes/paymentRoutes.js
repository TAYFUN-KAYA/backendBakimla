const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getSavedCards,
  saveCard,
  deleteCard,
  processPayment,
  getInstallmentInfo
} = require('../controllers/paymentController');

// Get installment info (doesn't require auth for flexibility)
router.post('/installments', getInstallmentInfo);

// All other routes require authentication
router.use(authMiddleware);

// Get user's saved cards
router.get('/cards', getSavedCards);

// Save a new card
router.post('/cards', saveCard);

// Delete a saved card
router.delete('/cards/:cardToken', deleteCard);

// Process payment
router.post('/process', processPayment);

module.exports = router;
