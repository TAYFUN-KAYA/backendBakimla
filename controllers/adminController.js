const User = require('../models/User');

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

module.exports = {
  getPendingEmployees,
  approveEmployee,
  rejectEmployee,
  getAllEmployees,
};

