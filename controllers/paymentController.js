const iyzipay = require("../config/iyzico");
const Payment = require("../models/Payment");
const User = require("../models/User");
const Customer = require("../models/Customer");
const Appointment = require("../models/Appointment");
const Accounting = require("../models/Accounting");
const Store = require("../models/Store");
const { sendPaymentLink } = require("../utils/smsService");
const { addToWallet, refundFromWallet } = require("./walletController");
const { addPoints } = require("./pointsController");
const { completeOrderPayment } = require("./orderController");
const axios = require("axios");
const crypto = require("crypto");
const CryptoJS = require("crypto-js");

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
      currency = "TRY",
      installment = 1,
      buyerInfo,
    } = req.body;

    // Validasyon
    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "price (0'dan büyük) zorunludur",
      });
    }

    // Güvenlik: companyId'yi req.user'dan al (authMiddleware'den geliyor)
    // Eğer kullanıcı company ise, sadece kendi companyId'sini kullanabilir
    let finalCompanyId = companyId;
    if (req.user) {
      if (req.user.userType === "company") {
        // Şirket kullanıcısı sadece kendi ID'sini kullanabilir
        finalCompanyId = req.user._id.toString();
      } else if (req.user.userType === "employee" && req.user.companyId) {
        // Çalışan, bağlı olduğu şirketin ID'sini kullanabilir
        finalCompanyId = req.user.companyId.toString();
      } else if (!companyId) {
        return res.status(400).json({
          success: false,
          message: "companyId gereklidir",
        });
      }
    } else if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId gereklidir",
      });
    }

    // Şirket kontrolü
    const company = await User.findById(finalCompanyId);
    if (!company || company.userType !== "company") {
      return res.status(404).json({
        success: false,
        message: "Şirket bulunamadı",
      });
    }

    // Müşteri bilgilerini al
    let customer = null;
    if (buyerId) {
      customer = await Customer.findById(buyerId);
      if (
        !customer ||
        customer.companyId.toString() !== finalCompanyId.toString()
      ) {
        return res.status(404).json({
          success: false,
          message: "Müşteri bulunamadı veya bu şirkete ait değil",
        });
      }
    }

    // Randevu kontrolü
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (
        !appointment ||
        appointment.companyId.toString() !== finalCompanyId.toString()
      ) {
        return res.status(404).json({
          success: false,
          message: "Randevu bulunamadı veya bu şirkete ait değil",
        });
      }
    }

    // Sipariş kontrolü
    if (orderId) {
      const Order = require("../models/Order");
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Sipariş bulunamadı",
        });
      }
      // Order'dan companyId'yi al (ilk üründen)
      if (order.items && order.items.length > 0) {
        const Product = require("../models/Product");
        const firstProduct = await Product.findById(order.items[0].productId);
        if (
          firstProduct &&
          firstProduct.companyId.toString() !== finalCompanyId.toString()
        ) {
          return res.status(400).json({
            success: false,
            message: "Sipariş bu şirkete ait değil",
          });
        }
      }
    }
    const rawCardInfo = req.body.cardInfo || {
      cardNumber: "5890040000000016", // Akbank MasterCard Debit (Test)
      expireMonth: "12",
      expireYear: "2030", // 4 haneli yıl formatı
      cvc: "123",
      cardHolderName: buyerInfo?.name || customer?.firstName || "Test User",
    };

    // Kart numarasındaki boşlukları temizle
    const cardInfo = {
      ...rawCardInfo,
      cardNumber: rawCardInfo.cardNumber.replace(/\s/g, ""), // Boşlukları kaldır
    };

    // İşletme taksit ayarlarını kontrol et
    const Store = require("../models/Store");
    const store = await Store.findOne({ companyId: finalCompanyId });

    let enabledInstallments = [2, 3, 6, 9, 12];
    if (store && store.installmentSettings) {
      if (!store.installmentSettings.enabled) {
        enabledInstallments = [];
      } else {
        const max = store.installmentSettings.maxInstallment || 12;
        enabledInstallments = enabledInstallments.filter((i) => i <= max);
      }
    }

    const request = {
      locale: "tr",
      conversationId: `CONV-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      price: price.toString(),
      paidPrice: price.toString(),
      currency: currency,
      installment: installment.toString(),
      basketId: appointmentId
        ? appointmentId.toString()
        : orderId
        ? orderId.toString()
        : `BASKET-${Date.now()}`,
      paymentChannel: "WEB",
      paymentGroup: "PRODUCT",
      callbackUrl: `${
        process.env.API_URL || "http://localhost:3001"
      }/api/payments/callback`,
      enabledInstallments: enabledInstallments,
      paymentCard: {
        cardNumber: cardInfo.cardNumber,
        expireMonth: cardInfo.expireMonth,
        expireYear: cardInfo.expireYear,
        cvc: cardInfo.cvc,
        cardHolderName: cardInfo.cardHolderName,
        registerCard: "0", // Kartı kaydetme
      },
      buyer: {
        id: buyerId ? buyerId.toString() : buyerInfo?.id || "GUEST",
        name: buyerInfo?.name || customer?.firstName || "Misafir",
        surname: buyerInfo?.surname || customer?.lastName || "Kullanıcı",
        gsmNumber:
          buyerInfo?.phoneNumber || customer?.phoneNumber || "+905350000000",
        email: buyerInfo?.email || company.email || "test@test.com",
        identityNumber: buyerInfo?.identityNumber || "11111111111",
        lastLoginDate: (() => {
          const now = new Date();
          return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(now.getDate()).padStart(2, "0")} ${String(
            now.getHours()
          ).padStart(2, "0")}:${String(now.getMinutes()).padStart(
            2,
            "0"
          )}:${String(now.getSeconds()).padStart(2, "0")}`;
        })(),
        registrationDate: (() => {
          if (customer?.createdAt) {
            const date =
              customer.createdAt instanceof Date
                ? customer.createdAt
                : new Date(customer.createdAt);
            return `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}-${String(date.getDate()).padStart(
              2,
              "0"
            )} ${String(date.getHours()).padStart(2, "0")}:${String(
              date.getMinutes()
            ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
          }
          const now = new Date();
          return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(now.getDate()).padStart(2, "0")} ${String(
            now.getHours()
          ).padStart(2, "0")}:${String(now.getMinutes()).padStart(
            2,
            "0"
          )}:${String(now.getSeconds()).padStart(2, "0")}`;
        })(),
        registrationAddress: buyerInfo?.address || "N/A",
        ip: req.ip || req.connection.remoteAddress || "127.0.0.1",
        city: buyerInfo?.city || "Istanbul",
        country: buyerInfo?.country || "Turkey",
        zipCode: buyerInfo?.zipCode || "34000",
      },
      shippingAddress: {
        contactName: buyerInfo?.name || customer?.firstName || "Misafir",
        city: buyerInfo?.city || "Istanbul",
        country: buyerInfo?.country || "Turkey",
        address: buyerInfo?.address || "N/A",
        zipCode: buyerInfo?.zipCode || "34000",
      },
      billingAddress: {
        contactName: buyerInfo?.name || customer?.firstName || "Misafir",
        city: buyerInfo?.city || "Istanbul",
        country: buyerInfo?.country || "Turkey",
        address: buyerInfo?.address || "N/A",
        zipCode: buyerInfo?.zipCode || "34000",
      },
      basketItems: [
        {
          id: appointmentId
            ? appointmentId.toString()
            : orderId
            ? orderId.toString()
            : "ITEM-1",
          name: appointmentId
            ? "Hizmet Ödemesi"
            : orderId
            ? "Ürün Ödemesi"
            : "Ödeme",
          category1: appointmentId ? "Hizmet" : orderId ? "Ürün" : "Genel",
          category2: "Genel",
          itemType: "PHYSICAL",
          price: price.toString(),
        },
      ],
    };

    // Debug: Request'i logla
    console.log("iyzico REQUEST BAŞLADI");
    console.log("Card Number:", request.paymentCard.cardNumber);
    console.log("Expire Year:", request.paymentCard.expireYear);
    console.log("Last Login Date:", request.buyer.lastLoginDate);
    console.log("Registration Date:", request.buyer.registrationDate);
    console.log("Full Request:", JSON.stringify(request, null, 2));
    console.log("iyzico REQUEST BİTTİ");

    // iyzico'ya ödeme isteği gönder
    iyzipay.threedsInitialize.create(request, async (err, result) => {
      if (err) {
        console.error("iyzico Error:", err);
        return res.status(400).json({
          success: false,
          message: "Ödeme başlatılamadı",
          error: err.message,
        });
      }

      // Hata kontrolü
      if (result.status === "failure") {
        // Ödeme kaydı oluştur (başarısız)
        const payment = await Payment.create({
          companyId: finalCompanyId,
          appointmentId: appointmentId || undefined,
          orderId: orderId || undefined,
          buyerId: buyerId || undefined,
          price,
          currency,
          installment,
          paymentStatus: "failed",
          conversationId: request.conversationId,
          errorMessage: result.errorMessage,
          errorCode: result.errorCode,
          iyzicoResponse: result,
        });

        return res.status(400).json({
          success: false,
          message: result.errorMessage || "Ödeme başlatılamadı",
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
        paymentStatus: "pending",
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
        message: "Ödeme başlatıldı",
        data: {
          payment,
          htmlContent: result.threeDSHtmlContent,
          paymentId: result.paymentId,
        },
      });
    });
  } catch (error) {
    console.error("Payment Initialize Error:", error);
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
    const token =
      req.body.token ||
      req.query.token ||
      req.body.paymentId ||
      req.query.paymentId;

    if (!token) {
      console.log(
        "Callback - Token bulunamadı. Body:",
        req.body,
        "Query:",
        req.query
      );
      return res.status(400).json({
        success: false,
        message: "Token zorunludur",
      });
    }

    console.log("Callback - Token alındı:", token);

    // iyzico'dan ödeme sonucunu sorgula
    const request = {
      locale: "tr",
      conversationId: "CONV-" + Date.now(),
      paymentId: token,
    };

    iyzipay.threedsPayment.create(request, async (err, result) => {
      if (err) {
        console.error("iyzico Callback Error:", err);
        return res.status(400).json({
          success: false,
          message: "Ödeme sonucu alınamadı",
          error: err.message,
        });
      }

      // Ödeme kaydını bul ve güncelle
      const payment = await Payment.findOne({
        conversationId: result.conversationId,
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Ödeme kaydı bulunamadı",
        });
      }

      // Ödeme durumunu güncelle
      // CALLBACK_THREEDS = 3D Secure işlemi devam ediyor
      if (result.status === "success" && result.paymentStatus === "SUCCESS") {
        payment.paymentStatus = "success";
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
              ? "Online ödeme - Randevu"
              : payment.orderId
              ? "Online ödeme - Sipariş"
              : "Online ödeme";

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
            const appointment = await Appointment.findById(
              payment.appointmentId
            );
            if (appointment) {
              appointment.paymentReceived = true;
              appointment.status = "approved";
              appointment.isApproved = true;
              await appointment.save();

              // Randevu için puan ekle (kullanıcıya)
              if (appointment.userId && appointment.totalPrice) {
                await addPoints(
                  appointment.userId.toString(),
                  appointment.totalPrice,
                  "appointment",
                  appointment._id,
                  "Randevu için puan kazandınız"
                );
              }
            }
          }

          // 3. Sipariş varsa tamamla (içinde puan ekleme var)
          if (payment.orderId) {
            await completeOrderPayment(payment.orderId.toString(), payment._id);
          }
        } catch (error) {
          console.error("Payment Success Callback Error:", error);
          // Hata olsa bile ödeme başarılı sayılır
        }
      } else if (result.paymentStatus === "CALLBACK_THREEDS") {
        // 3D Secure işlemi devam ediyor, pending olarak bırak
        payment.paymentStatus = "pending";
        payment.paymentId = result.paymentId;
      } else {
        payment.paymentStatus = "failed";
        payment.errorMessage = result.errorMessage;
        payment.errorCode = result.errorCode;
      }

      payment.iyzicoResponse = result;
      await payment.save();

      // Frontend'e yönlendirme için HTML döndür
      const redirectUrl =
        result.status === "success" && result.paymentStatus === "SUCCESS"
          ? `${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }/payment/success?paymentId=${payment._id}`
          : `${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }/payment/failed?paymentId=${payment._id}`;

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
    console.error("Payment Callback Error:", error);
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
      .populate("companyId", "firstName lastName email")
      .populate("buyerId", "firstName lastName phoneNumber")
      .populate("appointmentId");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Ödeme kaydı bulunamadı",
      });
    }

    // iyzico'dan güncel durumu sorgula
    // paymentId hem payment.paymentId'den hem de iyzicoResponse'dan alınabilir
    const iyzicoPaymentId =
      payment.paymentId || payment.iyzicoResponse?.paymentId;

    if (iyzicoPaymentId) {
      const request = {
        locale: "tr",
        conversationId: payment.conversationId,
        paymentId: iyzicoPaymentId,
      };

      console.log("Sorgulanan Payment ID:", iyzicoPaymentId);

      iyzipay.payment.retrieve(request, (err, result) => {
        if (err) {
          console.error("iyzico Retrieve Error:", err);
          return res.status(200).json({
            success: true,
            data: payment,
            note: "iyzico sorgulama hatası",
          });
        }

        console.log(
          "iyzico Retrieve Result:",
          result.status,
          result.paymentStatus
        );

        if (result.status === "success") {
          // Güncel durumu güncelle
          payment.paymentStatus =
            result.paymentStatus === "SUCCESS" ? "success" : "failed";
          if (result.paymentStatus === "SUCCESS") {
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
        note: "Payment ID bulunamadı, iyzico sorgulaması yapılamadı",
      });
    }
  } catch (error) {
    console.error("Get Payment Status Error:", error);
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
      .populate("buyerId", "firstName lastName phoneNumber")
      .populate("appointmentId")
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
    console.error("Get Payments Error:", error);
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
        message: "Ödeme kaydı bulunamadı",
      });
    }

    if (payment.paymentStatus !== "success") {
      return res.status(400).json({
        success: false,
        message: "Sadece başarılı ödemeler iptal edilebilir",
      });
    }

    if (!payment.paymentId) {
      return res.status(400).json({
        success: false,
        message: "Ödeme ID bulunamadı",
      });
    }

    const request = {
      locale: "tr",
      conversationId: payment.conversationId,
      paymentId: payment.paymentId,
    };

    iyzipay.payment.cancel.create(request, async (err, result) => {
      if (err) {
        console.error("iyzico Cancel Error:", err);
        return res.status(400).json({
          success: false,
          message: "Ödeme iptal edilemedi",
          error: err.message,
        });
      }

      if (result.status === "success") {
        payment.paymentStatus = "cancelled";
        payment.iyzicoResponse = result;
        await payment.save();

        res.status(200).json({
          success: true,
          message: "Ödeme başarıyla iptal edildi",
          data: payment,
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.errorMessage || "Ödeme iptal edilemedi",
          errorCode: result.errorCode,
        });
      }
    });
  } catch (error) {
    console.error("Cancel Payment Error:", error);
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
        message: "paymentId ve phoneNumber zorunludur",
      });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Ödeme kaydı bulunamadı",
      });
    }

    // Ödeme linki oluştur (frontend URL + payment ID)
    const paymentLink = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/payment/${paymentId}`;

    // SMS gönder
    const smsResult = await sendPaymentLink(phoneNumber, paymentLink);

    if (smsResult.success) {
      res.status(200).json({
        success: true,
        message: "Ödeme linki SMS ile gönderildi",
        data: {
          paymentLink,
          smsResult,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "SMS gönderilemedi",
        error: smsResult.message,
      });
    }
  } catch (error) {
    console.error("Send Payment Link SMS Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * refundPayment
 * Ödeme iade eder
 */
const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Ödeme kaydı bulunamadı",
      });
    }

    if (payment.paymentStatus !== "success") {
      return res.status(400).json({
        success: false,
        message: "Sadece başarılı ödemeler iade edilebilir",
      });
    }

    const iyzicoPaymentId =
      payment.paymentId ||
      (payment.iyzicoResponse && payment.iyzicoResponse.paymentId);
    // iyzico iadeler için paymentTransactionId (basket item ID) de gereklidir
    const paymentTransactionId =
      payment.iyzicoResponse?.itemTransactions?.[0]?.paymentTransactionId;

    if (!iyzicoPaymentId) {
      return res.status(400).json({
        success: false,
        message: "iyzico Ödeme ID bulunamadı",
      });
    }

    if (!paymentTransactionId && amount) {
      // Kısmi iade için transactionId şarttır.
      // Ama biz yine de genel bir hata verelim eğer hiç yoksa.
      console.warn("paymentTransactionId missing for refund");
    }

    // iyzico iade isteği
    const request = {
      locale: "tr",
      conversationId: `REF-${Date.now()}`,
      paymentId: iyzicoPaymentId,
      paymentTransactionId: paymentTransactionId, // Zorunlu alan
      ip: req.ip || "127.0.0.1",
      price: (amount || payment.price).toString(), // iade edilecek tutar
      currency: payment.currency,
    };

    iyzipay.refund.create(request, async (err, result) => {
      if (err) {
        console.error("iyzico Refund Error:", err);
        return res.status(400).json({
          success: false,
          message: "İade işlemi başarısız",
          error: err.message,
        });
      }

      if (result.status === "success") {
        // Cüzdandan düş
        if (payment.companyId) {
          await refundFromWallet(
            payment.companyId,
            parseFloat(request.price),
            payment._id,
            payment.appointmentId || payment.orderId,
            `İade - ${reason || "Yönetici iadesi"}`
          );
        }

        // Eğer tam iade ise durumu güncelle
        if (!amount || parseFloat(amount) >= payment.price) {
          payment.paymentStatus = "refunded";
        }

        // iyzico yanıtını sakla
        payment.iyzicoResponse = {
          ...payment.iyzicoResponse,
          refundDetails: result,
        };
        await payment.save();

        res.status(200).json({
          success: true,
          message: "İade işlemi başarıyla tamamlandı",
          data: result,
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.errorMessage || "İade işlemi başarısız",
          errorCode: result.errorCode,
        });
      }
    });
  } catch (error) {
    console.error("Refund Payment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * createPayment
 * Nakit veya IBAN ödemesi için direkt payment kaydı oluşturur
 */
const createPayment = async (req, res) => {
  try {
    const {
      companyId,
      appointmentId,
      buyerId,
      price,
      currency = "TRY",
      paymentMethod, // 'cash' veya 'iban'
    } = req.body;

    // Validasyon
    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "price (0'dan büyük) zorunludur",
      });
    }

    if (!paymentMethod || !["cash", "iban"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'paymentMethod "cash" veya "iban" olmalıdır',
      });
    }

    // Güvenlik: companyId'yi req.user'dan al
    let finalCompanyId = companyId;
    if (req.user) {
      if (req.user.userType === "company") {
        finalCompanyId = req.user._id.toString();
      } else if (req.user.userType === "employee" && req.user.companyId) {
        finalCompanyId = req.user.companyId.toString();
      } else if (!companyId) {
        return res.status(400).json({
          success: false,
          message: "companyId gereklidir",
        });
      }
    } else if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId gereklidir",
      });
    }

    // Randevu kontrolü
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (
        !appointment ||
        appointment.companyId.toString() !== finalCompanyId.toString()
      ) {
        return res.status(404).json({
          success: false,
          message: "Randevu bulunamadı veya bu şirkete ait değil",
        });
      }
    }

    // Payment kaydı oluştur
    const payment = new Payment({
      companyId: finalCompanyId,
      appointmentId: appointmentId || null,
      buyerId: buyerId || null,
      price,
      currency,
      paymentStatus: "success", // Nakit ve IBAN ödemeleri direkt başarılı
      installment: 1,
    });

    await payment.save();

    // Randevuyu güncelle: completed yap ve paymentReceived: true
    let appointment = null;
    if (appointmentId) {
      appointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        {
          paymentReceived: true,
          paymentMethod: paymentMethod,
          status: "completed",
        },
        { new: true }
      );
    }

    // Accounting kaydı oluştur
    try {
      // Randevu bilgilerini al
      if (appointment) {
        const accountingData = {
          companyId: finalCompanyId,
          employeeId: appointment.employeeId || null,
          appointmentId: appointmentId || null,
          date: appointment.appointmentDate || new Date(),
          income: price,
          expense: 0,
          description: `Randevu ödemesi - ${
            appointment.serviceType || "Hizmet"
          }`,
          category:
            appointment.serviceType || appointment.serviceCategory || "Randevu",
          paymentMethod:
            paymentMethod === "cash"
              ? "nakit"
              : paymentMethod === "iban"
              ? "iban"
              : paymentMethod === "card"
              ? "online"
              : "nakit",
        };

        await Accounting.create(accountingData);
        console.log("✅ Accounting kaydı oluşturuldu:", accountingData);
      }
    } catch (accountingError) {
      console.error(
        "⚠️ Accounting kaydı oluşturulurken hata:",
        accountingError
      );
      // Accounting hatası ödeme işlemini engellemez, sadece log'lanır
    }

    res.status(201).json({
      success: true,
      message: "Ödeme kaydı oluşturuldu ve randevu tamamlandı",
      data: {
        payment,
      },
    });
  } catch (error) {
    console.error("Create Payment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Ödeme kaydı oluşturulamadı",
    });
  }
};

/**
 * createPaymentLink
 * Iyzico payment link oluşturur ve SMS ile gönderir
 */
const createPaymentLink = async (req, res) => {
  try {
    const {
      companyId,
      appointmentId,
      buyerId,
      price,
      phoneNumber,
      currency = "TRY",
    } = req.body;

    // Validasyon
    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "price (0'dan büyük) zorunludur",
      });
    }

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "phoneNumber zorunludur",
      });
    }

    // Güvenlik: companyId'yi req.user'dan al
    let finalCompanyId = companyId;
    if (req.user) {
      if (req.user.userType === "company") {
        finalCompanyId = req.user._id.toString();
      } else if (req.user.userType === "employee" && req.user.companyId) {
        finalCompanyId = req.user.companyId.toString();
      } else if (!companyId) {
        return res.status(400).json({
          success: false,
          message: "companyId gereklidir",
        });
      }
    } else if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId gereklidir",
      });
    }

    // Randevu kontrolü
    let appointment = null;
    if (appointmentId) {
      appointment = await Appointment.findById(appointmentId);
      if (
        !appointment ||
        appointment.companyId.toString() !== finalCompanyId.toString()
      ) {
        return res.status(404).json({
          success: false,
          message: "Randevu bulunamadı veya bu şirkete ait değil",
        });
      }
    }

    // Müşteri bilgilerini al
    let customer = null;
    let customerName = "Müşteri";
    if (buyerId) {
      customer = await Customer.findById(buyerId);
      if (customer) {
        customerName =
          `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
          "Müşteri";
      }
    } else if (
      appointment &&
      appointment.customerIds &&
      appointment.customerIds.length > 0
    ) {
      customer = await Customer.findById(appointment.customerIds[0]);
      if (customer) {
        customerName =
          `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
          "Müşteri";
      }
    }

    // İşletme bilgilerini al (appIcon için)
    // const store = await Store.findOne({ companyId: finalCompanyId });
    // let encodedImageFile = null;

    // if (store?.appIcon) {
    //   try {
    //     // URL'den resmi indir ve base64'e çevir
    //     const imageResponse = await axios.get(store.appIcon, {
    //       responseType: "arraybuffer",
    //     });
    //     const imageBuffer = Buffer.from(imageResponse.data);
    //     encodedImageFile = imageBuffer.toString("base64");
    //     console.log("encodedImageFile", encodedImageFile);
    //   } catch (error) {
    //     console.error("⚠️ AppIcon indirilemedi veya base64'e çevrilemedi:", error.message);
    //     // Hata durumunda encodedImageFile null kalır
    //   }
    // }

    // Iyzico Link API için request body
    // NOT: conversationId burada appointmentId olarak kullanılıyor
    // Webhook geldiğinde conversationId ile randevuyu bulacağız
    const conversationId = appointmentId
      ? appointmentId.toString()
      : `payment-${Date.now()}`;
    const requestBody = {
      conversationId: conversationId, // Bu değer webhook'ta geri gelecek, randevuyu bulmak için kullanılacak
      locale: "tr",
      name: appointment
        ? appointment.serviceType || "Randevu Ödemesi"
        : "Randevu Ödemesi",
      description: appointment
        ? `Randevu ödemesi - ${appointment.serviceType || "Hizmet"}`
        : "Online randevu ödemesi",
      price: parseFloat(price).toFixed(2).toString(),
      currencyCode: "TRY",
      addressIgnorable: true, // Adres istenmesin
      categoryType: "UNKNOWN",
      encodedImageFile:
        "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",
      // ...(encodedImageFile && { encodedImageFile: encodedImageFile }),
      installmentRequested: false,
      flexibleLink: true,
      presetPriceValues: [parseFloat(price).toFixed(2).toString()],
      stockEnabled: false, // Stok kontrolü kapalı
    };

    console.log("📤 Iyzico Link Request:", requestBody);

    // Iyzico authentication: IYZWS formatı (signature ile)
    const apiKey = process.env.IYZICO_API_KEY || "";
    const secretKey = process.env.IYZICO_SECRET_KEY || "";
    const iyzicoUri =
      process.env.IYZICO_URI || "https://sandbox-api.iyzipay.com";

    if (!apiKey || !secretKey) {
      return res.status(500).json({
        success: false,
        message: "Iyzico API anahtarları yapılandırılmamış",
      });
    }

    // Iyzico Link API için HMACSHA256 kimlik doğrulama
    // Örnek kod yapısına göre
    const randomVar = "123456789";
    const randomKey = new Date().getTime() + randomVar;
    const uri_path = "/v2/iyzilink/products";
    
    // Request body'yi JSON string'e çevir
    const body = JSON.stringify(requestBody);
    
    // Payload: body boş değilse uri_path + body, boşsa sadece uri_path
    const payload = body ? uri_path + body : uri_path;
    
    // dataToEncrypt: randomKey + payload
    const dataToEncrypt = randomKey + payload;
    
    // HMACSHA256 ile encryptedData oluştur (toString() olmadan)
    const encryptedData = CryptoJS.HmacSHA256(dataToEncrypt, secretKey);

    // Authorization string oluştur
    const authorizationString =
      "apiKey:" +
      apiKey +
      "&randomKey:" +
      randomKey +
      "&signature:" +
      encryptedData;

    // Base64 encode et
    const base64EncodedAuthorization = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(authorizationString)
    );

    // Authorization header'ı oluştur
    const authHeader = "IYZWSv2 " + base64EncodedAuthorization;
    console.log("autheader : ", authHeader);
    console.log("🔐 Iyzico Auth Debug:", {
      apiKeyLength: apiKey.length,
      secretKeyLength: secretKey.length,
      randomKey: randomKey,
      uri_path: uri_path,
      authorizationPrefix: authHeader.substring(0, 50) + "...",
      iyzicoUri: iyzicoUri,
    });

    try {
      // Iyzico Link API'ye POST isteği
      const iyzicoResponse = await axios.post(
        `${iyzicoUri}/v2/iyzilink/products`,
        body,
        {
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
            Accept: "application/json",
            "x-iyzi-rnd": randomKey,
          },
        }
      );

      const result = iyzicoResponse.data;

      if (result.status === "failure") {
        console.error("❌ Iyzico Link Failure:", result.errorMessage);
        return res.status(400).json({
          success: false,
          message: result.errorMessage || "Payment link oluşturulamadı",
          errorCode: result.errorCode,
        });
      }

      // Response'dan URL ve ID'yi al
      const paymentLinkUrl = result.url || result.data?.url;
      const paymentLinkId =
        result.paymentLinkId || result.data?.paymentLinkId || result.id;

      console.log("✅ Iyzico Link Created:", {
        paymentLinkId: paymentLinkId,
        url: paymentLinkUrl,
      });

      // Randevu varsa iyzicoLinkId'yi kaydet
      if (appointment && paymentLinkId) {
        appointment.iyzicoLinkId = paymentLinkId;
        await appointment.save();
      }

      // Payment kaydı oluştur (pending durumunda)
      const payment = new Payment({
        companyId: finalCompanyId,
        appointmentId: appointmentId || null,
        buyerId: buyerId || (customer ? customer._id : null),
        price: parseFloat(price),
        currency,
        paymentStatus: "pending",
        installment: 1,
        paymentMethod: "card",
        iyzicoResponse: {
          paymentLinkId: paymentLinkId,
          url: paymentLinkUrl,
        },
      });

      await payment.save();

      // Link'i console'a yazdır (test için)
      console.log("🔗 Iyzico Payment Link:", paymentLinkUrl);
      console.log("📱 SMS gönderilecek telefon:", phoneNumber);
      console.log("💳 Payment Link ID:", paymentLinkId);

      res.status(200).json({
        success: true,
        message: "Iyzico payment link oluşturuldu",
        data: {
          paymentLink: paymentLinkUrl,
          paymentLinkId: paymentLinkId,
          paymentId: payment._id,
          // Test için console'a yazdırıldı, gerçek SMS Iyzico tarafından gönderilecek
        },
      });
    } catch (axiosError) {
      console.error("❌ Iyzico Link API Error:", {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message,
        url: `${iyzicoUri}/v2/iyzilink/products`,
        requestBody: requestBody,
      });

      // 401 hatası genellikle authentication hatası
      if (axiosError.response?.status === 401) {
        return res.status(401).json({
          success: false,
          message:
            "Iyzico authentication hatası. API anahtarlarını kontrol edin.",
          error:
            axiosError.response?.data?.errorMessage || "Authentication failed",
          errorCode: axiosError.response?.data?.errorCode,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Iyzico payment link oluşturulamadı",
        error: axiosError.response?.data?.errorMessage || axiosError.message,
        errorCode: axiosError.response?.data?.errorCode,
      });
    }
  } catch (error) {
    console.error("Create Payment Link Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Payment link oluşturulamadı",
    });
  }
};

/**
 * iyzicoWebhook
 * Iyzico'dan gelen webhook'u işler
 */
const iyzicoWebhook = async (req, res) => {
  try {
    const { paymentStatus, paymentLinkId, conversationId } = req.body;

    console.log("📥 Iyzico Webhook Received:", {
      paymentStatus,
      paymentLinkId,
      conversationId,
    });

    if (!paymentLinkId && !conversationId) {
      return res.status(400).json({
        success: false,
        message: "paymentLinkId veya conversationId gereklidir",
      });
    }

    // Randevuyu bul (conversationId appointmentId olarak kullanılıyor)
    let appointment = null;
    if (conversationId) {
      appointment = await Appointment.findById(conversationId);
    } else if (paymentLinkId) {
      // paymentLinkId ile randevuyu bul
      appointment = await Appointment.findOne({ iyzicoLinkId: paymentLinkId });
    }

    if (appointment) {
      // Payment kaydını bul
      const payment = await Payment.findOne({
        appointmentId: appointment._id,
        "iyzicoResponse.paymentLinkId": paymentLinkId,
      });

      if (payment) {
        if (paymentStatus === "SUCCESS" || paymentStatus === "success") {
          // Ödeme başarılı
          payment.paymentStatus = "success";
          payment.paymentReceived = true;
          await payment.save();

          // Randevuyu güncelle
          appointment.paymentReceived = true;
          appointment.paymentMethod = "card";
          appointment.status = "completed";
          await appointment.save();

          // Accounting kaydı oluştur
          try {
            const accountingData = {
              companyId: appointment.companyId,
              employeeId: appointment.employeeId || null,
              appointmentId: appointment._id,
              date: appointment.appointmentDate || new Date(),
              income: payment.price,
              expense: 0,
              description: `Randevu ödemesi (Iyzico) - ${
                appointment.serviceType || "Hizmet"
              }`,
              category:
                appointment.serviceType ||
                appointment.serviceCategory ||
                "Randevu",
              paymentMethod: "online",
            };

            await Accounting.create(accountingData);
            console.log("✅ Accounting kaydı oluşturuldu:", accountingData);
          } catch (accountingError) {
            console.error(
              "⚠️ Accounting kaydı oluşturulurken hata:",
              accountingError
            );
          }

          console.log(
            "✅ Payment başarılı, randevu tamamlandı:",
            appointment._id
          );
        } else if (paymentStatus === "FAILURE" || paymentStatus === "failure") {
          // Ödeme başarısız
          payment.paymentStatus = "failed";
          await payment.save();

          console.log("❌ Payment başarısız:", appointment._id);
        }
      }
    }

    // Iyzico webhook'a 200 döndür
    res.status(200).send("OK");
  } catch (error) {
    console.error("Iyzico Webhook Error:", error);
    // Hata olsa bile Iyzico'ya 200 döndür (retry olmasın)
    res.status(200).send("OK");
  }
};

module.exports = {
  initializePayment,
  paymentCallback,
  getPaymentStatus,
  getPayments,
  cancelPayment,
  sendPaymentLinkViaSMS,
  refundPayment,
  createPayment,
  createPaymentLink,
  iyzicoWebhook,
};
