import api from './api';

export const adminService = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard'),

  // Users
  getAllUsers: (params) => api.get('/admin/users', { params }),

  // Stores
  getAllStores: (params) => api.get('/admin/stores', { params }),
  getStoreDetails: (storeId) => api.get(`/admin/stores/${storeId}`),

  // Appointments
  getAllAppointments: (params) => api.get('/admin/appointments', { params }),

  // Payments
  getAllPayments: (params) => api.get('/admin/payments', { params }),

  // Orders
  getAllOrders: (params) => api.get('/admin/orders', { params }),

  // Wallets
  getAllWallets: (params) => api.get('/admin/wallets', { params }),

  // Withdrawal Requests
  getAllWithdrawalRequests: (params) => api.get('/admin/withdrawal-requests', { params }),
  processWithdrawalRequest: (id, data) => api.put(`/admin/withdrawal-requests/${id}/process`, data),

  // Products
  getAllProducts: (params) => api.get('/admin/products', { params }),

  // Reviews
  getAllReviews: (params) => api.get('/admin/reviews', { params }),
  toggleReviewPublish: (id) => api.put(`/admin/reviews/${id}/toggle-publish`),

  // Employees
  getPendingEmployees: () => api.get('/admin/employees/pending'),
  getAllEmployees: (params) => api.get('/admin/employees', { params }),
  approveEmployee: (id) => api.put(`/admin/employees/${id}/approve`),
  rejectEmployee: (id) => api.put(`/admin/employees/${id}/reject`),
};

