const Iyzipay = require('iyzipay');

// iyzico yapılandırması - lazy load
let iyzipayInstance = null;

const getIyzipay = () => {
  if (!iyzipayInstance) {
    if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY) {
      console.warn('⚠️  UYARI: IYZICO_API_KEY veya IYZICO_SECRET_KEY tanımlı değil! Ödeme işlemleri çalışmayabilir.');
      // Return dummy instance to prevent crashes
      iyzipayInstance = new Iyzipay({
        apiKey: 'dummy-api-key',
        secretKey: 'dummy-secret-key',
        uri: 'https://sandbox-api.iyzipay.com',
      });
    } else {
      iyzipayInstance = new Iyzipay({
        apiKey: process.env.IYZICO_API_KEY,
        secretKey: process.env.IYZICO_SECRET_KEY,
        uri: process.env.IYZICO_URI || 'https://sandbox-api.iyzipay.com',
      });
    }
  }
  return iyzipayInstance;
};

module.exports = getIyzipay();

