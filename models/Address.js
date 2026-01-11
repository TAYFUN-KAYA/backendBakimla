const mongoose = require('mongoose');

/**
 * Address Model
 * Kullanıcı adresleri (sipariş ve fatura için)
 */
const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Kullanıcı ID zorunludur'],
    },
    title: {
      type: String,
      required: [true, 'Adres başlığı zorunludur'],
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, 'Ad zorunludur'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Soyad zorunludur'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Telefon numarası zorunludur'],
      trim: true,
    },
    addressLine1: {
      type: String,
      required: [true, 'Adres satırı 1 zorunludur'],
      trim: true,
    },
    addressLine2: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Şehir zorunludur'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'İlçe zorunludur'],
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      default: 'Türkiye',
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isBillingAddress: {
      type: Boolean,
      default: false,
    },
    taxNumber: {
      type: String,
      trim: true,
    },
    taxOffice: {
      type: String,
      trim: true,
    },
    latitude: {
      type: Number,
      // Konum bilgisi (opsiyonel)
    },
    longitude: {
      type: Number,
      // Konum bilgisi (opsiyonel)
    },
  },
  {
    timestamps: true,
  }
);

addressSchema.index({ userId: 1, isDefault: 1 });
addressSchema.index({ userId: 1, createdAt: -1 });

// Varsayılan adres kontrolü
addressSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await mongoose.model('Address').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

module.exports = mongoose.model('Address', addressSchema);

