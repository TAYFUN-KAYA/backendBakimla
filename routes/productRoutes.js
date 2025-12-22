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
} = require('../controllers/productController');
const { companyMiddleware } = require('../middleware/authMiddleware');

router.post('/', companyMiddleware, createProduct);
router.get('/', getAllProducts);
router.post('/filter', filterProducts);
router.post('/company', companyMiddleware, getCompanyProducts);
router.get('/:id', getProductById);
router.put('/:id', companyMiddleware, updateProduct);
router.delete('/:id', companyMiddleware, deleteProduct);

module.exports = router;

