const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getCompanyAppointments,
  getEmployeeAppointments,
  getAppointmentSummary,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointmentController');
const { companyMiddleware, employeeMiddleware, authMiddleware } = require('../middleware/authMiddleware');

router.post('/', companyMiddleware, createAppointment);
router.get('/:id/summary', authMiddleware, getAppointmentSummary);
router.post('/company', companyMiddleware, getCompanyAppointments);
router.post('/employee', employeeMiddleware, getEmployeeAppointments);
router.put('/:id', companyMiddleware, updateAppointment);
router.delete('/:id', companyMiddleware, deleteAppointment);

module.exports = router;

