const ClientHomeAd = require('../models/ClientHomeAd');
const { Colors } = require('../../BakimlaBusinessV2/src/constants/colors');
/**
 * getActiveClientHomeAds
 * Aktif reklamları getirir (tarih kontrolü ile)
 */
const getActiveClientHomeAds = async (req, res) => {
  try {
    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const now = new Date();

    const ads = await ClientHomeAd.find({
      isActive: true,
      $or: [
        { startDate: { $exists: false }, endDate: { $exists: false } },
        { startDate: { $lte: now }, endDate: { $exists: false } },
        { startDate: { $exists: false }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: { $gte: now } },
      ],
    })
      .sort({ order: 1, createdAt: -1 })
      .limit(limitNum);

    // Frontend için uygun formata çevir
    const formattedAds = ads.map((ad, index) => ({
      id: ad._id,
      _id: ad._id,
      title: ad.title || '',
      subtitle: ad.subtitle || '',
      imageUri: ad.image,
      image: ad.image,
      color: ad.color || (index % 2 === 0 ? Colors.purple : Colors.primaryGreen),
      link: ad.link || null,
    }));

    res.status(200).json({
      success: true,
      count: formattedAds.length,
      data: formattedAds,
    });
  } catch (error) {
    console.error('getActiveClientHomeAds error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllClientHomeAds
 * Tüm reklamları getirir (admin için)
 */
const getAllClientHomeAds = async (req, res) => {
  try {
    const ads = await ClientHomeAd.find()
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: ads.length,
      data: ads,
    });
  } catch (error) {
    console.error('getAllClientHomeAds error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * createClientHomeAd
 * Yeni reklam oluşturur (admin için)
 */
const createClientHomeAd = async (req, res) => {
  try {
    const { image, title, subtitle, link, color, order, isActive, startDate, endDate } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Reklam görseli zorunludur',
      });
    }

    const ad = await ClientHomeAd.create({
      image,
      title: title || null,
      subtitle: subtitle || null,
      link: link || null,
      color: color || Colors.purple,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
      startDate: startDate || null,
      endDate: endDate || null,
    });

    res.status(201).json({
      success: true,
      message: 'Reklam başarıyla oluşturuldu',
      data: ad,
    });
  } catch (error) {
    console.error('createClientHomeAd error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateClientHomeAd
 * Reklamı günceller (admin için)
 */
const updateClientHomeAd = async (req, res) => {
  try {
    const { id } = req.params;
    const { image, title, subtitle, link, color, order, isActive, startDate, endDate } = req.body;

    const ad = await ClientHomeAd.findByIdAndUpdate(
      id,
      {
        image,
        title: title !== undefined ? title : null,
        subtitle: subtitle !== undefined ? subtitle : null,
        link: link !== undefined ? link : null,
        color: color !== undefined ? color : Colors.purple,
        order: order !== undefined ? order : 0,
        isActive: isActive !== undefined ? isActive : true,
        startDate: startDate !== undefined ? startDate : null,
        endDate: endDate !== undefined ? endDate : null,
      },
      { new: true, runValidators: true }
    );

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Reklam bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reklam başarıyla güncellendi',
      data: ad,
    });
  } catch (error) {
    console.error('updateClientHomeAd error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * deleteClientHomeAd
 * Reklamı siler (admin için)
 */
const deleteClientHomeAd = async (req, res) => {
  try {
    const { id } = req.params;

    const ad = await ClientHomeAd.findByIdAndDelete(id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Reklam bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reklam başarıyla silindi',
    });
  } catch (error) {
    console.error('deleteClientHomeAd error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getActiveClientHomeAds,
  getAllClientHomeAds,
  createClientHomeAd,
  updateClientHomeAd,
  deleteClientHomeAd,
};

