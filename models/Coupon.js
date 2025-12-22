const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Şirket ID zorunludur'],
    },
    code: {
      type: String,
      required: [true, 'Kupon kodu zorunludur'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, 'Kupon başlığı zorunludur'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Kupon açıklaması zorunludur'],
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
    usageLimit: {
      type: Number,
      default: null,
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

couponSchema.index({ companyId: 1, code: 1 });
couponSchema.index({ code: 1, isActive: 1 });

module.exports = mongoose.model('Coupon', couponSchema);

