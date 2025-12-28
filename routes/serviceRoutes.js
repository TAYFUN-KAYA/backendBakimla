const express = require('express');
const router = express.Router();
const {
    createService,
    getCompanyServices,
    updateService,
    deleteService,
} = require('../controllers/serviceController');
const { companyMiddleware } = require('../middleware/authMiddleware');

router.post('/', companyMiddleware, createService);
router.get('/', companyMiddleware, getCompanyServices);
router.put('/:id', companyMiddleware, updateService);
router.delete('/:id', companyMiddleware, deleteService);

module.exports = router;
