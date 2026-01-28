/**
 * Generic Admin CRUD Controller
 * Tüm modeller için genel CRUD işlemleri
 */

const mongoose = require('mongoose');

// Model mapping - tüm modelleri buraya ekle
const models = {
  User: require('../models/User'),
  Store: require('../models/Store'),
  Appointment: require('../models/Appointment'),
  Payment: require('../models/Payment'),
  Order: require('../models/Order'),
  Product: require('../models/Product'),
  Review: require('../models/Review'),
  Campaign: require('../models/Campaign'),
  Coupon: require('../models/Coupon'),
  Address: require('../models/Address'),
  Basket: require('../models/Basket'),
  Favorite: require('../models/Favorite'),
  Invoice: require('../models/Invoice'),
  Notification: require('../models/Notification'),
  Points: require('../models/Points').Points,
  PointsTransaction: require('../models/Points').PointsTransaction,
  Reward: require('../models/Reward').Reward,
  RewardTransaction: require('../models/Reward').RewardTransaction,
  Service: require('../models/Service'),
  Accounting: require('../models/Accounting'),
  Customer: require('../models/Customer'),
  Form: require('../models/Form'),
  PaymentMethod: require('../models/PaymentMethod'),
  UserCampaign: require('../models/UserCampaign'),
  UserCoupon: require('../models/UserCoupon'),
  UserFavoriteStore: require('../models/UserFavoriteStore'),
  BakimlaStoreCoupon: require('../models/BakimlaStoreCoupon'),
  BusinessHomeAd: require('../models/BusinessHomeAd'),
  ClientHomeAd: require('../models/ClientHomeAd'),
  ClientCenterAd: require('../models/ClientCenterAd'),
  QuickAppointment: require('../models/QuickAppointment'),
  Wallet: require('../models/Wallet').Wallet,
  WalletTransaction: require('../models/Wallet').WalletTransaction,
  WithdrawalRequest: require('../models/Wallet').WithdrawalRequest,
  OTP: require('../models/OTP'),
};

/**
 * Generic GET ALL - Tüm kayıtları listele
 */
