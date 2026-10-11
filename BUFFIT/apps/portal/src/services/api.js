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

// Petición pública de registro
export const registerUser = async (userData) => {
  const response = await api.post('/register', userData);
  return response.data;
};

// Petición pública de login
export const loginUser = async (credentials) => {
  const response = await api.post('/login', credentials);
  return response.data;
};

export default api;