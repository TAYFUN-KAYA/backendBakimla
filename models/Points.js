const mongoose = require('mongoose');

/**
 * Points Model
 * Bakımla puan sistemi
 * Kullanıcı randevu oluşturdukça puan kazanır (randevu tutarının %10'u)
 * Toplam puanın %10'u = 1 TL
 */
const pointsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Kullanıcı ID zorunludur'],
      unique: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: [0, 'Toplam puan 0 veya daha büyük olmalıdır'],
    },
    usedPoints: {
      type: Number,
      default: 0,
      min: [0, 'Kullanılan puan 0 veya daha büyük olmalıdır'],
    },
    availablePoints: {
      type: Number,
      default: 0,
      min: [0, 'Kullanılabilir puan 0 veya daha büyük olmalıdır'],
    },
    totalValueInTL: {
      type: Number,
      default: 0,
      min: [0, 'TL değeri 0 veya daha büyük olmalıdır'],
    },
  },
  {
    timestamps: true,
  }
);

pointsSchema.index({ userId: 1 });

/**
 * Points Transaction Model
 * Puan işlem geçmişi
 */
const pointsTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Kullanıcı ID zorunludur'],
    },
    type: {
      type: String,
      enum: ['earned', 'used', 'expired', 'refunded'],
      required: [true, 'İşlem tipi zorunludur'],
    },
    points: {
      type: Number,
      required: [true, 'Puan zorunludur'],
    },
    valueInTL: {
      type: Number,
      default: 0,
      min: [0, 'TL değeri 0 veya daha büyük olmalıdır'],
    },
    description: {
      type: String,
      trim: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    source: {
      type: String,
      enum: ['appointment', 'order', 'bonus', 'refund'],
      required: true,
    },
    sourceAmount: {
      type: Number,
      min: [0, 'Kaynak tutarı 0 veya daha büyük olmalıdır'],
    },
  },
  {
    timestamps: true,
  }
);

pointsTransactionSchema.index({ userId: 1, createdAt: -1 });
pointsTransactionSchema.index({ type: 1, createdAt: -1 });

const Points = mongoose.model('Points', pointsSchema);
const PointsTransaction = mongoose.model('PointsTransaction', pointsTransactionSchema);

module.exports = {
  Points,
  PointsTransaction,
};

