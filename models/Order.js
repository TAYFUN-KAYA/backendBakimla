const mongoose = require('mongoose');

/**
 * Order Model
 * E-ticaret siparişleri (Kozmetik Store)
 */
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Kullanıcı ID zorunludur'],
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Miktar en az 1 olmalıdır'],
        },
        unitPrice: {
          type: Number,
          required: true,
          min: [0, 'Birim fiyat 0 veya daha büyük olmalıdır'],
        },
        totalPrice: {
          type: Number,
          required: true,
          min: [0, 'Toplam fiyat 0 veya daha büyük olmalıdır'],
        },
        options: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Ara toplam 0 veya daha büyük olmalıdır'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'İndirim 0 veya daha büyük olmalıdır'],
    },
    pointsUsed: {
      type: Number,
      default: 0,
      min: [0, 'Kullanılan puan 0 veya daha büyük olmalıdır'],
    },
    pointsEarned: {
      type: Number,
      default: 0,
      min: [0, 'Kazanılan puan 0 veya daha büyük olmalıdır'],
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: [0, 'Kargo ücreti 0 veya daha büyük olmalıdır'],
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Toplam 0 veya daha büyük olmalıdır'],
    },
    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },
    billingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'cash_on_delivery'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
    },
    shippingCompany: {
      type: String,
      trim: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });

// Order Number oluştur
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

