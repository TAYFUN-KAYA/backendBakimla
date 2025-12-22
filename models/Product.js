const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Şirket ID zorunludur'],
    },
    name: {
      type: String,
      required: [true, 'Ürün adı zorunludur'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Ürün fiyatı zorunludur'],
      min: [0, 'Fiyat 0 veya daha büyük olmalıdır'],
    },
    category: {
      type: String,
      required: [true, 'Ürün kategorisi zorunludur'],
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stok 0 veya daha büyük olmalıdır'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ companyId: 1, isPublished: 1, createdAt: -1 });
productSchema.index({ category: 1, isPublished: 1 });
productSchema.index({ isPublished: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);

