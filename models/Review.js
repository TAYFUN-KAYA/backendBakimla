const mongoose = require('mongoose');

/**
 * Review Model
 * Randevu ve ürün yorumları/değerlendirmeleri
 */
const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Kullanıcı ID zorunludur'],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rating: {
      type: Number,
      required: [true, 'Puan zorunludur'],
      min: [1, 'Puan en az 1 olmalıdır'],
      max: [5, 'Puan en fazla 5 olmalıdır'],
    },
    comment: {
      type: String,
      trim: true,
    },
    reviewType: {
      type: String,
      enum: ['appointment', 'product', 'employee', 'store'],
      required: [true, 'Yorum tipi zorunludur'],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false, // Randevu tamamlandıysa true
    },
  },
  {
    timestamps: true,
  }
);

// Bir kullanıcı aynı randevu/ürün için sadece bir yorum yapabilir
reviewSchema.index({ userId: 1, appointmentId: 1 }, { unique: true, sparse: true });
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true, sparse: true });
reviewSchema.index({ companyId: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, rating: -1 });
reviewSchema.index({ reviewType: 1, isPublished: 1 });

module.exports = mongoose.model('Review', reviewSchema);

