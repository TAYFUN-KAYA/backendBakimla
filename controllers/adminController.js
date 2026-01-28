const bcrypt = require('bcrypt');
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
const QuickAppointment = require('../models/QuickAppointment');
const IsletKazan = require('../models/IsletKazan');
const { addToWallet } = require('./walletController');
const { APPOINTMENT } = require('../constants/paymentMethods');

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
 * Tüm çalışanları listeler (onaylı ve onaysız). Sayfalama ve arama destekler.
 */
const getAllEmployees = async (req, res) => {
  try {
    const { isApproved, page = 1, limit = 20, search } = req.query;
    const query = { userType: 'employee' };

    if (isApproved !== undefined && isApproved !== '') {
      query.isApproved = isApproved === 'true';
    }

    const s = (search || '').trim();
    if (s) {
      query.$or = [
        { firstName: { $regex: s, $options: 'i' } },
        { lastName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { phoneNumber: { $regex: s, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const employees = await User.find(query)
      .populate('companyId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
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
          .filter(apt => apt.paymentReceived || APPOINTMENT.isCard(apt.paymentMethod))
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

/** Regex özel karakterlerini escape et (., *, + vb. literal aranabilsin) */
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * getAllAppointments
 * Tüm randevuları listele
 */
const getAllAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, startDate, endDate, search: searchRaw, companyId, paymentMethod } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }
    if (companyId) {
      query.companyId = companyId;
    }
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }
    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = new Date(startDate);
      if (endDate) query.appointmentDate.$lte = new Date(endDate);
    }

    const s = (typeof searchRaw === 'string' ? searchRaw : Array.isArray(searchRaw) ? searchRaw[0] : '')
      .trim()
      .slice(0, 100);
    if (s.length > 0) {
      const esc = escapeRegex(s);
      const orParts = [
        { serviceCategory: { $regex: esc, $options: 'i' } },
        { serviceType: { $regex: esc, $options: 'i' } },
        { taskType: { $regex: esc, $options: 'i' } },
        { notes: { $regex: esc, $options: 'i' } },
      ];
      const customers = await Customer.find({
        $or: [
          { firstName: { $regex: esc, $options: 'i' } },
          { lastName: { $regex: esc, $options: 'i' } },
          { phoneNumber: { $regex: esc, $options: 'i' } },
        ],
      })
        .select('_id')
        .lean();
      const cIds = customers.map((c) => c._id);
      if (cIds.length) orParts.push({ customerIds: { $in: cIds } });
      const users = await User.find({
        $or: [
          { firstName: { $regex: esc, $options: 'i' } },
          { lastName: { $regex: esc, $options: 'i' } },
          { email: { $regex: esc, $options: 'i' } },
          { phoneNumber: { $regex: esc, $options: 'i' } },
        ],
      })
        .select('_id')
        .lean();
      const uIds = users.map((u) => u._id);
      if (uIds.length) {
        orParts.push({ companyId: { $in: uIds } }, { employeeId: { $in: uIds } }, { userId: { $in: uIds } });
      }
      query.$or = orParts;
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
    const { paymentStatus, page = 1, limit = 20, startDate, endDate, search } = req.query;

    const query = {};
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    const s = (search || '').trim();
    if (s) {
      const ids = await User.find({
        $or: [
          { firstName: { $regex: s, $options: 'i' } },
          { lastName: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
        ],
      }).distinct('_id');
      query.$or = [
        { companyId: { $in: ids } },
        { buyerId: { $in: ids } },
      ];
      if (ids.length === 0) query.$or = [{ companyId: { $in: [] } }, { buyerId: { $in: [] } }];
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
    const { status, paymentStatus, page = 1, limit = 20, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    const s = (search || '').trim();
    if (s) {
      const ids = await User.find({
        $or: [
          { firstName: { $regex: s, $options: 'i' } },
          { lastName: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
          { phoneNumber: { $regex: s, $options: 'i' } },
        ],
      }).distinct('_id');
      query.$or = [
        { orderNumber: { $regex: s, $options: 'i' } },
        ...(ids.length ? [{ userId: { $in: ids } }] : []),
      ];
    }

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
    const { page = 1, limit = 20, search } = req.query;

    const query = {};
    const s = (search || '').trim();
    if (s) {
      const ids = await User.find({
        userType: 'company',
        $or: [
          { firstName: { $regex: s, $options: 'i' } },
          { lastName: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
        ],
      }).distinct('_id');
      query.companyId = ids.length ? { $in: ids } : { $in: [] };
    }

    const wallets = await Wallet.find(query)
      .populate('companyId', 'firstName lastName email')
      .sort({ balance: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Wallet.countDocuments(query);

    const totalBalanceAgg = [{ $group: { _id: null, total: { $sum: '$balance' } } }];
    if (Object.keys(query).length) totalBalanceAgg.unshift({ $match: query });
    const totalBalance = await Wallet.aggregate(totalBalanceAgg);

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
    const { status, page = 1, limit = 20, search, source, companyId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (companyId) query.companyId = companyId;
    if (source === 'islet_kazan') query.source = 'islet_kazan';
    else if (source === 'wallet') query.source = { $in: ['wallet', null] }; // null = mevcut kayıtlar (alan yok)
    const s = (search || '').trim();
    if (s) {
      const ids = await User.find({
        $or: [
          { firstName: { $regex: s, $options: 'i' } },
          { lastName: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
        ],
      }).distinct('_id');
      query.$or = [
        ...(ids.length ? [{ companyId: { $in: ids } }] : []),
        { iban: { $regex: s, $options: 'i' } },
        { accountHolderName: { $regex: s, $options: 'i' } },
      ];
    }

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
    const { page = 1, limit = 20, reviewType, isPublished, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};
    if (reviewType) query.reviewType = reviewType;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';

    const s = (search || '').trim();
    if (s) {
      const ids = await User.find({
        $or: [
          { firstName: { $regex: s, $options: 'i' } },
          { lastName: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } },
        ],
      }).distinct('_id');
      query.$or = [
        { comment: { $regex: s, $options: 'i' } },
        ...(ids.length ? [{ userId: { $in: ids } }] : []),
      ];
    }

    const allowedSort = { createdAt: 1, rating: 1, reviewType: 1 };
    const by = allowedSort[sortBy] ? sortBy : 'createdAt';
    const order = sortOrder === 'asc' ? 1 : -1;
    const sort = { [by]: order };

    const reviews = await Review.find(query)
      .populate('userId', 'firstName lastName')
      .populate('companyId', 'firstName lastName')
      .populate('productId', 'name')
      .populate('appointmentId')
      .sort(sort)
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

/**
 * updateUser – Kullanıcı güncelle (şifre gelirse bcrypt ile hash’lenir)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const body = { ...req.body };

    if (body.password != null && String(body.password).trim()) {
      body.password = await bcrypt.hash(String(body.password).trim(), 10);
    } else {
      delete body.password;
    }
    delete body.__v;
    delete body.createdAt;
    delete body.updatedAt;

    const user = await User.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true })
      .select('-password')
      .populate('companyId', 'firstName lastName email');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    res.status(200).json({
      success: true,
      message: 'Kullanıcı güncellendi',
      data: user,
    });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * getAllQuickAppointments
 * Tüm işletmelerin hızlı randevularını listeler (arama, sayfalama)
 */
const getAllQuickAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 20, search: searchRaw } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    const s = (typeof searchRaw === 'string' ? searchRaw : Array.isArray(searchRaw) ? searchRaw[0] : '')
      .trim()
      .slice(0, 100);

    if (s.length > 0) {
      const esc = String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const companies = await User.find({
        userType: 'company',
        $or: [
          { firstName: { $regex: esc, $options: 'i' } },
          { lastName: { $regex: esc, $options: 'i' } },
          { email: { $regex: esc, $options: 'i' } },
          { phoneNumber: { $regex: esc, $options: 'i' } },
        ],
      })
        .select('_id')
        .lean();
      const companyIds = companies.map((c) => c._id);
      const customers = await Customer.find({
        $or: [
          { firstName: { $regex: esc, $options: 'i' } },
          { lastName: { $regex: esc, $options: 'i' } },
          { phoneNumber: { $regex: esc, $options: 'i' } },
        ],
      })
        .select('_id')
        .lean();
      const customerIds = customers.map((c) => c._id);
      const orParts = [];
      if (companyIds.length) orParts.push({ companyId: { $in: companyIds } });
      if (customerIds.length) orParts.push({ customerIds: { $in: customerIds } });
      if (orParts.length) query.$or = orParts;
      else query.companyId = { $in: [] };
    }

    const [data, total] = await Promise.all([
      QuickAppointment.find(query)
        .populate('companyId', 'firstName lastName email phoneNumber')
        .populate('customerIds', 'firstName lastName phoneNumber notes profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      QuickAppointment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data,
    });
  } catch (error) {
    console.error('Get All QuickAppointments Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * getAllIsletKazan
 * İşlet Kazan: her 50 tamamlanan randevu = 20 TL. Takip listesi.
 */
const getAllIsletKazan = async (req, res) => {
  try {
    const { search } = req.query;
    const agg = await Appointment.aggregate([
      { $match: { status: 'completed', paymentReceived: true, paymentMethod: APPOINTMENT.CARD } },
      { $group: { _id: '$companyId', count: { $sum: 1 } } },
    ]);
    const companyIds = agg.map((a) => a._id).filter(Boolean);
    const countMap = Object.fromEntries(agg.map((a) => [a._id.toString(), a.count]));

    for (const cid of companyIds) {
      await IsletKazan.findOneAndUpdate(
        { companyId: cid },
        { $setOnInsert: { companyId: cid, paidMilestoneCount: 0, totalAmountPaid: 0, amountPerMilestone: 20, milestoneSize: 50 } },
        { upsert: true, new: true }
      );
    }

    const list = await IsletKazan.find({ companyId: { $in: companyIds } })
      .populate('companyId', 'firstName lastName email')
      .sort({ totalAmountPaid: -1, lastPaidAt: -1 })
      .lean();

    let rows = list.map((ik) => {
      const cid = (ik.companyId && (ik.companyId._id || ik.companyId)) || ik.companyId;
      const completedCount = countMap[cid ? cid.toString() : (ik.companyId || '').toString()] || 0;
      const ms = ik.milestoneSize || 50;
      const amt = ik.amountPerMilestone || 20;
      const earned = Math.floor(completedCount / ms);
      const paid = ik.paidMilestoneCount || 0;
      const pending = Math.max(0, earned - paid);
      return {
        ...ik,
        completedCount,
        earnedMilestoneCount: earned,
        pendingMilestoneCount: pending,
        pendingAmount: pending * amt,
      };
    });

    const s = (search || '').trim().toLowerCase();
    if (s) {
      rows = rows.filter((r) => {
        const c = r.companyId;
        const name = c ? `${(c.firstName || '')} ${(c.lastName || '')}`.trim() : '';
        const email = (c && c.email) || '';
        return (name && name.toLowerCase().includes(s)) || (email && email.toLowerCase().includes(s));
      });
    }

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Get All IsletKazan Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * payIsletKazanPending
 * Bekleyen 50’lik randevu primlerini (20 TL) cüzdana yatır.
 * POST /admin/islet-kazan/:id/pay-pending
 */
const payIsletKazanPending = async (req, res) => {
  try {
    const { id } = req.params;
    const ik = await IsletKazan.findById(id).populate('companyId', 'firstName lastName email');
    if (!ik) return res.status(404).json({ success: false, message: 'İşlet Kazan kaydı bulunamadı' });

    const companyId = ik.companyId?._id || ik.companyId;
    const completedCount = await Appointment.countDocuments({ companyId, status: 'completed', paymentReceived: true, paymentMethod: APPOINTMENT.CARD });
    const ms = ik.milestoneSize || 50;
    const amt = ik.amountPerMilestone || 20;
    const earned = Math.floor(completedCount / ms);
    const paid = ik.paidMilestoneCount || 0;
    const toPay = Math.max(0, earned - paid);
    if (toPay === 0) {
      return res.status(400).json({ success: false, message: 'Ödenecek bekleyen prim yok' });
    }

    const total = toPay * amt;
    const result = await addToWallet(companyId, total, null, null, `İşlet Kazan - ${toPay} x 50 randevu primi (${total} TL)`);
    if (!result.success) return res.status(400).json({ success: false, message: result.error || 'Cüzdan işlemi başarısız' });

    ik.paidMilestoneCount = (ik.paidMilestoneCount || 0) + toPay;
    ik.totalAmountPaid = (ik.totalAmountPaid || 0) + total;
    ik.lastPaidAt = new Date();
    await ik.save();

    res.status(200).json({
      success: true,
      message: `${toPay} adet prim (${total} TL) cüzdana yatırıldı`,
      data: { paidCount: toPay, amount: total, isletKazan: ik },
    });
  } catch (error) {
    console.error('Pay IsletKazan Pending Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * getAllStoreServices
 * Tüm işletmelerdeki hizmetleri listeler (flatten)
 */
const getAllStoreServices = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, serviceName, isActive, businessField } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('[DEBUG] getAllStoreServices - params:', { page, limit, search, category, serviceName, isActive, businessField });

    // Store sorgusu - businessField filtresi varsa uygula
    const storeQuery = {};
    if (businessField) {
      storeQuery.businessField = businessField;
    }

    console.log('[DEBUG] Store query:', storeQuery);

    // Tüm store'ları çek
    const stores = await Store.find(storeQuery)
      .populate('companyId', 'firstName lastName email phoneNumber')
      .select('storeName businessName services companyId businessField')
      .lean();

    console.log('[DEBUG] Found', stores.length, 'stores');

    // Services'i flatten et
    let allServices = [];
    stores.forEach((store) => {
      if (store.services && store.services.length > 0) {
        store.services.forEach((service, index) => {
          allServices.push({
            _id: `${store._id}_${index}`, // Composite ID
            storeId: store._id,
            storeName: store.storeName || store.businessName,
            businessField: store.businessField,
            companyId: store.companyId,
            serviceIndex: index,
            ...service,
          });
        });
      }
    });

    console.log('[DEBUG] Total services after flatten:', allServices.length);
    if (allServices.length > 0) {
      console.log('[DEBUG] Sample service:', JSON.stringify(allServices[0], null, 2));
    }

    // Arama filtresi
    if (search) {
      const s = search.toLowerCase();
      allServices = allServices.filter(
        (svc) =>
          (svc.name && svc.name.toLowerCase().includes(s)) ||
          (svc.category && svc.category.toLowerCase().includes(s)) ||
          (svc.storeName && svc.storeName.toLowerCase().includes(s)) ||
          (svc.companyId?.firstName && svc.companyId.firstName.toLowerCase().includes(s)) ||
          (svc.companyId?.lastName && svc.companyId.lastName.toLowerCase().includes(s))
      );
    }

    // Hizmet adı/türü filtresi (serviceName veya category parametresi ile)
    // Hem name hem category field'larında arar (case-insensitive, partial match)
    const serviceNameFilter = serviceName || category;
    console.log('[DEBUG] serviceNameFilter:', serviceNameFilter);
    if (serviceNameFilter) {
      const filterLower = serviceNameFilter.toLowerCase().trim();
      console.log('[DEBUG] Filtering by:', filterLower);
      allServices = allServices.filter((svc) => {
        const nameMatch = svc.name && svc.name.toLowerCase().trim().includes(filterLower);
        const categoryMatch = svc.category && svc.category.toLowerCase().trim().includes(filterLower);
        const exactNameMatch = svc.name && svc.name.toLowerCase().trim() === filterLower;
        const exactCategoryMatch = svc.category && svc.category.toLowerCase().trim() === filterLower;
        return exactNameMatch || exactCategoryMatch || nameMatch || categoryMatch;
      });
      console.log('[DEBUG] After category filter:', allServices.length);
    }

    // Aktif filtresi
    if (isActive !== undefined && isActive !== '') {
      const active = isActive === 'true';
      allServices = allServices.filter((svc) => svc.isActive === active);
    }

    // Sıralama (store adına göre, sonra hizmet adına göre)
    allServices.sort((a, b) => {
      const storeCompare = (a.storeName || '').localeCompare(b.storeName || '');
      if (storeCompare !== 0) return storeCompare;
      return (a.name || '').localeCompare(b.name || '');
    });

    const total = allServices.length;
    const paginatedServices = allServices.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      count: paginatedServices.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: paginatedServices,
    });
  } catch (error) {
    console.error('Get All Store Services Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateStoreService
 * İşletmenin belirli bir hizmetini günceller
 */
const updateStoreService = async (req, res) => {
  try {
    const { storeId, serviceIndex } = req.params;
    const { name, category, duration, price, cancelDuration, description, isActive } = req.body;

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'İşletme bulunamadı',
      });
    }

    const idx = parseInt(serviceIndex);
    if (!store.services || idx < 0 || idx >= store.services.length) {
      return res.status(404).json({
        success: false,
        message: 'Hizmet bulunamadı',
      });
    }

    // Hizmeti güncelle
    if (name !== undefined) store.services[idx].name = name;
    if (category !== undefined) store.services[idx].category = category;
    if (duration !== undefined) store.services[idx].duration = duration;
    if (price !== undefined) store.services[idx].price = price;
    if (cancelDuration !== undefined) store.services[idx].cancelDuration = cancelDuration;
    if (description !== undefined) store.services[idx].description = description;
    if (isActive !== undefined) store.services[idx].isActive = isActive;

    await store.save();

    res.status(200).json({
      success: true,
      message: 'Hizmet başarıyla güncellendi',
      data: store.services[idx],
    });
  } catch (error) {
    console.error('Update Store Service Error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * addStoreService
 * İşletmeye yeni hizmet ekler
 */
const addStoreService = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { name, category, duration, price, cancelDuration, description, isActive } = req.body;

    if (!name || !category || !duration || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Hizmet adı, kategori, süre ve fiyat zorunludur',
      });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'İşletme bulunamadı',
      });
    }

    const newService = {
      name,
      category,
      duration: parseInt(duration),
      price: parseFloat(price),
      cancelDuration: parseInt(cancelDuration) || 0,
      description: description || '',
      isActive: isActive !== undefined ? isActive : true,
    };

    store.services.push(newService);
    await store.save();

    res.status(201).json({
      success: true,
      message: 'Hizmet başarıyla eklendi',
      data: store.services[store.services.length - 1],
    });
  } catch (error) {
    console.error('Add Store Service Error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * deleteStoreService
 * İşletmeden hizmet siler
 */
const deleteStoreService = async (req, res) => {
  try {
    const { storeId, serviceIndex } = req.params;

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'İşletme bulunamadı',
      });
    }

    const idx = parseInt(serviceIndex);
    if (!store.services || idx < 0 || idx >= store.services.length) {
      return res.status(404).json({
        success: false,
        message: 'Hizmet bulunamadı',
      });
    }

    store.services.splice(idx, 1);
    await store.save();

    res.status(200).json({
      success: true,
      message: 'Hizmet başarıyla silindi',
    });
  } catch (error) {
    console.error('Delete Store Service Error:', error);
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
  updateUser,
  getAllQuickAppointments,
  getAllIsletKazan,
  payIsletKazanPending,
  getAllStoreServices,
  updateStoreService,
  addStoreService,
  deleteStoreService,
};

