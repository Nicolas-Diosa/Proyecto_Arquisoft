import { useState } from 'react';
import { PlateBuilder } from '../components/PlateBuilder';
import { createOrder } from '../services/api';

export function Home() {
  const [activeOrder, setActiveOrder] = useState(null);

  // Opciones de menú publicadas por el restaurante para el día actual
  const menuOptions = {
    proteins: [
      { id: 'p1', name: 'Pechuga a la Plancha' },
      { id: 'p2', name: 'Carne Desmechada' },
      { id: 'p3', name: 'Tofu Salteado (Opción Veg)' },
    ],
    carbs: [
      { id: 'c1', name: 'Arroz Blanco' },
      { id: 'c2', name: 'Papa Criolla' },
      { id: 'c3', name: 'Plátano Madurado' },
    ],
  };

  const handleOrderSubmit = async (plateData) => {
    try {
      // Petición enviada hacia AuthService -> API Gateway -> Gestor de Pedidos / Inventario
      const orderResponse = await createOrder(plateData);
      setActiveOrder(orderResponse);
    } catch (error) {
      // Simulación de respuesta en caso de desarrollo local
      setActiveOrder({
        orderNumber: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        price: '$ 12.500 COP',
        details: plateData,
        status: 'Creada',
      });
    }
  };

  return (
    <div className="home-container">
      <h2>Opciones de Menú del Día</h2>

      {!activeOrder ? (
        <PlateBuilder menuOptions={menuOptions} onSubmitOrder={handleOrderSubmit} />
      ) : (
        <div className="order-summary-card">
          <h3>¡Orden Creada Exitosamente!</h3>
          <p><strong>Número de Orden:</strong> {activeOrder.orderNumber}</p>
          <p><strong>Precio a pagar:</strong> {activeOrder.price}</p>
          <hr />
          <h4>Detalle del Plato:</h4>
          <p>• <strong>Proteína:</strong> {activeOrder.details.protein}</p>
          <p>• <strong>Carbohidratos:</strong> {activeOrder.details.carbs.join(', ')}</p>
          <p>• <strong>Punto de recogida:</strong> {activeOrder.details.pickupLocation}</p>
          <p>• <strong>Rango horario:</strong> {activeOrder.details.pickupTimeRange}</p>
          <button onClick={() => setActiveOrder(null)}>Armar otro pedido</button>
        </div>
      )}
    </div>
  );
}