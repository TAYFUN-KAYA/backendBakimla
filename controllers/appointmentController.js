const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const User = require('../models/User');

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

module.exports = {
  createAppointment,
  getCompanyAppointments,
  getEmployeeAppointments,
  getAppointmentSummary,
  updateAppointment,
  deleteAppointment,
};

