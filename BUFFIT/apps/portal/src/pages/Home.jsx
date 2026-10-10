import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Datos de prueba simulando el menú publicado por el contratista
const menuData = {
  proteinas: ['Pollo a la Plancha', 'Carne Asada', 'Tofu Salteado (Vegetariano)'],
  carbohidratos: ['Arroz Blanco', 'Arroz con Coco', 'Papa Salada', 'Plátano Madurado'],
  ensaladas: ['Ensalada Mixta', 'Ensalada César', 'Sin Ensalada'],
  bebidas: ['Jugo de Lulo', 'Jugo de Maracuyá', 'Agua'],
  puntosRecogida: ['Comedor Central', 'Comedor Hemeroteca', 'Comedor Agronomía'],
  rangosHorarios: ['11:30 AM - 12:00 PM', '12:00 PM - 12:30 PM', '12:30 PM - 01:00 PM', '01:00 PM - 01:30 PM']
};

export default function Home() {
  const [proteina, setProteina] = useState('');
  const [carb1, setCarb1] = useState('');
  const [carb2, setCarb2] = useState('');
  const [ensalada, setEnsalada] = useState('');
  const [bebida, setBebida] = useState('');
  const [punto, setPunto] = useState(menuData.puntosRecogida[0]);
  const [horario, setHorario] = useState(menuData.rangosHorarios[0]);

  const navigate = useNavigate();

  const handleCrearOrden = (e) => {
    e.preventDefault();

    if (!proteina || !carb1 || !carb2 || !ensalada || !bebida) {
      alert('Por favor selecciona todos los componentes de tu plato.');
      return;
    }

    // Datos de la orden a transferir
    const newOrder = {
      orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      plato: { proteina, carb1, carb2, ensalada, bebida },
      puntoRecogida: punto,
      rangoHorario: horario,
      precio: 8500, // Precio estudiante fijo/dinámico
      fecha: new Date().toLocaleDateString()
    };

    navigate('/resumen', { state: { order: newOrder } });
  };

  return (
    <div className="container">
      <h2>Arma tu Almuerzo BUFF/T</h2>
      <p>Selecciona las opciones ofertadas para el menú de hoy.</p>

      <form onSubmit={handleCrearOrden}>
        <div className="card">
          <h3>1. Selección de Plato</h3>
          <div className="grid">
            <div className="form-group">
              <label>Proteína (1 porción)</label>
              <select value={proteina} onChange={(e) => setProteina(e.target.value)} required>
                <option value="">-- Seleccionar --</option>
                {menuData.proteinas.map((p, i) => <option key={i} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Carbohidrato 1</label>
              <select value={carb1} onChange={(e) => setCarb1(e.target.value)} required>
                <option value="">-- Seleccionar --</option>
                {menuData.carbohidratos.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Carbohidrato 2</label>
              <select value={carb2} onChange={(e) => setCarb2(e.target.value)} required>
                <option value="">-- Seleccionar --</option>
                {menuData.carbohidratos.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Ensalada</label>
              <select value={ensalada} onChange={(e) => setEnsalada(e.target.value)} required>
                <option value="">-- Seleccionar --</option>
                {menuData.ensaladas.map((e, i) => <option key={i} value={e}>{e}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Bebida</label>
              <select value={bebida} onChange={(e) => setBebida(e.target.value)} required>
                <option value="">-- Seleccionar --</option>
                {menuData.bebidas.map((b, i) => <option key={i} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>2. Logística de Entrega</h3>
          <div className="grid">
            <div className="form-group">
              <label>Punto de Recogida</label>
              <select value={punto} onChange={(e) => setPunto(e.target.value)}>
                {menuData.puntosRecogida.map((pr, i) => <option key={i} value={pr}>{pr}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Rango de Hora</label>
              <select value={horario} onChange={(e) => setHorario(e.target.value)}>
                {menuData.rangosHorarios.map((rh, i) => <option key={i} value={rh}>{rh}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button type="submit" className="btn" style={{ fontSize: '1.2rem', width: '100%' }}>
          Confirmar y Crear Orden
        </button>
      </form>
    </div>
  );
}