const express = require('express');
const router = express.Router();
const {
  createAppointment,
  createAppointmentFromClient,
  getCompanyAppointments,
  getEmployeeAppointments,
  getClientAppointments,
  getAppointmentSummary,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointmentController');
const { companyMiddleware, employeeMiddleware, authMiddleware } = require('../middleware/authMiddleware');

// Business app için randevu oluşturma
router.post('/', companyMiddleware, createAppointment);

// Client app için randevu oluşturma
router.post('/client', authMiddleware, createAppointmentFromClient);

// Client app randevularını getir
router.get('/client/list', authMiddleware, getClientAppointments);

router.get('/:id/summary', authMiddleware, getAppointmentSummary);
router.post('/company', companyMiddleware, getCompanyAppointments);
router.post('/employee', employeeMiddleware, getEmployeeAppointments);
router.put('/:id', companyMiddleware, updateAppointment);
router.delete('/:id', companyMiddleware, deleteAppointment);

module.exports = router;

