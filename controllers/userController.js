const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt');

/**
 * getAllUsers
 * Tüm kullanıcıları listeler, userType query parametresi ile filtreleme yapılabilir
 */
const getAllUsers = async (req, res) => {
  try {
    const { userType } = req.query;
    const query = userType ? { userType } : {};

    const users = await User.find(query);
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * getAllEmployees
 * Tüm çalışanları listeler (şirket bazlı veya tümü)
 */
const getAllEmployees = async (req, res) => {
  try {
    const { companyId, showAll } = req.query;

    const query = { userType: 'employee' };
    if (showAll !== 'true') {
      query.isApproved = true;
    }

    if (companyId) {
      query.companyId = companyId;
    }

    const employees = await User.find(query)
      .select('firstName lastName email phoneNumber birthDate profileImage city district companyId isApproved bio expertiseDocuments workExamples')
      .populate('companyId', 'firstName lastName businessName')
      .sort({ createdAt: -1 });

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
 * getUserById
 * ID ile tek bir kullanıcıyı getirir
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * createUser
 * Yeni kullanıcı oluşturur (company, employee, user)
 * Employee tipi için companyId zorunludur
 */
const createUser = async (req, res) => {
  try {
    const { userType, companyId } = req.body;

    if (userType === 'employee' && !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Şirket çalışanı için companyId gereklidir',
      });
    }

    if (userType === 'employee') {
      const company = await User.findById(companyId);
      if (!company || company.userType !== 'company') {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz şirket ID',
        });
      }
    }

    const user = await User.create(req.body);
    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateUserType
 * Kullanıcı tipini günceller, employee olarak güncellenirse 6 haneli kod gönderilir
 */
const updateUserType = async (req, res) => {
  try {
    const { userType, companyId } = req.body;
    const { id } = req.params;

    if (!userType) {
      return res.status(400).json({
        success: false,
        message: 'userType gereklidir',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    if (userType === 'employee' && !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Şirket çalışanı için companyId gereklidir',
      });
    }

    if (userType === 'employee') {
      const company = await User.findById(companyId);
      if (!company || company.userType !== 'company') {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz şirket ID',
        });
      }
    }

    const updateData = { userType };
    if (userType === 'employee') {
      updateData.companyId = companyId;
    } else {
      updateData.companyId = undefined;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    let response = {
      success: true,
      data: updatedUser,
    };

    if (userType === 'employee') {
      const employeeCode = Math.floor(100000 + Math.random() * 900000).toString();
      response.employeeCode = employeeCode;
    }

    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateUser
 * Kullanıcı bilgilerini günceller
 */
const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateProfile
 * Kullanıcı kendi profil bilgilerini günceller
 */
const updateProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const { firstName, lastName, username, email, phoneNumber, birthDate, profileImage } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId gereklidir',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (username !== undefined) updateData.username = username;
    if (email) updateData.email = email.toLowerCase();
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (birthDate) updateData.birthDate = new Date(birthDate);
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (req.body.bio !== undefined) updateData.bio = req.body.bio;
    if (req.body.expertiseDocuments !== undefined) updateData.expertiseDocuments = req.body.expertiseDocuments;
    if (req.body.workExamples !== undefined) updateData.workExamples = req.body.workExamples;
    if (req.body.notificationPreferences) {
      updateData.notificationPreferences = {
        appointmentReminder: req.body.notificationPreferences.appointmentReminder !== undefined
          ? req.body.notificationPreferences.appointmentReminder
          : user.notificationPreferences?.appointmentReminder ?? true,
        campaignNotifications: req.body.notificationPreferences.campaignNotifications !== undefined
          ? req.body.notificationPreferences.campaignNotifications
          : user.notificationPreferences?.campaignNotifications ?? true,
      };
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Bu e-posta adresi zaten kullanılıyor',
        });
      }
    }

    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const existingUser = await User.findOne({ phoneNumber });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon numarası zaten kullanılıyor',
        });
      }
    }

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Bu kullanıcı adı zaten kullanılıyor',
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profil başarıyla güncellendi',
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updateNotificationPreferences
 * Kullanıcı bildirim tercihlerini günceller
 */
