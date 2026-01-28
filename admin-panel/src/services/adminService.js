import axios from 'axios';
import api from './api';

const getBaseUrl = () => (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

// Generic CRUD service generator
const createCrudService = (endpoint) => ({
  getAll: (params) => api.get(`/admin/${endpoint}`, { params }),
  getById: (id) => api.get(`/admin/${endpoint}/${id}`),
  create: (data) => api.post(`/admin/${endpoint}`, data),
  update: (id, data) => api.put(`/admin/${endpoint}/${id}`, data),
  delete: (id) => api.delete(`/admin/${endpoint}/${id}`),
});

export const adminService = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard'),

  // Users
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Stores
  getAllStores: (params) => api.get('/admin/stores', { params }),
  getStoreDetails: (storeId) => api.get(`/admin/stores/${storeId}`),
  updateStoreSettings: (storeId, data) => api.put(`/admin/stores/${storeId}/settings`, data),
  createStore: (data) => api.post('/admin/stores', data),
  updateStore: (id, data) => api.put(`/admin/stores/${id}/update`, data),
  deleteStore: (id) => api.delete(`/admin/stores/${id}`),

  // Store Services (işletmelerdeki hizmetler)
  storeServices: {
    getAll: (params) => api.get('/admin/store-services', { params }),
    create: (storeId, data) => api.post(`/admin/stores/${storeId}/services`, data),
    update: (storeId, serviceIndex, data) => api.put(`/admin/stores/${storeId}/services/${serviceIndex}`, data),
    delete: (storeId, serviceIndex) => api.delete(`/admin/stores/${storeId}/services/${serviceIndex}`),
  },

  // Appointments
  getAllAppointments: (params) => api.get('/admin/appointments', { params }),
  getAppointmentById: (id) => api.get(`/admin/appointments/${id}`),
  createAppointment: (data) => api.post('/admin/appointments', data),
  updateAppointment: (id, data) => api.put(`/admin/appointments/${id}`, data),
  deleteAppointment: (id) => api.delete(`/admin/appointments/${id}`),

  // Payments
  getAllPayments: (params) => api.get('/admin/payments', { params }),
  getPaymentById: (id) => api.get(`/admin/payments/${id}`),
  createPayment: (data) => api.post('/admin/payments', data),
  updatePayment: (id, data) => api.put(`/admin/payments/${id}`, data),
  deletePayment: (id) => api.delete(`/admin/payments/${id}`),
  refundPayment: (id, data) => api.post(`/admin/payments/${id}/refund`, data || {}),
  cancelPayment: (id, data) => api.post(`/admin/payments/${id}/cancel`, data || {}),

  // Orders
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  getOrderById: (id) => api.get(`/admin/orders/${id}`),
  createOrder: (data) => api.post('/admin/orders', data),
  updateOrder: (id, data) => api.put(`/admin/orders/${id}`, data),
  deleteOrder: (id) => api.delete(`/admin/orders/${id}`),

  // Wallets
  getAllWallets: (params) => api.get('/admin/wallets', { params }),
  getWalletById: (id) => api.get(`/admin/wallets/${id}`),
  createWallet: (data) => api.post('/admin/wallets', data),
  updateWallet: (id, data) => api.put(`/admin/wallets/${id}`, data),
  deleteWallet: (id) => api.delete(`/admin/wallets/${id}`),

  // İşlet Kazan (50 randevu = 20 TL)
  getIsletKazanList: (params) => api.get('/admin/islet-kazan', { params }),
  payIsletKazanPending: (id) => api.post(`/admin/islet-kazan/${id}/pay-pending`),

  // Withdrawal Requests
  getAllWithdrawalRequests: (params) => api.get('/admin/withdrawal-requests', { params }),
  getWithdrawalRequestById: (id) => api.get(`/admin/withdrawal-requests/${id}`),
  createWithdrawalRequest: (data) => api.post('/admin/withdrawal-requests', data),
  updateWithdrawalRequest: (id, data) => api.put(`/admin/withdrawal-requests/${id}`, data),
  processWithdrawalRequest: (id, data) => api.put(`/admin/withdrawal-requests/${id}/process`, data),
  deleteWithdrawalRequest: (id) => api.delete(`/admin/withdrawal-requests/${id}`),

  // Products
  getAllProducts: (params) => api.get('/admin/products', { params }),
  getProductById: (id) => api.get(`/admin/products/${id}`),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),

  // Resim yükleme (S3) – FormData, Content-Type yok (multipart)
  uploadImage: async (file, folder = 'products') => {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('folder', folder);
    return axios.post(`${getBaseUrl()}/admin/upload/image`, fd, {
      headers: { Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` },
    });
  },

  // Reviews
  getAllReviews: (params) => api.get('/admin/reviews', { params }),
  getReviewById: (id) => api.get(`/admin/reviews/${id}`),
  createReview: (data) => api.post('/admin/reviews', data),
  updateReview: (id, data) => api.put(`/admin/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  toggleReviewPublish: (id) => api.put(`/admin/reviews/${id}/toggle-publish`),

  // Employees
  getPendingEmployees: () => api.get('/admin/employees/pending'),
  getAllEmployees: (params) => api.get('/admin/employees', { params }),
  approveEmployee: (id) => api.put(`/admin/employees/${id}/approve`),
  rejectEmployee: (id) => api.put(`/admin/employees/${id}/reject`),

  // Generic CRUD for all other models
  campaigns: createCrudService('campaigns'),
  coupons: createCrudService('coupons'),
  addresses: createCrudService('addresses'),
  baskets: createCrudService('baskets'),
  favorites: createCrudService('favorites'),
  invoices: createCrudService('invoices'),
  notifications: createCrudService('notifications'),
  points: createCrudService('points'),
  pointsTransactions: createCrudService('points-transactions'),
  rewards: createCrudService('rewards'),
  rewardTransactions: createCrudService('reward-transactions'),
  services: createCrudService('services'),
  accounting: createCrudService('accounting'),
  customers: createCrudService('customers'),
  forms: createCrudService('forms'),
  paymentMethods: createCrudService('payment-methods'),
  userCampaigns: createCrudService('user-campaigns'),
  userCoupons: createCrudService('user-coupons'),
  userFavoriteStores: createCrudService('user-favorite-stores'),
  bakimlaStoreCoupons: createCrudService('bakimla-store-coupons'),
  businessHomeAds: createCrudService('business-home-ads'),
  clientHomeAds: createCrudService('client-home-ads'),
  clientCenterAds: createCrudService('client-center-ads'),
  quickAppointments: createCrudService('quick-appointments'),
  walletTransactions: createCrudService('wallet-transactions'),
  otps: createCrudService('otps'),
};

