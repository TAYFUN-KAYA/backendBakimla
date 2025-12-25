const mongoose = require('mongoose');

/**
 * Cart Model
 * Sepet (data izni ile tutulabilir)
 */
const cartSchema = new mongoose.Schema(
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

cartSchema.index({ userId: 1 });

// Sepet toplamını hesapla
cartSchema.methods.calculateTotal = async function () {
  const Product = mongoose.model('Product');
  let subtotal = 0;

  for (const item of this.items) {
    const product = await Product.findById(item.productId);
    if (product && product.isActive && product.isPublished) {
      subtotal += product.price * item.quantity;
    }
  }

  this.subtotal = subtotal;
  this.total = subtotal - this.discount - (this.pointsToUse * 0.1) + this.shippingCost;
  this.lastUpdated = new Date();
  return this.total;
};

module.exports = mongoose.model('Cart', cartSchema);

