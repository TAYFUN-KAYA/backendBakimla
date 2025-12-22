const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Şirket ID zorunludur'],
    },
    title: {
      type: String,
      required: [true, 'Kampanya başlığı zorunludur'],
      trim: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Kampanya kısa açıklaması zorunludur'],
      trim: true,
    },
    serviceCategory: {
      type: String,
      required: [true, 'Hizmet kategorisi zorunludur'],
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
      required: [true, 'Kampanya başlangıç tarihi zorunludur'],
    },
    endDate: {
      type: Date,
      required: [true, 'Kampanya bitiş tarihi zorunludur'],
    },
    visibilityDuration: {
      type: Number,
      required: [true, 'Kampanya görünürlük süresi zorunludur'],
      min: [1, 'Görünürlük süresi en az 1 gün olmalıdır'],
    },
    participantCount: {
      type: Number,
      default: 0,
      min: [0, 'Katılımcı sayısı 0 veya daha büyük olmalıdır'],
    },
    image: {
      type: String,
      required: [true, 'Kampanya görseli zorunludur'],
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

campaignSchema.index({ companyId: 1, startDate: -1 });
campaignSchema.index({ companyId: 1, endDate: -1 });
campaignSchema.index({ isActive: 1, endDate: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);

