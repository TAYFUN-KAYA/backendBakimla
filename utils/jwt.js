const jwt = require('jsonwebtoken');

// JWT_SECRET environment variable kontrolü
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('⚠️  UYARI: JWT_SECRET environment variable tanımlı değil! Production ortamında güvenlik riski oluşturur.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'bakimla-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

// Production ortamında default secret kullanılıyorsa uyarı ver
if (JWT_SECRET === 'bakimla-secret-key-change-in-production' && process.env.NODE_ENV === 'production') {
  console.error('⚠️  KRİTİK UYARI: Production ortamında default JWT_SECRET kullanılıyor! Lütfen güvenli bir secret key tanımlayın.');
}

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

