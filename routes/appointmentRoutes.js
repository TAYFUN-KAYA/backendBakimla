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
  cancelAppointment,
  getBusyDates,
  getStoreAppointmentsByDateRange,
} = require('../controllers/appointmentController');
const { companyMiddleware, employeeMiddleware, authMiddleware } = require('../middleware/authMiddleware');

// Business app için randevu oluşturma
router.post('/', companyMiddleware, createAppointment);

// Client app için randevu oluşturma
router.post('/client', authMiddleware, createAppointmentFromClient);

// Client app randevularını getir
router.get('/client/list', authMiddleware, getClientAppointments);

// Spesifik route'lar parametrik route'lardan ÖNCE olmalı
router.get('/busy-dates', authMiddleware, getBusyDates); // companyMiddleware → authMiddleware
router.get('/company', authMiddleware, getCompanyAppointments); // GET isteği, query parametreleri ile
router.get('/store/:storeId/date-range', getStoreAppointmentsByDateRange); // Public endpoint for available hours
router.get('/:id/summary', authMiddleware, getAppointmentSummary);
router.post('/employee', authMiddleware, getEmployeeAppointments); // authMiddleware: hem company hem employee erişebilir
router.put('/:id', companyMiddleware, updateAppointment);
router.post('/:id/cancel', companyMiddleware, cancelAppointment);
router.delete('/:id', companyMiddleware, deleteAppointment);

module.exports = router;

