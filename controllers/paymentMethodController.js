const PaymentMethod = require('../models/PaymentMethod');
const User = require('../models/User');
const iyzipay = require('../config/iyzico');

/**
 * getPaymentMethods
 * Kayıtlı ödeme yöntemlerini listele
 * İyzico dokümantasyonuna göre: POST /cardstorage/cards
 */
const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user._id;

    // Kullanıcının iyzicoCardUserKey'ini al
    const user = await User.findById(userId).select('iyzicoCardUserKey');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    // Eğer kullanıcının cardUserKey'i yoksa, boş liste döndür
    if (!user.iyzicoCardUserKey) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // İyzico'dan kartları sorgula (POST /cardstorage/cards)
    const request = {
      locale: 'tr',
      conversationId: `CONV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cardUserKey: user.iyzicoCardUserKey,
    };

    iyzipay.card.list(request, async (err, result) => {
      if (err) {
        console.error('Iyzico Card List Error:', err);
        // Hata durumunda database'den çek
        const paymentMethods = await PaymentMethod.find({ userId, isActive: true }).sort({
          isDefault: -1,
          createdAt: -1,
        });
        return res.status(200).json({
          success: true,
          count: paymentMethods.length,
          data: paymentMethods,
        });
      }

      if (result.status === 'failure') {
        console.error('Iyzico Card List Failure:', result.errorMessage);
        // Hata durumunda database'den çek
        const paymentMethods = await PaymentMethod.find({ userId, isActive: true }).sort({
          isDefault: -1,
          createdAt: -1,
        });
        return res.status(200).json({
          success: true,
          count: paymentMethods.length,
          data: paymentMethods,
        });
      }

      // İyzico'dan gelen kartları database ile senkronize et
      const iyzicoCards = result.cardDetails || [];
      const paymentMethods = [];

      for (const card of iyzicoCards) {
        // Database'de bu kart var mı kontrol et
        let paymentMethod = await PaymentMethod.findOne({
          userId,
          iyzicoCardToken: card.cardToken,
        });

        if (!paymentMethod) {
          // Yeni kart, database'e ekle
          paymentMethod = await PaymentMethod.create({
            userId,
            iyzicoCardToken: card.cardToken,
            iyzicoCardUserKey: result.cardUserKey || user.iyzicoCardUserKey,
            cardType: card.cardType,
            cardAssociation: card.cardAssociation,
            cardFamily: card.cardFamily,
            binNumber: card.binNumber,
            lastFourDigits: card.lastFourDigits,
            cardHolderName: card.cardHolderName || '',
            isDefault: false,
            isActive: true,
          });
        } else {
          // Mevcut kartı güncelle
          paymentMethod.cardType = card.cardType;
          paymentMethod.cardAssociation = card.cardAssociation;
          paymentMethod.cardFamily = card.cardFamily;
          paymentMethod.binNumber = card.binNumber;
          paymentMethod.lastFourDigits = card.lastFourDigits;
          paymentMethod.isActive = true;
          await paymentMethod.save();
        }

        paymentMethods.push(paymentMethod);
      }

      // İyzico'da olmayan ama database'de olan kartları pasif yap
      const iyzicoCardTokens = iyzicoCards.map(c => c.cardToken);
      await PaymentMethod.updateMany(
        {
          userId,
          iyzicoCardToken: { $nin: iyzicoCardTokens },
          isActive: true,
        },
        { isActive: false }
      );

      // Sıralama: default önce, sonra oluşturulma tarihine göre
      paymentMethods.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      res.status(200).json({
        success: true,
        count: paymentMethods.length,
        data: paymentMethods,
      });
    });
  } catch (error) {
    console.error('Get Payment Methods Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * addPaymentMethod
 * Ödeme yöntemi ekle (tokenize edilmiş kartı database'e kaydet)
 * Not: Kart zaten tokenizeCard ile iyzico'ya kaydedilmiş olmalı
 */
const addPaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cardToken, cardUserKey, isDefault, binNumber, lastFourDigits, cardType, cardAssociation, cardFamily, cardHolderName } = req.body;

    if (!cardToken || !cardUserKey) {
      return res.status(400).json({
        success: false,
        message: 'cardToken ve cardUserKey zorunludur',
      });
    }

    // Bu kart zaten database'de var mı kontrol et
    const existingPaymentMethod = await PaymentMethod.findOne({
      userId,
      iyzicoCardToken: cardToken,
    });

    if (existingPaymentMethod) {
      // Mevcut kartı güncelle
      existingPaymentMethod.isDefault = isDefault || false;
      existingPaymentMethod.isActive = true;
      if (binNumber) existingPaymentMethod.binNumber = binNumber;
      if (lastFourDigits) existingPaymentMethod.lastFourDigits = lastFourDigits;
      if (cardType) existingPaymentMethod.cardType = cardType;
      if (cardAssociation) existingPaymentMethod.cardAssociation = cardAssociation;
      if (cardFamily) existingPaymentMethod.cardFamily = cardFamily;
      if (cardHolderName) existingPaymentMethod.cardHolderName = cardHolderName;
      await existingPaymentMethod.save();

      return res.status(200).json({
        success: true,
        message: 'Ödeme yöntemi güncellendi',
        data: existingPaymentMethod,
      });
    }

    // Yeni ödeme yöntemi kaydı oluştur
    const paymentMethod = await PaymentMethod.create({
      userId,
      iyzicoCardToken: cardToken,
      iyzicoCardUserKey: cardUserKey,
      cardType: cardType || null,
      cardAssociation: cardAssociation || null,
      cardFamily: cardFamily || null,
      binNumber: binNumber || null,
      lastFourDigits: lastFourDigits || '',
      cardHolderName: cardHolderName || '',
      isDefault: isDefault || false,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Ödeme yöntemi kaydedildi',
      data: paymentMethod,
    });
  } catch (error) {
    console.error('Add Payment Method Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * tokenizeCard
 * Kart bilgilerini iyzico'ya gönderip token al
 * İyzico dokümantasyonuna göre: POST /cardstorage/card
 */
const tokenizeCard = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cardNumber, expireMonth, expireYear, cvc, cardHolderName, cardAlias } = req.body;

    if (!cardNumber || !expireMonth || !expireYear || !cvc || !cardHolderName) {
      return res.status(400).json({
        success: false,
        message: 'Tüm kart bilgileri zorunludur',
      });
    }

    // Kullanıcı bilgilerini al (iyzico için gerekli)
    const user = await User.findById(userId).select('email phoneNumber iyzicoCardUserKey');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    // İyzico dokümantasyonuna göre request oluştur
    const request = {
      locale: 'tr',
      conversationId: `CONV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      card: {
        cardNumber: cardNumber.replace(/\s/g, ''), // Boşlukları temizle
        expireMonth: expireMonth,
        expireYear: expireYear,
        cardHolderName: cardHolderName,
        ...(cardAlias && { cardAlias: cardAlias }),
      },
    };

    // Eğer kullanıcının cardUserKey'i varsa, mevcut kullanıcıya kart ekle
    // Yoksa yeni kullanıcı oluştur
    if (user.iyzicoCardUserKey) {
      request.cardUserKey = user.iyzicoCardUserKey;
    } else {
      // Yeni kullanıcı için externalId ve email gerekli
      request.externalId = userId.toString();
      request.email = user.email || `${user.phoneNumber}@bakimla.com`;
    }

    // iyzico card storage API'sine istek gönder (POST /cardstorage/card)
    iyzipay.card.create(request, async (err, result) => {
      if (err) {
        console.error('Iyzico Card Create Error:', err);
        return res.status(400).json({
          success: false,
          message: 'Kart kaydedilemedi',
          error: err.message,
        });
      }

      if (result.status === 'failure') {
        console.error('Iyzico Card Create Failure:', result.errorMessage);
        return res.status(400).json({
          success: false,
          message: result.errorMessage || 'Kart kaydedilemedi',
          errorCode: result.errorCode,
        });
      }

      // İlk kart kaydında cardUserKey'i User'a kaydet
      if (!user.iyzicoCardUserKey && result.cardUserKey) {
        user.iyzicoCardUserKey = result.cardUserKey;
        await user.save();
      }

      // Başarılı - token ve userKey döndür
      res.status(200).json({
        success: true,
        message: 'Kart başarıyla tokenize edildi',
        data: {
          cardToken: result.cardToken,
          cardUserKey: result.cardUserKey || user.iyzicoCardUserKey,
          binNumber: result.binNumber,
          lastFourDigits: result.lastFourDigits,
          cardType: result.cardType,
          cardAssociation: result.cardAssociation,
          cardFamily: result.cardFamily,
          cardBankCode: result.cardBankCode,
          cardBankName: result.cardBankName,
        },
      });
    });
  } catch (error) {
    console.error('Tokenize Card Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * deletePaymentMethod
 * Ödeme yöntemini sil
 * İyzico dokümantasyonuna göre: DELETE /cardstorage/card
 */
const deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const paymentMethod = await PaymentMethod.findOne({ _id: id, userId });
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Ödeme yöntemi bulunamadı',
      });
    }

    // İyzico dokümantasyonuna göre DELETE /cardstorage/card
    const request = {
      locale: 'tr',
      conversationId: `CONV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cardUserKey: paymentMethod.iyzicoCardUserKey,
      cardToken: paymentMethod.iyzicoCardToken,
    };

    iyzipay.card.delete(request, async (err, result) => {
      // İyzico'dan silme işlemi başarısız olsa bile database'den sil
      // (Kart zaten silinmiş olabilir veya başka bir hata olabilir)
      await PaymentMethod.findByIdAndDelete(id);

      if (err || (result && result.status === 'failure')) {
        console.error('Iyzico Card Delete Error:', err || result.errorMessage);
        // Hata olsa bile database'den silindi, başarılı döndür
        return res.status(200).json({
          success: true,
          message: 'Ödeme yöntemi silindi',
          note: 'İyzico silme işlemi başarısız olabilir, ancak yerel kayıt silindi',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Ödeme yöntemi silindi',
      });
    });
  } catch (error) {
    console.error('Delete Payment Method Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  tokenizeCard,
};

