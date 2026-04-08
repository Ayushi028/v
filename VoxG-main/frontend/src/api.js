import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL; // ✅ dynamic
const API = axios.create({ baseURL: API_BASE });

// 🔥 AUTO ADD TOKEN
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  auth: {
    login: (username, password) => API.post('/auth/login', { username, password }),
  },
  keywords: {
    getAll: () => API.get('/keywords'),
    add: (word) => API.post('/keywords', { word }),
    delete: (id) => API.delete(`/keywords/${id}`),
  },
  logs: {
    getAll: () => API.get('/logs'),
    report: (data) => API.post('/logs/report', data),
  },
};

export default api;
