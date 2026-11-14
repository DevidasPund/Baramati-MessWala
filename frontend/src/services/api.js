import axios from 'axios';

// Normalize VITE_API_URL to ensure /api suffix is present and trailing slashes are handled
const rawApiUrl = import.meta.env.VITE_API_URL;
let baseURL = '/api';

if (rawApiUrl && typeof rawApiUrl === 'string') {
  const trimmed = rawApiUrl.trim().replace(/\/+$/, '');
  if (trimmed) {
    baseURL = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
}

const api = axios.create({
  baseURL,
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('messmate_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('messmate_token');
        localStorage.removeItem('messmate_user');
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;
