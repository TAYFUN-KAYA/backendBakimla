const Favorite = require('../models/Favorite');
const Product = require('../models/Product');

/**
 * getFavorites
 * Kullanıcının favori ürünlerini getir
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;

    const favorites = await Favorite.find({ userId })
      .populate('productId')
      .sort({ createdAt: -1 });

    // Sadece aktif ve yayınlanmış ürünleri filtrele
    const validFavorites = favorites.filter(
      (fav) => fav.productId && fav.productId.isActive && fav.productId.isPublished
    );

    res.status(200).json({
      success: true,
      count: validFavorites.length,
      data: validFavorites.map((fav) => ({
        id: fav._id,
        productId: fav.productId._id,
        product: {
          id: fav.productId._id,
          name: fav.productId.name,
          description: fav.productId.description,
          price: fav.productId.price,
          discountPrice: fav.productId.discountPrice,
          discountPercent: fav.productId.discountPercent,
          category: fav.productId.category,
          images: fav.productId.images,
          rating: fav.productId.rating,
          brand: fav.productId.brand,
        },
        addedAt: fav.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get Favorites Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * addToFavorites
 * Favorilere ürün ekle
 */
const addToFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId zorunludur',
      });
    }

    // Ürün var mı kontrol et
    const product = await Product.findById(productId);
    if (!product || !product.isActive || !product.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı veya aktif değil',
      });
    }

    // Zaten favorilerde mi kontrol et
    const existingFavorite = await Favorite.findOne({ userId, productId });
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Bu ürün zaten favorilerinizde',
      });
    }

    const favorite = await Favorite.create({ userId, productId });

    res.status(201).json({
      success: true,
      message: 'Ürün favorilere eklendi',
      data: {
        id: favorite._id,
        productId: favorite.productId,
      },
    });
  } catch (error) {
    console.error('Add to Favorites Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * removeFromFavorites
 * Favorilerden ürün çıkar
 */
const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const favorite = await Favorite.findOneAndDelete({ userId, productId });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Bu ürün favorilerinizde bulunmuyor',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ürün favorilerden çıkarıldı',
    });
  } catch (error) {
    console.error('Remove from Favorites Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * toggleFavorite
 * Favorilere ekle/çıkar (toggle)
 */
const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId zorunludur',
      });
    }

    // Ürün var mı kontrol et
    const product = await Product.findById(productId);
    if (!product || !product.isActive || !product.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı veya aktif değil',
      });
    }

    // Zaten favorilerde mi kontrol et
    const existingFavorite = await Favorite.findOne({ userId, productId });

    if (existingFavorite) {
      // Favorilerden çıkar
      await Favorite.findByIdAndDelete(existingFavorite._id);
      return res.status(200).json({
        success: true,
        message: 'Ürün favorilerden çıkarıldı',
        isFavorite: false,
      });
    } else {
      // Favorilere ekle
      await Favorite.create({ userId, productId });
      return res.status(200).json({
        success: true,
        message: 'Ürün favorilere eklendi',
        isFavorite: true,
      });
    }
  } catch (error) {
    console.error('Toggle Favorite Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * checkFavorite
 * Ürün favorilerde mi kontrol et
 */
const checkFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const favorite = await Favorite.findOne({ userId, productId });

    res.status(200).json({
      success: true,
      isFavorite: !!favorite,
    });
  } catch (error) {
    console.error('Check Favorite Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  checkFavorite,
};
