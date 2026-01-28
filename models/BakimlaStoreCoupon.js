const mongoose = require('mongoose');

/**
 * BakimlaStoreCoupon Model
 * Bakımla mağazası için genel indirim kuponları
 */
const bakimlaStoreCouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Kupon kodu zorunludur'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Kupon adı zorunludur'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'amount'],
      required: [true, 'İndirim tipi zorunludur'],
    },
    discountValue: {
      type: Number,
      required: [true, 'İndirim değeri zorunludur'],
      min: [0, 'İndirim değeri 0 veya daha büyük olmalıdır'],
    },
    startDate: {
      type: Date,
      required: [true, 'Kupon başlangıç tarihi zorunludur'],
    },
    endDate: {
      type: Date,
      required: [true, 'Kupon bitiş tarihi zorunludur'],
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum alışveriş tutarı 0 veya daha büyük olmalıdır'],
    },
    usageLimit: {
      type: Number,
      default: null, // null = sınırsız
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, 'Kullanım sayısı 0 veya daha büyük olmalıdır'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

bakimlaStoreCouponSchema.index({ code: 1, isActive: 1 });
bakimlaStoreCouponSchema.index({ startDate: 1, endDate: 1 });

// Aktif ve geçerli kuponları getir
bakimlaStoreCouponSchema.statics.getActiveCoupons = function () {
  const now = new Date();
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { usageLimit: null },
      { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
    ],
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('BakimlaStoreCoupon', bakimlaStoreCouponSchema);
