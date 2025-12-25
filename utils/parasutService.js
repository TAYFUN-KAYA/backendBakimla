const axios = require('axios');
const PARASUT_CONFIG = require('../config/parasut');

/**
 * Paraşüt Service
 * Paraşüt API üzerinden fatura oluşturma ve yönetimi
 */

let accessToken = null;
let tokenExpiry = null;

/**
 * Paraşüt API'den access token al
 * @returns {Promise<string>}
 */
const getAccessToken = async () => {
  try {
    // Token hala geçerliyse kullan
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
      return accessToken;
    }

    if (!PARASUT_CONFIG.clientId || !PARASUT_CONFIG.clientSecret || !PARASUT_CONFIG.username || !PARASUT_CONFIG.password) {
      throw new Error('Paraşüt yapılandırması eksik');
    }

    const response = await axios.post(
      `${PARASUT_CONFIG.apiUrl}/oauth/token`,
      {
        grant_type: 'password',
        client_id: PARASUT_CONFIG.clientId,
        client_secret: PARASUT_CONFIG.clientSecret,
        username: PARASUT_CONFIG.username,
        password: PARASUT_CONFIG.password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.access_token) {
      accessToken = response.data.access_token;
      // Token'ı 1 saat öncesinden yenile (expires_in genelde 7200 saniye)
      const expiresIn = response.data.expires_in || 7200;
      tokenExpiry = Date.now() + (expiresIn - 3600) * 1000;

      return accessToken;
    }

    throw new Error('Paraşüt token alınamadı');
  } catch (error) {
    console.error('Paraşüt Token Hatası:', error.response?.data || error.message);
    throw new Error('Paraşüt token alınamadı');
  }
};

/**
 * Fatura oluştur
 * @param {Object} invoiceData - Fatura verileri
 * @returns {Promise<Object>}
 */
const createInvoice = async (invoiceData) => {
  try {
    const token = await getAccessToken();

    if (!PARASUT_CONFIG.companyId) {
      throw new Error('Paraşüt company ID tanımlı değil');
    }

    const invoicePayload = {
      data: {
        type: 'sales_invoices',
        attributes: {
          item_type: 'invoice',
          description: invoiceData.description || 'Bakimla Randevu/Ürün Ödemesi',
          issue_date: invoiceData.issueDate || new Date().toISOString().split('T')[0],
          due_date: invoiceData.dueDate || invoiceData.issueDate || new Date().toISOString().split('T')[0],
          currency: invoiceData.currency || 'TRY',
          exchange_rate: invoiceData.exchangeRate || 1,
          withholding_rate: invoiceData.withholdingRate || 0,
          vat_withholding_rate: invoiceData.vatWithholdingRate || 0,
          invoice_series: invoiceData.invoiceSeries || 'BAKIMLA',
          invoice_id: invoiceData.invoiceId || null,
          notes: invoiceData.notes || '',
          payment_account_id: invoiceData.paymentAccountId || null,
        },
        relationships: {
          contact: {
            data: {
              id: invoiceData.contactId,
              type: 'contacts',
            },
          },
          details: {
            data: invoiceData.items.map((item) => ({
              type: 'sales_invoice_details',
              attributes: {
                quantity: item.quantity || 1,
                unit_price: item.unitPrice,
                vat_rate: item.vatRate || 20,
                discount_type: item.discountType || 'percentage',
                discount_value: item.discountValue || 0,
                description: item.description,
                excise_duty_type: item.exciseDutyType || null,
                excise_duty: item.exciseDuty || null,
                communications_tax_rate: item.communicationsTaxRate || 0,
              },
            })),
          },
        },
      },
    };

    const response = await axios.post(
      `${PARASUT_CONFIG.apiUrl}/${PARASUT_CONFIG.companyId}/sales_invoices`,
      invoicePayload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: response.data,
      invoiceId: response.data.data?.id,
    };
  } catch (error) {
    console.error('Paraşüt Fatura Oluşturma Hatası:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.errors?.[0]?.detail || error.message || 'Fatura oluşturulamadı',
    };
  }
};

/**
 * Fatura detayını getir
 * @param {string} invoiceId - Paraşüt fatura ID'si
 * @returns {Promise<Object>}
 */
const getInvoice = async (invoiceId) => {
  try {
    const token = await getAccessToken();

    if (!PARASUT_CONFIG.companyId) {
      throw new Error('Paraşüt company ID tanımlı değil');
    }

    const response = await axios.get(
      `${PARASUT_CONFIG.apiUrl}/${PARASUT_CONFIG.companyId}/sales_invoices/${invoiceId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Paraşüt Fatura Getirme Hatası:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.errors?.[0]?.detail || error.message || 'Fatura getirilemedi',
    };
  }
};

/**
 * Müşteri (contact) oluştur veya getir
 * @param {Object} contactData - Müşteri verileri
 * @returns {Promise<Object>}
 */
const createOrGetContact = async (contactData) => {
  try {
    const token = await getAccessToken();

    if (!PARASUT_CONFIG.companyId) {
      throw new Error('Paraşüt company ID tanımlı değil');
    }

    // Önce mevcut müşteriyi ara
    const searchResponse = await axios.get(
      `${PARASUT_CONFIG.apiUrl}/${PARASUT_CONFIG.companyId}/contacts`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params: {
          'filter[email]': contactData.email,
        },
      }
    );

    // Eğer müşteri varsa döndür
    if (searchResponse.data.data && searchResponse.data.data.length > 0) {
      return {
        success: true,
        contactId: searchResponse.data.data[0].id,
        isNew: false,
      };
    }

    // Yeni müşteri oluştur
    const contactPayload = {
      data: {
        type: 'contacts',
        attributes: {
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone || '',
          tax_number: contactData.taxNumber || '',
          tax_office: contactData.taxOffice || '',
          address: contactData.address || '',
          city: contactData.city || '',
          district: contactData.district || '',
          country: contactData.country || 'Türkiye',
          account_type: 'customer',
        },
      },
    };

    const createResponse = await axios.post(
      `${PARASUT_CONFIG.apiUrl}/${PARASUT_CONFIG.companyId}/contacts`,
      contactPayload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      contactId: createResponse.data.data.id,
      isNew: true,
    };
  } catch (error) {
    console.error('Paraşüt Müşteri Oluşturma Hatası:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.errors?.[0]?.detail || error.message || 'Müşteri oluşturulamadı',
    };
  }
};

module.exports = {
  createInvoice,
  getInvoice,
  createOrGetContact,
};

