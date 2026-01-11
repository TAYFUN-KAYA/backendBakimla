const mongoose = require('mongoose');

/**
 * UserCampaign Model
 * Kullanıcının katıldığı kampanyalar
 */
const userCampaignSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Kullanıcı ID zorunludur'],
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: [true, 'Kampanya ID zorunludur'],
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

userCampaignSchema.index({ userId: 1, campaignId: 1 }, { unique: true });
userCampaignSchema.index({ userId: 1, createdAt: -1 });
userCampaignSchema.index({ campaignId: 1 });

module.exports = mongoose.model('UserCampaign', userCampaignSchema);

