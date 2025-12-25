const mongoose = require('mongoose');

/**
 * PaymentMethod Model
 * Kullanıcının kayıtlı ödeme yöntemleri (iyzico'da tutulur)
 */
const paymentMethodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Kullanıcı ID zorunludur'],
    },
    iyzicoCardToken: {
      type: String,
      required: [true, 'iyzico kart token zorunludur'],
      unique: true,
    },
    iyzicoCardUserKey: {
      type: String,
      required: [true, 'iyzico kart kullanıcı anahtarı zorunludur'],
    },
    cardType: {
      type: String,
      enum: ['CREDIT_CARD', 'DEBIT_CARD'],
    },
    cardAssociation: {
      type: String,
    },
    cardFamily: {
      type: String,
    },
    binNumber: {
      type: String,
    },
    lastFourDigits: {
      type: String,
      required: true,
      match: [/^[0-9]{4}$/, 'Son 4 haneli kart numarası 4 haneli olmalıdır'],
    },
    cardHolderName: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentMethodSchema.index({ userId: 1, isDefault: 1 });
paymentMethodSchema.index({ userId: 1, isActive: 1, createdAt: -1 });
paymentMethodSchema.index({ iyzicoCardToken: 1 });

// Varsayılan ödeme yöntemi kontrolü
paymentMethodSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await mongoose.model('PaymentMethod').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);

