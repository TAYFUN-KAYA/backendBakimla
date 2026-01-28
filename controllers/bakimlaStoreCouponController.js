const BakimlaStoreCoupon = require('../models/BakimlaStoreCoupon');

/**
 * getActiveCoupons
 * Aktif ve geçerli kuponları getir
 */
const getActiveCoupons = async (req, res) => {
  try {
    const coupons = await BakimlaStoreCoupon.getActiveCoupons();

    res.status(200).json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    console.error('Get Active Coupons Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllCoupons
 * Tüm kuponları getir (admin için)
 */
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await BakimlaStoreCoupon.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    console.error('Get All Coupons Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getCouponByCode
 * Kupon koduna göre kupon getir
 */
const getCouponByCode = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Kupon kodu zorunludur',
      });
    }

    const now = new Date();
    const coupon = await BakimlaStoreCoupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
      ],
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Geçerli kupon bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error('Get Coupon By Code Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * createCoupon
 * Yeni kupon oluştur (admin için)
 */
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      minPurchaseAmount,
      usageLimit,
    } = req.body;

    if (
      !code ||
      !name ||
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

    const existingCoupon = await BakimlaStoreCoupon.findOne({
      code: code.toUpperCase(),
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Bu kupon kodu zaten kullanılıyor',
      });
    }

    const coupon = await BakimlaStoreCoupon.create({
      code: code.toUpperCase(),
      name,
      description,
      discountType,
      discountValue,
      startDate: startDateObj,
      endDate: endDateObj,
      minPurchaseAmount: minPurchaseAmount || 0,
      usageLimit: usageLimit || null,
    });

    res.status(201).json({
      success: true,
      message: 'Kupon oluşturuldu',
      data: coupon,
    });
  } catch (error) {
    console.error('Create Coupon Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getActiveCoupons,
  getAllCoupons,
  getCouponByCode,
  createCoupon,
};
