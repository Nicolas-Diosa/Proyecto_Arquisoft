import React, { useEffect, useState } from 'react';
import api from '../services/api';

export const MyOrdersList = () => {
  const [myOrders, setMyOrders] = useState([]);

  const loadMyOrders = async () => {
    try {
      const res = await api.get('/orders');
      setMyOrders(res.data);
    } catch (err) {
      console.error('Error al obtener órdenes del usuario:', err);
    }
  };

  useEffect(() => {
    loadMyOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    try {
      await api.delete(`/orders/${orderId}`);
      alert('Pedido cancelado exitosamente.');
      loadMyOrders();
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo cancelar el pedido.';
      alert(msg);
    }
  };

  return (
    <div>
      <h3>Mis Pedidos Realizados</h3>
      {myOrders.map((order) => (
        <div key={order.id} className="order-card">
          <p><strong>Orden #{order.id}</strong> - Estado: {order.status}</p>
          <p>Comedor: {order.dining_hall} | Hora: {order.pickup_time_slot}</p>
          <p>Total a pagar: ${order.total_price} COP</p>
          {order.status === 'CONFIRMED' && (
            <button onClick={() => handleCancelOrder(order.id)}>
              Cancelar Pedido
            </button>
          )}
        </div>
      ))}
    </div>
  );
};