import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // MODO PRUEBA / SIMULACIÓN (Frontend independiente)
    try {
      // Para probar el frontend sin backend, forzamos un login simulado
      localStorage.setItem('bufft_token', 'mock_token_unal_12345');
      window.location.reload(); // Recarga para actualizar el estado del contexto
      
      // NOTA: Cuando tu backend AuthService esté corriendo, usa solo esta línea:
      // await login({ email, password });
    } catch (err) {
      alert('Error al iniciar sesión');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #444', borderRadius: '8px', background: '#222', color: '#fff' }}>
      <h2>Iniciar Sesión - BUFF/T</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px', textAlign: 'left' }}>
          <label>Correo UNAL:</label>
          <input 
            type="email" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #555' }}
          />
        </div>
        <div style={{ marginBottom: '15px', textAlign: 'left' }}>
          <label>Contraseña:</label>
          <input 
            type="password" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #555' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Ingresar
        </button>
      </form>
    </div>
  );
}