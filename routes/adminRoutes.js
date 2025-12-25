const express = require('express');
const router = express.Router();
const {
  getPendingEmployees,
  approveEmployee,
  rejectEmployee,
  getAllEmployees,
  getDashboardStats,
  getAllUsers,
  getAllStores,
  getStoreDetails,
  getAllAppointments,
  getAllPayments,
  getAllOrders,
  getAllWallets,
  getAllWithdrawalRequests,
  processWithdrawalRequest,
  getAllProducts,
  getAllReviews,
  toggleReviewPublish,
} = require('../controllers/adminController');
const { adminMiddleware } = require('../middleware/authMiddleware');

// Dashboard
router.get('/dashboard', adminMiddleware, getDashboardStats);

// Users
router.get('/users', adminMiddleware, getAllUsers);

// Stores
router.get('/stores', adminMiddleware, getAllStores);
router.get('/stores/:storeId', adminMiddleware, getStoreDetails);

// Appointments
router.get('/appointments', adminMiddleware, getAllAppointments);

// Payments
router.get('/payments', adminMiddleware, getAllPayments);

// Orders
router.get('/orders', adminMiddleware, getAllOrders);

// Wallets
router.get('/wallets', adminMiddleware, getAllWallets);

// Withdrawal Requests
router.get('/withdrawal-requests', adminMiddleware, getAllWithdrawalRequests);
router.put('/withdrawal-requests/:id/process', adminMiddleware, processWithdrawalRequest);

// Products
router.get('/products', adminMiddleware, getAllProducts);

// Reviews
router.get('/reviews', adminMiddleware, getAllReviews);
router.put('/reviews/:id/toggle-publish', adminMiddleware, toggleReviewPublish);

// Employees
router.get('/employees/pending', adminMiddleware, getPendingEmployees);
router.get('/employees', adminMiddleware, getAllEmployees);
router.put('/employees/:id/approve', adminMiddleware, approveEmployee);
router.put('/employees/:id/reject', adminMiddleware, rejectEmployee);

module.exports = router;

