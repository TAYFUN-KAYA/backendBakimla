const express = require('express');
const router = express.Router();
const {
  createCampaign,
  getCompanyCampaigns,
  getActiveCampaigns,
  updateCampaign,
  deleteCampaign,
} = require('../controllers/campaignController');
const { companyMiddleware, authMiddleware } = require('../middleware/authMiddleware');

router.post('/', companyMiddleware, createCampaign);
router.get('/active', getActiveCampaigns);
router.post('/company', companyMiddleware, getCompanyCampaigns);
router.put('/:id', companyMiddleware, updateCampaign);
router.delete('/:id', companyMiddleware, deleteCampaign);

module.exports = router;

