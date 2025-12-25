const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const User = require('../models/User');
const Store = require('../models/Store');
const Coupon = require('../models/Coupon');
const Campaign = require('../models/Campaign');
const { usePoints, addPoints } = require('./pointsController');

/**
 * createAppointment
 * Yeni randevu oluşturur (tekli veya çoklu müşteri)
 */
const createAppointment = async (req, res) => {
  try {
    const {
      customerIds,
      companyId,
      employeeId,
      appointmentDate,
      appointmentTime,
      serviceCategory,
      taskType,
      serviceType,
      serviceDuration,
      servicePrice,
      paymentMethod,
      notes,
    } = req.body;

    if (
      !customerIds ||
      !companyId ||
      !employeeId ||
      !appointmentDate ||
      !appointmentTime ||
      !serviceCategory ||
      !taskType ||
      !serviceType ||
      !serviceDuration ||
      servicePrice === undefined ||
      !paymentMethod
    ) {
      return res.status(400).json({
        success: false,
        message: 'Tüm zorunlu alanlar doldurulmalıdır',
      });
    }

    if (!['cash', 'card'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Ödeme tipi "cash" veya "card" olmalıdır',
      });
    }

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'En az bir müşteri seçilmelidir',
      });
    }

    const company = await User.findById(companyId);
    if (!company || company.userType !== 'company') {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı',
      });
    }

    const employee = await User.findById(employeeId);
    if (!employee || employee.userType !== 'employee') {
      return res.status(404).json({
        success: false,
        message: 'Çalışan bulunamadı',
      });
    }

    if (employee.companyId.toString() !== companyId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Çalışan bu şirkete ait değil',
      });
    }

    if (!employee.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Çalışan henüz onaylanmamış',
      });
    }

    for (const customerId of customerIds) {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: `Müşteri bulunamadı: ${customerId}`,
        });
      }

      if (customer.companyId.toString() !== companyId.toString()) {
        return res.status(400).json({
          success: false,
          message: `Müşteri bu şirkete ait değil: ${customerId}`,
        });
      }
    }

    const appointmentDateObj = new Date(appointmentDate);
    const startOfDay = new Date(appointmentDateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointment = await Appointment.findOne({
      employeeId,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      appointmentTime,
      status: { $in: ['pending', 'completed'] },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Bu saatte zaten bir randevu mevcut',
      });
    }

    const appointment = await Appointment.create({
      customerIds,
      companyId,
      employeeId,
      appointmentDate: appointmentDateObj,
      appointmentTime,
      serviceCategory,
      taskType,
      serviceType,
      serviceDuration,
      servicePrice,
      paymentMethod,
      notes,
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('customerIds', 'firstName lastName phoneNumber')
      .populate('employeeId', 'firstName lastName')
      .populate('companyId', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Randevu başarıyla oluşturuldu',
      data: populatedAppointment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getCompanyAppointments
 * Şirketin tüm randevularını getirir
 */
const getCompanyAppointments = async (req, res) => {
  try {
    const { companyId } = req.body;
    const { status, startDate, endDate } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'companyId gereklidir',
      });
    }

    const query = { companyId };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.appointmentDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.appointmentDate.$lte = end;
      }
    }

    const appointments = await Appointment.find(query)
      .populate('customerIds', 'firstName lastName phoneNumber')
      .populate('employeeId', 'firstName lastName')
      .populate('companyId', 'firstName lastName')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getEmployeeAppointments
 * Çalışanın randevularını getirir
 */
