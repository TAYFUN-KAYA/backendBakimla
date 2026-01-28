const mongoose = require('mongoose');

/**
 * İşlet Kazan Model
 * Her 50 tamamlanan randevu için işletmeye 20 TL primi takibi
 * Para, cüzdana (Wallet) yatırılır; çekim WithdrawalRequest ile yapılır.
 */
const isletKazanSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Şirket ID zorunludur'],
      unique: true,
    },
    /** Kaç adet 50’lik ödül ödendi */
    paidMilestoneCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Toplam ödenen prim (paidMilestoneCount * amountPerMilestone) */
    totalAmountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Her 50 randevuda ödenen tutar (TRY) */
    amountPerMilestone: {
      type: Number,
      default: 20,
      min: 0,
    },
    /** Milestone büyüklüğü (kaç tamamlanan randevu) */
    milestoneSize: {
      type: Number,
      default: 50,
      min: 1,
    },
    /** Son prim ödeme tarihi */
    lastPaidAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

isletKazanSchema.index({ companyId: 1 });

module.exports = mongoose.model('IsletKazan', isletKazanSchema);
