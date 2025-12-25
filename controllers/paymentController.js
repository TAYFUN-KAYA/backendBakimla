const iyzipay = require('../config/iyzico');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');
const { sendPaymentLink } = require('../utils/smsService');
const { addToWallet } = require('./walletController');
const { addPoints } = require('./pointsController');
const { completeOrderPayment } = require('./orderController');

/**
 * initializePayment
 * Yeni ödeme işlemi başlatır
 */
const initializePayment = async (req, res) => {
  try {
    const {
      companyId,
      appointmentId,
      orderId,
      buyerId,
      price,
      currency = 'TRY',
      installment = 1,
      buyerInfo,
    } = req.body;

    // Validasyon
    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'price (0\'dan büyük) zorunludur',
      });
    }

    // Güvenlik: companyId'yi req.user'dan al (authMiddleware'den geliyor)
    // Eğer kullanıcı company ise, sadece kendi companyId'sini kullanabilir
    let finalCompanyId = companyId;
    if (req.user) {
      if (req.user.userType === 'company') {
        // Şirket kullanıcısı sadece kendi ID'sini kullanabilir
        finalCompanyId = req.user._id.toString();
      } else if (req.user.userType === 'employee' && req.user.companyId) {
        // Çalışan, bağlı olduğu şirketin ID'sini kullanabilir
        finalCompanyId = req.user.companyId.toString();
      } else if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'companyId gereklidir',
        });
      }
    } else if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'companyId gereklidir',
      });
    }

    // Şirket kontrolü
    const company = await User.findById(finalCompanyId);
    if (!company || company.userType !== 'company') {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı',
      });
    }

    // Müşteri bilgilerini al
    let customer = null;
    if (buyerId) {
      customer = await Customer.findById(buyerId);
      if (!customer || customer.companyId.toString() !== finalCompanyId.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Müşteri bulunamadı veya bu şirkete ait değil',
        });
      }
    }

    // Randevu kontrolü
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment || appointment.companyId.toString() !== finalCompanyId.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Randevu bulunamadı veya bu şirkete ait değil',
        });
      }
    }

    // Sipariş kontrolü
    if (orderId) {
      const Order = require('../models/Order');
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Sipariş bulunamadı',
        });
      }
      // Order'dan companyId'yi al (ilk üründen)
      if (order.items && order.items.length > 0) {
        const Product = require('../models/Product');
        const firstProduct = await Product.findById(order.items[0].productId);
        if (firstProduct && firstProduct.companyId.toString() !== finalCompanyId.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Sipariş bu şirkete ait değil',
          });
        }
      }
    }
    const rawCardInfo = req.body.cardInfo || {
      cardNumber: '5890040000000016', // Akbank MasterCard Debit (Test)
      expireMonth: '12',
      expireYear: '2030', // 4 haneli yıl formatı
      cvc: '123',
      cardHolderName: buyerInfo?.name || customer?.firstName || 'Test User',
    };
    
    // Kart numarasındaki boşlukları temizle
    const cardInfo = {
      ...rawCardInfo,
      cardNumber: rawCardInfo.cardNumber.replace(/\s/g, ''), // Boşlukları kaldır
    };

    const request = {
      locale: 'tr',
      conversationId: `CONV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      price: price.toString(),
      paidPrice: price.toString(),
      currency: currency,
      installment: installment.toString(),
      basketId: appointmentId ? appointmentId.toString() : orderId ? orderId.toString() : `BASKET-${Date.now()}`,
      paymentChannel: 'WEB',
      paymentGroup: 'PRODUCT',
      callbackUrl: `${process.env.API_URL || 'http://localhost:3001'}/api/payments/callback`,
      enabledInstallments: [2, 3, 6, 9, 12],
      paymentCard: {
        cardNumber: cardInfo.cardNumber,
        expireMonth: cardInfo.expireMonth,
        expireYear: cardInfo.expireYear,
        cvc: cardInfo.cvc,
        cardHolderName: cardInfo.cardHolderName,
        registerCard: '0', // Kartı kaydetme
      },
      buyer: {
        id: buyerId ? buyerId.toString() : buyerInfo?.id || 'GUEST',
        name: buyerInfo?.name || customer?.firstName || 'Misafir',
        surname: buyerInfo?.surname || customer?.lastName || 'Kullanıcı',
        gsmNumber: buyerInfo?.phoneNumber || customer?.phoneNumber || '+905350000000',
        email: buyerInfo?.email || company.email || 'test@test.com',
        identityNumber: buyerInfo?.identityNumber || '11111111111',
        lastLoginDate: (() => {
          const now = new Date();
          return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        })(),
        registrationDate: (() => {
          if (customer?.createdAt) {
            const date = customer.createdAt instanceof Date ? customer.createdAt : new Date(customer.createdAt);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
          }
          const now = new Date();
          return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        })(),
        registrationAddress: buyerInfo?.address || 'N/A',
        ip: req.ip || req.connection.remoteAddress || '127.0.0.1',
        city: buyerInfo?.city || 'Istanbul',
        country: buyerInfo?.country || 'Turkey',
        zipCode: buyerInfo?.zipCode || '34000',
      },
      shippingAddress: {
        contactName: buyerInfo?.name || customer?.firstName || 'Misafir',
        city: buyerInfo?.city || 'Istanbul',
        country: buyerInfo?.country || 'Turkey',
        address: buyerInfo?.address || 'N/A',
        zipCode: buyerInfo?.zipCode || '34000',
      },
      billingAddress: {
        contactName: buyerInfo?.name || customer?.firstName || 'Misafir',
        city: buyerInfo?.city || 'Istanbul',
        country: buyerInfo?.country || 'Turkey',
        address: buyerInfo?.address || 'N/A',
        zipCode: buyerInfo?.zipCode || '34000',
      },
      basketItems: [
        {
          id: appointmentId ? appointmentId.toString() : orderId ? orderId.toString() : 'ITEM-1',
          name: appointmentId ? 'Hizmet Ödemesi' : orderId ? 'Ürün Ödemesi' : 'Ödeme',
          category1: appointmentId ? 'Hizmet' : orderId ? 'Ürün' : 'Genel',
          category2: 'Genel',
          itemType: 'PHYSICAL',
          price: price.toString(),
        },
      ],
    };

    // Debug: Request'i logla
    console.log('iyzico REQUEST BAŞLADI');
    console.log('Card Number:', request.paymentCard.cardNumber);
    console.log('Expire Year:', request.paymentCard.expireYear);
    console.log('Last Login Date:', request.buyer.lastLoginDate);
    console.log('Registration Date:', request.buyer.registrationDate);
    console.log('Full Request:', JSON.stringify(request, null, 2));
    console.log('iyzico REQUEST BİTTİ');

    // iyzico'ya ödeme isteği gönder
    iyzipay.threedsInitialize.create(request, async (err, result) => {
      if (err) {
        console.error('iyzico Error:', err);
        return res.status(400).json({
          success: false,
          message: 'Ödeme başlatılamadı',
          error: err.message,
        });
      }

      // Hata kontrolü
      if (result.status === 'failure') {
        // Ödeme kaydı oluştur (başarısız)
        const payment = await Payment.create({
          companyId: finalCompanyId,
          appointmentId: appointmentId || undefined,
          orderId: orderId || undefined,
          buyerId: buyerId || undefined,
          price,
          currency,
          installment,
          paymentStatus: 'failed',
          conversationId: request.conversationId,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode,
          iyzicoResponse: result,
        });

        return res.status(400).json({
          success: false,
          message: result.errorMessage || 'Ödeme başlatılamadı',
          errorCode: result.errorCode,
          data: payment,
        });
      }

      // Başarılı ise ödeme kaydı oluştur
      const payment = await Payment.create({
        companyId: finalCompanyId,
        appointmentId: appointmentId || undefined,
        orderId: orderId || undefined,
        buyerId: buyerId || undefined,
        price,
        currency,
        installment,
        paymentStatus: 'pending',
        conversationId: request.conversationId,
        buyerInfo: {
          id: request.buyer.id,
          name: request.buyer.name,
          surname: request.buyer.surname,
          email: request.buyer.email,
          identityNumber: request.buyer.identityNumber,
          city: request.buyer.city,
          country: request.buyer.country,
          zipCode: request.buyer.zipCode,
        },
        iyzicoResponse: result,
      });

      res.status(200).json({
        success: true,
        message: 'Ödeme başlatıldı',
        data: {
          payment,
          htmlContent: result.threeDSHtmlContent, 
          paymentId: result.paymentId,
        },
      });
    });
  } catch (error) {
    console.error('Payment Initialize Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * paymentCallback
 * iyzico'dan gelen callback'i işler
 */
const paymentCallback = async (req, res) => {
  try {
    const token = req.body.token || req.query.token || req.body.paymentId || req.query.paymentId;

    if (!token) {
      console.log('Callback - Token bulunamadı. Body:', req.body, 'Query:', req.query);
      return res.status(400).json({
        success: false,
        message: 'Token zorunludur',
      });
    }

    console.log('Callback - Token alındı:', token);

    // iyzico'dan ödeme sonucunu sorgula
    const request = {
      locale: 'tr',
      conversationId: 'CONV-' + Date.now(),
      paymentId: token,
    };

    iyzipay.threedsPayment.create(request, async (err, result) => {
      if (err) {
        console.error('iyzico Callback Error:', err);
        return res.status(400).json({
          success: false,
          message: 'Ödeme sonucu alınamadı',
          error: err.message,
        });
      }

      // Ödeme kaydını bul ve güncelle
      const payment = await Payment.findOne({ conversationId: result.conversationId });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Ödeme kaydı bulunamadı',
        });
      }

      // Ödeme durumunu güncelle
      // CALLBACK_THREEDS = 3D Secure işlemi devam ediyor
      if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
        payment.paymentStatus = 'success';
        payment.paymentId = result.paymentId;
        payment.cardInfo = {
          cardType: result.cardType,
          cardAssociation: result.cardAssociation,
          cardFamily: result.cardFamily,
          binNumber: result.binNumber,
          lastFourDigits: result.lastFourDigits,
        };

        // Ödeme başarılı olduğunda işlemler
        try {
          // 1. Wallet'a para ekle (sadece online ödemeler için)
          if (payment.companyId) {
            const description = payment.appointmentId
              ? 'Online ödeme - Randevu'
              : payment.orderId
              ? 'Online ödeme - Sipariş'
              : 'Online ödeme';
            
            await addToWallet(
              payment.companyId,
              payment.price,
              payment._id,
              payment.appointmentId || payment.orderId,
              description
            );
          }

          // 2. Randevu varsa güncelle ve puan ekle
          if (payment.appointmentId) {
            const appointment = await Appointment.findById(payment.appointmentId);
            if (appointment) {
              appointment.paymentReceived = true;
              appointment.status = 'approved';
              appointment.isApproved = true;
              await appointment.save();

              // Randevu için puan ekle (kullanıcıya)
              if (appointment.userId && appointment.totalPrice) {
                await addPoints(
                  appointment.userId.toString(),
                  appointment.totalPrice,
                  'appointment',
                  appointment._id,
                  'Randevu için puan kazandınız'
                );
              }
            }
          }

          // 3. Sipariş varsa tamamla (içinde puan ekleme var)
          if (payment.orderId) {
            await completeOrderPayment(payment.orderId.toString(), payment._id);
          }
        } catch (error) {
          console.error('Payment Success Callback Error:', error);
          // Hata olsa bile ödeme başarılı sayılır
        }
      } else if (result.paymentStatus === 'CALLBACK_THREEDS') {
        // 3D Secure işlemi devam ediyor, pending olarak bırak
        payment.paymentStatus = 'pending';
        payment.paymentId = result.paymentId;
      } else {
        payment.paymentStatus = 'failed';
        payment.errorMessage = result.errorMessage;
        payment.errorCode = result.errorCode;
      }

      payment.iyzicoResponse = result;
      await payment.save();

      // Frontend'e yönlendirme için HTML döndür
      const redirectUrl = result.status === 'success' && result.paymentStatus === 'SUCCESS'
        ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?paymentId=${payment._id}`
        : `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed?paymentId=${payment._id}`;

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ödeme İşleniyor...</title>
          <meta http-equiv="refresh" content="0;url=${redirectUrl}">
        </head>
        <body>
          <p>Yönlendiriliyorsunuz...</p>
          <script>window.location.href = "${redirectUrl}";</script>
        </body>
        </html>
      `);
    });
  } catch (error) {
    console.error('Payment Callback Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getPaymentStatus
 * Ödeme durumunu sorgular
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('companyId', 'firstName lastName email')
      .populate('buyerId', 'firstName lastName phoneNumber')
      .populate('appointmentId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Ödeme kaydı bulunamadı',
      });
    }

    // iyzico'dan güncel durumu sorgula
    // paymentId hem payment.paymentId'den hem de iyzicoResponse'dan alınabilir
    const iyzicoPaymentId = payment.paymentId || payment.iyzicoResponse?.paymentId;
    
    if (iyzicoPaymentId) {
      const request = {
        locale: 'tr',
        conversationId: payment.conversationId,
        paymentId: iyzicoPaymentId,
      };

      console.log('Sorgulanan Payment ID:', iyzicoPaymentId);

      iyzipay.payment.retrieve(request, (err, result) => {
        if (err) {
          console.error('iyzico Retrieve Error:', err);
          return res.status(200).json({
            success: true,
            data: payment,
            note: 'iyzico sorgulama hatası',
          });
        }

        console.log('iyzico Retrieve Result:', result.status, result.paymentStatus);

        if (result.status === 'success') {
          // Güncel durumu güncelle
          payment.paymentStatus = result.paymentStatus === 'SUCCESS' ? 'success' : 'failed';
          if (result.paymentStatus === 'SUCCESS') {
            payment.paymentId = result.paymentId;
            payment.cardInfo = {
              cardType: result.cardType,
              cardAssociation: result.cardAssociation,
              cardFamily: result.cardFamily,
              binNumber: result.binNumber,
              lastFourDigits: result.lastFourDigits,
            };
          }
          payment.iyzicoResponse = result;
          payment.save();
        }

        res.status(200).json({
          success: true,
          data: payment,
        });
      });
    } else {
      res.status(200).json({
        success: true,
        data: payment,
        note: 'Payment ID bulunamadı, iyzico sorgulaması yapılamadı',
      });
    }
  } catch (error) {
    console.error('Get Payment Status Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getPayments
 * Şirkete ait ödemeleri listeler
 */
const getPayments = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = { companyId };

    if (status) {
      query.paymentStatus = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('buyerId', 'firstName lastName phoneNumber')
      .populate('appointmentId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: payments,
    });
  } catch (error) {
    console.error('Get Payments Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * cancelPayment
 * Ödeme iptal eder (sadece başarılı ödemeler için)
 */
const cancelPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Ödeme kaydı bulunamadı',
      });
    }

    if (payment.paymentStatus !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Sadece başarılı ödemeler iptal edilebilir',
      });
    }

    if (!payment.paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Ödeme ID bulunamadı',
      });
    }

    const request = {
      locale: 'tr',
      conversationId: payment.conversationId,
      paymentId: payment.paymentId,
    };

    iyzipay.payment.cancel.create(request, async (err, result) => {
      if (err) {
        console.error('iyzico Cancel Error:', err);
        return res.status(400).json({
          success: false,
          message: 'Ödeme iptal edilemedi',
          error: err.message,
        });
      }

      if (result.status === 'success') {
        payment.paymentStatus = 'cancelled';
        payment.iyzicoResponse = result;
        await payment.save();

        res.status(200).json({
          success: true,
          message: 'Ödeme başarıyla iptal edildi',
          data: payment,
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.errorMessage || 'Ödeme iptal edilemedi',
          errorCode: result.errorCode,
        });
      }
    });
  } catch (error) {
    console.error('Cancel Payment Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * sendPaymentLinkViaSMS
 * Ödeme linkini SMS ile gönder
 */
const sendPaymentLinkViaSMS = async (req, res) => {
  try {
    const { paymentId, phoneNumber } = req.body;

    if (!paymentId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'paymentId ve phoneNumber zorunludur',
      });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Ödeme kaydı bulunamadı',
      });
    }

    // Ödeme linki oluştur (frontend URL + payment ID)
    const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/${paymentId}`;

    // SMS gönder
    const smsResult = await sendPaymentLink(phoneNumber, paymentLink);

    if (smsResult.success) {
      res.status(200).json({
        success: true,
        message: 'Ödeme linki SMS ile gönderildi',
        data: {
          paymentLink,
          smsResult,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'SMS gönderilemedi',
        error: smsResult.message,
      });
    }
  } catch (error) {
    console.error('Send Payment Link SMS Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  initializePayment,
  paymentCallback,
  getPaymentStatus,
  getPayments,
  cancelPayment,
  sendPaymentLinkViaSMS,
};

