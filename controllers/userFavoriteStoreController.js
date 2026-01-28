const UserFavoriteStore = require('../models/UserFavoriteStore');
const Store = require('../models/Store');

/**
 * getUserFavoriteStores
 * Kullanıcının favori işletmelerini getir (sıralı)
 */
const getUserFavoriteStores = async (req, res) => {
  try {
    const userId = req.user._id;

    const favorites = await UserFavoriteStore.find({ userId })
      .populate('storeId')
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: favorites.length,
      data: favorites
        .filter(fav => fav.storeId) // Null storeId'leri filtrele
        .map(fav => ({
          id: fav._id,
          storeId: fav.storeId._id || fav.storeId,
          order: fav.order,
          store: fav.storeId ? {
            id: fav.storeId._id,
            storeName: fav.storeId.storeName,
            businessName: fav.storeId.businessName,
            businessDescription: fav.storeId.businessDescription,
            appIcon: fav.storeId.appIcon,
            interiorImage: fav.storeId.interiorImage,
            interiorImages: fav.storeId.interiorImages || (fav.storeId.interiorImage ? [fav.storeId.interiorImage] : []),
            serviceImages: fav.storeId.serviceImages || [],
            services: fav.storeId.services || [],
            address: fav.storeId.address,
            location: fav.storeId.location,
            companyId: fav.storeId.companyId,
          } : null,
          createdAt: fav.createdAt,
        })),
    });
  } catch (error) {
    console.error('Get User Favorite Stores Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllStores
 * Tüm işletmeleri getir (favori seçimi için)
 */
const getAllStores = async (req, res) => {
  try {
    const userId = req.user._id;
    const { search, category } = req.query;

    // Query oluştur
    const query = {};
    if (search) {
      query.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { businessDescription: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) {
      query.businessField = category;
    }

    const stores = await Store.find(query)
      .populate('companyId', 'firstName lastName email phoneNumber profileImage')
      .sort({ createdAt: -1 })
      .limit(100);

    // Kullanıcının favori işletmelerini getir
    const userFavorites = await UserFavoriteStore.find({ userId })
      .select('storeId order');

    const favoriteStoreIds = new Set(userFavorites.map(fav => fav.storeId.toString()));
    const favoriteOrders = {};
    userFavorites.forEach(fav => {
      favoriteOrders[fav.storeId.toString()] = fav.order;
    });

    res.status(200).json({
      success: true,
      count: stores.length,
      data: stores.map(store => ({
        id: store._id,
        storeName: store.storeName,
        businessName: store.businessName,
        businessDescription: store.businessDescription,
        appIcon: store.appIcon,
        interiorImage: store.interiorImage,
        interiorImages: store.interiorImages || (store.interiorImage ? [store.interiorImage] : []),
        serviceImages: store.serviceImages || [],
        services: store.services || [],
        address: store.address,
        location: store.location,
        businessField: store.businessField,
        sectors: store.sectors || [],
        companyId: store.companyId?._id || store.companyId,
        companyName: store.companyId?.firstName 
          ? `${store.companyId.firstName} ${store.companyId.lastName || ''}`.trim()
          : 'İşletme',
        isFavorite: favoriteStoreIds.has(store._id.toString()),
        favoriteOrder: favoriteOrders[store._id.toString()] || null,
      })),
    });
  } catch (error) {
    console.error('Get All Stores Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * addFavoriteStore
 * Favori işletme ekle
 */
const addFavoriteStore = async (req, res) => {
  try {
    const userId = req.user._id;
    const { storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'storeId zorunludur',
      });
    }

    // İşletme var mı kontrol et
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'İşletme bulunamadı',
      });
    }

    // Zaten favorilerde mi kontrol et
    const existingFavorite = await UserFavoriteStore.findOne({ userId, storeId });
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Bu işletme zaten favorilerinizde',
      });
    }

    // Kullanıcının mevcut favori sayısını kontrol et
    const favoriteCount = await UserFavoriteStore.countDocuments({ userId });
    if (favoriteCount >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maksimum 5 favori işletme seçebilirsiniz',
      });
    }

    // Yeni sıra numarası (mevcut maksimum + 1)
    const maxOrder = await UserFavoriteStore.findOne({ userId })
      .sort({ order: -1 })
      .select('order');
    const newOrder = (maxOrder?.order || 0) + 1;

    const favorite = await UserFavoriteStore.create({
      userId,
      storeId,
      order: newOrder,
    });

    await favorite.populate('storeId');

    res.status(201).json({
      success: true,
      message: 'İşletme favorilere eklendi',
      data: {
        id: favorite._id,
        storeId: favorite.storeId._id,
        order: favorite.order,
        store: favorite.storeId,
      },
    });
  } catch (error) {
    console.error('Add Favorite Store Error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * removeFavoriteStore
 * Favori işletmeyi kaldır
 */
const removeFavoriteStore = async (req, res) => {
  try {
    const userId = req.user._id;
    const { storeId } = req.params;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'storeId zorunludur',
      });
    }

    // Favoriyi bul ve sil
    const favorite = await UserFavoriteStore.findOneAndDelete({ userId, storeId });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favori işletme bulunamadı',
      });
    }

    // Kalan favorilerin sıralarını güncelle
    const remainingFavorites = await UserFavoriteStore.find({ userId })
      .sort({ order: 1 });
    
    for (let i = 0; i < remainingFavorites.length; i++) {
      remainingFavorites[i].order = i + 1;
      await remainingFavorites[i].save();
    }

    res.status(200).json({
      success: true,
      message: 'İşletme favorilerden kaldırıldı',
    });
  } catch (error) {
    console.error('Remove Favorite Store Error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateFavoriteStoresOrder
 * Favori işletmelerin sırasını güncelle (toplu)
 */
const updateFavoriteStoresOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { stores } = req.body; // [{ storeId, order }, ...]

    if (!stores || !Array.isArray(stores)) {
      return res.status(400).json({
        success: false,
        message: 'stores array zorunludur',
      });
    }

    // Maksimum 5 kontrolü
    if (stores.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maksimum 5 favori işletme seçebilirsiniz',
      });
    }

    // Tüm favorileri sil
    await UserFavoriteStore.deleteMany({ userId });

    // Yeni favorileri ekle
    const favorites = stores.map(({ storeId, order }) => ({
      userId,
      storeId,
      order,
    }));

    await UserFavoriteStore.insertMany(favorites);

    res.status(200).json({
      success: true,
      message: 'Favori işletmeler güncellendi',
      count: favorites.length,
    });
  } catch (error) {
    console.error('Update Favorite Stores Order Error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getUserFavoriteStores,
  getAllStores,
  addFavoriteStore,
  removeFavoriteStore,
  updateFavoriteStoresOrder,
};
