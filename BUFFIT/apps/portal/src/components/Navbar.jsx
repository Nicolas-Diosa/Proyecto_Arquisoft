import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getRole } from '../utils/user';

const linkStyle = { marginRight: '15px', color: '#fff', textDecoration: 'none' };

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isComedor = getRole(user) === 'Comedor';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <h2>BUFF/T - UNAL</h2>
      <div>
        {user ? (
          <>
            {isComedor ? (
              <>
                <Link to="/comedor" style={linkStyle}>Entregas</Link>
                <Link to="/comedor/inventario" style={linkStyle}>Inventario</Link>
              </>
            ) : (
              <>
                <Link to="/" style={linkStyle}>Menú</Link>
                <Link to="/mis-pedidos" style={linkStyle}>Mis Pedidos</Link>
              </>
            )}

            <span>Hola, {user.user?.name || user?.name || user?.email}</span>

            <button className="btn" style={{ marginLeft: '15px' }} onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </>
        ) : (
          <Link to="/login">Iniciar Sesión</Link>
        )}
      </div>
    </nav>
  );
}
