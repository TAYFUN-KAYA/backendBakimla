const User = require('../models/User');
const Store = require('../models/Store');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { Wallet, WalletTransaction, WithdrawalRequest } = require('../models/Wallet');
const { Points } = require('../models/Points');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Campaign = require('../models/Campaign');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const Accounting = require('../models/Accounting');
const Customer = require('../models/Customer');

/**
 * getPendingEmployees
 * Onay bekleyen çalışanları listeler
 */
const getPendingEmployees = async (req, res) => {
  try {
    const employees = await User.find({
      userType: 'employee',
      isApproved: false,
    }).populate('companyId', 'firstName lastName email');

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * approveEmployee
 * Çalışanı onaylar
 */
const approveEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Çalışan bulunamadı',
      });
    }

    if (employee.userType !== 'employee') {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı bir çalışan değil',
      });
    }

    if (employee.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Bu çalışan zaten onaylanmış',
      });
    }

    employee.isApproved = true;
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Çalışan başarıyla onaylandı',
      data: employee,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * rejectEmployee
 * Çalışanı reddeder
 */
const rejectEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Çalışan bulunamadı',
      });
    }

    if (employee.userType !== 'employee') {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı bir çalışan değil',
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Çalışan başarıyla reddedildi ve silindi',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllEmployees
 * Tüm çalışanları listeler (onaylı ve onaysız)
 */
const getAllEmployees = async (req, res) => {
  try {
    const { isApproved } = req.query;
    const query = { userType: 'employee' };

    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true';
    }

    const employees = await User.find(query).populate('companyId', 'firstName lastName email');

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getDashboardStats
 * Dashboard istatistiklerini getir
 */
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCompanies,
      totalEmployees,
      totalStores,
      totalAppointments,
      totalPayments,
      totalOrders,
      totalRevenue,
      pendingEmployees,
      pendingWithdrawals,
    ] = await Promise.all([
      User.countDocuments({ userType: 'user' }),
      User.countDocuments({ userType: 'company' }),
      User.countDocuments({ userType: 'employee' }),
      Store.countDocuments(),
      Appointment.countDocuments(),
      Payment.countDocuments({ paymentStatus: 'success' }),
      Order.countDocuments(),
      Payment.aggregate([
        { $match: { paymentStatus: 'success' } },
        { $group: { _id: null, total: { $sum: '$price' } } },
      ]),
      User.countDocuments({ userType: 'employee', isApproved: false }),
      WithdrawalRequest.countDocuments({ status: 'pending' }),
    ]);

    const revenue = totalRevenue[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          companies: totalCompanies,
          employees: totalEmployees,
          pendingEmployees,
        },
        stores: totalStores,
        appointments: totalAppointments,
        payments: {
          total: totalPayments,
          revenue,
        },
        orders: totalOrders,
        withdrawals: {
          pending: pendingWithdrawals,
        },
      },
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllUsers
 * Tüm kullanıcıları listele (filtreleme ile)
 */
