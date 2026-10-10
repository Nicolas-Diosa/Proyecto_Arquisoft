import axios from 'axios';

// URL del AuthService según la arquitectura del proyecto (puerto HTTP cliente)
const API_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adjuntar el JWT token en peticiones autenticadas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bufft_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const createOrder = async (orderData) => {
  // Petición que viajará del Portal al AuthService y luego al API Gateway
  const response = await api.post('/orders', orderData);
  return response.data;
};

export default api;