import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const router = useRouter();
  const { user, role, login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
      await login(email, password); // Solo hace login, no redirige aún
    } catch (err) {
      setError('Credenciales incorrectas o error al iniciar sesión.');
      console.error('Error de login:', err);
      setIsLoggingIn(false);
    }
  };

  // Redirige automáticamente cuando user y role están disponibles
  useEffect(() => {
    if (user && role) {
      if (role === 'ADMIN' || role === 'LINEA') {
        router.replace('/Request');
      } else if (role === 'EMBARQUE') {
        router.replace('/Dispatch');
      } else {
        setError('Rol no autorizado.');
      }

      setIsLoggingIn(false); // Oculta loader si estaba encendido
    }
  }, [user, role]);

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
        <div className="logo-wrapper">
          <Image src="/logo_app.svg" alt="Logo" width={70} height={70} />
        </div>
        </div>
        <span className="navbar-title">PalletGo</span>
        <h2>Iniciar Sesión</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo electrónico"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          <input
            type="password"
            placeholder="Contraseña"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button 
            type="submit" 
            className="login-button" 
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
