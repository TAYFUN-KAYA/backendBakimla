const BusinessHomeAd = require('../models/BusinessHomeAd');

/**
 * getActiveBusinessHomeAds
 * Aktif reklamları getirir (tarih kontrolü ile)
 */
const getActiveBusinessHomeAds = async (req, res) => {
  try {
    const now = new Date();

    const ads = await BusinessHomeAd.find({
      isActive: true,
      $or: [
        { startDate: { $exists: false }, endDate: { $exists: false } },
        { startDate: { $lte: now }, endDate: { $exists: false } },
        { startDate: { $exists: false }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: { $gte: now } },
      ],
    })
      .sort({ order: 1, createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: ads.length,
      data: ads,
    });
  } catch (error) {
    console.error('getActiveBusinessHomeAds error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllBusinessHomeAds
 * Tüm reklamları getirir (admin için)
 */
const getAllBusinessHomeAds = async (req, res) => {
  try {
    const ads = await BusinessHomeAd.find()
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: ads.length,
      data: ads,
    });
  } catch (error) {
    console.error('getAllBusinessHomeAds error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * createBusinessHomeAd
 * Yeni reklam oluşturur (admin için)
 */
const createBusinessHomeAd = async (req, res) => {
  try {
    const { image, link, order, isActive, startDate, endDate } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Reklam görseli zorunludur',
      });
    }

    const ad = await BusinessHomeAd.create({
      image,
      link: link || null,
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
    console.error('createBusinessHomeAd error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateBusinessHomeAd
 * Reklamı günceller (admin için)
 */
const updateBusinessHomeAd = async (req, res) => {
  try {
    const { id } = req.params;
    const { image, link, order, isActive, startDate, endDate } = req.body;

    const ad = await BusinessHomeAd.findByIdAndUpdate(
      id,
      {
        image,
        link: link !== undefined ? link : null,
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
    console.error('updateBusinessHomeAd error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * deleteBusinessHomeAd
 * Reklamı siler (admin için)
 */
const deleteBusinessHomeAd = async (req, res) => {
  try {
    const { id } = req.params;

    const ad = await BusinessHomeAd.findByIdAndDelete(id);

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
    console.error('deleteBusinessHomeAd error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getActiveBusinessHomeAds,
  getAllBusinessHomeAds,
  createBusinessHomeAd,
  updateBusinessHomeAd,
  deleteBusinessHomeAd,
};

