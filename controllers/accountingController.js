const Accounting = require('../models/Accounting');
const User = require('../models/User');
const { ACCOUNTING } = require('../constants/paymentMethods');

/**
 * createAccountingRecord
 * Yeni muhasebe kaydı oluşturur
 */
const createAccountingRecord = async (req, res) => {
  try {
    const { companyId, employeeId, date, income, expense, description, category, paymentMethod } = req.body;

    if (!companyId || !date) {
      return res.status(400).json({
        success: false,
        message: 'companyId ve date zorunludur',
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

    if (employeeId) {
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
          message: 'Bu çalışan bu şirkete ait değil',
        });
      }
    }

    const accountingRecord = await Accounting.create({
      companyId,
      employeeId: employeeId || undefined,
      date,
      income: income || 0,
      expense: expense || 0,
      description,
      category,
      paymentMethod: paymentMethod || ACCOUNTING.NAKIT,
    });

    res.status(201).json({
      success: true,
      message: 'Muhasebe kaydı başarıyla oluşturuldu',
      data: accountingRecord,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getDailyAccounting
 * Günlük muhasebe kayıtlarını getirir
 */
const getDailyAccounting = async (req, res) => {
  try {
    // authMiddleware kullanıldığında req.user._id, companyMiddleware kullanıldığında req.companyId
    const companyId = req.user?._id || req.body.companyId || req.companyId;
    const { employeeId, date } = req.body;

    if (!companyId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Kimlik doğrulama ve tarih zorunludur',
      });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      companyId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    };

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const records = await Accounting.find(query)
      .populate('employeeId', 'firstName lastName')
      .sort({ date: -1 });

    const totalIncome = records.reduce((sum, record) => sum + (record.income || 0), 0);
    const totalExpense = records.reduce((sum, record) => sum + (record.expense || 0), 0);
    const netProfit = totalIncome - totalExpense;

    res.status(200).json({
      success: true,
      date: date,
      count: records.length,
      summary: {
        totalIncome,
        totalExpense,
        netProfit,
      },
      data: records,
    });
  } catch (error) {
    console.error('getDailyAccounting error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getWeeklyAccounting
 * Haftalık muhasebe kayıtlarını getirir
 */
const getWeeklyAccounting = async (req, res) => {
  try {
    // authMiddleware kullanıldığında req.user._id, companyMiddleware kullanıldığında req.companyId
    const companyId = req.user?._id || req.body.companyId || req.companyId;
    const { employeeId, startDate } = req.body;

    if (!companyId || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Kimlik doğrulama ve startDate zorunludur',
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const query = {
      companyId,
      date: {
        $gte: start,
        $lte: end,
      },
    };

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const records = await Accounting.find(query)
      .populate('employeeId', 'firstName lastName')
      .sort({ date: -1 });

    const totalIncome = records.reduce((sum, record) => sum + (record.income || 0), 0);
    const totalExpense = records.reduce((sum, record) => sum + (record.expense || 0), 0);
    const netProfit = totalIncome - totalExpense;

    const dailyBreakdown = {};
    records.forEach((record) => {
      const dayKey = record.date.toISOString().split('T')[0];
      if (!dailyBreakdown[dayKey]) {
        dailyBreakdown[dayKey] = {
          date: dayKey,
          income: 0,
          expense: 0,
          count: 0,
        };
      }
      dailyBreakdown[dayKey].income += record.income || 0;
      dailyBreakdown[dayKey].expense += record.expense || 0;
      dailyBreakdown[dayKey].count += 1;
    });

    res.status(200).json({
      success: true,
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
      count: records.length,
      summary: {
        totalIncome,
        totalExpense,
        netProfit,
      },
      dailyBreakdown: Object.values(dailyBreakdown),
      data: records,
    });
  } catch (error) {
    console.error('getWeeklyAccounting error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getMonthlyAccounting
 * Aylık muhasebe kayıtlarını getirir
 */
const getMonthlyAccounting = async (req, res) => {
  try {
    // authMiddleware kullanıldığında req.user._id, companyMiddleware kullanıldığında req.companyId
    const companyId = req.user?._id || req.body.companyId || req.companyId;
    const { employeeId, year, month } = req.body;

    if (!companyId || !year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Kimlik doğrulama, year ve month zorunludur',
      });
    }

    const start = new Date(year, month - 1, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(year, month, 0);
    end.setHours(23, 59, 59, 999);

    const query = {
      companyId,
      date: {
        $gte: start,
        $lte: end,
      },
    };

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const records = await Accounting.find(query)
      .populate('employeeId', 'firstName lastName')
      .sort({ date: -1 });

    const totalIncome = records.reduce((sum, record) => sum + (record.income || 0), 0);
    const totalExpense = records.reduce((sum, record) => sum + (record.expense || 0), 0);
    const netProfit = totalIncome - totalExpense;

    const weeklyBreakdown = {};
    records.forEach((record) => {
      const recordDate = new Date(record.date);
      const weekStart = new Date(recordDate);
      weekStart.setDate(recordDate.getDate() - recordDate.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyBreakdown[weekKey]) {
        weeklyBreakdown[weekKey] = {
          weekStart: weekKey,
          income: 0,
          expense: 0,
          count: 0,
        };
      }
      weeklyBreakdown[weekKey].income += record.income || 0;
      weeklyBreakdown[weekKey].expense += record.expense || 0;
      weeklyBreakdown[weekKey].count += 1;
    });

    res.status(200).json({
      success: true,
      period: {
        year,
        month,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
      count: records.length,
      summary: {
        totalIncome,
        totalExpense,
        netProfit,
      },
      weeklyBreakdown: Object.values(weeklyBreakdown),
      data: records,
    });
  } catch (error) {
    console.error('getMonthlyAccounting error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllAccountingRecords
 * Tüm muhasebe kayıtlarını getirir
 */
const getAllAccountingRecords = async (req, res) => {
  try {
    // authMiddleware kullanıldığında req.user._id, companyMiddleware kullanıldığında req.companyId
    const companyId = req.user?._id || req.body.companyId || req.companyId;
    const { employeeId, category, paymentMethod, startDate, endDate } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Kimlik doğrulama gereklidir',
      });
    }

    const query = { companyId };
    
    if (employeeId) {
      query.employeeId = employeeId;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const records = await Accounting.find(query)
      .populate('employeeId', 'firstName lastName')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error('getAllAccountingRecords error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getEmployeeAccounting
 * Çalışanın muhasebe kayıtlarını getirir (günlük/haftalık/aylık)
 */
const getEmployeeAccounting = async (req, res) => {
  try {
    const { companyId, employeeId, period, date, startDate, year, month } = req.body;

    if (!companyId || !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'companyId ve employeeId gereklidir',
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
        message: 'Bu çalışan bu şirkete ait değil',
      });
    }

    let query = {
      companyId,
      employeeId,
    };

    let periodInfo = {};

    if (period === 'daily' && date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
      periodInfo = { period: 'daily', date };
    } else if (period === 'weekly' && startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
      periodInfo = {
        period: 'weekly',
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    } else if (period === 'monthly' && year && month) {
      const start = new Date(year, month - 1, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(year, month, 0);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
      periodInfo = {
        period: 'monthly',
        year,
        month,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir period ve ilgili tarih bilgileri gereklidir',
      });
    }

    const records = await Accounting.find(query)
      .populate('employeeId', 'firstName lastName')
      .sort({ date: -1 });

    const totalIncome = records.reduce((sum, record) => sum + (record.income || 0), 0);
    const totalExpense = records.reduce((sum, record) => sum + (record.expense || 0), 0);
    const netProfit = totalIncome - totalExpense;

    res.status(200).json({
      success: true,
      employee: {
        id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
      },
      period: periodInfo,
      count: records.length,
      summary: {
        totalIncome,
        totalExpense,
        netProfit,
      },
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createAccountingRecord,
  getDailyAccounting,
  getWeeklyAccounting,
  getMonthlyAccounting,
  getAllAccountingRecords,
  getEmployeeAccounting,
};

