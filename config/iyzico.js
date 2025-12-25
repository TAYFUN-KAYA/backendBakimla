const Iyzipay = require('iyzipay');

// iyzico yapılandırması
if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY) {
  console.warn('⚠️  UYARI: IYZICO_API_KEY veya IYZICO_SECRET_KEY tanımlı değil! Ödeme işlemleri çalışmayabilir.');
}

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || '',
  secretKey: process.env.IYZICO_SECRET_KEY || '',
  uri: process.env.IYZICO_URI || 'https://sandbox-api.iyzipay.com', // Sandbox için
});

module.exports = iyzipay;

