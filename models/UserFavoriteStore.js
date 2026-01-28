const mongoose = require('mongoose');

/**
 * UserFavoriteStore Model
 * Kullanıcının favori işletmeleri (max 5 adet)
 */
const userFavoriteStoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Kullanıcı ID zorunludur'],
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'İşletme ID zorunludur'],
    },
    order: {
      type: Number,
      required: true,
      min: [1, 'Sıra en az 1 olmalıdır'],
      max: [5, 'Maksimum 5 işletme seçilebilir'],
    },
  },
  {
    timestamps: true,
  }
);

// Aynı kullanıcı aynı işletmeyi birden fazla kez favoriye ekleyemez
userFavoriteStoreSchema.index({ userId: 1, storeId: 1 }, { unique: true });
userFavoriteStoreSchema.index({ userId: 1, order: 1 });
userFavoriteStoreSchema.index({ userId: 1, createdAt: -1 });

// Pre-save hook: Aynı kullanıcının maksimum 5 favori işletmesi olabilir
userFavoriteStoreSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('UserFavoriteStore').countDocuments({ userId: this.userId });
    if (count >= 5) {
      return next(new Error('Maksimum 5 favori işletme seçebilirsiniz'));
    }
  }
  next();
});

module.exports = mongoose.model('UserFavoriteStore', userFavoriteStoreSchema);
