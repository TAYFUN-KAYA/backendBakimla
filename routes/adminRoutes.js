const express = require('express');
const router = express.Router();
const multer = require('multer');
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
  updateStoreSettings,
  updateUser,
  getAllQuickAppointments,
  getAllIsletKazan,
  payIsletKazanPending,
  getAllStoreServices,
  updateStoreService,
  addStoreService,
  deleteStoreService,
} = require('../controllers/adminController');
const { adminMiddleware } = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');
const { createCrudFunctions } = require('../controllers/adminGenericController');
const uploadController = require('../controllers/uploadController');

const uploadStorage = multer.memoryStorage();
const uploadMulter = multer({ storage: uploadStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// Dashboard
router.get('/dashboard', adminMiddleware, getDashboardStats);

// Admin resim yükleme (S3) – ürün vb.
router.post('/upload/image', adminMiddleware, uploadMulter.single('image'), uploadController.uploadImage);

// Users
router.get('/users', adminMiddleware, getAllUsers);

// Stores - Custom routes first (specific routes before generic)
router.get('/stores', adminMiddleware, getAllStores);
router.get('/stores/:storeId', adminMiddleware, getStoreDetails);
router.put('/stores/:storeId/settings', adminMiddleware, updateStoreSettings);
// PUT /stores/:id/update - ayrı path ile :storeId ile çakışmayı önle
router.put('/stores/:id/update', adminMiddleware, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Model = require('../models/Store');
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz ID',
      });
    }

    const data = await Model.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Store bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Store başarıyla güncellendi',
      data: data.toObject(),
    });
  } catch (error) {
    console.error('Update Store Error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});
router.post('/stores', adminMiddleware, createCrudFunctions('Store').create);
router.delete('/stores/:id', adminMiddleware, createCrudFunctions('Store').remove);

// Store Services (işletmelerdeki hizmetler)
router.get('/store-services', adminMiddleware, getAllStoreServices);
router.post('/stores/:storeId/services', adminMiddleware, addStoreService);
router.put('/stores/:storeId/services/:serviceIndex', adminMiddleware, updateStoreService);
router.delete('/stores/:storeId/services/:serviceIndex', adminMiddleware, deleteStoreService);

// Appointments
router.get('/appointments', adminMiddleware, getAllAppointments);

// Payments
router.get('/payments', adminMiddleware, getAllPayments);
router.post('/payments/:id/refund', adminMiddleware, paymentController.refundPayment);
router.post('/payments/:id/cancel', adminMiddleware, paymentController.cancelPayment);

// Orders
router.get('/orders', adminMiddleware, getAllOrders);

// Wallets
router.get('/wallets', adminMiddleware, getAllWallets);

// İşlet Kazan (50 randevu = 20 TL takip, prim ödeme)
router.get('/islet-kazan', adminMiddleware, getAllIsletKazan);
router.post('/islet-kazan/:id/pay-pending', adminMiddleware, payIsletKazanPending);

// Withdrawal Requests
router.get('/withdrawal-requests', adminMiddleware, getAllWithdrawalRequests);
router.get('/withdrawal-requests/:id', adminMiddleware, createCrudFunctions('WithdrawalRequest').getById);
router.post('/withdrawal-requests', adminMiddleware, createCrudFunctions('WithdrawalRequest').create);
router.put('/withdrawal-requests/:id', adminMiddleware, createCrudFunctions('WithdrawalRequest').update);
router.put('/withdrawal-requests/:id/process', adminMiddleware, processWithdrawalRequest);
router.delete('/withdrawal-requests/:id', adminMiddleware, createCrudFunctions('WithdrawalRequest').remove);

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

// Generic CRUD Routes for all models
const modelRoutes = [
  'campaigns',
  'coupons',
  'addresses',
  'baskets',
  'favorites',
  'invoices',
  'notifications',
  'points',
  'points-transactions',
  'rewards',
  'reward-transactions',
  'services',
  'accounting',
  'customers',
  'forms',
  'payment-methods',
  'user-campaigns',
  'user-coupons',
  'user-favorite-stores',
  'bakimla-store-coupons',
  'business-home-ads',
  'client-home-ads',
  'client-center-ads',
  'wallet-transactions',
  'otps',
];

// Model name mapping (route name -> Model name)
const modelNameMap = {
  'campaigns': 'Campaign',
  'coupons': 'Coupon',
  'addresses': 'Address',
  'baskets': 'Basket',
  'favorites': 'Favorite',
  'invoices': 'Invoice',
  'notifications': 'Notification',
  'points': 'Points',
  'points-transactions': 'PointsTransaction',
  'rewards': 'Reward',
  'reward-transactions': 'RewardTransaction',
  'services': 'Service',
  'accounting': 'Accounting',
  'customers': 'Customer',
  'forms': 'Form',
  'payment-methods': 'PaymentMethod',
  'user-campaigns': 'UserCampaign',
  'user-coupons': 'UserCoupon',
  'user-favorite-stores': 'UserFavoriteStore',
  'bakimla-store-coupons': 'BakimlaStoreCoupon',
  'business-home-ads': 'BusinessHomeAd',
  'client-home-ads': 'ClientHomeAd',
  'client-center-ads': 'ClientCenterAd',
  'wallet-transactions': 'WalletTransaction',
  'otps': 'OTP',
};

// Create routes for each model
modelRoutes.forEach(routeName => {
  const modelName = modelNameMap[routeName];
  const crud = createCrudFunctions(modelName);
  
  router.get(`/${routeName}`, adminMiddleware, crud.getAll);
  router.get(`/${routeName}/:id`, adminMiddleware, crud.getById);
  router.post(`/${routeName}`, adminMiddleware, crud.create);
  router.put(`/${routeName}/:id`, adminMiddleware, crud.update);
  router.delete(`/${routeName}/:id`, adminMiddleware, crud.remove);
});

// Special routes for existing models (override generic if needed)
// Users - already has custom routes (updateUser: şifre hash için)
router.get('/users', adminMiddleware, getAllUsers);
router.get('/users/:id', adminMiddleware, createCrudFunctions('User').getById);
router.post('/users', adminMiddleware, createCrudFunctions('User').create);
router.put('/users/:id', adminMiddleware, updateUser);
router.delete('/users/:id', adminMiddleware, createCrudFunctions('User').remove);

// Stores routes are defined above (lines 34-40)

// Appointments - already has custom routes
router.get('/appointments', adminMiddleware, getAllAppointments);
router.get('/appointments/:id', adminMiddleware, createCrudFunctions('Appointment').getById);
router.post('/appointments', adminMiddleware, createCrudFunctions('Appointment').create);
router.put('/appointments/:id', adminMiddleware, createCrudFunctions('Appointment').update);
router.delete('/appointments/:id', adminMiddleware, createCrudFunctions('Appointment').remove);

// Payments - already has custom routes
router.get('/payments', adminMiddleware, getAllPayments);
router.get('/payments/:id', adminMiddleware, createCrudFunctions('Payment').getById);
router.post('/payments', adminMiddleware, createCrudFunctions('Payment').create);
router.put('/payments/:id', adminMiddleware, createCrudFunctions('Payment').update);
router.delete('/payments/:id', adminMiddleware, createCrudFunctions('Payment').remove);

// Orders - already has custom routes
router.get('/orders', adminMiddleware, getAllOrders);
router.get('/orders/:id', adminMiddleware, createCrudFunctions('Order').getById);
router.post('/orders', adminMiddleware, createCrudFunctions('Order').create);
router.put('/orders/:id', adminMiddleware, createCrudFunctions('Order').update);
router.delete('/orders/:id', adminMiddleware, createCrudFunctions('Order').remove);

// Products - already has custom routes
router.get('/products', adminMiddleware, getAllProducts);
router.get('/products/:id', adminMiddleware, createCrudFunctions('Product').getById);
router.post('/products', adminMiddleware, createCrudFunctions('Product').create);
router.put('/products/:id', adminMiddleware, createCrudFunctions('Product').update);
router.delete('/products/:id', adminMiddleware, createCrudFunctions('Product').remove);

// Reviews - already has custom routes
router.get('/reviews', adminMiddleware, getAllReviews);
router.get('/reviews/:id', adminMiddleware, createCrudFunctions('Review').getById);
router.post('/reviews', adminMiddleware, createCrudFunctions('Review').create);
router.put('/reviews/:id', adminMiddleware, createCrudFunctions('Review').update);
router.put('/reviews/:id/toggle-publish', adminMiddleware, toggleReviewPublish);
router.delete('/reviews/:id', adminMiddleware, createCrudFunctions('Review').remove);

// Wallets - already has custom routes
router.get('/wallets', adminMiddleware, getAllWallets);
router.get('/wallets/:id', adminMiddleware, createCrudFunctions('Wallet').getById);
router.post('/wallets', adminMiddleware, createCrudFunctions('Wallet').create);
router.put('/wallets/:id', adminMiddleware, createCrudFunctions('Wallet').update);
router.delete('/wallets/:id', adminMiddleware, createCrudFunctions('Wallet').remove);

// Quick appointments - custom GET (arama, sayfalama), diğerleri generic
router.get('/quick-appointments', adminMiddleware, getAllQuickAppointments);
router.get('/quick-appointments/:id', adminMiddleware, createCrudFunctions('QuickAppointment').getById);
router.post('/quick-appointments', adminMiddleware, createCrudFunctions('QuickAppointment').create);
router.put('/quick-appointments/:id', adminMiddleware, createCrudFunctions('QuickAppointment').update);
router.delete('/quick-appointments/:id', adminMiddleware, createCrudFunctions('QuickAppointment').remove);

module.exports = router;

