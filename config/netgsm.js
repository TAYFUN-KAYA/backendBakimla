/**
 * NetGSM Configuration
 * SMS gönderimi için NetGSM API yapılandırması
 */

const NETGSM_CONFIG = {
  username: process.env.NETGSM_USERNAME || '',
  password: process.env.NETGSM_PASSWORD || '',
  apiUrl: process.env.NETGSM_API_URL || 'https://api.netgsm.com.tr/sms/send/get',
  msgheader: process.env.NETGSM_MSG_HEADER || 'BAKIMLA',
};

if (!NETGSM_CONFIG.username || !NETGSM_CONFIG.password) {
  console.warn('⚠️  UYARI: NETGSM_USERNAME veya NETGSM_PASSWORD tanımlı değil! SMS gönderimi çalışmayabilir.');
}

module.exports = NETGSM_CONFIG;

