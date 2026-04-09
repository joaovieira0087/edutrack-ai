import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retrocompatibilidade (para os services manterem a sintaxe authApi e crudApi)
export const authApi = api;
export const crudApi = api;

// Request interceptor: add token to headers
const authInterceptor = (config) => {
  const token = localStorage.getItem('edutrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

authApi.interceptors.request.use(authInterceptor);

// Redirect on 401 Unauthorized
const errorInterceptor = (error) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('edutrack_token');
    localStorage.removeItem('edutrack_user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

authApi.interceptors.response.use((response) => response, errorInterceptor);

export default api;
