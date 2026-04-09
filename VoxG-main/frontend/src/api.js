// ✅ REPLACE YOUR ENTIRE api.js with this:
import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://v-backend-9ncg.onrender.com/api', // ✅ YOUR BACKEND
  timeout: 10000,
});

// Logs API
api.logs = {
  getAll: () => api.get('/logs'),
  report: (data) => api.post('/logs/report', data)
};

export default api;
