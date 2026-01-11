const mongoose = require('mongoose');

/**
 * UserCoupon Model
 * Kullanıcının kazandığı/aldığı kuponlar
 */
const userCouponSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Kullanıcı ID zorunludur'],
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      required: [true, 'Kupon ID zorunludur'],
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    obtainedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

userCouponSchema.index({ userId: 1, isUsed: 1 });
userCouponSchema.index({ userId: 1, createdAt: -1 });
userCouponSchema.index({ couponId: 1 });

module.exports = mongoose.model('UserCoupon', userCouponSchema);

