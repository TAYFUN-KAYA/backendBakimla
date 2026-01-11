const UserCoupon = require('../models/UserCoupon');
const Coupon = require('../models/Coupon');

/**
 * getUserCoupons
 * Kullanıcının sahip olduğu kuponları getir
 */
const getUserCoupons = async (req, res) => {
  try {
    const userId = req.user._id;
    const { isUsed, isExpired } = req.query;

    const query = { userId };
    if (isUsed !== undefined) {
      query.isUsed = isUsed === 'true';
    }

    let userCoupons = await UserCoupon.find(query)
      .populate('couponId')
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 });

    // Kupon bilgilerini kontrol et ve filtrele
    const now = new Date();
    const validCoupons = [];

    for (const userCoupon of userCoupons) {
      if (!userCoupon.couponId) continue;

      const coupon = userCoupon.couponId;
      const isCouponExpired = now > coupon.endDate;
      const isCouponActive = coupon.isActive && now >= coupon.startDate && now <= coupon.endDate;

      // isExpired parametresine göre filtrele
      if (isExpired === 'true' && !isCouponExpired) continue;
      if (isExpired === 'false' && isCouponExpired) continue;

      validCoupons.push({
        _id: userCoupon._id,
        couponId: coupon._id,
        isUsed: userCoupon.isUsed,
        usedAt: userCoupon.usedAt,
        orderId: userCoupon.orderId,
        obtainedAt: userCoupon.obtainedAt,
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          title: coupon.title,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          startDate: coupon.startDate,
          endDate: coupon.endDate,
          isActive: coupon.isActive,
          isExpired: isCouponExpired,
          isActiveNow: isCouponActive,
        },
      });
    }

    res.status(200).json({
      success: true,
      count: validCoupons.length,
      data: validCoupons,
    });
  } catch (error) {
    console.error('Get User Coupons Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * addUserCoupon
 * Kullanıcıya kupon ekle (kampanya katılımı veya kupon kazanma)
 */
const addUserCoupon = async (req, res) => {
  try {
    const userId = req.user._id;
    const { couponId } = req.body;

    if (!couponId) {
      return res.status(400).json({
        success: false,
        message: 'Kupon ID gereklidir',
      });
    }

    // Kupon var mı kontrol et
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Kupon bulunamadı',
      });
    }

    // Kullanıcının zaten bu kuponu var mı kontrol et
    const existingUserCoupon = await UserCoupon.findOne({
      userId,
      couponId,
      isUsed: false,
    });

    if (existingUserCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Bu kuponu zaten kullanıcınızda mevcut',
      });
    }

    const userCoupon = await UserCoupon.create({
      userId,
      couponId,
      obtainedAt: new Date(),
    });

    await userCoupon.populate('couponId');

    res.status(201).json({
      success: true,
      message: 'Kupon başarıyla eklendi',
      data: userCoupon,
    });
  } catch (error) {
    console.error('Add User Coupon Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getUserCoupons,
  addUserCoupon,
};

