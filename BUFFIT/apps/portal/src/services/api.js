import axios from 'axios';

const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = async (userData) => {
  const response = await api.post('/users/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/users/login', credentials);
  return response.data;
};

// Petición para obtener las opciones del menú disponibles del día (desde el Inventario)
export const getMenuOpciones = async () => {
  const response = await api.get('/inventario/opciones');
  return response.data;
};

// Petición para crear una nueva orden en el Gestor de Pedidos
export const createOrder = async (orderData) => {
  const response = await api.post('/pedidos/crearOrden', orderData);
  return response.data;
};

// Obtener historial de pedidos del usuario autenticado
export const getUserOrders = async (userId) => {
  const response = await api.get(`/pedidos/user/${userId}`);
  return response.data;
};

export const cancelOrder = async (orderId) => {
  const response = await api.put(`/pedidos/${orderId}/cancel`);
  return response.data;
};

// ---------------------------------------------------------------- Rol Comedor
// Pedidos del comedor para hoy (o `fecha`), ordenados por franja de recogida
export const getDiningHallOrders = async (diningHall, { status, fecha } = {}) => {
  const response = await api.get('/pedidos/comedor', {
    params: { dining_hall: diningHall, status, fecha },
  });
  return response.data;
};

export const deliverOrder = async (orderId, diningHall) => {
  const response = await api.put(`/pedidos/${orderId}/deliver`, { dining_hall: diningHall });
  return response.data;
};

export const getInventoryItems = async (diningHall) => {
  const response = await api.get('/inventario/items', { params: { comedor: diningHall } });
  return response.data;
};

export const createInventoryItem = async (item) => {
  const response = await api.post('/inventario/items', item);
  return response.data;
};

export const updateInventoryItem = async (itemId, changes) => {
  const response = await api.put(`/inventario/items/${itemId}`, changes);
  return response.data;
};

export const createLeftoverReport = async (diningHall) => {
  const response = await api.post('/inventario/reportes/sobrantes', { dining_hall: diningHall });
  return response.data;
};

export const getLeftoverReports = async (diningHall) => {
  const response = await api.get('/inventario/reportes/sobrantes', { params: { comedor: diningHall } });
  return response.data;
};
export default api;