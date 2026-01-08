const express = require('express');
const router = express.Router();
const {
  createAccountingRecord,
  getDailyAccounting,
  getWeeklyAccounting,
  getMonthlyAccounting,
  getAllAccountingRecords,
  getEmployeeAccounting,
} = require('../controllers/accountingController');
const { companyMiddleware, authMiddleware } = require('../middleware/authMiddleware');

// ✅ authMiddleware kullan (token-based authentication)
router.post('/', authMiddleware, createAccountingRecord);
router.post('/all', authMiddleware, getAllAccountingRecords); // ✅ GET → POST (body için)
router.post('/daily', authMiddleware, getDailyAccounting);
router.post('/weekly', authMiddleware, getWeeklyAccounting);
router.post('/monthly', authMiddleware, getMonthlyAccounting);
router.post('/employee', authMiddleware, getEmployeeAccounting);

module.exports = router;

