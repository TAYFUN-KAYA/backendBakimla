const Store = require('../models/Store');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');

/**
 * createStore
 * Şirket için mağaza bilgilerini oluşturur
 */
const createStore = async (req, res) => {
  try {
    const {
      companyId,
      storeName,
      authorizedPersonName,
      authorizedPersonTCKN,
      businessName,
      taxOffice,
      taxNumber,
      iban,
      businessDescription,
      businessPassword,
      interiorImage,
      exteriorImage,
      appIcon,
      workingDays,
      sectors,
      serviceType,
      serviceDuration,
      servicePrice,
      serviceCategory,
      businessField,
    } = req.body;

    if (
      !companyId ||
      !storeName ||
      !authorizedPersonName ||
      !authorizedPersonTCKN ||
      !businessName ||
      !taxOffice ||
      !taxNumber ||
      !iban ||
      !businessDescription ||
      !businessPassword ||
      !interiorImage ||
      !exteriorImage ||
      !appIcon ||
      !workingDays ||
      !sectors ||
      !serviceType ||
      !serviceDuration ||
      !servicePrice ||
      !serviceCategory ||
      !businessField
    ) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanlar zorunludur',
      });
    }

    if (!Array.isArray(workingDays) || workingDays.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'En az bir çalışma günü belirtilmelidir',
      });
    }

    if (!Array.isArray(sectors) || sectors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'En az bir sektör seçilmelidir',
      });
    }

    const company = await User.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı',
      });
    }

    if (company.userType !== 'company') {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı bir şirket değil',
      });
    }

    const store = await Store.create({
      companyId,
      storeName,
      authorizedPersonName,
      authorizedPersonTCKN,
      businessName,
      taxOffice,
      taxNumber,
      iban,
      businessDescription,
      businessPassword,
      interiorImage,
      exteriorImage,
      appIcon,
      workingDays,
      sectors,
      serviceType,
      serviceDuration,
      servicePrice,
      serviceCategory,
      businessField,
    });

    if (!company.activeStoreId) {
      company.activeStoreId = store._id;
      await company.save();
    }

    res.status(201).json({
      success: true,
      message: 'Mağaza bilgileri başarıyla oluşturuldu',
      data: store,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getCompanyStores
 * Şirketin tüm mağazalarını getirir
 */
const getCompanyStores = async (req, res) => {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'companyId gereklidir',
      });
    }

    const company = await User.findById(companyId);
    if (!company || company.userType !== 'company') {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı',
      });
    }

    const stores = await Store.find({ companyId })
      .populate('companyId', 'firstName lastName email phoneNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: stores.length,
      activeStoreId: company.activeStoreId,
      data: stores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getStoreDetails
 * Store ID'sine göre işletme detaylarını getirir (normal kullanıcılar için)
 */
const getStoreDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findById(id)
      .populate('companyId', 'firstName lastName email phoneNumber profileImage')
      .select('-businessPassword -authorizedPersonTCKN -taxNumber -iban');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'İşletme bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getStoreByCompanyId
 * Şirket ID'sine göre belirli bir mağaza bilgisini getirir
 */
const getStoreByCompanyId = async (req, res) => {
  try {
    const { companyId, storeId } = req.params;

    const query = { companyId };
    if (storeId) {
      query._id = storeId;
    }

    const store = await Store.findOne(query).populate('companyId', 'firstName lastName email phoneNumber');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Mağaza bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * setActiveStore
 * Şirketin aktif mağazasını seçer
 */
const setActiveStore = async (req, res) => {
  try {
    const { companyId, storeId } = req.body;

    if (!companyId || !storeId) {
      return res.status(400).json({
        success: false,
        message: 'companyId ve storeId gereklidir',
      });
    }

    const company = await User.findById(companyId);
    if (!company || company.userType !== 'company') {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı',
      });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Mağaza bulunamadı',
      });
    }

    if (store.companyId.toString() !== companyId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bu mağaza bu şirkete ait değil',
      });
    }

    company.activeStoreId = storeId;
    await company.save();

    res.status(200).json({
      success: true,
      message: 'Aktif mağaza başarıyla seçildi',
      data: {
        activeStoreId: company.activeStoreId,
        store: store,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateStore
 * Mağaza bilgilerini günceller
 */
const updateStore = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Mağaza bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Mağaza bilgileri başarıyla güncellendi',
      data: store,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateStoreByCompanyId
 * Şirket ID'sine göre mağaza bilgilerini günceller
 */
const updateStoreByCompanyId = async (req, res) => {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'companyId gereklidir',
      });
    }

    const company = await User.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı',
      });
    }

    if (company.userType !== 'company') {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı bir şirket değil',
      });
    }

    const store = await Store.findOneAndUpdate({ companyId }, req.body, {
      new: true,
      runValidators: true,
    }).populate('companyId', 'firstName lastName email phoneNumber');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Mağaza bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Mağaza bilgileri başarıyla güncellendi',
      data: store,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllStores
 * Tüm mağazaları listeler
 */
const getAllStores = async (req, res) => {
  try {
    const stores = await Store.find().populate('companyId', 'firstName lastName email phoneNumber');

    res.status(200).json({
      success: true,
      count: stores.length,
      data: stores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getMyStoreInfo
 * Şirketin aktif mağaza bilgilerini getirir
 */
const getMyStoreInfo = async (req, res) => {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'companyId gereklidir',
      });
    }

    const company = await User.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı',
      });
    }

    if (company.userType !== 'company') {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı bir şirket değil',
      });
    }

    if (!company.activeStoreId) {
      return res.status(404).json({
        success: false,
        message: 'Aktif mağaza seçilmemiş',
      });
    }

    const store = await Store.findById(company.activeStoreId).populate('companyId', 'firstName lastName email phoneNumber');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Mağaza bilgileri bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getStoreCustomers
 * İşletmeye ait müşteri listesini getirir
 */
const getStoreCustomers = async (req, res) => {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'companyId gereklidir',
      });
    }

    const company = await User.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı',
      });
    }

    if (company.userType !== 'company') {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı bir şirket değil',
      });
    }

    const customers = await Customer.find({ companyId }).select('firstName lastName phoneNumber notes');

    const customersWithAppointments = await Promise.all(
      customers.map(async (customer) => {
        const appointments = await Appointment.find({
          customerIds: customer._id,
          companyId: companyId,
          status: 'completed',
        })
          .sort({ appointmentDate: -1 })
          .select('appointmentDate appointmentTime serviceType serviceDuration servicePrice notes status');

        const customerObj = customer.toObject();
        customerObj.pastAppointments = appointments;
        return customerObj;
      })
    );

    res.status(200).json({
      success: true,
      count: customersWithAppointments.length,
      data: customersWithAppointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createStore,
  getCompanyStores,
  getStoreDetails,
  getStoreByCompanyId,
  setActiveStore,
  updateStore,
  updateStoreByCompanyId,
  getAllStores,
  getMyStoreInfo,
  getStoreCustomers,
};

