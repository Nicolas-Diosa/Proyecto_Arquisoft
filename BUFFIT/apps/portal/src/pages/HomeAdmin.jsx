import React, { useEffect, useState } from 'react';
import { getAllUsers } from '../services/api'; 

export default function AdminHome() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para el buscador
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCriteria, setSearchCriteria] = useState('email');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Error al obtener la lista de usuarios');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    
    const valueToSearch = String(user[searchCriteria] || '').toLowerCase();
    return valueToSearch.includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '40px auto' }}>
      <h1>Panel de Administrador</h1>
      <p>Bienvenido. Aquí puedes gestionar todos los usuarios del sistema.</p>

      <div style={{
        display: 'flex', gap: '10px', marginBottom: '20px', 
        padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px'
      }}>
        <select 
          value={searchCriteria} 
          onChange={(e) => setSearchCriteria(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="email">Buscar por Email</option>
          <option value="name">Buscar por Nombre</option>
          <option value="id">Buscar por ID</option>
        </select>

        <input 
          type="text" 
          placeholder={`Buscar...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      {loading && <p>Cargando usuarios...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      
      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <details 
                key={user.id} 
                style={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #ddd', 
                  borderRadius: '6px', 
                  padding: '10px' 
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#14253f' }}>
                  {user.name} ({user.email})
                </summary>
                
                <div style={{ marginTop: '10px', paddingLeft: '15px', borderLeft: '3px solid #f16e58' }}>
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Rol:</strong> {user.role}</p>
                  <p><strong>Tipo de Usuario:</strong> {user.user_type}</p>
                  <p><strong>Estado:</strong> {user.is_active ? '✅ Activo' : '❌ Inactivo'}</p>
                  <p><strong>Fecha de creación:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </details>
            ))
          ) : (
            <p style={{ color: '#666' }}>No se encontraron usuarios con esos criterios.</p>
          )}
        </div>
      )}
    </div>
  );
}