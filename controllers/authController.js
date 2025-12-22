const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

/**
 * Register
 * Yeni kullanıcı kaydı oluşturur (company, employee, user)
 */
const register = async (req, res) => {
  try {
    const { firstName, lastName, gender, email, phoneNumber, password, userType, companyId } = req.body;

    if (!firstName || !lastName || !gender || !email || !phoneNumber || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanlar zorunludur',
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

    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu e-posta veya telefon numarası zaten kullanılıyor',
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      gender,
      email,
      phoneNumber,
      password,
      userType,
      companyId: userType === 'employee' ? companyId : undefined,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı',
      data: userResponse,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Login
 * Telefon numarası ve şifre ile kullanıcı girişi yapar
 */
const login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Telefon numarası ve şifre gereklidir',
      });
    }

    const user = await User.findOne({ phoneNumber }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Telefon numarası veya şifre hatalı',
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Telefon numarası veya şifre hatalı',
      });
    }

    if (user.userType === 'employee' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Hesabınız henüz onaylanmadı. Lütfen admin onayını bekleyin.',
      });
    }

    const token = generateToken(user._id);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
};

