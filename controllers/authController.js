const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcrypt');
const OTP = require('../models/OTP');
const { sendOTP } = require('../utils/smsService');

/**
 * sendOTP
 * OTP kodu gönder (kayıt veya giriş için)
 */
const sendOTPCode = async (req, res) => {
  try {
    const { phoneNumber, purpose, userType } = req.body; // purpose: 'register' veya 'login', userType: 'user', 'company', 'employee'

    if (!phoneNumber || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'phoneNumber ve purpose zorunludur',
      });
    }

    if (!['register', 'login', 'admin-login', 'reset-password'].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: 'purpose "register", "login", "admin-login" veya "reset-password" olmalıdır',
      });
    }

    // Admin login için telefon numarası kontrolü
    if (purpose === 'admin-login') {
      const user = await User.findOne({ phoneNumber, userType: 'admin' });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı',
        });
      }
    }

    // Kayıt için telefon numarası kontrolü - belirli userType için
    if (purpose === 'register') {
      if (!userType) {
        return res.status(400).json({
          success: false,
          message: 'Kayıt için userType zorunludur',
        });
      }
      const existingUser = await User.findOne({ phoneNumber, userType });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: `Bu telefon numarası ${userType} tipinde zaten kayıtlı`,
        });
      }
    }

    // Giriş veya şifre sıfırlama için kullanıcı kontrolü
    // Önce verilen userType ile ara; bulunamazsa (örn. uygulama company gönderir ama kullanıcı employee) diğer tipi dene
    if (purpose === 'login' || purpose === 'reset-password') {
      const preferredType = userType || 'company';
      let user = await User.findOne({ phoneNumber, userType: preferredType });
      if (!user && (preferredType === 'company' || preferredType === 'employee')) {
        const fallbackType = preferredType === 'company' ? 'employee' : 'company';
        user = await User.findOne({ phoneNumber, userType: fallbackType });
      }
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Bu telefon numarası ile kayıtlı kullanıcı bulunamadı',
        });
      }
      // Onay bekleyen çalışana da OTP gönder (giriş yapıp "Onay Bekleniyor" ekranını görsün)
    }

    // 6 haneli OTP kodu oluştur
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Eski OTP'leri iptal et (aynı telefon ve purpose için)
    await OTP.updateMany(
      { phoneNumber, purpose, isUsed: false },
      { isUsed: true }
    );

    // Yeni OTP oluştur (10 dakika geçerli)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const otp = await OTP.create({
      phoneNumber,
      code,
      purpose,
      expiresAt,
    });

    // SMS gönder
    /* NetGSM devre dışı
    const smsResult = await sendOTP(phoneNumber, code);

    if (smsResult.success) {
      res.status(200).json({
        success: true,
        message: 'OTP kodu gönderildi',
        data: {
          expiresIn: 600, // 10 dakika (saniye cinsinden)
        },
      });
    } else {
      // SMS gönderilemese bile OTP kaydı oluşturuldu (test için)
      res.status(200).json({
        success: true,
        message: 'OTP kodu oluşturuldu (SMS gönderilemedi)',
        data: {
          code: process.env.NODE_ENV === 'development' ? code : undefined, // Sadece development'ta göster
          expiresIn: 600,
        },
        smsError: smsResult.message,
      });
    }
    */

    console.log(`OTP Code for ${phoneNumber}: ${code}`);

    res.status(200).json({
      success: true,
      message: 'OTP kodu oluşturuldu (SMS Devre Dışı)',
      data: {
        code: code,
        expiresIn: 600,
      },
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * verifyOTP
 * OTP kodunu doğrula ve kayıt/giriş yap
 */
const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, code, purpose, userData, userType } = req.body;

    if (!phoneNumber || !code || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'phoneNumber, code ve purpose zorunludur',
      });
    }

    if (!['register', 'login', 'admin-login', 'reset-password'].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: 'purpose "register", "login", "admin-login" veya "reset-password" olmalıdır',
      });
    }

    // OTP'yi bul
    let otp;
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    const isMagicNumber = isDev && purpose === 'admin-login' && code === '001234';

    if (isMagicNumber) {
      // Magic number kullanıldığında OTP kaydı aramaya gerek yok
      otp = { isUsed: true };
    } else {
      otp = await OTP.findOne({
        phoneNumber,
        code,
        purpose,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });

      if (!otp) {
        // Deneme sayısını artır
        const failedOtp = await OTP.findOne({ phoneNumber, purpose, isUsed: false });
        if (failedOtp) {
          failedOtp.attempts += 1;
          if (failedOtp.attempts >= 5) {
            failedOtp.isUsed = true; // Çok fazla deneme, OTP'yi iptal et
          }
          await failedOtp.save();
        }

        return res.status(400).json({
          success: false,
          message: 'Geçersiz veya süresi dolmuş OTP kodu',
        });
      }

      // OTP'yi kullanıldı olarak işaretle
      otp.isUsed = true;
      await otp.save();
    }



    if (purpose === 'register') {
      // Kayıt işlemi (şifresiz)
      const { firstName, lastName, gender, email, userType, companyId } = userData || {};

      if (!firstName || !lastName || !gender || !email || !userType) {
        return res.status(400).json({
          success: false,
          message: 'Kayıt için ad, soyad, cinsiyet, email ve kullanıcı tipi gereklidir',
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

      // Aynı telefon+userType kombinasyonunu kontrol et
      const existingUserByPhone = await User.findOne({
        phoneNumber,
        userType,
      });

      if (existingUserByPhone) {
        return res.status(400).json({
          success: false,
          message: `Bu telefon numarası ${userType} tipinde zaten kayıtlı`,
        });
      }

      // Email kontrolü (email unique olarak kalıyor)
      const existingUserByEmail = await User.findOne({ email });

      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: 'Bu e-posta adresi zaten kullanılıyor',
        });
      }

      const user = await User.create({
        firstName,
        lastName,
        gender,
        email,
        phoneNumber,
        userType,
        companyId: userType === 'employee' ? companyId : undefined,
        // No password field - passwordless authentication
      });

      const token = generateToken(user._id);
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(201).json({
        success: true,
        message: 'Kayıt başarılı',
        data: {
          user: userResponse,
          token,
        },
      });
    } else if (purpose === 'login') {
      // Giriş: önce body'deki userType ile ara, bulunamazsa company/employee fallback
      const preferredType = userType || 'company';
      let user = await User.findOne({ phoneNumber, userType: preferredType });
      if (!user && (preferredType === 'company' || preferredType === 'employee')) {
        const fallbackType = preferredType === 'company' ? 'employee' : 'company';
        user = await User.findOne({ phoneNumber, userType: fallbackType });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı',
        });
      }

      // Onay bekleyen çalışan da giriş yapabilsin; uygulama CreateBusinessFinal'a yönlendirir
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
    } else if (purpose === 'admin-login') {
      // Admin giriş işlemi
      const user = await User.findOne({ phoneNumber });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı',
        });
      }

      if (user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Bu panele erişim için admin yetkisi gereklidir',
        });
      }

      const token = generateToken(user._id);
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(200).json({
        success: true,
        message: 'Admin girişi başarılı',
        data: {
          user: userResponse,
          token,
        },
      });
    }
    else if (purpose === 'reset-password') {
      // Şifre sıfırlama işlemi - belirli userType için
      const { password } = userData || {};

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Yeni şifre gereklidir',
        });
      }

      if (!userType) {
        return res.status(400).json({
          success: false,
          message: 'Şifre sıfırlama için userType zorunludur',
        });
      }

      const user = await User.findOne({ phoneNumber, userType });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı',
        });
      }

      // Şifreyi güncelle (User modelinde hash'lenecek)
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Şifreniz başarıyla güncellendi',
      });
    }
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Register
 * Yeni kullanıcı kaydı oluşturur (company, employee, user)
 * NOT: Artık OTP ile çalışıyor, bu fonksiyon backward compatibility için
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

    // Şifre kontrolü - hem hash'lenmiş hem de eski düz metin şifreleri destekle (migration için)
    let isPasswordValid = false;
    if (user.password.startsWith('$2')) {
      // Hash'lenmiş şifre
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Eski düz metin şifre (backward compatibility)
      isPasswordValid = user.password === password;
      // Eğer eşleşiyorsa, şifreyi hash'le ve kaydet
      if (isPasswordValid) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
      }
    }

    if (!isPasswordValid) {
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

/**
 * checkUserByPhone
 * Telefon numarasına göre belirli userType'taki kullanıcı bilgisini kontrol et
 */
const checkUserByPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { userType } = req.query; // Query parameter olarak userType

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Telefon numarası zorunludur',
      });
    }

    if (!userType) {
      return res.status(400).json({
        success: false,
        message: 'userType parametresi zorunludur',
      });
    }

    // Belirli userType'taki kullanıcıyı bul
    const user = await User.findOne({ phoneNumber, userType }).select('userType firstName lastName');

    if (!user) {
      return res.status(200).json({
        success: true,
        exists: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    return res.status(200).json({
      success: true,
      exists: true,
      data: {
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Check User By Phone Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  sendOTPCode,
  verifyOTP,
  register, // Backward compatibility
  login, // Backward compatibility
  checkUserByPhone,
};

