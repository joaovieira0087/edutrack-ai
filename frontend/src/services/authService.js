import { authApi } from './api';

const authService = {
  login: async (credentials) => {
    const { email, password } = credentials;
    const response = await authApi.post('/auth/login', { email, password });
    if (response.data && response.data.authToken) {
      localStorage.setItem('edutrack_token', response.data.authToken);
      // user will be loaded by validateSession but we can mock it
      localStorage.setItem('edutrack_user', JSON.stringify({ email }));
    }
    return { user: { email } }; // Compatible return format for AuthContext
  },
  
  signup: async (data) => {
    const { name, email, password } = data;
    const response = await authApi.post('/auth/signup', { name, email, password });
    // Token is no longer returned on signup. The user must verify their email.
    return response.data;
  },

  verifyEmail: async (email, code) => {
    const response = await authApi.post('/auth/verify-email', { email, code });
    if (response.data && response.data.authToken) {
      localStorage.setItem('edutrack_token', response.data.authToken);
      localStorage.setItem('edutrack_user', JSON.stringify({ email }));
    }
    return response.data;
  },

  resendVerificationCode: async (email) => {
    const response = await authApi.post('/auth/resend-verification', { email });
    return response.data;
  },

  getStoredUser: () => {
    const userStr = localStorage.getItem('edutrack_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('edutrack_token');
  },

  me: async () => {
    try {
      const response = await authApi.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('edutrack_token');
    localStorage.removeItem('edutrack_user');
  },

  forgotPassword: async (email) => {
    const response = await authApi.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyCode: async (email, code) => {
    const response = await authApi.post('/auth/verify-code', { email, code });
    return response.data;
  },

  resetPassword: async (email, code, newPassword, confirmPassword) => {
    const response = await authApi.post('/auth/reset-password', {
      email,
      code,
      newPassword,
      confirmPassword
    });
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await authApi.put('/auth/profile', data);
    return response.data;
  },

  updateSettings: async (settings) => {
    const response = await authApi.put('/auth/settings', settings);
    return response.data;
  }
};

export default authService;
