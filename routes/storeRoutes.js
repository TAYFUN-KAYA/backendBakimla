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
} = require('../controllers/storeController');
const { companyMiddleware, authMiddleware } = require('../middleware/authMiddleware');

router.post('/', companyMiddleware, createStore);
router.get('/', getAllStores);
router.get('/:id', getStoreDetails);
router.post('/company/list', companyMiddleware, getCompanyStores);
router.post('/company/active', companyMiddleware, setActiveStore);
router.get('/my-info', companyMiddleware, getMyStoreInfo);
router.get('/customers', companyMiddleware, getStoreCustomers);
router.get('/company/:companyId/:storeId?', getStoreByCompanyId);
router.put('/company', companyMiddleware, updateStoreByCompanyId);
router.put('/:id', companyMiddleware, updateStore);

module.exports = router;

