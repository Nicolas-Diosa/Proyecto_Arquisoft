import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getMenuOpciones } from '../services/api';

export default function Home() {
  // 1. Información del usuario autenticado desde AuthContext
  const { user } = useContext(AuthContext);

  // 2. Estados para almacenar las opciones dinámicas del inventario
  const [menuData, setMenuData] = useState({
    proteinas: [],
    carbohidratos: [],
    ensaladas: [],
    bebidas: [],
    sopas: [],
    postres: [],
    puntosRecogida: ['Comedor Central', 'Comedor Hemeroteca', 'Comedor Agronomía'],
    rangosHorarios: ['11:30 AM - 11:45 AM ', '11:45 AM - 12:00 PM', '12:00 PM - 12:15 PM', '12:15 PM - 12:30 PM', '12:45 PM - 01:00 PM', '1:15 PM - 1:30 PM' ]
  });

  const [loading, setLoading] = useState(true);
  const [errorMenu, setErrorMenu] = useState('');

  // 3. Estados de la selección del usuario
  const [proteina, setProteina] = useState('');
  const [carb1, setCarb1] = useState('');
  const [carb2, setCarb2] = useState('');
  const [ensalada, setEnsalada] = useState('');
  const [bebida, setBebida] = useState('');
  
  // Opciones de Sopa y Postre (Por defecto "Sin sopa" / "Sin postre")
  const [quiereSopa, setQuiereSopa] = useState(false);
  const [sopa, setSopa] = useState('Sin sopa');
  
  const [quierePostre, setQuierePostre] = useState(false);
  const [postre, setPostre] = useState('Sin postre');

  // Logística
  const [punto, setPunto] = useState('');
  const [horario, setHorario] = useState('');

  const navigate = useNavigate();

  // 4. Carga de opciones desde el servicio de inventario
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const data = await getMenuOpciones();
        
        setMenuData({
          proteinas: data.proteinas || [],
          carbohidratos: data.carbohidratos || [],
          ensaladas: data.ensaladas || [],
          bebidas: data.bebidas || [],
          sopas: data.sopas || ['Sopa del Día (Verduras)', 'Crema de Pollo'],
          postres: data.postres || ['Flan de Leche', 'Fruta de Temporada'],
          puntosRecogida: data.puntosRecogida || ['Comedor Central', 'Comedor Hemeroteca', 'Comedor Agronomía'],
          rangosHorarios: data.rangosHorarios || ['11:30 AM - 11:45 AM ', '11:45 AM - 12:00 PM', '12:00 PM - 12:15 PM', '12:15 PM - 12:30 PM', '12:45 PM - 01:00 PM', '1:15 PM - 1:30 PM' ]
        });

        // Configuración por defecto de logística
        if (data.puntosRecogida?.length > 0) setPunto(data.puntosRecogida[0]);
        else setPunto('Comedor Central');

        if (data.rangosHorarios?.length > 0) setHorario(data.rangosHorarios[0]);
        else setHorario('11:30 AM - 12:00 PM');

      } catch (err) {
        console.error("Error al cargar el menú desde el inventario:", err);
        setErrorMenu('No se pudieron obtener las opciones de menú del día.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // 5. Creación de la Orden
  const handleCrearOrden = (e) => {
    e.preventDefault();

    if (!proteina || !carb1 || !carb2 || !ensalada || !bebida) {
      alert('Por favor selecciona los componentes principales de tu plato.');
      return;
    }

    if (quiereSopa && (!sopa || sopa === 'Sin sopa')) {
      alert('Por favor selecciona la sopa de tu preferencia.');
      return;
    }

    if (quierePostre && (!postre || postre === 'Sin postre')) {
      alert('Por favor selecciona el postre de tu preferencia.');
      return;
    }

    const precioPlato = user?.user_type === 'APOYO_ALIMENTARIO' ? 0 : 8500;

    const newOrder = {
      orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      userId: user?.id || user?.email,
      userType: user?.user_type || 'ESTUDIANTE',
      plato: {
        proteina,
        carb1,
        carb2,
        ensalada,
        bebida,
        sopa: quiereSopa ? sopa : 'Sin sopa',
        postre: quierePostre ? postre : 'Sin postre'
      },
      puntoRecogida: punto,
      rangoHorario: horario,
      precio: precioPlato,
      fecha: new Date().toLocaleDateString()
    };

    navigate('/resumen', { state: { order: newOrder } });
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h3>Cargando menú del día desde el inventario...</h3>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Arma tu Almuerzo BUFF/T</h2>
      <p>Bienvenido, <strong>{user.user?.name || user?.email}</strong>. Selecciona las opciones ofertadas para hoy.</p>

      {errorMenu && <p style={{ color: 'red', fontWeight: 'bold' }}>{errorMenu}</p>}

      <form onSubmit={handleCrearOrden}>
        <div className="card">
          <h3>1. Selección de Plato Principal</h3>
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

        {/* 2. Opciones adicionales (Sopa y Postre) */}
        <div className="card">
          <h3>2. Entradas y Acompañamientos Opcionales</h3>
          <div className="grid">
            
            {/* Sección Sopa */}
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={quiereSopa}
                  onChange={(e) => {
                    setQuiereSopa(e.target.checked);
                    if (!e.target.checked) setSopa('Sin sopa');
                  }}
                  style={{ marginRight: '8px' }}
                />
                Deseo incluir Sopa
              </label>

              {quiereSopa && (
                <select value={sopa} onChange={(e) => setSopa(e.target.value)} required>
                  <option value="">-- Seleccionar Sopa --</option>
                  {menuData.sopas.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
              )}
            </div>

            {/* Sección Postre */}
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={quierePostre}
                  onChange={(e) => {
                    setQuierePostre(e.target.checked);
                    if (!e.target.checked) setPostre('Sin postre');
                  }}
                  style={{ marginRight: '8px' }}
                />
                Deseo incluir Postre
              </label>

              {quierePostre && (
                <select value={postre} onChange={(e) => setPostre(e.target.value)} required>
                  <option value="">-- Seleccionar Postre --</option>
                  {menuData.postres.map((p, i) => <option key={i} value={p}>{p}</option>)}
                </select>
              )}
            </div>

          </div>
        </div>

        {/* 3. Logística de Entrega */}
        <div className="card">
          <h3>3. Logística de Entrega</h3>
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