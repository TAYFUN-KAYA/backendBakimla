const axios = require('axios');
const xml2js = require('xml2js');
const NETGSM_CONFIG = require('../config/netgsm');

/**
 * SMS Service
 * NetGSM üzerinden SMS gönderimi
 */

/**
 * OTP SMS gönder
 * @param {string} phoneNumber - Telefon numarası (5XXXXXXXXX formatında)
 * @param {string} code - OTP kodu
 * @returns {Promise<Object>}
 */
const sendOTP = async (phoneNumber, code) => {
  try {
    if (!NETGSM_CONFIG.username || !NETGSM_CONFIG.password) {
      throw new Error('NetGSM yapılandırması eksik');
    }

    // Telefon numarasını temizle (başındaki 0'ı kaldır)
    const cleanPhone = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;
    const formattedPhone = `90${cleanPhone}`;

    const message = `Bakimla giris kodunuz: ${code}. Bu kodu kimseyle paylasmayin.`;

    const params = new URLSearchParams({
      usercode: NETGSM_CONFIG.username,
      password: NETGSM_CONFIG.password,
      gsmno: formattedPhone,
      message: message,
      msgheader: NETGSM_CONFIG.msgheader,
      dil: 'TR',
    });

    const response = await axios.get(`${NETGSM_CONFIG.apiUrl}?${params.toString()}`);

    // XML response'u parse et
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);

    if (result && result.xml && result.xml.main && result.xml.main[0]) {
      const statusCode = result.xml.main[0].$.code;
      if (statusCode === '00' || statusCode === '01') {
        return {
          success: true,
          message: 'SMS başarıyla gönderildi',
          jobId: result.xml.main[0].$.jobID || null,
        };
      } else {
        return {
          success: false,
          message: result.xml.main[0]._ || 'SMS gönderilemedi',
          errorCode: statusCode,
        };
      }
    }

    return {
      success: false,
      message: 'SMS gönderiminde hata oluştu',
    };
  } catch (error) {
    console.error('SMS Gönderim Hatası:', error);
    return {
      success: false,
      message: error.message || 'SMS gönderiminde hata oluştu',
    };
  }
};

/**
 * Randevu bilgilendirme SMS gönder
 * @param {string} phoneNumber - Telefon numarası
 * @param {string} message - SMS mesajı
 * @returns {Promise<Object>}
 */
const sendAppointmentNotification = async (phoneNumber, message) => {
  try {
    if (!NETGSM_CONFIG.username || !NETGSM_CONFIG.password) {
      throw new Error('NetGSM yapılandırması eksik');
    }

    const cleanPhone = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;
    const formattedPhone = `90${cleanPhone}`;

    const params = new URLSearchParams({
      usercode: NETGSM_CONFIG.username,
      password: NETGSM_CONFIG.password,
      gsmno: formattedPhone,
      message: message,
      msgheader: NETGSM_CONFIG.msgheader,
      dil: 'TR',
    });

    const response = await axios.get(`${NETGSM_CONFIG.apiUrl}?${params.toString()}`);

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);

    if (result && result.xml && result.xml.main && result.xml.main[0]) {
      const statusCode = result.xml.main[0].$.code;
      if (statusCode === '00' || statusCode === '01') {
        return {
          success: true,
          message: 'SMS başarıyla gönderildi',
          jobId: result.xml.main[0].$.jobID || null,
        };
      } else {
        return {
          success: false,
          message: result.xml.main[0]._ || 'SMS gönderilemedi',
          errorCode: statusCode,
        };
      }
    }

    return {
      success: false,
      message: 'SMS gönderiminde hata oluştu',
    };
  } catch (error) {
    console.error('SMS Gönderim Hatası:', error);
    return {
      success: false,
      message: error.message || 'SMS gönderiminde hata oluştu',
    };
  }
};

/**
 * Ödeme linki SMS gönder
 * @param {string} phoneNumber - Telefon numarası
 * @param {string} paymentLink - Ödeme linki
 * @returns {Promise<Object>}
 */
const sendPaymentLink = async (phoneNumber, paymentLink) => {
  try {
    const message = `Bakimla ödeme linkiniz: ${paymentLink}`;
    return await sendAppointmentNotification(phoneNumber, message);
  } catch (error) {
    console.error('Ödeme Linki SMS Hatası:', error);
    return {
      success: false,
      message: error.message || 'SMS gönderiminde hata oluştu',
    };
  }
};

module.exports = {
  sendOTP,
  sendAppointmentNotification,
  sendPaymentLink,
};

