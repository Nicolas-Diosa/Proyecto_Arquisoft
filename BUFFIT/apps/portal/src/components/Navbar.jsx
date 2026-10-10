import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

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
            <span>Hola, {user.name || user.username}</span>
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