const getAllUsers = async (req, res) => {
  try {
    const { userType, page = 1, limit = 20, search } = req.query;

    const query = {};
    if (userType) {
      query.userType = userType;
    }
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .populate('companyId', 'firstName lastName')
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllStores
 * Tüm işletmeleri listele
 */
const getAllStores = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
      ];
    }

    const stores = await Store.find(query)
      .populate('companyId', 'firstName lastName email phoneNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Store.countDocuments(query);

    res.status(200).json({
      success: true,
      count: stores.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: stores,
    });
  } catch (error) {
    console.error('Get All Stores Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getStoreDetails
 * İşletme detaylarını getir (çalışanlar, kazançlar, randevular dahil)
 */
const getStoreDetails = async (req, res) => {
  try {
    const { storeId } = req.params;

    // İşletme bilgileri
    const store = await Store.findById(storeId)
      .populate('companyId', 'firstName lastName email phoneNumber');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'İşletme bulunamadı',
      });
    }

    const companyId = store.companyId._id;

    // Çalışanlar
    const employees = await User.find({ 
      userType: 'employee',
      companyId: companyId 
    }).select('firstName lastName email phoneNumber isApproved createdAt');

    // İşletme kazançları (toplam ödemeler)
    const payments = await Payment.find({
      companyId: companyId,
      paymentStatus: 'success',
    });

    const totalEarnings = payments.reduce((sum, p) => sum + (p.price || 0), 0);
    const totalPayments = payments.length;

    // Cüzdan bilgisi
    const wallet = await Wallet.findOne({ companyId: companyId });

    // Randevular
    const appointments = await Appointment.find({ companyId: companyId })
      .populate('customerIds', 'firstName lastName phoneNumber')
      .populate('employeeId', 'firstName lastName')
      .populate('userId', 'firstName lastName')
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .limit(50);

    const totalAppointments = await Appointment.countDocuments({ companyId: companyId });
    const completedAppointments = await Appointment.countDocuments({ 
      companyId: companyId,
      status: 'completed'
    });
    const pendingAppointments = await Appointment.countDocuments({ 
      companyId: companyId,
      status: 'pending'
    });

    // Çalışan bazında kazançlar ve randevular
    const employeesWithStats = await Promise.all(
      employees.map(async (employee) => {
        const employeeAppointments = await Appointment.find({
          companyId: companyId,
          employeeId: employee._id,
        });

        const employeeEarnings = employeeAppointments
          .filter(apt => apt.paymentReceived || apt.paymentMethod === 'card')
          .reduce((sum, apt) => sum + (apt.servicePrice || apt.totalPrice || 0), 0);

        return {
          ...employee.toObject(),
          totalAppointments: employeeAppointments.length,
          completedAppointments: employeeAppointments.filter(a => a.status === 'completed').length,
          totalEarnings: employeeEarnings,
        };
      })
    );

    // Son ödemeler
    const recentPayments = await Payment.find({
      companyId: companyId,
      paymentStatus: 'success',
    })
      .populate('appointmentId', 'appointmentDate appointmentTime')
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        store,
        employees: employeesWithStats,
        stats: {
          totalEarnings,
          totalPayments,
          walletBalance: wallet?.balance || 0,
          totalWithdrawals: wallet?.totalWithdrawals || 0,
          totalAppointments,
          completedAppointments,
          pendingAppointments,
          totalEmployees: employees.length,
          approvedEmployees: employees.filter(e => e.isApproved).length,
        },
        recentAppointments: appointments,
        recentPayments,
      },
    });
  } catch (error) {
    console.error('Get Store Details Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllAppointments
 * Tüm randevuları listele
 */
const getAllAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, startDate, endDate } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }
    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = new Date(startDate);
      if (endDate) query.appointmentDate.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query)
      .populate('customerIds', 'firstName lastName phoneNumber')
      .populate('companyId', 'firstName lastName')
      .populate('employeeId', 'firstName lastName')
      .populate('userId', 'firstName lastName')
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: appointments,
    });
  } catch (error) {
    console.error('Get All Appointments Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllPayments
 * Tüm ödemeleri listele
 */
const getAllPayments = async (req, res) => {
  try {
    const { paymentStatus, page = 1, limit = 20, startDate, endDate } = req.query;

    const query = {};
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('companyId', 'firstName lastName')
      .populate('appointmentId')
      .populate('orderId', 'orderNumber')
      .populate('buyerId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    const totalAmount = await Payment.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      totalAmount: totalAmount[0]?.total || 0,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: payments,
    });
  } catch (error) {
    console.error('Get All Payments Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllOrders
 * Tüm siparişleri listele
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const orders = await Order.find(query)
      .populate('userId', 'firstName lastName email phoneNumber')
      .populate('items.productId', 'name images')
      .populate('shippingAddress')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    console.error('Get All Orders Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllWallets
 * Tüm cüzdanları listele
 */
const getAllWallets = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const wallets = await Wallet.find()
      .populate('companyId', 'firstName lastName email')
      .sort({ balance: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Wallet.countDocuments();

    const totalBalance = await Wallet.aggregate([
      { $group: { _id: null, total: { $sum: '$balance' } } },
    ]);

    res.status(200).json({
      success: true,
      count: wallets.length,
      total,
      totalBalance: totalBalance[0]?.total || 0,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: wallets,
    });
  } catch (error) {
    console.error('Get All Wallets Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllWithdrawalRequests
 * Tüm para çekme taleplerini listele
 */
const getAllWithdrawalRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const requests = await WithdrawalRequest.find(query)
      .populate('companyId', 'firstName lastName email')
      .populate('walletId')
      .populate('processedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WithdrawalRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: requests,
    });
  } catch (error) {
    console.error('Get All Withdrawal Requests Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * processWithdrawalRequest
 * Para çekme talebini işle
 */
const processWithdrawalRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const adminId = req.user._id;

    if (!['processing', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum',
      });
    }

    const request = await WithdrawalRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Para çekme talebi bulunamadı',
      });
    }

    if (status === 'completed') {
      // Cüzdandan para çek
      const wallet = await Wallet.findById(request.walletId);
      if (wallet.balance < request.amount) {
        return res.status(400).json({
          success: false,
          message: 'Yetersiz bakiye',
        });
      }

      wallet.balance -= request.amount;
      wallet.totalWithdrawals += request.amount;
      await wallet.save();

      // İşlem kaydı oluştur
      await WalletTransaction.create({
        walletId: wallet._id,
        companyId: request.companyId,
        type: 'withdrawal',
        amount: request.amount,
        balanceBefore: wallet.balance + request.amount,
        balanceAfter: wallet.balance,
        description: 'Para çekme - IBAN transferi',
        withdrawalRequestId: request._id,
        status: 'completed',
      });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Red nedeni gereklidir',
      });
    }

    request.status = status;
    request.processedAt = new Date();
    request.processedBy = adminId;
    if (rejectionReason) request.rejectionReason = rejectionReason;
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Para çekme talebi işlendi',
      data: request,
    });
  } catch (error) {
    console.error('Process Withdrawal Request Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllProducts
 * Tüm ürünleri listele
 */
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isPublished } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (isPublished !== undefined) {
      query.isPublished = isPublished === 'true';
    }

    const products = await Product.find(query)
      .populate('companyId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: products,
    });
  } catch (error) {
    console.error('Get All Products Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllReviews
 * Tüm yorumları listele
 */
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, reviewType, isPublished } = req.query;

    const query = {};
    if (reviewType) query.reviewType = reviewType;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';

    const reviews = await Review.find(query)
      .populate('userId', 'firstName lastName')
      .populate('companyId', 'firstName lastName')
      .populate('productId', 'name')
      .populate('appointmentId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: reviews,
    });
  } catch (error) {
    console.error('Get All Reviews Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * toggleReviewPublish
 * Yorum yayınlama durumunu değiştir
 */
const toggleReviewPublish = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Yorum bulunamadı',
      });
    }

    review.isPublished = !review.isPublished;
    await review.save();

    res.status(200).json({
      success: true,
      message: `Yorum ${review.isPublished ? 'yayınlandı' : 'yayından kaldırıldı'}`,
      data: review,
    });
  } catch (error) {
    console.error('Toggle Review Publish Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateStoreSettings
 * İşletme ayarlarını günceller (taksit vb.)
 */
const updateStoreSettings = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { installmentSettings } = req.body;

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'İşletme bulunamadı',
      });
    }

    if (installmentSettings) {
      store.installmentSettings = {
        ...store.installmentSettings,
        ...installmentSettings
      };
    }

    await store.save();

    res.status(200).json({
      success: true,
      message: 'İşletme ayarları güncellendi',
      data: store,
    });
  } catch (error) {
    console.error('Update Store Settings Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getPendingEmployees,
  approveEmployee,
  rejectEmployee,
  getAllEmployees,
  getDashboardStats,
  getAllUsers,
  getAllStores,
  getStoreDetails,
  getAllAppointments,
  getAllPayments,
  getAllOrders,
  getAllWallets,
  getAllWithdrawalRequests,
  processWithdrawalRequest,
  getAllProducts,
  getAllReviews,
  toggleReviewPublish,
  updateStoreSettings,
};

