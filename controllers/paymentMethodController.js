const PaymentMethod = require('../models/PaymentMethod');
const iyzipay = require('../config/iyzico');

/**
 * getPaymentMethods
 * Kayıtlı ödeme yöntemlerini listele
 */
const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user._id;

    const paymentMethods = await PaymentMethod.find({ userId, isActive: true }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: paymentMethods.length,
      data: paymentMethods,
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
 * Ödeme yöntemi ekle (iyzico'dan kart kaydetme sonrası)
 */
const addPaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cardToken, cardUserKey, isDefault } = req.body;

    if (!cardToken || !cardUserKey) {
      return res.status(400).json({
        success: false,
        message: 'cardToken ve cardUserKey zorunludur',
      });
    }

    // iyzico'dan kart bilgilerini al
    const request = {
      locale: 'tr',
      conversationId: `CONV-${Date.now()}`,
      cardUserKey: cardUserKey,
    };

    iyzipay.card.retrieve(request, async (err, result) => {
      if (err || result.status === 'failure') {
        return res.status(400).json({
          success: false,
          message: 'Kart bilgileri alınamadı',
          error: err?.message || result?.errorMessage,
        });
      }

      // Ödeme yöntemi kaydı oluştur
      const paymentMethod = await PaymentMethod.create({
        userId,
        iyzicoCardToken: cardToken,
        iyzicoCardUserKey: cardUserKey,
        cardType: result.cardType,
        cardAssociation: result.cardAssociation,
        cardFamily: result.cardFamily,
        binNumber: result.binNumber,
        lastFourDigits: result.lastFourDigits,
        cardHolderName: result.cardHolderName,
        isDefault: isDefault || false,
        isActive: true,
      });

      res.status(201).json({
        success: true,
        message: 'Ödeme yöntemi kaydedildi',
        data: paymentMethod,
      });
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
 * deletePaymentMethod
 * Ödeme yöntemini sil
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

    // iyzico'dan kartı sil
    const request = {
      locale: 'tr',
      conversationId: `CONV-${Date.now()}`,
      cardUserKey: paymentMethod.iyzicoCardUserKey,
      cardToken: paymentMethod.iyzicoCardToken,
    };

    iyzipay.card.delete(request, async (err, result) => {
      // iyzico hatası olsa bile local'den sil
      await PaymentMethod.findByIdAndDelete(id);

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
};

