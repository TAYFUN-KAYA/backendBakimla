const Iyzipay = require('iyzipay');

// Test environment configuration
const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || 'sandbox-your-api-key',
  secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-your-secret-key',
  uri: 'https://sandbox-api.iyzipay.com' // Test ortamı için sandbox URL
});

module.exports = iyzipay;
