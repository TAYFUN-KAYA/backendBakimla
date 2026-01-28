const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const Product = require('../models/Product');
const Store = require('../models/Store');

/**
 * createReview
 * Yorum oluştur
 */
const createReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { appointmentId, productId, employeeId, companyId, rating, comment, reviewType } = req.body;

    if (!rating || !reviewType) {
      return res.status(400).json({
        success: false,
        message: 'rating ve reviewType zorunludur',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Puan 1-5 arasında olmalıdır',
      });
    }

    // Randevu yorumu için randevu kontrolü
    if (reviewType === 'appointment' && appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Randevu bulunamadı',
        });
      }

      // Randevu tamamlanmış ve ödeme alınmış olmalı
      if (appointment.status !== 'completed' || !appointment.paymentReceived) {
        return res.status(400).json({
          success: false,
          message: 'Sadece tamamlanmış ve ödemesi alınmış randevular değerlendirilebilir',
        });
      }

      // Daha önce yorum yapılmış mı kontrol et
      const existingReview = await Review.findOne({ userId, appointmentId });
      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'Bu randevu için zaten yorum yaptınız',
        });
      }
    }

    // Ürün yorumu için ürün kontrolü
    if (reviewType === 'product' && productId) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Ürün bulunamadı',
        });
      }

      const existingReview = await Review.findOne({ userId, productId });
      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'Bu ürün için zaten yorum yaptınız',
        });
      }
    }

    const review = await Review.create({
      userId,
      appointmentId: reviewType === 'appointment' ? appointmentId : undefined,
      productId: reviewType === 'product' ? productId : undefined,
      employeeId,
      companyId,
      rating,
      comment,
      reviewType,
      isVerified: reviewType === 'appointment' ? true : false,
    });

    // Eğer companyId varsa, Store modelindeki rating'i güncelle
    if (companyId) {
      try {
        // Store'u bul (companyId'ye göre)
        const store = await Store.findOne({ companyId });
        
        if (store) {
          // Tüm yorumların ortalamasını hesapla
          const ratingResult = await Review.aggregate([
            {
              $match: {
                companyId: companyId,
                isPublished: true,
              },
            },
            {
              $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 },
              },
            },
          ]);

          const avgRating = ratingResult[0]?.avgRating || 0;
          const reviewCount = ratingResult[0]?.reviewCount || 0;

          // Store'u güncelle
          await Store.findByIdAndUpdate(store._id, {
            rating: avgRating > 0 ? parseFloat(avgRating.toFixed(1)) : 0,
            reviewCount: reviewCount || 0,
          });
        }
      } catch (error) {
        console.error('Store rating update error:', error);
        // Hata olsa bile review oluşturuldu, sadece log'la
      }
    }

    res.status(201).json({
      success: true,
      message: 'Yorum başarıyla oluşturuldu',
      data: review,
    });
  } catch (error) {
    console.error('Create Review Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getReviews
 * Yorumları listele
 */
const getReviews = async (req, res) => {
  try {
    const { companyId, productId, appointmentId, employeeId, reviewType, page = 1, limit = 20 } = req.query;

    const query = { isPublished: true };
    if (companyId) query.companyId = companyId;
    if (productId) query.productId = productId;
    if (appointmentId) query.appointmentId = appointmentId;
    if (employeeId) query.employeeId = employeeId;
    if (reviewType) query.reviewType = reviewType;

    const reviews = await Review.find(query)
      .populate('userId', 'firstName lastName profileImage')
      .populate('employeeId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    // Ortalama puan hesapla
    const avgRating = await Review.aggregate([
      { $match: query },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      averageRating: avgRating[0]?.avgRating || 0,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: reviews,
    });
  } catch (error) {
    console.error('Get Reviews Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getStoreReviews
 * İşletmeye ait yorumları getirir
 */
const getStoreReviews = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'İşletme ID gereklidir',
      });
    }

    // Get store's company ID
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'İşletme bulunamadı',
      });
    }

    const query = {
      companyId: store.companyId,
      isPublished: true,
    };

    const reviews = await Review.find(query)
      .populate('userId', 'firstName lastName profileImage')
      .populate('employeeId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Review.countDocuments(query);

    // Ortalama puan hesapla
    const avgRating = await Review.aggregate([
      { $match: query },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      averageRating: avgRating[0]?.avgRating || 0,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: reviews,
    });
  } catch (error) {
    console.error('getStoreReviews error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createReview,
  getReviews,
  getStoreReviews,
};

