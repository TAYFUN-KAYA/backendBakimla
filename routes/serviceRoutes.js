const express = require('express');
const router = express.Router();
const {
    createService,
    getCompanyServices,
    updateService,
    deleteService,
} = require('../controllers/serviceController');
const { companyMiddleware, authMiddleware } = require('../middleware/authMiddleware');

router.post('/', companyMiddleware, createService);
router.get('/', authMiddleware, getCompanyServices); // authMiddleware: hem company hem employee erişebilir
router.put('/:id', companyMiddleware, updateService);
router.delete('/:id', companyMiddleware, deleteService);

module.exports = router;
