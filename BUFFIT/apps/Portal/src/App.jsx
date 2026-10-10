import { AuthProvider, useAuth } from './context/AuthContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import './App.css';

function MainContent() {
  const { token } = useAuth();
  // Si hay un token válido se muestra la vista principal; de lo contrario, el Login
  return token ? <Home /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <header className="navbar">
          <h1>BUFF/T - UNAL Bogotá</h1>
        </header>
        <main className="content">
          <MainContent />
        </main>
      </div>
    </AuthProvider>
  );
}