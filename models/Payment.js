const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Şirket ID zorunludur'],
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    // iyzico payment bilgileri
    paymentId: {
      type: String,
      sparse: true,
    },
    conversationId: {
      type: String,
    },
    price: {
      type: Number,
      required: [true, 'Fiyat zorunludur'],
      min: [0, 'Fiyat 0 veya daha büyük olmalıdır'],
    },
    currency: {
      type: String,
      default: 'TRY',
      enum: ['TRY', 'USD', 'EUR'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled'],
      default: 'pending',
    },
    // iyzico response bilgileri
    iyzicoResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Ödeme yapan kişi bilgileri
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    buyerInfo: {
      id: String,
      name: String,
      surname: String,
      email: String,
      identityNumber: String,
      city: String,
      country: String,
      zipCode: String,
    },
    // Kart bilgileri (hash'lenmiş)
    cardInfo: {
      cardType: String,
      cardAssociation: String,
      cardFamily: String,
      binNumber: String,
      lastFourDigits: String,
    },
    // Hata bilgisi
    errorMessage: {
      type: String,
    },
    errorCode: {
      type: String,
    },
    // Installment bilgisi
    installment: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ companyId: 1, createdAt: -1 });
paymentSchema.index({ paymentId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ conversationId: 1 });
paymentSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

