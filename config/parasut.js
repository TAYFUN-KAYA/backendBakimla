/**
 * Paraşüt API Configuration
 * Fatura yönetimi için Paraşüt API yapılandırması
 */

const PARASUT_CONFIG = {
  apiUrl: process.env.PARASUT_API_URL || 'https://api.parasut.com/v4',
  clientId: process.env.PARASUT_CLIENT_ID || '',
  clientSecret: process.env.PARASUT_CLIENT_SECRET || '',
  username: process.env.PARASUT_USERNAME || '',
  password: process.env.PARASUT_PASSWORD || '',
  companyId: process.env.PARASUT_COMPANY_ID || '',
};

if (!PARASUT_CONFIG.clientId || !PARASUT_CONFIG.clientSecret) {
  console.warn('⚠️  UYARI: Paraşüt API yapılandırması eksik! Fatura işlemleri çalışmayabilir.');
}

module.exports = PARASUT_CONFIG;

