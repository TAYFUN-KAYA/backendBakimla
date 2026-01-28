const iyzipay = require('../config/iyzico');
const Iyzipay = require('iyzipay');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { APPOINTMENT } = require('../constants/paymentMethods');
const Appointment = require('../models/Appointment');
const UserCampaign = require('../models/UserCampaign');
const UserCoupon = require('../models/UserCoupon');
const Campaign = require('../models/Campaign');
const Coupon = require('../models/Coupon');
const Store = require('../models/Store');
const Service = require('../models/Service');
const { Points, PointsTransaction } = require('../models/Points');
const { usePoints } = require('./pointsController');

// Get installment info
exports.getInstallmentInfo = async (req, res) => {
  try {
    const { binNumber, price } = req.body;

    console.log('📊 Installment Info Request:', { binNumber, price });

    if (!binNumber || !price) {
        return res.status(400).json({
          success: false,
        message: 'BIN numarası ve fiyat gerekli'
      });
    }

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: `${Date.now()}`,
      binNumber: binNumber,
      price: price.toString()
    };

    console.log('📤 Sending to Iyzico:', request);

    iyzipay.installmentInfo.retrieve(request, (err, result) => {
      if (err) {
        console.error('❌ Iyzico installment info error:', err);
        return res.status(500).json({
          success: false,
          message: 'Taksit bilgileri alınamadı',
          error: err
        });
      }

      console.log('📥 Iyzico Response:', JSON.stringify(result, null, 2));

      if (result.status === 'success') {
        return res.json({
        success: true,
          installmentDetails: result.installmentDetails || []
        });
      } else {
        console.error('❌ Iyzico returned error:', result.errorMessage, result.errorCode);
      return res.status(400).json({
        success: false,
          message: result.errorMessage || 'Taksit bilgileri alınamadı',
          errorCode: result.errorCode
        });
      }
    });
        } catch (error) {
    console.error('Get installment info error:', error);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu',
      error: error.message
    });
  }
};

// Get user's saved cards
exports.getSavedCards = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Get saved cards from Iyzico
    if (user.iyzicoCardUserKey) {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: userId.toString(),
        cardUserKey: user.iyzicoCardUserKey
      };

      iyzipay.cardList.retrieve(request, (err, result) => {
        if (err) {
          console.error('Iyzico card list error:', err);
          return res.status(500).json({
          success: false,
            message: 'Kartlar getirilemedi',
            error: err
          });
        }

        if (result.status === 'success') {
          return res.json({
          success: true,
            cards: result.cardDetails || []
      });
    } else {
          return res.json({
        success: true,
            cards: []
          });
        }
      });
      } else {
      return res.json({
      success: true,
        cards: []
      });
    }
  } catch (error) {
    console.error('Get saved cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu',
      error: error.message
    });
  }
};

// Save a new card
exports.saveCard = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cardAlias, cardHolderName, cardNumber, expireMonth, expireYear } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Create card user key if not exists
    let cardUserKey = user.iyzicoCardUserKey;
    if (!cardUserKey) {
      cardUserKey = `card_user_${userId}_${Date.now()}`;
      user.iyzicoCardUserKey = cardUserKey;
      await user.save();
    }

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: userId.toString(),
      email: user.email,
      externalId: userId.toString(),
      cardUserKey: cardUserKey,
      card: {
        cardAlias: cardAlias,
        cardHolderName: cardHolderName,
        cardNumber: cardNumber,
        expireMonth: expireMonth,
        expireYear: expireYear
      }
    };

    iyzipay.card.create(request, (err, result) => {
      if (err) {
        console.error('Iyzico save card error:', err);
        return res.status(500).json({
          success: false,
          message: 'Kart kaydedilemedi',
          error: err
        });
      }

      if (result.status === 'success') {
        return res.json({
          success: true,
          message: 'Kart başarıyla kaydedildi',
          cardToken: result.cardToken,
          cardUserKey: result.cardUserKey
        });
      } else {
      return res.status(400).json({
        success: false,
          message: result.errorMessage || 'Kart kaydedilemedi'
        });
      }
    });
  } catch (error) {
    console.error('Save card error:', error);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu',
      error: error.message
    });
  }
};

