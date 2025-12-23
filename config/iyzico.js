const Iyzipay = require('iyzipay');

// iyzico yapılandırması
const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY,
  secretKey: process.env.IYZICO_SECRET_KEY,
  uri: process.env.IYZICO_URI || 'https://sandbox-api.iyzipay.com', // Sandbox için
});

module.exports = iyzipay;

