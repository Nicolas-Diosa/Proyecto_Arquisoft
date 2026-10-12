import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createOrder } from '../services/api';

export default function OrderSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const draftOrder = location.state?.draftOrder;

  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Si se accede directo sin seleccionar plato en Home
  if (!draftOrder && !completedOrder) {
    return (
      <div className="container" style={{ marginTop: '50px', textAlign: 'center' }}>
        <h3>No hay ninguna orden pendiente.</h3>
        <button className="btn" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
          Volver al Inicio
        </button>
      </div>
    );
  }

  const handleConfirmarPedido = async () => {
    try {
      setSubmitting(true);
      setErrorMsg('');

      // Petición POST real al Gestor de Pedidos mediante api.js
      const createdOrder = await createOrder(draftOrder);
      
      setCompletedOrder(createdOrder);

    } catch (err) {
      console.error("Error al procesar la orden:", err);
      setErrorMsg(err.response?.data?.error || 'No se pudo registrar el pedido en el sistema.');
    } finally {
      setSubmitting(false);
    }
  };

  // Pantalla de Confirmación / Ticket Exitoso
  if (completedOrder) {
    return (
      <div className="container" style={{ marginTop: '40px' }}>
        <div className="card" style={{ textAlign: 'center', borderColor: '#4CAF50' }}>
          <h2 style={{ color: '#4CAF50' }}>¡Pedido Confirmado Exitosamente! 🎉</h2>
          <p>Tu orden ha sido registrada en el Gestor de Pedidos.</p>
          
          <hr style={{ margin: '20px 0' }} />

          <h3>Código de Ticket: <strong>{completedOrder.orderId || completedOrder.id || 'ORD-OK'}</strong></h3>
          <p><strong>Punto de Recogida:</strong> {completedOrder.puntoRecogida}</p>
          <p><strong>Horario:</strong> {completedOrder.rangoHorario}</p>
          <p><strong>Total Pagado:</strong> ${completedOrder.precio?.toLocaleString('es-CO')}</p>

          <button className="btn" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
            Volver al Menú Principal
          </button>
        </div>
      </div>
    );
  }

  // Pantalla de Resumen previo al envío HTTP
  return (
    <div className="container" style={{ marginTop: '40px' }}>
      <h2>Resumen de tu Orden</h2>
      <p>Revisa la composición de tu almuerzo antes de confirmar.</p>

      {errorMsg && <p style={{ color: 'red', fontWeight: 'bold' }}>{errorMsg}</p>}

      <div className="card">
        <h3>Detalle del Menú</h3>
        <ul>
          <li><strong>Proteína:</strong> {draftOrder.plato.proteina}</li>
          <li><strong>Carbohidrato 1:</strong> {draftOrder.plato.carb1}</li>
          <li><strong>Carbohidrato 2:</strong> {draftOrder.plato.carb2}</li>
          <li><strong>Ensalada:</strong> {draftOrder.plato.ensalada}</li>
          <li><strong>Bebida:</strong> {draftOrder.plato.bebida}</li>
          <li><strong>Sopa:</strong> {draftOrder.plato.sopa}</li>
          <li><strong>Postre:</strong> {draftOrder.plato.postre}</li>
        </ul>
      </div>

      <div className="card">
        <h3>Logística y Pago</h3>
        <p><strong>Punto de Recogida:</strong> {draftOrder.puntoRecogida}</p>
        <p><strong>Horario Seleccionado:</strong> {draftOrder.rangoHorario}</p>
        <p><strong>Tipo de Usuario:</strong> {draftOrder.userType}</p>
        <h3 style={{ marginTop: '10px', color: '#14253f' }}>
          Total a Pagar: ${draftOrder.precio.toLocaleString('es-CO')} COP
        </h3>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        <button 
          type="button" 
          onClick={() => navigate('/')} 
          style={{ padding: '12px 20px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          disabled={submitting}
        >
          Modificar Selección
        </button>

        <button 
          type="button" 
          className="btn" 
          onClick={handleConfirmarPedido}
          style={{ flex: 1, fontSize: '1.1rem' }}
          disabled={submitting}
        >
          {submitting ? 'Procesando Pedido...' : 'Pagar y Confirmar Pedido'}
        </button>
      </div>
    </div>
  );
}