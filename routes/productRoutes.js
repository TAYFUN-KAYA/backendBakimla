const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  filterProducts,
  getCompanyProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getCategories,
} = require('../controllers/productController');
const { companyMiddleware } = require('../middleware/authMiddleware');

router.post('/', companyMiddleware, createProduct);
router.get('/categories', getCategories); // ✅ Kategoriler endpoint'i (/:id'den önce olmalı)
router.get('/', getAllProducts);
router.post('/filter', filterProducts);
router.post('/company', companyMiddleware, getCompanyProducts);
router.get('/:id', getProductById);
router.put('/:id', companyMiddleware, updateProduct);
router.delete('/:id', companyMiddleware, deleteProduct);

module.exports = router;

