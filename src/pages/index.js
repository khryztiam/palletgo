import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Modal from 'react-modal';
import { FaUserTie, FaUser } from 'react-icons/fa';

Modal.setAppElement('#__next'); // necesario para accesibilidad con Next.js

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState('USER');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const { user, role, login, logout } = useAuth();
  const [fadeIn, setFadeIn] = useState(true);

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

// Efecto para reiniciar animación en cada cambio de tab
useEffect(() => {
  setFadeIn(false); // reinicia
  const timeout = setTimeout(() => setFadeIn(true), 50); // espera breve para reactivar clase

  return () => clearTimeout(timeout);
}, [activeTab]);

  // Redirige automáticamente cuando user y role están disponibles
    useEffect(() => {
      if (user && role) {
        const isAdminTab = activeTab === 'admin';
      
        if ((isAdminTab && role !== 'ADMIN') || (!isAdminTab && role === 'ADMIN')) {
          setIsModalOpen(true);
          setIsLoggingIn(false);
          return;
        }
      
        if (role === 'ADMIN') {
          router.replace('/admin/Dashboard');
        } else if (role === 'LINEA') {
          router.replace('/Request');
        } else if (role === 'EMBARQUE') {
          router.replace('/Dispatch');
        } else {
          setError('Rol no autorizado.');
        }
      
        setIsLoggingIn(false);
      }
    }, [user, role, activeTab]); // 👈 ojo: agregamos activeTab en las dependencias

  const boxClass = `login-box ${activeTab === 'admin' ? 'admin-mode' : 'employee-mode'}`;

  return (
    <div className="login-container">
      <div className={boxClass}>
        <div className="login-logo">
          <div className="logo-wrapper">
            <Image src="/logo_app.svg" alt="Logo" width={70} height={70} />
          </div>
        </div>
        <span className="navbar-title">PalletGo</span>
        <h2>{activeTab === 'admin' ? 'Administrador' : 'Iniciar Sesión'}</h2>

        <div className="login-tabs">
          <button
            onClick={() => setActiveTab('employee')}
            className={activeTab === 'employee' ? 'active' : ''}
          >
            <FaUser style={{ marginRight: '6px' }} />
            Usuario
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={activeTab === 'admin' ? 'active' : ''}
          >
            <FaUserTie style={{ marginRight: '6px' }} />
            Administrador
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {(activeTab === 'employee' || activeTab === 'admin') && (
          <div className={`tab-content ${fadeIn ? 'show' : ''}`}>
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
        )}
      </div>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="custom-modal"
        overlayClassName="custom-overlay"
      >
        <h2>Acceso denegado</h2>
        <p>Esta sección es exclusiva para administradores.</p>
        <button className='cancel-btn' onClick={async () => {
          await logout();
          setIsModalOpen(false);
          router.replace('/');
        }}>Cerrar</button>
      </Modal>
    </div>
  );
}