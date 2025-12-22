const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bakimla-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

/**
 * Generate JWT Token
 * Kullanıcı bilgileri ile JWT token oluşturur
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verify JWT Token
 * Token'ı doğrular ve kullanıcı ID'sini döner
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Geçersiz veya süresi dolmuş token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
};

