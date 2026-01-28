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
 * Eğer req.user varsa (authMiddleware ile), o kullanıcının companyId'sine göre filtreler
 */
const getAllEmployees = async (req, res) => {
  try {
    const { companyId: queryCompanyId, showAll, position, jobTitle } = req.query;

    const query = { userType: 'employee' };
    
    // Sadece aktif (onaylanmış) çalışanları getir
    if (showAll !== 'true' && showAll !== 'false') {
      query.isApproved = true;
    } else if (showAll === 'false') {
      query.isApproved = true;
    }

    // Position veya jobTitle filtresi
    if (position) {
      query.position = position;
    } else if (jobTitle) {
      query.jobTitle = jobTitle;
    }

    // companyId belirleme önceliği:
    // 1. Query parametresinden gelen companyId
    // 2. Token'dan gelen user'ın companyId'si (employee ise)
    // 3. Token'dan gelen user'ın _id'si (company ise)
    // NOT: userType='user' olan kullanıcılar için companyId filtresi uygulanmaz (tüm estetisyenleri görebilirler)
    let finalCompanyId = queryCompanyId;
    
    if (req.user && req.user.userType !== 'user') {
      if (req.user.userType === 'employee' && req.user.companyId) {
        // Employee ise, bağlı olduğu şirketin çalışanlarını getir
        finalCompanyId = req.user.companyId.toString();
      } else if (req.user.userType === 'company') {
        // Company ise, kendi çalışanlarını getir
        finalCompanyId = req.user._id.toString();
      }
    }
    // userType='user' ise finalCompanyId undefined kalır ve tüm estetisyenler getirilir

    if (finalCompanyId) {
      query.companyId = finalCompanyId;
    }

    console.log('🔍 getAllEmployees query:', {
      query,
      userType: req.user?.userType,
      userId: req.user?._id,
      finalCompanyId
    });

    const employees = await User.find(query)
      .select('firstName lastName email phoneNumber birthDate profileImage city district companyId isApproved bio expertiseDocuments workExamples jobTitle position')
      .populate('companyId', 'firstName lastName businessName')
      .sort({ createdAt: -1 });

    console.log('✅ Found employees:', employees.length);

    // Her employee için companyId'den store location'ını ve randevu sayısını ekle
    const Store = require('../models/Store');
    const Appointment = require('../models/Appointment');
    const employeesWithStoreLocation = await Promise.all(
      employees.map(async (employee) => {
        const employeeObj = employee.toObject();
        try {
          if (employee.companyId) {
            const companyId = employee.companyId._id || employee.companyId;
            // Company'nin ilk store'unu bul (location'ı olan)
            const store = await Store.findOne({ companyId })
              .select('location')
              .lean();
            
            if (store && store.location && store.location.latitude && store.location.longitude) {
              employeeObj.storeLocation = {
                latitude: store.location.latitude,
                longitude: store.location.longitude,
              };
            }
          }
          
          // Randevu sayısını hesapla
          const appointmentCount = await Appointment.countDocuments({ 
            employeeId: employee._id 
          });
          employeeObj.appointmentCount = appointmentCount || 0;
        } catch (error) {
          console.error(`Error loading store location/appointment count for employee ${employee._id}:`, error);
          employeeObj.appointmentCount = 0;
        }
        return employeeObj;
      })
    );

    res.status(200).json({
      success: true,
      count: employeesWithStoreLocation.length,
      data: employeesWithStoreLocation,
    });
  } catch (error) {
    console.error('❌ getAllEmployees error:', error);
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
    const { id } = req.params;
    const updateData = { ...req.body };

    // Date alanlarını düzelt
    if (updateData.birthDate) {
      updateData.birthDate = new Date(updateData.birthDate);
    }

    // Array alanlarını kontrol et
    if (updateData.expertiseDocuments !== undefined) {
      updateData.expertiseDocuments = Array.isArray(updateData.expertiseDocuments) 
        ? updateData.expertiseDocuments 
        : [];
    }

    if (updateData.workExamples !== undefined) {
      updateData.workExamples = Array.isArray(updateData.workExamples) 
        ? updateData.workExamples 
        : [];
    }

    console.log('📝 Updating user:', { id, updateData: Object.keys(updateData) });

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    console.log('✅ User updated successfully:', { id, updatedFields: Object.keys(updateData) });

    res.status(200).json({
      success: true,
      data: userResponse,
    });
  } catch (error) {
    console.error('❌ Update user error:', error);
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
 * getNotificationPreferences
 * Kullanıcı bildirim tercihlerini getirir
 */
const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user._id; // authMiddleware'den gelen user bilgisi

    const user = await User.findById(userId).select('notificationPreferences');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      data: user.notificationPreferences || {
        appNotifications: false,
        campaignNotifications: false,
        appointmentReminders: true
      },
    });
  } catch (error) {
    res.status(500).json({
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
    const userId = req.user._id; // authMiddleware'den gelen user bilgisi
    const { appNotifications, campaignNotifications, appointmentReminders } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    const updateData = {
      notificationPreferences: {
        appNotifications: appNotifications !== undefined
          ? appNotifications
          : (user.notificationPreferences?.appNotifications ?? false),
        campaignNotifications: campaignNotifications !== undefined
          ? campaignNotifications
          : (user.notificationPreferences?.campaignNotifications ?? false),
        appointmentReminders: appointmentReminders !== undefined
          ? appointmentReminders
          : (user.notificationPreferences?.appointmentReminders ?? true),
      },
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({
      success: true,
      message: 'Bildirim tercihleri başarıyla güncellendi',
      data: updatedUser.notificationPreferences,
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
    const { companyId, firstName, lastName, birthDate, phoneNumber, profileImage, city, district, bio, expertiseDocuments, workExamples, jobTitle, position, isApproved } = req.body;

    console.log('📥 createEmployee request body:', {
      companyId,
      firstName,
      lastName,
      phoneNumber,
      profileImage: profileImage || 'null/undefined',
      jobTitle,
      isApproved
    });

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

    const employeeData = {
      firstName,
      lastName,
      gender: 'other',
      email: defaultEmail,
      phoneNumber,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      city,
      district,
      bio,
      expertiseDocuments,
      workExamples,
      jobTitle: jobTitle || 'Çalışan',
      position: position || jobTitle, // Position key (kuaför, estetisyen_doktor, etc.)
      password: defaultPassword,
      userType: 'employee',
      companyId,
      isApproved: isApproved !== undefined ? isApproved : true, // Varsayılan olarak true (otomatik aktif)
    };

    // profileImage sadece varsa ekle
    if (profileImage) {
      employeeData.profileImage = profileImage;
      console.log('✅ Adding profileImage to employeeData:', profileImage);
    } else {
      console.log('⚠️ No profileImage provided, will be null/undefined');
    }

    console.log('📝 Creating employee with data:', { ...employeeData, profileImage: employeeData.profileImage || 'null/undefined' });

    const employee = await User.create(employeeData);

    const employeeResponse = employee.toObject();
    delete employeeResponse.password;

    console.log('✅ Employee created:', {
      _id: employeeResponse._id,
      firstName: employeeResponse.firstName,
      lastName: employeeResponse.lastName,
      profileImage: employeeResponse.profileImage || 'null'
    });

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
 * Kullanıcıyı ve tüm ilgili verilerini siler
 */
const deleteUser = async (req, res) => {
  try {
    const userId = req.user?._id || req.params.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID gereklidir',
      });
    }

    // Kullanıcıyı bul
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    // Tüm ilgili verileri sil (companyId veya userId ile ilişkili)
    const Store = require('../models/Store');
    const Customer = require('../models/Customer');
    const Service = require('../models/Service');
    const Product = require('../models/Product');
    const { Reward, RewardTransaction } = require('../models/Reward');
    const Payment = require('../models/Payment');
    const Accounting = require('../models/Accounting');
    const Invoice = require('../models/Invoice');
    const Notification = require('../models/Notification');
    const Favorite = require('../models/Favorite');
    const Basket = require('../models/Basket');
    const Address = require('../models/Address');
    const { Wallet, WalletTransaction, WithdrawalRequest } = require('../models/Wallet');
    const { Points, PointsTransaction } = require('../models/Points');
    const PaymentMethod = require('../models/PaymentMethod');
    const QuickAppointment = require('../models/QuickAppointment');
    const Order = require('../models/Order');

    // Paralel olarak tüm ilgili verileri sil
    await Promise.all([
      // Store ve ilgili veriler
      Store.deleteMany({ companyId: userId }),
      
      // Customer verileri
      Customer.deleteMany({ companyId: userId }),
      
      // Service verileri
      Service.deleteMany({ companyId: userId }),
      
      // Product verileri
      Product.deleteMany({ companyId: userId }),
      
      // Campaign verileri
      Campaign.deleteMany({ companyId: userId }),
      
      // Coupon verileri
      Coupon.deleteMany({ companyId: userId }),
      
      // Reward verileri
      Reward.deleteMany({ companyId: userId }),
      RewardTransaction.deleteMany({ companyId: userId }),
      
      // Appointment verileri (companyId veya employeeId veya userId)
      Appointment.deleteMany({ 
        $or: [
          { companyId: userId },
          { employeeId: userId },
          { userId: userId }
        ]
      }),
      
      // Review verileri
      Review.deleteMany({ 
        $or: [
          { companyId: userId },
          { userId: userId },
          { employeeId: userId }
        ]
      }),
      
      // Payment verileri
      Payment.deleteMany({ companyId: userId }),
      
      // Accounting verileri
      Accounting.deleteMany({ 
        $or: [
          { companyId: userId },
          { employeeId: userId }
        ]
      }),
      
      // Invoice verileri (userId ile)
      Invoice.deleteMany({ userId: userId }),
      
      // Order verileri (userId ile)
      Order.deleteMany({ userId: userId }),
      
      // Notification verileri
      Notification.deleteMany({ 
        $or: [
          { userId: userId },
          { companyId: userId }
        ]
      }),
      
      // Favorite verileri
      Favorite.deleteMany({ userId: userId }),
      
      // Basket verileri
      Basket.deleteMany({ userId: userId }),
      
      // Address verileri
      Address.deleteMany({ userId: userId }),
      
      // Wallet verileri (companyId ile)
      Wallet.deleteMany({ companyId: userId }),
      WalletTransaction.deleteMany({ companyId: userId }),
      WithdrawalRequest.deleteMany({ companyId: userId }),
      
      // Points verileri (userId ile)
      Points.deleteMany({ userId: userId }),
      PointsTransaction.deleteMany({ userId: userId }),
      
      // PaymentMethod verileri
      PaymentMethod.deleteMany({ userId: userId }),
      
      // QuickAppointment verileri
      QuickAppointment.deleteMany({ companyId: userId }),
    ]);

    // Employee ise, companyId'ye bağlı olanları da kontrol et
    if (user.userType === 'employee' && user.companyId) {
      // Employee silindiğinde, company'nin activeStoreIds'den bu employee'yi kaldır
      await User.updateMany(
        { _id: user.companyId },
        { $pull: { activeStoreIds: userId } }
      );
    }

    // Company ise, employee'lerin companyId'sini null yap veya sil
    if (user.userType === 'company') {
      await User.updateMany(
        { companyId: userId },
        { $unset: { companyId: '' } }
      );
    }

    // Son olarak kullanıcıyı sil
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Hesap ve tüm ilgili veriler başarıyla silindi',
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Hesap silinirken bir hata oluştu',
    });
  }
};

const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Accounting = require('../models/Accounting');
const Campaign = require('../models/Campaign');

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

/**
 * getDashboard
 * Ana sayfa için gerekli tüm verileri tek seferde getirir
 * - User profile
 * - Active campaigns (company's own)
 * - Pending appointments
 * - Recent earnings
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    // Get company's active campaigns
    const now = new Date();
    const campaigns = await Campaign.find({
      companyId: userId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .select('title shortDescription image discountType discountValue startDate endDate')
      .sort({ startDate: -1 })
      .limit(5);

    // Get pending appointments (son 2 gün + gelecek 22 gün = 25 gün)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);
    
    const twentyTwoDaysLater = new Date();
    twentyTwoDaysLater.setDate(twentyTwoDaysLater.getDate() + 22);
    twentyTwoDaysLater.setHours(23, 59, 59, 999);

    // Tüm randevuları getir (pending, approved, completed) - cancelled hariç
    const allAppointments = await Appointment.find({
      companyId: userId,
      status: { $nin: ['cancelled'] }, // İptal edilenler hariç tüm randevular
      appointmentDate: {
        $gte: twoDaysAgo,
        $lte: twentyTwoDaysLater,
      },
    })
      .populate('customerIds', 'firstName lastName phoneNumber profileImage')
      .populate('employeeId', 'firstName lastName')
      .select('appointmentDate appointmentTime serviceType servicePrice customerIds employeeId status paymentReceived groupId isApproved')
      .sort({ appointmentDate: 1, appointmentTime: 1 });
    
    // groupId varsa, sadece groupId null olan veya groupId kendisi olan randevuları göster (tekrar göstermemek için)
    // groupId başka bir randevunun _id'si olan randevuları filtrele
    const pendingAppointments = allAppointments.filter(apt => {
      // groupId yoksa veya null ise göster
      if (!apt.groupId) return true;
      
      // groupId varsa, sadece groupId kendisi ise göster (ilk randevu)
      // Yani apt._id === apt.groupId ise göster
      return apt._id.toString() === apt.groupId.toString();
    });

    // Get earnings for last 25 days (2 gün önce + bugün + 22 gün sonra)
    const earningsRecords = await Accounting.find({
      companyId: userId,
      date: {
        $gte: twoDaysAgo,
        $lte: twentyTwoDaysLater,
      },
    })
      .populate('employeeId', 'firstName lastName')
      .select('income expense category employeeId date appointmentId')
      .sort({ date: -1 });

    // Bugünün özet bilgileri
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayEarnings = earningsRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startOfToday && recordDate <= endOfToday;
    });

    const totalIncome = todayEarnings.reduce((sum, record) => sum + (record.income || 0), 0);
    const totalExpense = todayEarnings.reduce((sum, record) => sum + (record.expense || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        user,
        campaigns,
        pendingAppointments,
        earnings: {
          records: earningsRecords, // Tüm kayıtlar (25 gün)
          summary: {
            totalIncome, // Bugünün özeti
            totalExpense,
            netProfit: totalIncome - totalExpense,
          },
        },
      },
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
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
  getNotificationPreferences,
  updateNotificationPreferences,
  updatePassword,
  deleteUser,
  getEmployeeStats,
  getDashboard,
};

