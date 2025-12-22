const Campaign = require('../models/Campaign');
const User = require('../models/User');

/**
 * createCampaign
 * Yeni kampanya oluşturur
 */
const createCampaign = async (req, res) => {
  try {
    const {
      companyId,
      title,
      shortDescription,
      serviceCategory,
      discountType,
      discountValue,
      startDate,
      endDate,
      visibilityDuration,
      participantCount,
      image,
    } = req.body;

    if (
      !companyId ||
      !title ||
      !shortDescription ||
      !serviceCategory ||
      !discountType ||
      discountValue === undefined ||
      !startDate ||
      !endDate ||
      !visibilityDuration ||
      !image
    ) {
      return res.status(400).json({
        success: false,
        message: 'Tüm zorunlu alanlar doldurulmalıdır',
      });
    }

    if (!['percentage', 'amount'].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: 'İndirim tipi "percentage" veya "amount" olmalıdır',
      });
    }

    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Yüzde indirim 0-100 arasında olmalıdır',
      });
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (endDateObj <= startDateObj) {
      return res.status(400).json({
        success: false,
        message: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır',
      });
    }

    const company = await User.findById(companyId);
    if (!company || company.userType !== 'company') {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı',
      });
    }

    const campaign = await Campaign.create({
      companyId,
      title,
      shortDescription,
      serviceCategory,
      discountType,
      discountValue,
      startDate: startDateObj,
      endDate: endDateObj,
      visibilityDuration,
      participantCount: participantCount || 0,
      image,
    });

    res.status(201).json({
      success: true,
      message: 'Kampanya başarıyla oluşturuldu',
      data: campaign,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getCompanyCampaigns
 * Şirketin tüm kampanyalarını getirir
 */
const getCompanyCampaigns = async (req, res) => {
  try {
    const { companyId } = req.body;
    const { isActive } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'companyId gereklidir',
      });
    }

    const query = { companyId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const campaigns = await Campaign.find(query)
      .populate('companyId', 'firstName lastName email phoneNumber')
      .sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getActiveCampaigns
 * Aktif kampanyaları getirir
 */
const getActiveCampaigns = async (req, res) => {
  try {
    const now = new Date();

    const campaigns = await Campaign.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate('companyId', 'firstName lastName email phoneNumber')
      .sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateCampaign
 * Kampanya bilgilerini günceller
 */
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate('companyId', 'firstName lastName email phoneNumber');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Kampanya bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Kampanya başarıyla güncellendi',
      data: campaign,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * deleteCampaign
 * Kampanyayı siler
 */
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findByIdAndDelete(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Kampanya bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Kampanya başarıyla silindi',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCampaign,
  getCompanyCampaigns,
  getActiveCampaigns,
  updateCampaign,
  deleteCampaign,
};

