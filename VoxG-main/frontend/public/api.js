import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const api = {
  auth: {
    login: (email, password) => API.post('/auth/login', { email, password }),
    register: (email, password) => API.post('/auth/register', { email, password }),
  },
  keywords: {
    getAll: () => API.get('/keywords'),
    add: (word) => API.post('/keywords', { word }),
  },
  logs: {
    getAll: () => API.get('/logs'),
    report: (callerId, transcript) => API.post('/logs', { callerId, transcript }),
    purge: () => API.delete('/purge-logs'),
  },
};

export default api;