const Favorite = require('../models/Favorite');
const Store = require('../models/Store');
const Product = require('../models/Product');

/**
 * addFavorite
 * Favori ekle
 */
const addFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { favoriteType, storeId, productId } = req.body;

    if (!favoriteType || (!storeId && !productId)) {
      return res.status(400).json({
        success: false,
        message: 'favoriteType ve storeId veya productId zorunludur',
      });
    }

    // Daha önce eklenmiş mi kontrol et
    const existingFavorite = await Favorite.findOne({
      userId,
      favoriteType,
      ...(storeId ? { storeId } : { productId }),
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Bu öğe zaten favorilerinizde',
      });
    }

    // Store/Product var mı kontrol et
    if (storeId) {
      const store = await Store.findById(storeId);
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'İşletme bulunamadı',
        });
      }

      // Favori işletme limiti kontrolü (max 5)
      if (favoriteType === 'store') {
        const storeFavoriteCount = await Favorite.countDocuments({
          userId,
          favoriteType: 'store',
        });

        if (storeFavoriteCount >= 5) {
          return res.status(400).json({
            success: false,
            message: 'En fazla 5 favori işletme ekleyebilirsiniz',
          });
        }
      }
    }

    if (productId) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Ürün bulunamadı',
        });
      }
    }

    const favorite = await Favorite.create({
      userId,
      favoriteType,
      storeId: favoriteType === 'store' ? storeId : undefined,
      productId: favoriteType === 'product' ? productId : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Favoriye eklendi',
      data: favorite,
    });
  } catch (error) {
    console.error('Add Favorite Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * removeFavorite
 * Favoriden çıkar
 */
const removeFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const favorite = await Favorite.findOneAndDelete({ _id: id, userId });
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favori bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Favoriden çıkarıldı',
    });
  } catch (error) {
    console.error('Remove Favorite Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getFavorites
 * Favorileri listele
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const { favoriteType, page = 1, limit = 20 } = req.query;

    const query = { userId };
    if (favoriteType) {
      query.favoriteType = favoriteType;
    }

    const favorites = await Favorite.find(query)
      .populate('storeId', 'storeName appIcon sectors')
      .populate('productId', 'name images price category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Favorite.countDocuments(query);

    res.status(200).json({
      success: true,
      count: favorites.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: favorites,
    });
  } catch (error) {
    console.error('Get Favorites Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
};

