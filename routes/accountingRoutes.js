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
const { companyMiddleware } = require('../middleware/authMiddleware');

router.post('/', companyMiddleware, createAccountingRecord);
router.get('/all', companyMiddleware, getAllAccountingRecords);
router.post('/daily', companyMiddleware, getDailyAccounting);
router.post('/weekly', companyMiddleware, getWeeklyAccounting);
router.post('/monthly', companyMiddleware, getMonthlyAccounting);
router.post('/employee', companyMiddleware, getEmployeeAccounting);

module.exports = router;

