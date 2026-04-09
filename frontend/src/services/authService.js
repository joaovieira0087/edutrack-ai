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
    if (response.data && response.data.authToken) {
      localStorage.setItem('edutrack_token', response.data.authToken);
      localStorage.setItem('edutrack_user', JSON.stringify({ name, email }));
    }
    return { user: { name, email } };
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
  }
};

export default authService;
