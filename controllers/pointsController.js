const { Points, PointsTransaction } = require('../models/Points');
const Appointment = require('../models/Appointment');
const Order = require('../models/Order');

/**
 * getPoints
 * Kullanıcının puan bilgilerini getir
 */
const getPoints = async (req, res) => {
  try {
    const userId = req.user._id;

    let points = await Points.findOne({ userId });

    if (!points) {
      points = await Points.create({
        userId,
        totalPoints: 0,
        usedPoints: 0,
        availablePoints: 0,
        totalValueInTL: 0,
      });
    }

    res.status(200).json({
      success: true,
      data: points,
    });
  } catch (error) {
    console.error('Get Points Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getPointsTransactions
 * Puan işlem geçmişini getir
 * paymentMethod parametresi: 'card' (card), 'cash' (cash, iban), null (tümü)
 */
const getPointsTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, type, paymentMethod } = req.query;

    const query = { userId };
    if (type) {
      query.type = type;
    }

    let transactions = await PointsTransaction.find(query)
      .populate('appointmentId', 'appointmentDate servicePrice paymentMethod')
      .populate('orderId', 'orderNumber total paymentMethod')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Payment method'a göre filtrele
    if (paymentMethod === 'card') {
      // Kredi kartı ödemeleri: card payment method'u olanlar
      transactions = transactions.filter(t => {
        const pm = t.appointmentId?.paymentMethod || t.orderId?.paymentMethod;
        return pm === 'card';
      });
    } else if (paymentMethod === 'cash') {
      // Nakit ve IBAN ödemeleri: cash veya iban payment method'u olanlar
      transactions = transactions.filter(t => {
        const pm = t.appointmentId?.paymentMethod || t.orderId?.paymentMethod;
        return pm === 'cash' || pm === 'iban';
      });
    }

    // Total count için aynı filtrelemeyi yap
    let totalQuery = { userId };
    if (type) {
      totalQuery.type = type;
    }
    let totalTransactions = await PointsTransaction.find(totalQuery)
      .populate('appointmentId', 'paymentMethod')
      .populate('orderId', 'paymentMethod');
    
    if (paymentMethod === 'card') {
      totalTransactions = totalTransactions.filter(t => {
        const pm = t.appointmentId?.paymentMethod || t.orderId?.paymentMethod;
        return pm === 'card';
      });
    } else if (paymentMethod === 'cash') {
      totalTransactions = totalTransactions.filter(t => {
        const pm = t.appointmentId?.paymentMethod || t.orderId?.paymentMethod;
        return pm === 'cash' || pm === 'iban';
      });
    }

    const total = totalTransactions.length;

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: transactions,
    });
  } catch (error) {
    console.error('Get Points Transactions Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * addPoints
 * Puan ekle (internal use - randevu/ürün satın alma sonrası)
 */
const addPoints = async (userId, amount, source, sourceId, description) => {
  try {
    // Randevu tutarının %10'u kadar puan kazan
    const pointsToAdd = Math.floor(amount * 0.1);
    const valueInTL = pointsToAdd * 0.1; // Toplam puanın %10'u = 1 TL

    let points = await Points.findOne({ userId });

    if (!points) {
      points = await Points.create({
        userId,
        totalPoints: 0,
        usedPoints: 0,
        availablePoints: 0,
        totalValueInTL: 0,
      });
    }

    points.totalPoints += pointsToAdd;
    points.availablePoints += pointsToAdd;
    points.totalValueInTL += valueInTL;
    await points.save();

    // İşlem kaydı
    await PointsTransaction.create({
      userId,
      type: 'earned',
      points: pointsToAdd,
      valueInTL,
      description: description || `${source} puan kazandı`,
      appointmentId: source === 'appointment' ? sourceId : undefined,
      orderId: source === 'order' ? sourceId : undefined,
      source,
      sourceAmount: amount,
    });

    return { success: true, points, pointsAdded: pointsToAdd };
  } catch (error) {
    console.error('Add Points Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * usePoints
 * Puan kullan (internal use - randevu/ürün satın alma sırasında)
 */
const usePoints = async (userId, pointsToUse, orderId, appointmentId, description) => {
  try {
    let points = await Points.findOne({ userId });

    if (!points || points.availablePoints < pointsToUse) {
      return { success: false, error: 'Yetersiz puan' };
    }

    points.usedPoints += pointsToUse;
    points.availablePoints -= pointsToUse;
    await points.save();

    const valueInTL = pointsToUse * 0.1;

    // İşlem kaydı
    await PointsTransaction.create({
      userId,
      type: 'used',
      points: pointsToUse,
      valueInTL,
      description: description || 'Puan kullanıldı',
      orderId,
      appointmentId,
      source: orderId ? 'order' : 'appointment',
    });

    return { success: true, points, valueInTL };
  } catch (error) {
    console.error('Use Points Error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getPoints,
  getPointsTransactions,
  addPoints, // Internal
  usePoints, // Internal
};

