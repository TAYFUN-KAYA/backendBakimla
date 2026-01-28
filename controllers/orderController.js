const Order = require('../models/Order');
const Basket = require('../models/Basket');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const BakimlaStoreCoupon = require('../models/BakimlaStoreCoupon');
const { usePoints, addPoints } = require('./pointsController');
const { createInvoiceForOrder } = require('./invoiceController');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Address = require('../models/Address');
const Iyzipay = require('iyzipay');
const iyzipay = require('../config/iyzico');
const { ORDER } = require('../constants/paymentMethods');

/**
 * createOrder
 * Sepetten sipariş oluştur
 */
const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddressId, billingAddressId, paymentMethod, couponId, bakimlaStoreCouponId, pointsToUse, saveCard } = req.body;

    if (!shippingAddressId) {
      return res.status(400).json({
        success: false,
        message: 'shippingAddressId zorunludur',
      });
    }

    // Sepeti getir
    const cart = await Basket.findOne({ userId }).populate('items.productId');
    if (!cart) {
      return res.status(400).json({
        success: false,
        message: 'Sepet bulunamadı',
      });
    }

    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sepet boş',
      });
    }

    // Sepet item'larını kontrol et - productId null olmamalı
    const invalidItems = cart.items.filter(item => !item.productId || !item.productId._id);
    if (invalidItems.length > 0) {
      console.error('❌ Invalid items in cart:', invalidItems);
      return res.status(400).json({
        success: false,
        message: 'Sepette geçersiz ürünler bulundu',
      });
    }

    // Sepet toplamını hesapla (populate edilmiş verilerle - daha hızlı)
    // calculateTotal() yerine populate edilmiş product bilgilerini kullan
    let subtotal = 0;
    for (const item of cart.items) {
      if (item.productId && item.productId.isActive && item.productId.isPublished) {
        const price = item.productId.discountPrice || item.productId.price || 0;
        subtotal += price * (item.quantity || 1);
      }
    }

    // Sepet değerlerini güncelle
    cart.subtotal = subtotal;
    cart.total = subtotal - (cart.discount || 0) - ((cart.pointsToUse || 0) * 0.1) + (cart.shippingCost || 0);
    await cart.save();

    const shippingCost = cart.shippingCost || 0;

    if (subtotal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Sepet toplamı geçersiz',
      });
    }

    let discount = 0;
    let finalPointsToUse = 0;
    let appliedCouponId = null;
    let appliedBakimlaStoreCouponId = null;

    // BakimlaStoreCoupon kontrolü (öncelikli)
    if (bakimlaStoreCouponId) {
      const bakimlaCoupon = await BakimlaStoreCoupon.findById(bakimlaStoreCouponId);
      if (bakimlaCoupon && bakimlaCoupon.isActive) {
        const now = new Date();
        // Tarih kontrolü
        if (bakimlaCoupon.startDate <= now && bakimlaCoupon.endDate >= now) {
          // Minimum alışveriş tutarı kontrolü
          if (!bakimlaCoupon.minPurchaseAmount || subtotal >= bakimlaCoupon.minPurchaseAmount) {
            // Kullanım limiti kontrolü
            if (!bakimlaCoupon.usageLimit || bakimlaCoupon.usedCount < bakimlaCoupon.usageLimit) {
              // Kupon indirimini hesapla
              if (bakimlaCoupon.discountType === 'percentage') {
                discount = (subtotal * bakimlaCoupon.discountValue) / 100;
              } else {
                discount = bakimlaCoupon.discountValue;
              }
              // İndirim subtotal'ı geçmemeli
              if (discount > subtotal) {
                discount = subtotal;
              }
              appliedBakimlaStoreCouponId = bakimlaCouponId;
            }
          }
        }
      }
    }

    // Eğer BakimlaStoreCoupon yoksa, eski Coupon kontrolü
    if (!appliedBakimlaStoreCouponId && couponId) {
      const coupon = await Coupon.findById(couponId);
      if (coupon && coupon.isActive) {
        // Kupon indirimini hesapla
        if (coupon.discountType === 'percentage') {
          discount = (subtotal * coupon.discountValue) / 100;
        } else {
          discount = coupon.discountValue;
        }
        // İndirim subtotal'ı geçmemeli
        if (discount > subtotal) {
          discount = subtotal;
        }
        appliedCouponId = couponId;
      }
    }

    // Puan kullanımı
    if (pointsToUse && pointsToUse > 0) {
      try {
        const pointsResult = await usePoints(userId.toString(), pointsToUse, null, null, 'Sipariş için puan kullanıldı');
        if (pointsResult && pointsResult.success) {
          finalPointsToUse = pointsToUse;
          cart.pointsToUse = pointsToUse;
        }
      } catch (pointsError) {
        console.error('❌ Points usage error:', pointsError);
        // Puan hatası siparişi engellemez
        finalPointsToUse = 0;
      }
    }

    // Final toplam hesapla
    const pointsDiscount = finalPointsToUse * 0.1;
    const finalTotal = Math.max(0, subtotal - discount - pointsDiscount + shippingCost);

    // Order items oluştur - güvenli erişim
    const orderItems = cart.items.map((item) => {
      if (!item.productId || !item.productId._id) {
        throw new Error('Geçersiz ürün bilgisi');
      }

      const unitPrice = item.productId.price || 0;
      const quantity = item.quantity || 1;
      const productName = item.productId.name || 'Ürün';

      return {
        productId: item.productId._id,
        productName: productName,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: unitPrice * quantity,
        options: item.options || {},
      };
    });

    // OrderNumber oluştur (unique olması için kontrol et)
    let orderNumber;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      orderNumber = `ORD-${timestamp}-${random}`;
      
      // Unique kontrolü
      const existingOrder = await Order.findOne({ orderNumber });
      if (!existingOrder) {
        isUnique = true;
      } else {
        attempts++;
        // Kısa bir bekleme ekle (aynı timestamp'den kaynaklanan duplicate'i önlemek için)
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    if (!isUnique) {
      throw new Error('Order number oluşturulamadı');
    }

    console.log('📝 Creating order with orderNumber:', orderNumber);

    // Sipariş oluştur - orderNumber'ı direkt ver
    let order;
    try {
      order = await Order.create({
        userId,
        orderNumber: orderNumber, // Manuel olarak set ediyoruz
        items: orderItems,
        subtotal: subtotal,
        discount: discount,
        pointsUsed: finalPointsToUse,
        shippingCost: shippingCost,
        total: finalTotal,
        shippingAddress: shippingAddressId,
        billingAddress: billingAddressId || shippingAddressId,
        paymentMethod: paymentMethod || ORDER.CARD,
        paymentStatus: paymentMethod === ORDER.CASH_ON_DELIVERY ? 'pending' : 'pending',
        status: 'pending',
        couponId: appliedCouponId || undefined,
        bakimlaStoreCouponId: appliedBakimlaStoreCouponId || undefined,
      });

      // OrderNumber'ın düzgün oluşturulduğunu kontrol et
      if (!order.orderNumber || order.orderNumber === '') {
        console.error('❌ Order created but orderNumber is missing!');
        // Yeniden yükle
        order = await Order.findById(order._id);
        if (!order.orderNumber) {
          // Son çare: manuel set et
          order.orderNumber = orderNumber;
          await order.save();
        }
      }

      console.log('✅ Order created with orderNumber:', order.orderNumber, 'ID:', order._id);
    } catch (createError) {
      console.error('❌ Order creation error:', createError);
      // Eğer unique constraint hatası ise, yeni orderNumber dene
      if (createError.code === 11000 || createError.message.includes('duplicate')) {
        console.log('⚠️ Duplicate orderNumber detected, retrying...');
        // Yeni orderNumber ile tekrar dene
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        orderNumber = `ORD-${timestamp}-${random}`;
        
        order = await Order.create({
          userId,
          orderNumber: orderNumber,
          items: orderItems,
          subtotal: subtotal,
          discount: discount,
          pointsUsed: finalPointsToUse,
          shippingCost: shippingCost,
          total: finalTotal,
          shippingAddress: shippingAddressId,
          billingAddress: billingAddressId || shippingAddressId,
          paymentMethod: paymentMethod || ORDER.CARD,
          paymentStatus: paymentMethod === ORDER.CASH_ON_DELIVERY ? 'pending' : 'pending',
          status: 'pending',
          couponId: appliedCouponId || undefined,
          bakimlaStoreCouponId: appliedBakimlaStoreCouponId || undefined,
        });
        console.log('✅ Order created with new orderNumber:', order.orderNumber);
      } else {
        throw createError;
      }
    }

    // BakimlaStoreCoupon kullanım sayısını artır
    if (appliedBakimlaStoreCouponId) {
      await BakimlaStoreCoupon.findByIdAndUpdate(appliedBakimlaStoreCouponId, {
        $inc: { usedCount: 1 }
      });
    }

    // Sepeti temizle
    cart.items = [];
    cart.subtotal = 0;
    cart.discount = 0;
    cart.pointsToUse = 0;
    cart.total = 0;
    cart.couponId = undefined;
    await cart.save();

    // Ödeme yöntemi card ise ödeme başlat
    if (paymentMethod === ORDER.CARD) {
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
    console.error('❌ Create Order Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Sipariş oluşturulurken bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
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
 * processOrderPayment
 * Sipariş için Iyzico ödeme işlemi
 */
const processOrderPayment = async (req, res) => {
  try {
    console.log('💳 Process Order Payment Request:', JSON.stringify(req.body, null, 2));
    
    // 🎭 DEMO MODE - Skip Iyzico API calls if enabled
    const DEMO_MODE = process.env.DEMO_MODE === 'true' || true; // Temporarily hardcoded
    
    if (DEMO_MODE) {
      console.log('🎭 DEMO MODE ACTIVE - Simulating successful payment');
    }
    
    const userId = req.user._id;
    const { orderId } = req.params;
    const { 
      installment = 1,
      cardToken, // If using saved card
      cardInfo, // If using new card
      saveCard // Boolean to save card after payment
    } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId zorunludur',
      });
    }

    // Order'ı getir ve populate et
    const order = await Order.findById(orderId)
      .populate('userId')
      .populate('shippingAddress')
      .populate('billingAddress')
      .populate('items.productId');
    
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

    const user = order.userId;
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    // Address bilgilerini al
    const shippingAddr = order.shippingAddress;
    if (!shippingAddr) {
      return res.status(400).json({
        success: false,
        message: 'Teslimat adresi bulunamadı',
      });
    }

    // Ödeme için companyId gerekli (ürünlerin sahibi)
    const firstProduct = order.items[0]?.productId;
    if (!firstProduct || !firstProduct.companyId) {
      return res.status(400).json({
        success: false,
        message: 'Ürün bilgisi bulunamadı',
      });
    }

    const companyId = firstProduct.companyId;

    // Prepare payment request
    const conversationId = `ORDER_${orderId}_${Date.now()}`;
    const basketId = `BASKET_${orderId}`;

    // Buyer information
    const buyer = {
      id: userId.toString(),
      name: user.firstName || shippingAddr.firstName || 'Ad',
      surname: user.lastName || shippingAddr.lastName || 'Soyad',
      gsmNumber: user.phoneNumber || shippingAddr.phoneNumber || '+905555555555',
      email: user.email,
      identityNumber: '11111111111', // Test için
      registrationAddress: shippingAddr.addressLine1 || 'Istanbul, Turkey',
      ip: req.ip || '85.34.78.112',
      city: shippingAddr.city || 'Istanbul',
      country: shippingAddr.country || 'Turkey',
      zipCode: shippingAddr.postalCode || '34000'
    };

    // Billing address
    const billingAddr = order.billingAddress || shippingAddr;
    const billingAddress = {
      contactName: `${billingAddr.firstName || ''} ${billingAddr.lastName || ''}`.trim(),
      city: billingAddr.city || 'Istanbul',
      country: billingAddr.country || 'Turkey',
      address: billingAddr.addressLine1 || 'Istanbul, Turkey',
      zipCode: billingAddr.postalCode || '34000'
    };

    // Shipping address
    const shippingAddress = {
      contactName: `${shippingAddr.firstName || ''} ${shippingAddr.lastName || ''}`.trim(),
      city: shippingAddr.city || 'Istanbul',
      country: shippingAddr.country || 'Turkey',
      address: shippingAddr.addressLine1 || 'Istanbul, Turkey',
      zipCode: shippingAddr.postalCode || '34000'
    };

    // Basket items (products)
    const basketItems = order.items.map((item) => ({
      id: item.productId._id.toString(),
      name: item.productName || item.productId?.name || 'Ürün',
      category1: item.productId?.category || 'Kozmetik',
      itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
      price: (item.unitPrice * item.quantity).toFixed(2)
    }));

    // Payment card
    let paymentCard;
    if (cardToken) {
      // Use saved card
      paymentCard = {
        cardToken: cardToken,
        cardUserKey: user.iyzicoCardUserKey
      };
    } else if (cardInfo) {
      // Use new card
      paymentCard = {
        cardHolderName: cardInfo.cardHolderName,
        cardNumber: cardInfo.cardNumber,
        expireMonth: cardInfo.expireMonth,
        expireYear: cardInfo.expireYear,
        cvc: cardInfo.cvc
      };

      // If saveCard is true, register the card
      if (saveCard) {
        paymentCard.registerCard = '1';
        if (!user.iyzicoCardUserKey) {
          paymentCard.cardUserKey = `card_user_${userId}_${Date.now()}`;
        } else {
          paymentCard.cardUserKey = user.iyzicoCardUserKey;
        }
        paymentCard.cardAlias = cardInfo.cardAlias || `Kart ${Date.now()}`;
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Kart bilgisi gerekli',
      });
    }

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: conversationId,
      price: order.total.toFixed(2),
      paidPrice: order.total.toFixed(2),
      currency: Iyzipay.CURRENCY.TRY,
      installment: installment || 1,
      basketId: basketId,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      paymentCard: paymentCard,
      buyer: buyer,
      shippingAddress: shippingAddress,
      billingAddress: billingAddress,
      basketItems: basketItems
    };

    console.log('📤 Sending payment request to Iyzico:', JSON.stringify(request, null, 2));

    // Handle successful payment
    const handlePaymentSuccess = async (result) => {
      try {
        // Payment kaydı oluştur
        const payment = await Payment.create({
          companyId: companyId,
          orderId: order._id,
          paymentId: result.paymentId,
          conversationId: conversationId,
          price: order.total,
          currency: 'TRY',
          paymentStatus: 'success',
          iyzicoResponse: result,
          buyerInfo: buyer,
          cardInfo: {
            cardType: result.cardType,
            cardAssociation: result.cardAssociation,
            cardFamily: result.cardFamily,
            binNumber: result.binNumber,
            lastFourDigits: result.lastFourDigits,
          },
          installment: installment || 1,
        });

        // Order'ı güncelle
        order.paymentStatus = 'paid';
        order.paymentId = payment._id;
        order.status = 'confirmed';
        await order.save();

        // Puan ekle (sipariş tutarının %10'u)
        const pointsToEarn = Math.floor(order.total * 0.10);
        if (pointsToEarn > 0) {
          await addPoints(
            userId.toString(), 
            pointsToEarn, 
            'order', 
            order._id.toString(), 
            'Sipariş için puan kazandınız'
          );
        }

        // Fatura oluştur
        try {
          await createInvoiceForOrder(order._id.toString());
        } catch (invoiceError) {
          console.error('Invoice creation error:', invoiceError);
          // Fatura hatası ödemeyi etkilemez
        }

        // Save card user key if new card was registered
        if (result.cardUserKey && !user.iyzicoCardUserKey) {
          user.iyzicoCardUserKey = result.cardUserKey;
          await user.save();
        }

        return res.json({
          success: true,
          message: 'Ödeme başarılı',
          order: order,
          paymentId: payment._id,
          pointsEarned: pointsToEarn,
          cardSaved: result.cardUserKey ? true : false
        });
      } catch (dbError) {
        console.error('Database error after payment:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Ödeme alındı ancak sipariş güncellenemedi',
          error: dbError.message
        });
      }
    };

    // 🎭 DEMO MODE - Simulate successful payment
    if (DEMO_MODE) {
      console.log('🎭 Simulating successful Iyzico response...');
      const simulatedResult = {
        status: 'success',
        paymentId: `DEMO_${Date.now()}`,
        conversationId: conversationId,
        cardUserKey: saveCard ? `demo_card_user_${userId}` : undefined,
        cardType: 'CREDIT_CARD',
        cardAssociation: 'MASTER_CARD',
        cardFamily: 'Bonus',
        binNumber: cardInfo?.cardNumber?.substring(0, 6) || '540667',
        lastFourDigits: cardInfo?.cardNumber?.substring(cardInfo.cardNumber.length - 4) || '1234',
      };
      
      await handlePaymentSuccess(simulatedResult);
      return;
    }

    // Process payment with Iyzico
    iyzipay.payment.create(request, async (err, result) => {
      if (err) {
        console.error('❌ Iyzico payment error:', err);
        return res.status(500).json({
          success: false,
          message: 'Ödeme işlemi başarısız',
          error: err
        });
      }

      console.log('📥 Iyzico payment response:', JSON.stringify(result, null, 2));

      if (result.status === 'success') {
        console.log('✅ Payment successful!');
        await handlePaymentSuccess(result);
      } else {
        console.error('❌ Payment failed:', result.errorMessage, result.errorCode);
        
        // Payment kaydı oluştur (failed)
        try {
          await Payment.create({
            companyId: companyId,
            orderId: order._id,
            conversationId: conversationId,
            price: order.total,
            currency: 'TRY',
            paymentStatus: 'failed',
            iyzicoResponse: result,
            errorMessage: result.errorMessage,
            errorCode: result.errorCode,
            installment: installment || 1,
          });
        } catch (paymentError) {
          console.error('Failed payment record creation error:', paymentError);
        }

        return res.status(400).json({
          success: false,
          message: result.errorMessage || 'Ödeme başarısız',
          errorCode: result.errorCode
        });
      }
    });
  } catch (error) {
    console.error('❌ Process Order Payment error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu',
      error: error.message
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
  processOrderPayment,
  completeOrderPayment, // Internal
};

