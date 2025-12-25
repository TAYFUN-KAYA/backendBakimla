const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * getCart
 * Sepeti getir
 */
const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [],
        subtotal: 0,
        discount: 0,
        pointsToUse: 0,
        shippingCost: 0,
        total: 0,
      });
    } else {
      // Sepet toplamını güncelle
      await cart.calculateTotal();
    }

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error('Get Cart Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * addToCart
 * Sepete ürün ekle
 */
const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1, options } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId zorunludur',
      });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive || !product.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı veya aktif değil',
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [],
        subtotal: 0,
        discount: 0,
        pointsToUse: 0,
        shippingCost: 0,
        total: 0,
      });
    }

    // Ürün zaten sepette var mı kontrol et
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (existingItemIndex > -1) {
      // Miktarı güncelle
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Yeni ürün ekle
      cart.items.push({
        productId,
        quantity,
        options,
        addedAt: new Date(),
      });
    }

    await cart.calculateTotal();
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Ürün sepete eklendi',
      data: cart,
    });
  } catch (error) {
    console.error('Add to Cart Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateCartItem
 * Sepet ürününü güncelle
 */
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;
    const { quantity, options } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Sepet bulunamadı',
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Sepet ürünü bulunamadı',
      });
    }

    if (quantity !== undefined) {
      if (quantity <= 0) {
        // Ürünü sepetten çıkar
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
    }

    if (options !== undefined) {
      cart.items[itemIndex].options = options;
    }

    await cart.calculateTotal();
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Sepet güncellendi',
      data: cart,
    });
  } catch (error) {
    console.error('Update Cart Item Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * removeFromCart
 * Sepetten ürün çıkar
 */
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Sepet bulunamadı',
      });
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== itemId
    );

    await cart.calculateTotal();
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Ürün sepetten çıkarıldı',
      data: cart,
    });
  } catch (error) {
    console.error('Remove from Cart Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * clearCart
 * Sepeti temizle
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Sepet bulunamadı',
      });
    }

    cart.items = [];
    cart.subtotal = 0;
    cart.discount = 0;
    cart.pointsToUse = 0;
    cart.shippingCost = 0;
    cart.total = 0;
    cart.couponId = undefined;
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Sepet temizlendi',
      data: cart,
    });
  } catch (error) {
    console.error('Clear Cart Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};

