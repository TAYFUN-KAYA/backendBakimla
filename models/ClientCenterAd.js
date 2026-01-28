const mongoose = require('mongoose');

const clientCenterAdSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    discountPercent: {
      type: Number,
      min: [0, 'İndirim yüzdesi 0 veya daha büyük olmalıdır'],
      max: [100, 'İndirim yüzdesi 100 veya daha küçük olmalıdır'],
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Adet 0 veya daha büyük olmalıdır'],
    },
    image: {
      type: String,
      required: [true, 'Reklam görseli zorunludur'],
      trim: true,
    },
    productImage: {
      type: String,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      // Kategori key (erkek_kuafor, kadin_kuafor, guzellik_merkezi, vb.)
    },
    color: {
      type: String,
      default: '#743DFD',
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
      min: [0, 'Sıralama 0 veya daha büyük olmalıdır'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

clientCenterAdSchema.index({ isActive: 1, order: 1 });
clientCenterAdSchema.index({ category: 1, isActive: 1 });
clientCenterAdSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('ClientCenterAd', clientCenterAdSchema);

