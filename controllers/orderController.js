const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { usePoints, addPoints } = require('./pointsController');
const { createInvoiceForOrder } = require('./invoiceController');
const Payment = require('../models/Payment');
const iyzipay = require('../config/iyzico');

/**
 * createOrder
 * Sepetten sipariş oluştur
 */
const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddressId, billingAddressId, paymentMethod, couponId, pointsToUse, saveCard } = req.body;

    if (!shippingAddressId) {
      return res.status(400).json({
        success: false,
        message: 'shippingAddressId zorunludur',
      });
    }

    // Sepeti getir
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sepet boş',
      });
    }

    // Sepet toplamını güncelle
    await cart.calculateTotal();

    let discount = 0;
    let finalPointsToUse = 0;

    // Kupon kontrolü
    if (couponId) {
      const coupon = await Coupon.findById(couponId);
      if (coupon && coupon.isActive) {
        // Kupon indirimini hesapla
        if (coupon.discountType === 'percentage') {
          discount = (cart.subtotal * coupon.discountValue) / 100;
        } else {
          discount = coupon.discountValue;
        }
        cart.couponId = couponId;
        cart.discount = discount;
      }
    }

    // Puan kullanımı
    if (pointsToUse && pointsToUse > 0) {
      const pointsResult = await usePoints(userId, pointsToUse, null, null, 'Sipariş için puan kullanıldı');
      if (pointsResult.success) {
        finalPointsToUse = pointsToUse;
        cart.pointsToUse = pointsToUse;
      }
    }

    // Final toplam
    const finalTotal = cart.subtotal - discount - (finalPointsToUse * 0.1) + cart.shippingCost;

    // Sipariş oluştur
    const order = await Order.create({
      userId,
      items: cart.items.map((item) => ({
        productId: item.productId._id,
        productName: item.productId.name,
        quantity: item.quantity,
        unitPrice: item.productId.price,
        totalPrice: item.productId.price * item.quantity,
        options: item.options,
      })),
      subtotal: cart.subtotal,
      discount,
      pointsUsed: finalPointsToUse,
      shippingCost: cart.shippingCost,
      total: finalTotal,
      shippingAddress: shippingAddressId,
      billingAddress: billingAddressId || shippingAddressId,
      paymentMethod: paymentMethod || 'card',
      paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending',
      status: 'pending',
      couponId: cart.couponId,
    });

    // Sepeti temizle
    cart.items = [];
    cart.subtotal = 0;
    cart.discount = 0;
    cart.pointsToUse = 0;
    cart.total = 0;
    cart.couponId = undefined;
    await cart.save();

    // Ödeme yöntemi card ise ödeme başlat
    if (paymentMethod === 'card') {
      // Ödeme için orderId'yi döndür, frontend'de ödeme ekranına yönlendir
      return res.status(201).json({
        success: true,
        message: 'Sipariş oluşturuldu, ödeme bekleniyor',
        data: order,
        requiresPayment: true,
        orderId: order._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Sipariş oluşturuldu',
      data: order,
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getOrders
 * Kullanıcının siparişlerini listele
 */
const getOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('items.productId', 'name images')
      .populate('shippingAddress')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    console.error('Get Orders Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getOrder
 * Sipariş detayını getir
 */
const getOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, userId })
      .populate('items.productId')
      .populate('shippingAddress')
      .populate('billingAddress')
      .populate('couponId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get Order Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * cancelOrder
 * Sipariş iptal et
 */
const cancelOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const order = await Order.findOne({ _id: id, userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı',
      });
    }

    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Kargoya verilmiş veya teslim edilmiş siparişler iptal edilemez',
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = cancellationReason;
    await order.save();

    // Kullanılan puanları geri ver
    if (order.pointsUsed > 0) {
      // Puan iade işlemi burada yapılabilir
    }

    res.status(200).json({
      success: true,
      message: 'Sipariş iptal edildi',
      data: order,
    });
  } catch (error) {
    console.error('Cancel Order Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * initializeOrderPayment
 * Sipariş için ödeme başlat
 */
const initializeOrderPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;
    const { cardInfo, installment = 1 } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId zorunludur',
      });
    }

    const order = await Order.findById(orderId).populate('userId');
    if (!order || order.userId._id.toString() !== userId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı',
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Bu sipariş zaten ödenmiş',
      });
    }

    // Ödeme için companyId gerekli (ürünlerin sahibi)
    // Product'lardan companyId al
    const firstProduct = await Product.findById(order.items[0]?.productId);
    if (!firstProduct) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı',
      });
    }

    const companyId = firstProduct.companyId;

    // Payment controller'daki initializePayment fonksiyonunu kullan
    const { initializePayment } = require('./paymentController');
    
    // Request'i payment controller formatına çevir
    const originalBody = req.body;
    req.body = {
      companyId: companyId.toString(),
      orderId: orderId,
      price: order.total,
      currency: 'TRY',
      installment,
      buyerId: null,
      buyerInfo: {
        name: order.userId.firstName,
        surname: order.userId.lastName,
        email: order.userId.email,
        phoneNumber: order.userId.phoneNumber,
        identityNumber: '11111111111', // Gerekirse user'dan alınabilir
        city: 'Istanbul',
        country: 'Turkey',
      },
      cardInfo: cardInfo || originalBody.cardInfo || {
        cardNumber: '5890040000000016', // Test kartı
        expireMonth: '12',
        expireYear: '2030',
        cvc: '123',
        cardHolderName: `${order.userId.firstName} ${order.userId.lastName}`,
      },
    };

    // Ödeme başlat
    return initializePayment(req, res);
  } catch (error) {
    console.error('Initialize Order Payment Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * completeOrderPayment
 * Sipariş ödemesini tamamla (internal use - payment callback'ten çağrılır)
 */
const completeOrderPayment = async (orderId, paymentId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: 'Sipariş bulunamadı' };
    }

    order.paymentStatus = 'paid';
    order.paymentId = paymentId;
    order.status = 'confirmed';
    await order.save();

    // Puan ekle (sipariş tutarının %10'u)
    if (order.total > 0) {
      await addPoints(order.userId.toString(), order.total, 'order', order._id, 'Sipariş için puan kazandınız');
    }

    // Fatura oluştur
    await createInvoiceForOrder(orderId);

    return { success: true, order };
  } catch (error) {
    console.error('Complete Order Payment Error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  initializeOrderPayment,
  completeOrderPayment, // Internal
};

