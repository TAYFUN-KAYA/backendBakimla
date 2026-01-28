const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    // Opsiyonel. null/yok = Kozmetik mağaza (admin) ürünü; dolu = işletmeye ait ürün.
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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
    shortDescription: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Ürün fiyatı zorunludur'],
      min: [0, 'Fiyat 0 veya daha büyük olmalıdır'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'İndirimli fiyat 0 veya daha büyük olmalıdır'],
    },
    discountPercent: {
      type: Number,
      min: [0, 'İndirim yüzdesi 0 veya daha büyük olmalıdır'],
      max: [100, 'İndirim yüzdesi 100 veya daha küçük olmalıdır'],
    },
    category: {
      type: String,
      required: [true, 'Ürün kategorisi zorunludur'],
      trim: true,
    },
    subCategory: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
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
    // Ürün seçenekleri (renk, beden, hacim vs)
    options: [{
      name: { type: String, trim: true },
      values: [{ type: String, trim: true }],
    }],
    // Kargo ve iade bilgileri
    shippingInfo: {
      freeShipping: { type: Boolean, default: false },
      shippingCost: { type: Number, default: 0 },
      estimatedDelivery: { type: String, default: '2-4 iş günü' },
    },
    returnPolicy: {
      returnable: { type: Boolean, default: true },
      returnDays: { type: Number, default: 14 },
      returnDescription: { type: String, default: 'Ücretsiz iade' },
    },
    // Rating ve review bilgileri
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    // Ürünün hitap ettiği cinsiyet: man, woman, mix
    targetGender: {
      type: String,
      enum: ['man', 'woman', 'mix'],
      default: 'mix',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    soldCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ companyId: 1, isPublished: 1, createdAt: -1 });
productSchema.index({ category: 1, isPublished: 1 });
productSchema.index({ isPublished: 1, createdAt: -1 });
productSchema.index({ isFeatured: 1, isPublished: 1 });
productSchema.index({ soldCount: -1, isPublished: 1 });
productSchema.index({ targetGender: 1, isPublished: 1 });

module.exports = mongoose.model('Product', productSchema);