const getAll = (modelName) => async (req, res) => {
  try {
    const Model = models[modelName];
    if (!Model) {
      return res.status(404).json({
        success: false,
        message: `Model ${modelName} bulunamadı`,
      });
    }

    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Query oluştur
    let query = {};
    
    // Search için - model'e göre dinamik arama
    if (search) {
      if (modelName === 'Basket') {
        const User = models['User'];
        const ids = await User.find({
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }).distinct('_id');
        query.userId = ids.length ? { $in: ids } : { $in: [] };
      } else if (modelName === 'Favorite') {
        const User = models['User'];
        const Product = models['Product'];
        const [userIds, productIds] = await Promise.all([
          User.find({
            $or: [
              { firstName: { $regex: search, $options: 'i' } },
              { lastName: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
            ],
          }).distinct('_id'),
          Product.find({ name: { $regex: search, $options: 'i' } }).distinct('_id'),
        ]);
        query.$or = [
          userIds.length ? { userId: { $in: userIds } } : { userId: { $in: [] } },
          productIds.length ? { productId: { $in: productIds } } : { productId: { $in: [] } },
        ];
      } else if (modelName === 'Notification') {
        // Notification için hem başlık/mesaj hem de kullanıcı adı/email ile arama
        const User = models['User'];
        const userIds = await User.find({
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } },
          ],
        }).distinct('_id');
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } },
          ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
        ];
      } else if (modelName === 'Service') {
        // Service için hem hizmet adı/kategori hem de işletme adı/email ile arama
        const User = models['User'];
        const companyIds = await User.find({
          userType: 'company',
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }).distinct('_id');
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          ...(companyIds.length ? [{ companyId: { $in: companyIds } }] : []),
        ];
      } else {
        const searchFields = getSearchFields(modelName);
        if (searchFields.length > 0) {
          query.$or = searchFields.map(field => ({
            [field]: { $regex: search, $options: 'i' }
          }));
        }
      }
    }

    // Diğer filtreler
    Object.keys(filters).forEach(key => {
      if (filters[key] !== '' && filters[key] !== undefined) {
        query[key] = filters[key];
      }
    });

    // Sıralama
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Populate fields - model'e göre
    const populateFields = getPopulateFields(modelName);

    let queryBuilder = Model.find(query).sort(sort).skip(skip).limit(parseInt(limit));
    
    if (populateFields.length > 0) {
      populateFields.forEach(field => {
        queryBuilder = queryBuilder.populate(field);
      });
    }

    const [data, total] = await Promise.all([
      queryBuilder.lean(),
      Model.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data,
    });
  } catch (error) {
    console.error(`Get All ${modelName} Error:`, error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Generic GET BY ID - Tek kayıt getir
 */
const getById = (modelName) => async (req, res) => {
  try {
    const Model = models[modelName];
    if (!Model) {
      return res.status(404).json({
        success: false,
        message: `Model ${modelName} bulunamadı`,
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz ID',
      });
    }

    const populateFields = getPopulateFields(modelName);
    let query = Model.findById(id);
    
    if (populateFields.length > 0) {
      populateFields.forEach(field => {
        query = query.populate(field);
      });
    }

    const data = await query.lean();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: `${modelName} bulunamadı`,
      });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(`Get ${modelName} By ID Error:`, error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Generic CREATE - Yeni kayıt oluştur
 */
const create = (modelName) => async (req, res) => {
  try {
    const Model = models[modelName];
    if (!Model) {
      return res.status(404).json({
        success: false,
        message: `Model ${modelName} bulunamadı`,
      });
    }

    const data = new Model(req.body);
    await data.save();

    const populateFields = getPopulateFields(modelName);
    let populatedData = data.toObject();
    
    if (populateFields.length > 0) {
      const populated = await Model.findById(data._id).populate(populateFields);
      populatedData = populated.toObject();
    }

    res.status(201).json({
      success: true,
      message: `${modelName} başarıyla oluşturuldu`,
      data: populatedData,
    });
  } catch (error) {
    console.error(`Create ${modelName} Error:`, error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Generic UPDATE - Kayıt güncelle
 */
const update = (modelName) => async (req, res) => {
  try {
    const Model = models[modelName];
    if (!Model) {
      return res.status(404).json({
        success: false,
        message: `Model ${modelName} bulunamadı`,
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz ID',
      });
    }

    const data = await Model.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: `${modelName} bulunamadı`,
      });
    }

    const populateFields = getPopulateFields(modelName);
    let populatedData = data.toObject();
    
    if (populateFields.length > 0) {
      const populated = await Model.findById(data._id).populate(populateFields);
      populatedData = populated.toObject();
    }

    res.status(200).json({
      success: true,
      message: `${modelName} başarıyla güncellendi`,
      data: populatedData,
    });
  } catch (error) {
    console.error(`Update ${modelName} Error:`, error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Generic DELETE - Kayıt sil
 */
const remove = (modelName) => async (req, res) => {
  try {
    const Model = models[modelName];
    if (!Model) {
      return res.status(404).json({
        success: false,
        message: `Model ${modelName} bulunamadı`,
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz ID',
      });
    }

    const data = await Model.findByIdAndDelete(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: `${modelName} bulunamadı`,
      });
    }

    res.status(200).json({
      success: true,
      message: `${modelName} başarıyla silindi`,
      data,
    });
  } catch (error) {
    console.error(`Delete ${modelName} Error:`, error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Model'e göre arama alanlarını döndür
 */
function getSearchFields(modelName) {
  const searchFieldsMap = {
    User: ['firstName', 'lastName', 'email', 'phoneNumber', 'username'],
    Store: ['storeName', 'businessName', 'businessDescription'],
    Product: ['name', 'description', 'category', 'brand'],
    Appointment: ['serviceCategory', 'taskType'],
    Campaign: ['title', 'description'],
    Coupon: ['code', 'description'],
    Review: ['comment'],
    Notification: ['title', 'message'],
    Service: ['name', 'category'],
    Customer: ['firstName', 'lastName', 'phoneNumber', 'notes'],
    BakimlaStoreCoupon: ['code', 'name', 'description'],
    Address: ['title', 'firstName', 'lastName', 'phoneNumber', 'addressLine1', 'city', 'district'],
    OTP: ['phoneNumber', 'code', 'purpose'],
  };

  return searchFieldsMap[modelName] || ['name', 'title'];
}

/**
 * Model'e göre populate edilecek alanları döndür
 */
function getPopulateFields(modelName) {
  const populateFieldsMap = {
    User: ['companyId'],
    Store: ['companyId'],
    Appointment: ['userId', 'companyId', 'employeeId', 'customerIds'],
    Payment: ['userId', 'orderId'],
    Order: ['userId', 'shippingAddress', 'billingAddress', 'items.productId'],
    Product: ['companyId'],
    Review: ['userId', 'companyId', 'employeeId', 'productId', 'appointmentId'],
    Campaign: ['companyId'],
    Coupon: ['companyId'],
    Address: ['userId'],
    Basket: ['userId', 'items.productId', 'couponId'],
    Favorite: ['userId', 'productId'],
    Invoice: ['userId', 'orderId'],
    Notification: ['userId'],
    UserCampaign: ['userId', 'campaignId'],
    UserCoupon: ['userId', 'couponId'],
    UserFavoriteStore: ['userId', 'storeId'],
    Service: ['companyId'],
    Accounting: ['companyId'],
    Customer: ['companyId'],
    PaymentMethod: ['userId'],
    BusinessHomeAd: ['companyId'],
    ClientHomeAd: ['companyId'],
    ClientCenterAd: ['companyId'],
    QuickAppointment: ['companyId', 'customerIds'],
    Wallet: ['companyId'],
    Points: ['userId'],
    PointsTransaction: ['userId', 'appointmentId', 'orderId'],
    Reward: ['companyId'],
    RewardTransaction: ['companyId', 'appointmentId'],
  };

  return populateFieldsMap[modelName] || [];
}

/**
 * Tüm modeller için CRUD fonksiyonlarını export et
 */
const createCrudFunctions = (modelName) => ({
  getAll: getAll(modelName),
  getById: getById(modelName),
  create: create(modelName),
  update: update(modelName),
  remove: remove(modelName),
});

module.exports = {
  createCrudFunctions,
  getAll,
  getById,
  create,
  update,
  remove,
  models,
};