const updateNotificationPreferences = async (req, res) => {
  try {
    const { userId, appointmentReminder, campaignNotifications } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId gereklidir',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    const updateData = {
      notificationPreferences: {
        appointmentReminder: appointmentReminder !== undefined
          ? appointmentReminder
          : (user.notificationPreferences?.appointmentReminder ?? true),
        campaignNotifications: campaignNotifications !== undefined
          ? campaignNotifications
          : (user.notificationPreferences?.campaignNotifications ?? true),
      },
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({
      success: true,
      message: 'Bildirim tercihleri başarıyla güncellendi',
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * updatePassword
 * Kullanıcı şifresini günceller
 */
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'currentPassword ve newPassword gereklidir',
      });
    }

    // Kullanıcı ID'sini authMiddleware'den al (güvenlik için)
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Yetkilendirme hatası',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Yeni şifre en az 6 karakter olmalıdır',
      });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    // Mevcut şifre kontrolü - hem hash'lenmiş hem de eski düz metin şifreleri destekle
    let isCurrentPasswordValid = false;
    if (user.password.startsWith('$2')) {
      // Hash'lenmiş şifre
      isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    } else {
      // Eski düz metin şifre (backward compatibility)
      isCurrentPasswordValid = user.password === currentPassword;
    }

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mevcut şifre hatalı',
      });
    }

    // Yeni şifre mevcut şifre ile aynı mı kontrol et
    let isSamePassword = false;
    if (user.password.startsWith('$2')) {
      isSamePassword = await bcrypt.compare(newPassword, user.password);
    } else {
      isSamePassword = currentPassword === newPassword;
    }

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'Yeni şifre mevcut şifre ile aynı olamaz',
      });
    }

    // Yeni şifreyi set et (pre-save hook otomatik hash'leyecek)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Şifre başarıyla güncellendi',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * createEmployee
 * Şirket için yeni çalışan oluşturur
 */
const createEmployee = async (req, res) => {
  try {
    const { companyId, firstName, lastName, birthDate, phoneNumber, profileImage, city, district, bio, expertiseDocuments, workExamples } = req.body;

    if (!companyId || !firstName || !lastName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'companyId, firstName, lastName ve phoneNumber zorunludur',
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

    const existingUser = await User.findOne({ phoneNumber });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon numarası zaten kullanılıyor',
      });
    }

    const defaultPassword = phoneNumber.slice(-6);
    let defaultEmail = `${phoneNumber}@bakimla.local`;

    let emailExists = await User.findOne({ email: defaultEmail });
    let counter = 1;
    while (emailExists) {
      defaultEmail = `${phoneNumber}_${counter}@bakimla.local`;
      emailExists = await User.findOne({ email: defaultEmail });
      counter++;
    }

    const employee = await User.create({
      firstName,
      lastName,
      gender: 'other',
      email: defaultEmail,
      phoneNumber,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      profileImage,
      city,
      district,
      bio,
      expertiseDocuments,
      workExamples,
      password: defaultPassword,
      userType: 'employee',
      companyId,
      isApproved: false,
    });

    const employeeResponse = employee.toObject();
    delete employeeResponse.password;

    res.status(201).json({
      success: true,
      message: 'Çalışan başarıyla oluşturuldu',
      data: employeeResponse,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * deleteUser
 * Kullanıcıyı siler
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Kullanıcı başarıyla silindi',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Accounting = require('../models/Accounting');

/**
 * getEmployeeStats
 * Çalışan istatistiklerini getirir (randevu sayısı, puan, kazanç)
 */
const getEmployeeStats = async (req, res) => {
  try {
    const { id } = req.params;

    const processCount = await Appointment.countDocuments({ employeeId: id, status: 'completed' });

    const reviews = await Review.find({ employeeId: id, reviewType: 'employee' });
    const averageRating = reviews.length > 0
      ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
      : 0;

    const earnings = await Accounting.aggregate([
      { $match: { employeeId: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: null, total: { $sum: "$income" } } }
    ]);
    const totalEarnings = earnings.length > 0 ? earnings[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        processCount,
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalEarnings,
        reviewCount: reviews.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getAllEmployees,
  getUserById,
  createUser,
  createEmployee,
  updateUserType,
  updateUser,
  updateProfile,
  updateNotificationPreferences,
  updatePassword,
  deleteUser,
  getEmployeeStats,
};

