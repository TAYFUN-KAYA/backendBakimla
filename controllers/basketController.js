const Basket = require('../models/Basket');
const Product = require('../models/Product');

/**
 * getBasket
 * Sepeti getir
 */
const getBasket = async (req, res) => {
  try {
    const userId = req.user._id;

    let basket = await Basket.findOne({ userId }).populate('items.productId');

    if (!basket) {
      basket = await Basket.create({
        userId,
        items: [],
        subtotal: 0,
        discount: 0,
        pointsToUse: 0,
        shippingCost: 0,
        total: 0,
      });
    } else {
      await basket.calculateTotal();
    }

    res.status(200).json({
      success: true,
      data: basket,
    });
  } catch (error) {
    console.error('Get Basket Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * addToBasket
 * Sepete ürün ekle
 */
const addToBasket = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1, options } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId zorunludur',
      });
    }

    console.log('Adding to basket, productId:', productId);
    
    const product = await Product.findById(productId);
    console.log('Found product:', product ? product.name : 'NOT FOUND', 'isActive:', product?.isActive, 'isPublished:', product?.isPublished);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı',
      });
    }
    
    if (!product.isActive || !product.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Bu ürün şu anda satışta değil',
      });
    }

    let basket = await Basket.findOne({ userId });

    if (!basket) {
      basket = await Basket.create({
        userId,
        items: [],
        subtotal: 0,
        discount: 0,
        pointsToUse: 0,
        shippingCost: 0,
        total: 0,
      });
    }

    const existingItemIndex = basket.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (existingItemIndex > -1) {
      basket.items[existingItemIndex].quantity += quantity;
    } else {
      basket.items.push({
        productId,
        quantity,
        options,
        addedAt: new Date(),
      });
    }

    await basket.calculateTotal();
    await basket.save();

    await basket.populate('items.productId');

    res.status(200).json({
      success: true,
      message: 'Ürün sepete eklendi',
      data: basket,
    });
  } catch (error) {
    console.error('Add to Basket Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateBasketItem
 * Sepet ürününü güncelle
 */
const updateBasketItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;
    const { quantity, options } = req.body;

    const basket = await Basket.findOne({ userId });
    if (!basket) {
      return res.status(404).json({
        success: false,
        message: 'Sepet bulunamadı',
      });
    }

    const itemIndex = basket.items.findIndex(
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
        basket.items.splice(itemIndex, 1);
      } else {
        basket.items[itemIndex].quantity = quantity;
      }
    }

    if (options !== undefined) {
      basket.items[itemIndex].options = options;
    }

    await basket.calculateTotal();
    await basket.save();

    await basket.populate('items.productId');

    res.status(200).json({
      success: true,
      message: 'Sepet güncellendi',
      data: basket,
    });
  } catch (error) {
    console.error('Update Basket Item Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * removeFromBasket
 * Sepetten ürün çıkar
 */
const removeFromBasket = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    const basket = await Basket.findOne({ userId });
    if (!basket) {
      return res.status(404).json({
        success: false,
        message: 'Sepet bulunamadı',
      });
    }

    basket.items = basket.items.filter(
      (item) => item._id.toString() !== itemId
    );

    await basket.calculateTotal();
    await basket.save();

    await basket.populate('items.productId');

    res.status(200).json({
      success: true,
      message: 'Ürün sepetten çıkarıldı',
      data: basket,
    });
  } catch (error) {
    console.error('Remove from Basket Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * clearBasket
 * Sepeti temizle
 */
const clearBasket = async (req, res) => {
  try {
    const userId = req.user._id;

    const basket = await Basket.findOne({ userId });
    if (!basket) {
      return res.status(404).json({
        success: false,
        message: 'Sepet bulunamadı',
      });
    }

    basket.items = [];
    basket.subtotal = 0;
    basket.discount = 0;
    basket.pointsToUse = 0;
    basket.shippingCost = 0;
    basket.total = 0;
    basket.couponId = undefined;
    await basket.save();

    await basket.populate('items.productId');

    res.status(200).json({
      success: true,
      message: 'Sepet temizlendi',
      data: basket,
    });
  } catch (error) {
    console.error('Clear Basket Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getBasket,
  addToBasket,
  updateBasketItem,
  removeFromBasket,
  clearBasket,
};
