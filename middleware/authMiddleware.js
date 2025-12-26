const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

/**
 * Auth Middleware
 * Token ile kullanıcının giriş yapıp yapmadığını kontrol eder
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Yetkilendirme hatası. Token gereklidir.',
      });
    }

    const token = authHeader.substring(7);

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token',
      });
    }

    if (user.userType === 'employee' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Hesabınız henüz onaylanmadı',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'Yetkilendirme hatası',
    });
  }
};

/**
 * Company Middleware
 * Token ile sadece şirket kullanıcılarının erişebilmesini sağlar
 */
const companyMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Yetkilendirme hatası. Token gereklidir.',
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token',
      });
    }

    if (user.userType !== 'company') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için şirket yetkisi gereklidir',
      });
    }

    req.user = user;
    req.companyId = user._id;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'Yetkilendirme hatası',
    });
  }
};

/**
 * Employee Middleware
 * Token ile sadece çalışan kullanıcılarının erişebilmesini sağlar
 */
const employeeMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Yetkilendirme hatası. Token gereklidir.',
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token',
      });
    }

    if (user.userType !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için çalışan yetkisi gereklidir',
      });
    }

    if (!user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Hesabınız henüz onaylanmadı',
      });
    }

    req.user = user;
    req.employeeId = user._id;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'Yetkilendirme hatası',
    });
  }
};

/**
 * Admin Middleware
 * Token ile sadece admin kullanıcılarının erişebilmesini sağlar
 */
const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Yetkilendirme hatası. Token gereklidir.',
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token',
      });
    }

    if (user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için admin yetkisi gereklidir',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'Yetkilendirme hatası',
    });
  }
};

module.exports = {
  authMiddleware,
  companyMiddleware,
  employeeMiddleware,
  adminMiddleware,
};

