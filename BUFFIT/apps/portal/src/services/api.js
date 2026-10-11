import axios from 'axios';

// Único punto de contacto según el Diagrama C&C: Portal -> AuthService
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: AUTH_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para peticiones HTTP protegidas enviadas a través del AuthService
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;