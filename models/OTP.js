const mongoose = require('mongoose');

/**
 * OTP Model
 * Tek kullanımlık şifre (One-Time Password) için
 */
const otpSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: [true, 'Telefon numarası zorunludur'],
      trim: true,
      match: [/^[0-9]{10,15}$/, 'Geçerli bir telefon numarası giriniz'],
    },
    code: {
      type: String,
      required: [true, 'OTP kodu zorunludur'],
      trim: true,
    },
    purpose: {
      type: String,
      enum: ['register', 'login', 'forgot_password', 'admin-login'],
      required: [true, 'OTP amacı zorunludur'],
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Otomatik silme
    },
    attempts: {
      type: Number,
      default: 0,
      max: [5, 'Maksimum deneme sayısına ulaşıldı'],
    },
  },
  {
    timestamps: true,
  }
);

otpSchema.index({ phoneNumber: 1, purpose: 1, expiresAt: 1 });
otpSchema.index({ phoneNumber: 1, code: 1, isUsed: 1 });

module.exports = mongoose.model('OTP', otpSchema);

