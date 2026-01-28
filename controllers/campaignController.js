const Campaign = require('../models/Campaign');
const User = require('../models/User');

/**
 * createCampaign
 * Yeni kampanya oluşturur
 */
const createCampaign = async (req, res) => {
  try {
    // authMiddleware kullanıldığında req.user._id, companyMiddleware kullanıldığında req.companyId
    const companyId = req.user?._id || req.body.companyId || req.companyId;
    
    const {
      title,
      shortDescription,
      serviceCategory,
      servicesId,
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
      servicesId: servicesId || null,
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
    console.error('createCampaign error:', error);
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
    // authMiddleware kullanıldığında req.user._id, companyMiddleware kullanıldığında req.companyId
    const companyId = req.user?._id || req.body.companyId || req.companyId;
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
    console.error('getCompanyCampaigns error:', error);
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

/**
 * getCosmeticStorePromos
 * Kozmetik store için özel promo/campaign carousel verilerini getirir
 */
const getCosmeticStorePromos = async (req, res) => {
  try {
    console.log('getCosmeticStorePromos called'); // Debug log
    // Campaign modelinin var olduğundan emin ol
    if (!Campaign) {
      console.error('Campaign model is not available');
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const { limit = 5 } = req.query;
    const now = new Date();

    let promos = [];

    try {
      // Kozmetik store için kampanyalar (serviceCategory: 'Kozmetik' veya benzeri)
      const campaigns = await Campaign.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        $or: [
          { serviceCategory: { $regex: /kozmetik|cosmetic|ürün|product/i } },
          { serviceCategory: 'Kozmetik' },
        ],
      })
        .populate('companyId', 'firstName lastName profileImage')
        .sort({ startDate: -1 })
        .limit(parseInt(limit))
        .lean()
        .exec();

      // Eğer kampanya yoksa, genel aktif kampanyalardan al
      if (campaigns && campaigns.length > 0) {
        promos = campaigns;
      } else {
        const generalCampaigns = await Campaign.find({
          isActive: true,
          startDate: { $lte: now },
          endDate: { $gte: now },
        })
          .populate('companyId', 'firstName lastName profileImage')
          .sort({ startDate: -1 })
          .limit(parseInt(limit))
          .lean()
          .exec();
        
        promos = generalCampaigns || [];
      }
    } catch (dbError) {
      console.error('Database query error in getCosmeticStorePromos:', dbError);
      console.error('DB Error details:', {
        message: dbError.message,
        name: dbError.name,
        stack: dbError.stack,
      });
      // Veritabanı hatası varsa boş array döndür
      promos = [];
    }

    res.status(200).json({
      success: true,
      count: promos.length,
      data: promos,
    });
  } catch (error) {
    console.error('getCosmeticStorePromos error:', error);
    console.error('Error stack:', error.stack);
    // Hata durumunda bile boş array döndür, uygulama çalışmaya devam etsin
    res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: 'Promo verileri yüklenirken bir hata oluştu',
    });
  }
};

/**
 * getStoreCampaigns
 * İşletmeye ait aktif kampanyaları getirir
 */
const getStoreCampaigns = async (req, res) => {
  try {
    const { storeId } = req.params;
    const now = new Date();

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'İşletme ID gereklidir',
      });
    }

    // Find campaigns for this store's company
    const Store = require('../models/Store');
    const store = await Store.findById(storeId);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'İşletme bulunamadı',
      });
    }

    const campaigns = await Campaign.find({
      companyId: store.companyId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({ startDate: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    console.error('getStoreCampaigns error:', error);
    res.status(500).json({
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
  getCosmeticStorePromos,
  getStoreCampaigns,
};

