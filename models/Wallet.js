const mongoose = require('mongoose');

/**
 * Wallet Model
 * İşletmelerin online ödemelerden kazandığı cüzdan bakiyesi
 * Sadece online (kredi kartı) ödemeler cüzdana eklenir
 */
const walletSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Şirket ID zorunludur'],
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Bakiye 0 veya daha büyük olmalıdır'],
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: [0, 'Toplam kazanç 0 veya daha büyük olmalıdır'],
    },
    totalWithdrawals: {
      type: Number,
      default: 0,
      min: [0, 'Toplam çekim 0 veya daha büyük olmalıdır'],
    },
    lastTransactionDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

walletSchema.index({ companyId: 1 });

/**
 * Wallet Transaction Model
 * Cüzdan işlem geçmişi
 */
const walletTransactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Cüzdan ID zorunludur'],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Şirket ID zorunludur'],
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'refund'],
      required: [true, 'İşlem tipi zorunludur'],
    },
    amount: {
      type: Number,
      required: [true, 'Tutar zorunludur'],
      min: [0, 'Tutar 0 veya daha büyük olmalıdır'],
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    withdrawalRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WithdrawalRequest',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ companyId: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1, status: 1 });

/**
 * Withdrawal Request Model
 * Para çekme talepleri
 */
const withdrawalRequestSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Şirket ID zorunludur'],
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Cüzdan ID zorunludur'],
    },
    amount: {
      type: Number,
      required: [true, 'Tutar zorunludur'],
      min: [0.01, 'Tutar en az 0.01 olmalıdır'],
    },
    iban: {
      type: String,
      required: [true, 'IBAN zorunludur'],
      trim: true,
      match: [/^TR[0-9]{24}$/, 'Geçerli bir IBAN numarası giriniz (TR ile başlamalı)'],
    },
    accountHolderName: {
      type: String,
      required: [true, 'Hesap sahibi adı zorunludur'],
      trim: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected', 'cancelled'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    processedAt: {
      type: Date,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
    },
    eftDescription: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

withdrawalRequestSchema.index({ companyId: 1, createdAt: -1 });
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });

const Wallet = mongoose.model('Wallet', walletSchema);
const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

module.exports = {
  Wallet,
  WalletTransaction,
  WithdrawalRequest,
};

