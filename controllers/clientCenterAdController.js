const ClientCenterAd = require('../models/ClientCenterAd');

/**
 * getActiveClientCenterAds
 * Aktif reklamları getirir (kategoriye göre filtreleme ile)
 */
const getActiveClientCenterAds = async (req, res) => {
  try {
    const { category, limit } = req.query;
    const limitNum = limit ? parseInt(limit, 10) : 1; // Varsayılan 1 reklam
    const now = new Date();

    const query = {
      isActive: true,
      $or: [
        { startDate: { $exists: false }, endDate: { $exists: false } },
        { startDate: { $lte: now }, endDate: { $exists: false } },
        { startDate: { $exists: false }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: { $gte: now } },
      ],
    };

    // Kategori filtresi varsa ekle
    if (category) {
      query.category = category;
    }

    const ads = await ClientCenterAd.find(query)
      .sort({ order: 1, createdAt: -1 })
      .limit(limitNum);

    // Frontend için uygun formata çevir
    const formattedAds = ads.map((ad) => ({
      id: ad._id,
      _id: ad._id,
      title: ad.title || '',
      subtitle: ad.subtitle || '',
      imageUri: ad.image,
      image: ad.image,
      color: ad.color || '#743DFD',
      link: ad.link || null,
      category: ad.category || null,
    }));

    res.status(200).json({
      success: true,
      count: formattedAds.length,
      data: formattedAds.length > 0 ? formattedAds[0] : null, // Tek reklam döndür
    });
  } catch (error) {
    console.error('getActiveClientCenterAds error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllClientCenterAds
 * Tüm reklamları getirir (admin için)
 */
const getAllClientCenterAds = async (req, res) => {
  try {
    const ads = await ClientCenterAd.find()
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: ads.length,
      data: ads,
    });
  } catch (error) {
    console.error('getAllClientCenterAds error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * createClientCenterAd
 * Yeni reklam oluşturur (admin için)
 */
const createClientCenterAd = async (req, res) => {
  try {
    const { image, title, subtitle, link, category, color, order, isActive, startDate, endDate } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Reklam görseli zorunludur',
      });
    }

    const ad = await ClientCenterAd.create({
      image,
      title: title || null,
      subtitle: subtitle || null,
      link: link || null,
      category: category || null,
      color: color || '#743DFD',
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
    console.error('createClientCenterAd error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateClientCenterAd
 * Reklamı günceller (admin için)
 */
const updateClientCenterAd = async (req, res) => {
  try {
    const { id } = req.params;
    const { image, title, subtitle, link, category, color, order, isActive, startDate, endDate } = req.body;

    const ad = await ClientCenterAd.findByIdAndUpdate(
      id,
      {
        image,
        title: title !== undefined ? title : null,
        subtitle: subtitle !== undefined ? subtitle : null,
        link: link !== undefined ? link : null,
        category: category !== undefined ? category : null,
        color: color !== undefined ? color : '#743DFD',
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
    console.error('updateClientCenterAd error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * deleteClientCenterAd
 * Reklamı siler (admin için)
 */
const deleteClientCenterAd = async (req, res) => {
  try {
    const { id } = req.params;

    const ad = await ClientCenterAd.findByIdAndDelete(id);

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
    console.error('deleteClientCenterAd error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getActiveClientCenterAds,
  getAllClientCenterAds,
  createClientCenterAd,
  updateClientCenterAd,
  deleteClientCenterAd,
};

