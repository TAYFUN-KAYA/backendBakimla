const mongoose = require('mongoose');

/**
 * Favorite Model
 * Kullanıcı favorileri (işletmeler ve ürünler)
 */
const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Kullanıcı ID zorunludur'],
    },
    favoriteType: {
      type: String,
      enum: ['store', 'product'],
      required: [true, 'Favori tipi zorunludur'],
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  },
  {
    timestamps: true,
  }
);

// Bir kullanıcı aynı işletme/ürünü sadece bir kez favorileyebilir
favoriteSchema.index({ userId: 1, storeId: 1 }, { unique: true, sparse: true });
favoriteSchema.index({ userId: 1, productId: 1 }, { unique: true, sparse: true });
favoriteSchema.index({ userId: 1, favoriteType: 1, createdAt: -1 });

module.exports = mongoose.model('Favorite', favoriteSchema);