const getEmployeeAppointments = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const { status, startDate, endDate } = req.query;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'employeeId gereklidir',
      });
    }

    const query = { employeeId };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.appointmentDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.appointmentDate.$lte = end;
      }
    }

    const appointments = await Appointment.find(query)
      .populate('customerIds', 'firstName lastName phoneNumber')
      .populate('employeeId', 'firstName lastName')
      .populate('companyId', 'firstName lastName')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateAppointment
 * Randevu bilgilerini günceller
 */
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('customerIds', 'firstName lastName phoneNumber')
      .populate('employeeId', 'firstName lastName')
      .populate('companyId', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Randevu başarıyla güncellendi',
      data: appointment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAppointmentSummary
 * Randevu özetini getirir
 */
const getAppointmentSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .populate('customerIds', 'firstName lastName phoneNumber notes')
      .populate('employeeId', 'firstName lastName email phoneNumber')
      .populate('companyId', 'firstName lastName email phoneNumber');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı',
      });
    }

    const summary = {
      appointmentId: appointment._id,
      date: appointment.appointmentDate,
      time: appointment.appointmentTime,
      status: appointment.status,
      customers: appointment.customerIds,
      employee: appointment.employeeId,
      company: appointment.companyId,
      service: {
        category: appointment.serviceCategory,
        type: appointment.serviceType,
        taskType: appointment.taskType,
        duration: appointment.serviceDuration,
        price: appointment.servicePrice,
      },
      payment: {
        method: appointment.paymentMethod,
        methodText: appointment.paymentMethod === 'cash' ? 'Nakit' : 'Kredi Kartı',
      },
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * deleteAppointment
 * Randevuyu siler
 */
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Randevu başarıyla silindi',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * createAppointmentFromClient
 * Client uygulamasından randevu oluştur
 */
const createAppointmentFromClient = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      companyId,
      employeeId,
      appointmentDate,
      appointmentTime,
      services, // [{ serviceType, serviceDuration, servicePrice, personIndex }]
      personCount = 1,
      paymentMethod,
      couponId,
      campaignId,
      pointsToUse,
      notes,
    } = req.body;

    if (!companyId || !employeeId || !appointmentDate || !appointmentTime || !services || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Tüm zorunlu alanlar doldurulmalıdır',
      });
    }

    if (!['cash', 'card'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Ödeme tipi "cash" veya "card" olmalıdır',
      });
    }

    // Şirket kontrolü
    const company = await User.findById(companyId);
    if (!company || company.userType !== 'company') {
      return res.status(404).json({
        success: false,
        message: 'Şirket bulunamadı',
      });
    }

    // Çalışan kontrolü
    const employee = await User.findById(employeeId);
    if (!employee || employee.userType !== 'employee' || !employee.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Çalışan bulunamadı veya onaylanmamış',
      });
    }

    if (employee.companyId.toString() !== companyId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Çalışan bu şirkete ait değil',
      });
    }

    // Store bilgilerini al
    const store = await Store.findOne({ companyId });
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'İşletme bilgileri bulunamadı',
      });
    }

    // Müşteri oluştur veya bul (telefon numarasına göre)
    const user = await User.findById(userId);
    let customer = await Customer.findOne({
      companyId,
      phoneNumber: user.phoneNumber,
    });

    if (!customer) {
      customer = await Customer.create({
        companyId,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      });
    }

    // Hizmet fiyatlarını hesapla
    let totalServicePrice = 0;
    const serviceCategory = services[0]?.serviceCategory || store.serviceCategory;

    if (Array.isArray(services) && services.length > 0) {
      totalServicePrice = services.reduce((sum, service) => {
        return sum + (service.servicePrice || store.servicePrice || 0);
      }, 0);
    } else {
      totalServicePrice = store.servicePrice || 0;
    }

    // İndirim hesaplama
    let discount = 0;
    let finalPointsToUse = 0;

    // Kampanya kontrolü
    if (campaignId) {
      const campaign = await Campaign.findById(campaignId);
      if (campaign && campaign.isActive && campaign.serviceCategory === serviceCategory) {
        const now = new Date();
        if (now >= campaign.startDate && now <= campaign.endDate) {
          if (campaign.discountType === 'percentage') {
            discount += (totalServicePrice * campaign.discountValue) / 100;
          } else {
            discount += campaign.discountValue;
          }
        }
      }
    }

    // Kupon kontrolü
    if (couponId) {
      const coupon = await Coupon.findById(couponId);
      if (coupon && coupon.isActive && coupon.serviceCategory === serviceCategory) {
        const now = new Date();
        if (now >= coupon.startDate && now <= coupon.endDate) {
          discount += coupon.discountValue || 0;
        }
      }
    }

    // Puan kullanımı
    if (pointsToUse && pointsToUse > 0) {
      const pointsResult = await usePoints(userId, pointsToUse, null, null, 'Randevu için puan kullanıldı');
      if (pointsResult.success) {
        finalPointsToUse = pointsToUse;
      }
    }

    // Toplam fiyat
    const totalPrice = totalServicePrice - discount - (finalPointsToUse * 0.1);

    // Randevu tarih/saat kontrolü
    const appointmentDateObj = new Date(appointmentDate);
    const startOfDay = new Date(appointmentDateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointment = await Appointment.findOne({
      employeeId,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      appointmentTime,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Bu saatte zaten bir randevu mevcut',
      });
    }

    // Randevu oluştur
    const appointment = await Appointment.create({
      customerIds: [customer._id],
      userId,
      companyId,
      employeeId,
      appointmentDate: appointmentDateObj,
      appointmentTime,
      serviceCategory,
      taskType: services[0]?.taskType || store.serviceType,
      serviceType: services[0]?.serviceType || store.serviceType,
      serviceDuration: services[0]?.serviceDuration || store.serviceDuration,
      servicePrice: totalServicePrice,
      services,
      personCount,
      paymentMethod,
      totalPrice,
      discount,
      pointsUsed: finalPointsToUse,
      couponId: couponId || undefined,
      campaignId: campaignId || undefined,
      status: 'pending',
      isApproved: false,
      paymentReceived: paymentMethod === 'cash' ? false : false,
      notes,
    });

    // Nakit ödeme ise direkt onaylanmış sayılır
    if (paymentMethod === 'cash') {
      appointment.status = 'approved';
      appointment.isApproved = true;
      await appointment.save();
    }

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('customerIds', 'firstName lastName phoneNumber')
      .populate('employeeId', 'firstName lastName')
      .populate('companyId', 'firstName lastName')
      .populate('userId', 'firstName lastName email phoneNumber');

    res.status(201).json({
      success: true,
      message: 'Randevu başarıyla oluşturuldu',
      data: populatedAppointment,
      requiresPayment: paymentMethod === 'card',
    });
  } catch (error) {
    console.error('Create Appointment From Client Error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getClientAppointments
 * Client kullanıcısının randevularını getir
 */
const getClientAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, startDate, endDate } = req.query;

    const query = { userId };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.appointmentDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.appointmentDate.$lte = end;
      }
    }

    const appointments = await Appointment.find(query)
      .populate('customerIds', 'firstName lastName phoneNumber')
      .populate('employeeId', 'firstName lastName')
      .populate('companyId', 'firstName lastName storeName')
      .populate('couponId', 'title discountValue')
      .populate('campaignId', 'title discountValue')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error('Get Client Appointments Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createAppointment,
  createAppointmentFromClient,
  getCompanyAppointments,
  getEmployeeAppointments,
  getClientAppointments,
  getAppointmentSummary,
  updateAppointment,
  deleteAppointment,
};

