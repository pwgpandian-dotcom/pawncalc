import axios from 'axios';

// On Vercel (*.vercel.app) use the /api proxy — avoids CORS entirely.
// On localhost use the env var (points to local backend on port 5000).
const baseURL = window.location.hostname.endsWith('.vercel.app')
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

const api = axios.create({ baseURL });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('pc-token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pc-token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