// Delete a saved card
exports.deleteCard = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cardToken } = req.params;

    const user = await User.findById(userId);
    if (!user || !user.iyzicoCardUserKey) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı veya kart bulunamadı'
      });
    }

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: userId.toString(),
      cardToken: cardToken,
      cardUserKey: user.iyzicoCardUserKey
    };

    iyzipay.card.delete(request, (err, result) => {
      if (err) {
        console.error('Iyzico delete card error:', err);
        return res.status(500).json({
          success: false,
          message: 'Kart silinemedi',
          error: err
        });
      }

      if (result.status === 'success') {
        return res.json({
          success: true,
          message: 'Kart başarıyla silindi'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.errorMessage || 'Kart silinemedi'
        });
      }
    });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu',
      error: error.message
    });
  }
};

// Process payment with Iyzico
exports.processPayment = async (req, res) => {
  try {
    console.log('💳 Process Payment Request:', JSON.stringify(req.body, null, 2));
    
    // 🎭 DEMO MODE - Skip Iyzico API calls if enabled
    // Temporarily hardcoded for testing - TODO: Use process.env.DEMO_MODE === 'true'
    const DEMO_MODE = true; // process.env.DEMO_MODE === 'true';
    
    console.log('🔍 DEMO_MODE check:', {
      raw: process.env.DEMO_MODE,
      parsed: DEMO_MODE,
      type: typeof process.env.DEMO_MODE,
      hardcoded: true
    });
    
    if (DEMO_MODE) {
      console.log('🎭 DEMO MODE ACTIVE - Simulating successful payment');
    }
    
    const userId = req.user._id;
    const {
      storeId,
      employeeId,
      services,
      appointmentDate,
      appointmentTime,
      paymentType,
      personCount,
      note,
      campaignId,
      couponId,
      pointsUsed,
      totalPrice,
      installment,
      cardToken, // If using saved card
      cardInfo, // If using new card
      saveCard // Boolean to save card after payment
    } = req.body;

    console.log('👤 User ID:', userId);
    console.log('🏪 Store ID:', storeId);
    console.log('👨‍💼 Employee ID:', employeeId);
    console.log('🛍️ Services:', services);
    console.log('💰 Total Price:', totalPrice);
    console.log('💳 Card Token:', cardToken);
    console.log('💳 Card Info:', cardInfo ? 'Provided' : 'Not provided');

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({
          success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    console.log('✅ User found:', user.email);

    // Prepare payment request
    const conversationId = `${userId}_${Date.now()}`;
    const basketId = `B${Date.now()}`;

    // Buyer information
    const buyer = {
      id: userId.toString(),
      name: user.firstName || 'Ad',
      surname: user.lastName || 'Soyad',
      gsmNumber: user.phoneNumber || '+905555555555',
      email: user.email,
      identityNumber: '11111111111', // Test için
      registrationAddress: user.city ? `${user.district || ''} ${user.city}` : 'Istanbul, Turkey',
      ip: req.ip || '85.34.78.112',
      city: user.city || 'Istanbul',
      country: 'Turkey',
      zipCode: '34000'
    };

    // Billing address
    const billingAddress = {
      contactName: `${user.firstName || 'Ad'} ${user.lastName || 'Soyad'}`,
      city: user.city || 'Istanbul',
      country: 'Turkey',
      address: user.city ? `${user.district || ''} ${user.city}` : 'Istanbul, Turkey',
      zipCode: '34000'
    };

    // Basket items (services)
    const basketItems = services.map((serviceId, index) => ({
      id: serviceId.toString(),
      name: `Hizmet ${index + 1}`,
      category1: 'Güzellik',
      itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
      price: (parseFloat(totalPrice) / services.length).toFixed(2)
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
      if (saveCard && cardInfo.registerCard) {
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
        message: 'Kart bilgisi gerekli'
      });
    }

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: conversationId,
      price: totalPrice,
      paidPrice: totalPrice,
      currency: Iyzipay.CURRENCY.TRY,
      installment: installment || 1,
      basketId: basketId,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      paymentCard: paymentCard,
      buyer: buyer,
      shippingAddress: billingAddress,
      billingAddress: billingAddress,
      basketItems: basketItems
    };

    console.log('📤 Sending payment request to Iyzico:', JSON.stringify(request, null, 2));

    // Handle successful payment (both real and demo)
    const handlePaymentSuccess = async (result) => {
      try {
        // Fetch store to get companyId
        const store = await Store.findById(storeId);
        if (!store) {
          throw new Error('Store not found');
        }

        // Fetch services details
        const serviceDetails = await Service.find({ _id: { $in: services } });
        
        console.log('📦 Fetched services:', serviceDetails);

        // Calculate total duration and prepare services array
        let totalDuration = 0;
        let totalServicePrice = 0;
        const servicesData = serviceDetails.map((service, index) => {
          totalDuration += service.duration || 0;
          totalServicePrice += service.price || 0;
          return {
            serviceType: service.name || 'Hizmet',
            serviceDuration: service.duration || 0,
            servicePrice: service.price || 0,
            personIndex: index
          };
        });

        // Use first service details for main fields (for compatibility)
        const firstService = serviceDetails[0] || {};

        // Format appointmentTime to HH:MM
        const formattedTime = String(appointmentTime).includes(':') 
          ? appointmentTime 
          : `${String(appointmentTime).padStart(2, '0')}:00`;

        // Payment successful, create appointment
        const appointment = new Appointment({
          userId: userId,
          companyId: store.companyId || store.userId,
          employeeId: employeeId,
          customerIds: [], // Client uygulaması için boş array
          appointmentDate: appointmentDate,
          appointmentTime: formattedTime,
          serviceCategory: firstService.category || 'Güzellik',
          taskType: firstService.type || 'appointment',
          serviceType: firstService.name || 'Hizmet',
          serviceDuration: totalDuration || firstService.duration || 60,
          servicePrice: parseFloat(totalPrice) || totalServicePrice,
          services: servicesData,
          personCount: personCount || 1,
          paymentMethod: APPOINTMENT.CARD,
          paymentType: paymentType,
          status: 'approved', // Ödeme alındı, randevu onaylandı
          isApproved: true,
          paymentReceived: true, // Ödeme alındı flag'i
          note: note || '',
          totalPrice: parseFloat(totalPrice),
          paymentId: result.paymentId,
          iyzicoConversationId: conversationId
        });

        console.log('💾 Saving appointment:', appointment);
        await appointment.save();
        console.log('✅ Appointment saved successfully');

        // Update user points using Points model
        const pointsToEarn = Math.floor(parseFloat(totalPrice) * 0.10);
        const pointsUsedValue = pointsUsed || 0;

        // Use points if provided (deduct from user's available points)
        if (pointsUsedValue > 0) {
          const { usePoints } = require('./pointsController');
          const pointsResult = await usePoints(
            userId.toString(),
            pointsUsedValue,
            null,
            appointment._id.toString(),
            'Randevu ödemesinde kullanılan puan'
          );
          
          if (!pointsResult.success) {
            console.error('⚠️ Points usage failed:', pointsResult.error);
            // Continue even if points usage fails (points might have been used already)
          }
        }

        // Find or create Points document for user
        let userPoints = await Points.findOne({ userId: userId });
        
        if (!userPoints) {
          // Create new Points document
          userPoints = new Points({
            userId: userId,
            totalPoints: 0,
            usedPoints: 0,
            availablePoints: 0,
            totalValueInTL: 0
          });
        }

        // Update points - add earned points
        const oldTotalPoints = userPoints.totalPoints || 0;
        const oldAvailablePoints = userPoints.availablePoints || 0;

        // Add earned points (points were already deducted by usePoints function above)
        userPoints.totalPoints = oldTotalPoints + pointsToEarn;
        userPoints.availablePoints = oldAvailablePoints + pointsToEarn;
        userPoints.totalValueInTL = userPoints.availablePoints * 0.02;

        await userPoints.save();

        console.log('🎁 Points updated:', {
          totalPrice,
          pointsToEarn,
          pointsUsed: pointsUsedValue,
          oldTotalPoints,
          newTotalPoints: userPoints.totalPoints,
          oldAvailablePoints,
          newAvailablePoints: userPoints.availablePoints,
          totalValueInTL: userPoints.totalValueInTL
        });

        // Create PointsTransaction for earned points
        const pointsValueInTL = pointsToEarn * 0.02; // 1 puan = 0.02 TL
        await PointsTransaction.create({
          userId: userId,
          type: 'earned',
          points: pointsToEarn,
          valueInTL: pointsValueInTL,
          description: `Randevu ödemesi sonrası kazanılan puan (${totalPrice}₺)`,
          appointmentId: appointment._id,
          source: 'appointment',
          sourceAmount: parseFloat(totalPrice)
        });

        // Note: Points usage transaction is already created by usePoints function above

        // Save card user key if new card was registered
        if (result.cardUserKey && !user.iyzicoCardUserKey) {
          user.iyzicoCardUserKey = result.cardUserKey;
        }

        await user.save();
        console.log('✅ User saved');

        // Mark campaign as used if applicable
        if (campaignId) {
          // Kullanıcıya ait kampanya kaydını bul veya oluştur, "kullandı" olarak işaretle
          const userCampaign = await UserCampaign.findOneAndUpdate(
            {
              userId: userId,
              campaignId: campaignId
            },
            {
              userId: userId,
              campaignId: campaignId,
              storeId: storeId,
              isUsed: true,
              usedAt: new Date(),
              appointmentId: appointment._id
            },
            {
              upsert: true, // Yoksa oluştur, varsa güncelle
              new: true
            }
          );

          console.log('✅ UserCampaign marked as used:', {
            userId: userId,
            campaignId: campaignId,
            isUsed: userCampaign.isUsed
          });

          // Increase campaign participantCount (usedCount)
          const campaign = await Campaign.findById(campaignId);
          if (campaign) {
            campaign.participantCount = (campaign.participantCount || 0) + 1;
            await campaign.save();
            console.log('✅ Campaign participantCount increased:', campaign.participantCount);
          }
        }

        // Mark coupon as used if applicable
        if (couponId) {
          // Kullanıcıya ait kupon kaydını bul veya oluştur, "kullandı" olarak işaretle
          const userCoupon = await UserCoupon.findOneAndUpdate(
            {
              userId: userId,
              couponId: couponId
            },
            {
              userId: userId,
              couponId: couponId,
              storeId: storeId,
              isUsed: true,
              usedAt: new Date(),
              appointmentId: appointment._id
            },
            {
              upsert: true, // Yoksa oluştur, varsa güncelle
              new: true
            }
          );

          console.log('✅ UserCoupon marked as used:', {
            userId: userId,
            couponId: couponId,
            isUsed: userCoupon.isUsed
          });

          // Increase coupon usedCount
          const coupon = await Coupon.findById(couponId);
          if (coupon) {
            coupon.usedCount = (coupon.usedCount || 0) + 1;
            await coupon.save();
            console.log('✅ Coupon usedCount increased:', coupon.usedCount);
          }
        }

        return res.json({
          success: true,
          message: 'Ödeme başarılı',
          appointment: appointment,
          pointsEarned: pointsToEarn,
          paymentId: result.paymentId,
          cardSaved: result.cardUserKey ? true : false
        });
      } catch (dbError) {
        console.error('Database error after payment:', dbError);
      return res.status(500).json({
        success: false,
          message: 'Ödeme alındı ancak randevu kaydedilemedi',
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
        cardUserKey: saveCard ? `demo_card_user_${userId}` : undefined
      };
      
      // Continue with the same logic as real payment
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
        console.error('Full error response:', JSON.stringify(result, null, 2));
        return res.status(400).json({
          success: false,
          message: result.errorMessage || 'Ödeme başarısız',
          errorCode: result.errorCode
        });
      }
    });
  } catch (error) {
    console.error('❌ Process payment error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * refundPayment - İade (iyzico refund)
 * Admin: POST /admin/payments/:id/refund  body: { reason?, description? }
 */
exports.refundPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body || {};
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Ödeme bulunamadı' });
    }
    if (payment.paymentStatus !== 'success') {
      return res.status(400).json({ success: false, message: 'Sadece başarılı ödemeler iade edilebilir' });
    }

    const ip = req.ip || req.connection?.remoteAddress || '85.34.78.112';

    if (!payment.paymentId || String(payment.paymentId).startsWith('DEMO_')) {
      payment.paymentStatus = 'refunded';
      await payment.save();
      return res.status(200).json({ success: true, message: 'İade işlendi (demo)', data: payment });
    }

    let paymentTransactionId =
      payment.iyzicoResponse?.paymentItems?.[0]?.paymentTransactionId ||
      payment.iyzicoResponse?.itemTransactions?.[0]?.paymentTransactionId;

    if (!paymentTransactionId) {
      await new Promise((resolve, reject) => {
        iyzipay.payment.retrieve(
          { locale: Iyzipay.LOCALE.TR, conversationId: payment.conversationId || id, paymentId: payment.paymentId },
          (err, result) => {
            if (err) return reject(err);
            const items = result?.paymentItems || result?.itemTransactions;
            if (result?.status === 'success' && items?.[0]?.paymentTransactionId) {
              paymentTransactionId = items[0].paymentTransactionId;
            }
            resolve();
          }
        );
      });
    }

    if (!paymentTransactionId) {
      return res.status(400).json({ success: false, message: 'İade için iyzico işlem bilgisi bulunamadı' });
    }

    await new Promise((resolve, reject) => {
      iyzipay.refund.create(
        {
          locale: Iyzipay.LOCALE.TR,
          conversationId: payment.conversationId || id,
          paymentTransactionId,
          price: String(payment.price || 0),
          currency: (payment.currency || 'TRY').toUpperCase(),
          ip,
          reason: reason || Iyzipay.REFUND_REASON.OTHER,
          description: description || 'Yönetici iadesi',
        },
        async (err, result) => {
          if (err) return reject(err);
          if (result?.status !== 'success') {
            return reject(new Error(result?.errorMessage || 'İyzico iade başarısız'));
          }
          payment.paymentStatus = 'refunded';
          await payment.save();
          resolve(result);
        }
      );
    });

    res.status(200).json({ success: true, message: 'İade işlemi başarılı', data: payment });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({ success: false, message: error.message || 'İade işlemi başarısız' });
  }
};

/**
 * cancelPayment - İptal (iyzico cancel)
 * Admin: POST /admin/payments/:id/cancel  body: { reason?, description? }
 */
exports.cancelPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body || {};
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Ödeme bulunamadı' });
    }
    if (payment.paymentStatus === 'cancelled' || payment.paymentStatus === 'refunded') {
      return res.status(400).json({ success: false, message: 'Bu ödeme zaten iptal veya iade edilmiş' });
    }

    const ip = req.ip || req.connection?.remoteAddress || '85.34.78.112';

    if (payment.paymentStatus === 'pending' && !payment.paymentId) {
      payment.paymentStatus = 'cancelled';
      await payment.save();
      return res.status(200).json({ success: true, message: 'Ödeme iptal edildi', data: payment });
    }

    if (payment.paymentStatus === 'success' && (!payment.paymentId || String(payment.paymentId).startsWith('DEMO_'))) {
      payment.paymentStatus = 'cancelled';
      await payment.save();
      return res.status(200).json({ success: true, message: 'Ödeme iptal edildi (demo)', data: payment });
    }

    if (payment.paymentStatus === 'success' && payment.paymentId) {
      await new Promise((resolve, reject) => {
        iyzipay.cancel.create(
          {
            locale: Iyzipay.LOCALE.TR,
            conversationId: payment.conversationId || id,
            paymentId: payment.paymentId,
            ip,
            reason: reason || Iyzipay.REFUND_REASON.BUYER_REQUEST,
            description: description || 'Yönetici iptali',
          },
          async (err, result) => {
            if (err) return reject(err);
            if (result?.status !== 'success') {
              return reject(new Error(result?.errorMessage || 'İyzico iptal başarısız (aynı gün için geçerli olabilir; iade deneyin)'));
            }
            payment.paymentStatus = 'cancelled';
            await payment.save();
            resolve(result);
          }
        );
      });
      return res.status(200).json({ success: true, message: 'Ödeme iptal edildi', data: payment });
    }

    payment.paymentStatus = 'cancelled';
    await payment.save();
    res.status(200).json({ success: true, message: 'Ödeme iptal edildi', data: payment });
  } catch (error) {
    console.error('Cancel payment error:', error);
    res.status(500).json({ success: false, message: error.message || 'İptal işlemi başarısız' });
  }
};
