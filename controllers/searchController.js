const Store = require('../models/Store');

/**
 * searchStores
 * İşletmeleri arama (isim, konum)
 * Performanslı arama için MongoDB text index kullanır
 */
const searchStores = async (req, res) => {
  try {
    const { query, category, latitude, longitude, limit = 20, page = 1 } = req.query;

    // En az 3 karakter kontrolü
    if (!query || query.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Arama için en az 3 karakter girmelisiniz',
      });
    }

    const searchQuery = query.trim();
    const limitNum = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * limitNum;

    // Base query
    let baseQuery = {
      $or: [
        { storeName: { $regex: searchQuery, $options: 'i' } },
        { businessName: { $regex: searchQuery, $options: 'i' } },
        { 'location.address': { $regex: searchQuery, $options: 'i' } },
        { 'address.fullAddress': { $regex: searchQuery, $options: 'i' } },
        { 'address.city': { $regex: searchQuery, $options: 'i' } },
        { 'address.district': { $regex: searchQuery, $options: 'i' } },
      ],
    };

    // Kategori filtresi varsa ekle
    if (category) {
      baseQuery.$and = [
        {
          $or: [
            { 'sectors.key': category },
            { businessField: category },
          ],
        },
      ];
    }

    // İşletmeleri bul
    const stores = await Store.find(baseQuery)
      .populate('companyId', 'firstName lastName profileImage')
      .select('storeName businessName appIcon location address sectors businessField workingDays isOpen companyId')
      .limit(limitNum)
      .skip(skip)
      .lean();

    // İşletme sonuçlarını formatla
    const formattedStores = stores.map(store => {
      let distance = null;
      if (latitude && longitude && store.location?.latitude && store.location?.longitude) {
        distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          store.location.latitude,
          store.location.longitude
        );
      }

      // Çalışma saatleri
      let workingHours = '09:00 - 19:00';
      if (store.workingDays && store.workingDays.length > 0) {
        const firstDay = store.workingDays[0];
        if (firstDay.startTime && firstDay.endTime) {
          workingHours = `${firstDay.startTime} - ${firstDay.endTime}`;
        }
      }

      return {
        id: store._id,
        name: store.storeName || store.businessName || 'İşletme',
        logo: store.appIcon || store.companyId?.profileImage || null,
        rating: '4.7', // TODO: Rating hesaplama
        discount: '%50', // TODO: Discount hesaplama
        workingHours,
        isOpen: store.isOpen || false,
        averagePrice: 0,
        address: {
          fullAddress: store.address?.fullAddress || store.location?.address || '',
          latitude: store.location?.latitude || null,
          longitude: store.location?.longitude || null,
        },
        distance: distance ? `${distance.toFixed(1)} km` : null,
        distanceValue: distance || Infinity,
        businessField: store.businessField || null,
        sectors: store.sectors || [],
      };
    });

    // Mesafeye göre sırala (eğer konum varsa)
    if (latitude && longitude) {
      formattedStores.sort((a, b) => a.distanceValue - b.distanceValue);
    }

    const total = await Store.countDocuments(baseQuery);

    res.status(200).json({
      success: true,
      count: formattedStores.length,
      data: formattedStores,
      pagination: {
        page: parseInt(page, 10),
        limit: limitNum,
        total,
        hasMore: skip + stores.length < total,
      },
    });
  } catch (error) {
    console.error('searchStores error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Mesafe hesaplama fonksiyonu (Haversine formülü)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Dünya yarıçapı (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

module.exports = {
  searchStores,
};

