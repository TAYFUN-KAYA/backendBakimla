const mongoose = require('mongoose');

/**
 * Basket Model
 * Sepet (data izni ile tutulabilir)
 */
const basketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Kullanıcı ID zorunludur'],
      unique: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Miktar en az 1 olmalıdır'],
        },
        options: {
          type: mongoose.Schema.Types.Mixed,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    subtotal: {
      type: Number,
      default: 0,
      min: [0, 'Ara toplam 0 veya daha büyük olmalıdır'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'İndirim 0 veya daha büyük olmalıdır'],
    },
    pointsToUse: {
      type: Number,
      default: 0,
      min: [0, 'Kullanılacak puan 0 veya daha büyük olmalıdır'],
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: [0, 'Kargo ücreti 0 veya daha büyük olmalıdır'],
    },
    total: {
      type: Number,
      default: 0,
      min: [0, 'Toplam 0 veya daha büyük olmalıdır'],
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

basketSchema.index({ userId: 1 });

// Sepet toplamını hesapla
// Optimize edilmiş versiyon: populate edilmiş verilerle çalışır veya batch query kullanır
basketSchema.methods.calculateTotal = async function (populatedProducts = null) {
  let subtotal = 0;

  if (populatedProducts) {
    // Populate edilmiş veriler kullanılıyor - çok hızlı
    for (const item of this.items) {
      const product = populatedProducts.find(p => p._id.toString() === item.productId.toString());
      if (product && product.isActive && product.isPublished) {
        const price = product.discountPrice || product.price;
        subtotal += price * item.quantity;
      }
    }
  } else {
    // Populate edilmemişse, optimize edilmiş batch query kullan
    const Product = mongoose.model('Product');
    const productIds = this.items.map(item => item.productId);
    
    if (productIds.length > 0) {
      const products = await Product.find({ 
        _id: { $in: productIds },
        isActive: true,
        isPublished: true
      });
      
      const productMap = new Map(products.map(p => [p._id.toString(), p]));
      
      for (const item of this.items) {
        const product = productMap.get(item.productId.toString());
        if (product) {
          const price = product.discountPrice || product.price;
          subtotal += price * item.quantity;
        }
      }
    }
  }

  this.subtotal = subtotal;
  this.total = subtotal - this.discount - (this.pointsToUse * 0.1) + this.shippingCost;
  this.lastUpdated = new Date();
  return this.total;
};

module.exports = mongoose.model('Basket', basketSchema);
