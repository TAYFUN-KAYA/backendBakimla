const Coupon = require('../models/Coupon');
const User = require('../models/User');

/**
 * createCoupon
 * Yeni kupon oluşturur
 */
const createCoupon = async (req, res) => {
  try {
    // authMiddleware kullanıldığında req.user._id, companyMiddleware kullanıldığında req.companyId
    const companyId = req.user?._id || req.body.companyId || req.companyId;
    
    const {
      code,
      title,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      usageLimit,
    } = req.body;

    if (
      !companyId ||
      !code ||
      !title ||
      !description ||
      !discountType ||
      discountValue === undefined ||
      !startDate ||
      !endDate
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

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Bu kupon kodu zaten kullanılıyor',
      });
    }

    const coupon = await Coupon.create({
      companyId,
      code: code.toUpperCase(),
      title,
      description,
      discountType,
      discountValue,
      startDate: startDateObj,
      endDate: endDateObj,
      usageLimit: usageLimit || null,
    });

    res.status(201).json({
      success: true,
      message: 'Kupon başarıyla oluşturuldu',
      data: coupon,
    });
  } catch (error) {
    console.error('createCoupon error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getCompanyCoupons
 * Şirketin tüm kuponlarını getirir
 */
const getCompanyCoupons = async (req, res) => {
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

    const coupons = await Coupon.find(query)
      .populate('companyId', 'firstName lastName email phoneNumber')
      .sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    console.error('getCompanyCoupons error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * validateCoupon
 * Kupon kodunu doğrular
 */
const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Kupon kodu gereklidir',
      });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    }).populate('companyId', 'firstName lastName email phoneNumber');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Kupon bulunamadı veya aktif değil',
      });
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Kupon geçerli tarih aralığında değil',
      });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Kupon kullanım limitine ulaşmış',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Kupon geçerli',
      data: coupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateCoupon
 * Kupon bilgilerini günceller
 */
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate('companyId', 'firstName lastName email phoneNumber');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Kupon bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Kupon başarıyla güncellendi',
      data: coupon,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * deleteCoupon
 * Kuponu siler
 */
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Kupon bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Kupon başarıyla silindi',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getStoreCoupons
 * İşletmeye ait aktif kuponları getirir
 */
const getStoreCoupons = async (req, res) => {
  try {
    const { storeId } = req.params;
    const now = new Date();

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'İşletme ID gereklidir',
      });
    }

    // Find coupons for this store's company
    const Store = require('../models/Store');
    const store = await Store.findById(storeId);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'İşletme bulunamadı',
      });
    }

    const coupons = await Coupon.find({
      companyId: store.companyId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({ startDate: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    console.error('getStoreCoupons error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCoupon,
  getCompanyCoupons,
  validateCoupon,
  updateCoupon,
  deleteCoupon,
  getStoreCoupons,
};

