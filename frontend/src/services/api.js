import axios from 'axios';
import toast from 'react-hot-toast';

// Normalize VITE_API_URL to ensure /api suffix is present and trailing slashes are handled
const rawApiUrl = import.meta.env.VITE_API_URL;
let baseURL = '/api';

if (rawApiUrl && typeof rawApiUrl === 'string') {
  const trimmed = rawApiUrl.trim().replace(/\/+$/, '');
  if (trimmed) {
    baseURL = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
}

// 65-second timeout to safely accommodate Render Free-Tier cold starts (45-60s)
const api = axios.create({
  baseURL,
  timeout: 65000,
});

let coldStartTimer = null;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('messmate_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If request takes longer than 4 seconds, show cold-start warning for Render free instances
    if (!coldStartTimer) {
      coldStartTimer = setTimeout(() => {
        toast.loading('मेस सर्व्हर सुरू होत आहे, कृपया काही सेकंद थांबा...', {
          id: 'server-cold-start',
          duration: 15000,
        });
      }, 4000);
    }

    return config;
  },
  (error) => {
    if (coldStartTimer) {
      clearTimeout(coldStartTimer);
      coldStartTimer = null;
    }
    toast.dismiss('server-cold-start');
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (coldStartTimer) {
      clearTimeout(coldStartTimer);
      coldStartTimer = null;
    }
    toast.dismiss('server-cold-start');
    return response.data;
  },
  async (error) => {
    if (coldStartTimer) {
      clearTimeout(coldStartTimer);
      coldStartTimer = null;
    }

    const config = error.config;
    const status = error.response?.status;
    const isColdStartError =
      !error.response ||
      status === 502 ||
      status === 503 ||
      status === 504 ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('timeout') ||
      error.message?.includes('Network Error');

    // Auto-retry cold start errors up to 2 times
    if (isColdStartError && config && (!config.__retryCount || config.__retryCount < 2)) {
      config.__retryCount = (config.__retryCount || 0) + 1;
      toast.loading(`सर्व्हर कनेक्ट करत आहे... (प्रयत्न ${config.__retryCount}/2)`, {
        id: 'server-cold-start',
        duration: 8000,
      });

      // Wait 3.5 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 3500));
      return api(config);
    }

    toast.dismiss('server-cold-start');

    if (status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('messmate_token');
        localStorage.removeItem('messmate_user');
        window.location.href = '/login';
      }
    }

    const message = error.response?.data?.message || error.message || 'काहीतरी त्रुटी आली, कृपया पुन्हा प्रयत्न करा';
    return Promise.reject(new Error(message));
  }
);

export default api;
