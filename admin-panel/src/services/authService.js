import api from './api';

export const authService = {
  login: async (phoneNumber, code) => {
    const response = await api.post('/auth/verify-otp', {
      phoneNumber,
      code,
      purpose: 'login',
    });
    return response.data;
  },

  sendOTP: async (phoneNumber) => {
    const response = await api.post('/auth/send-otp', {
      phoneNumber,
      purpose: 'login',
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('admin_token');
  },
};

