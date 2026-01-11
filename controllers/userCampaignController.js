const UserCampaign = require('../models/UserCampaign');
const Campaign = require('../models/Campaign');

/**
 * getUserCampaigns
 * Kullanıcının katıldığı kampanyaları getir
 */
const getUserCampaigns = async (req, res) => {
  try {
    const userId = req.user._id;
    const { isExpired } = req.query;

    let userCampaigns = await UserCampaign.find({ userId })
      .populate('campaignId')
      .populate('appointmentId', 'appointmentDate status')
      .sort({ createdAt: -1 });

    // Kampanya bilgilerini kontrol et ve filtrele
    const now = new Date();
    const validCampaigns = [];

    for (const userCampaign of userCampaigns) {
      if (!userCampaign.campaignId) continue;

      const campaign = userCampaign.campaignId;
      const isCampaignExpired = now > campaign.endDate;
      const isCampaignActive = campaign.isActive && now >= campaign.startDate && now <= campaign.endDate;

      // isExpired parametresine göre filtrele
      if (isExpired === 'true' && !isCampaignExpired) continue;
      if (isExpired === 'false' && isCampaignExpired) continue;

      validCampaigns.push({
        _id: userCampaign._id,
        campaignId: campaign._id,
        appointmentId: userCampaign.appointmentId,
        joinedAt: userCampaign.joinedAt,
        campaign: {
          _id: campaign._id,
          title: campaign.title,
          shortDescription: campaign.shortDescription,
          description: campaign.shortDescription, // shortDescription'ı description olarak kullan
          discountType: campaign.discountType,
          discountValue: campaign.discountValue,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          image: campaign.image,
          isActive: campaign.isActive,
          isExpired: isCampaignExpired,
          isActiveNow: isCampaignActive,
          serviceCategory: campaign.serviceCategory,
        },
      });
    }

    res.status(200).json({
      success: true,
      count: validCampaigns.length,
      data: validCampaigns,
    });
  } catch (error) {
    console.error('Get User Campaigns Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getUserCampaigns,
};

