const express = require('express');
const router = express.Router();
const {
  getPendingEmployees,
  approveEmployee,
  rejectEmployee,
  getAllEmployees,
} = require('../controllers/adminController');
const { adminMiddleware } = require('../middleware/authMiddleware');

router.get('/employees/pending', adminMiddleware, getPendingEmployees);
router.get('/employees', adminMiddleware, getAllEmployees);
router.put('/employees/:id/approve', adminMiddleware, approveEmployee);
router.put('/employees/:id/reject', adminMiddleware, rejectEmployee);

module.exports = router;

