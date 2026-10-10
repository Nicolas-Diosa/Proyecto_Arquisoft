import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function OrderSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  if (!order) {
    return (
      <div className="container">
        <h2>No hay orden activa.</h2>
        <button className="btn" onClick={() => navigate('/')}>Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <div className="card" style={{ textAlign: 'center', borderTop: '5px solid #14253f' }}>
        <h2 style={{ color: '#27ae60' }}>¡Orden Creada Exitosamente!</h2>
        <p>Presenta este número al momento de reclamar tu almuerzo.</p>

        <div style={{ background: '#f1f1f1', padding: '15px', borderRadius: '5px', margin: '20px 0' }}>
          <h3>Número de Orden: <span style={{ color: '#f67055' }}>{order.orderId}</span></h3>
          <h4>Total a Pagar: ${order.precio.toLocaleString()} COP</h4>
        </div>

        <div style={{ textAlign: 'left', marginTop: '20px' }}>
          <h4>Detalles del Plato:</h4>
          <ul>
            <li><strong>Proteína:</strong> {order.plato.proteina}</li>
            <li><strong>Carbohidratos:</strong> {order.plato.carb1}, {order.plato.carb2}</li>
            <li><strong>Ensalada:</strong> {order.plato.ensalada}</li>
            <li><strong>Bebida:</strong> {order.plato.bebida}</li>
          </ul>

          <h4>Detalles de Entrega:</h4>
          <p><strong>Lugar:</strong> {order.puntoRecogida}</p>
          <p><strong>Horario:</strong> {order.rangoHorario}</p>
        </div>

        <button className="btn" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
          Crear Nueva Orden
        </button>
      </div>
    </div>
  );
}