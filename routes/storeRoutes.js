const express = require('express');
const router = express.Router();
const {
  createStore,
  getCompanyStores,
  getStoreDetails,
  getStoreByCompanyId,
  setActiveStore,
  updateStore,
  updateStoreByCompanyId,
  getAllStores,
  getMyStoreInfo,
  getStoreCustomers,
  createCustomer,
  debugUserStoreRelations,
  getStoresByCategory,
  getPopularStoresByCategory,
  getQuickAppointments,
  createOrUpdateQuickAppointment,
  deleteQuickAppointment,
} = require('../controllers/storeController');
const { companyMiddleware, authMiddleware } = require('../middleware/authMiddleware');

router.post('/', companyMiddleware, createStore);
router.get('/', getAllStores);
router.get('/debug/relations', debugUserStoreRelations); // Debug endpoint

// ✅ Category-based routes (specific routes before :id)
router.get('/category/popular', getPopularStoresByCategory);
router.get('/category', getStoresByCategory);

// ✅ Specific routes BEFORE dynamic :id route
router.get('/customers', authMiddleware, getStoreCustomers); // authMiddleware kullan (token-based)
router.post('/customers', authMiddleware, createCustomer); // authMiddleware kullan (token-based)
router.get('/quick-appointments', authMiddleware, getQuickAppointments);
router.post('/quick-appointments', authMiddleware, createOrUpdateQuickAppointment);
router.delete('/quick-appointments/:id', authMiddleware, deleteQuickAppointment);
router.post('/company/list', companyMiddleware, getCompanyStores);
router.post('/company/active', companyMiddleware, setActiveStore);
router.get('/my-info', companyMiddleware, getMyStoreInfo);
router.get('/company/:companyId/:storeId', getStoreByCompanyId);
router.get('/company/:companyId', getStoreByCompanyId);
router.put('/company', companyMiddleware, updateStoreByCompanyId);
router.put('/:id', companyMiddleware, updateStore);

// ⚠️ Dynamic :id route MUST be LAST to avoid conflicts
router.get('/:id', getStoreDetails);

module.exports = router;

