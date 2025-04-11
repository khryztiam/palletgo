import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link'; // Usamos Link de Next.js
import { useAuth } from '../context/AuthContext'; // Ajusta la ruta si es necesario
import Image from 'next/image'; // Utilizamos Next.js Image para optimización de imágenes
import { 
  FaHome, 
  FaClipboardList, 
  FaShippingFast, 
  FaUserCog, 
  FaSignOutAlt, 
  FaBars,
  FaTimes
} from 'react-icons/fa';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userName, logout, role } = useAuth();
  const router = useRouter();
  const roleLetter = role ? role.charAt(0) : '';
  const hideNavbarRoutes = ['/', '/login']; // rutas donde no queremos navbar

  if (hideNavbarRoutes.includes(router.pathname)) {
    return null;
  }

  // Función para manejar el cierre de sesión
  const handleLogout = async () => {
    await logout();  // Llama al método logout de Supabase
    router.push('/');  // Redirige al login, en Next.js usamos "window.location.href"
  }; 

  // Función para alternar el menú móvil
  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };


  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo + Nombre */}
        <div className="navbar-brand">
        <img src="/logo_app.svg" alt="PalletGo Logo" className="navbar-logo" />
          <span className="navbar-title">PalletGo</span>
        </div>

        {/* Menú Desktop/Mobile */}
        <div className={`navbar-menu ${isMenuOpen ? 'navbar-mobile' : ''}`}>
          {role === 'ADMIN' && (
            <>
              <Link href="/Request" onClick={() => setIsMenuOpen(false)}>
                <span className="navbar-link"><FaHome /> Solicitudes</span>
              </Link>
              <Link href="/Dispatch" onClick={() => setIsMenuOpen(false)}>
                <span className="navbar-link"><FaClipboardList /> Despacho</span>
              </Link>
              <Link href="/Boarding" onClick={() => setIsMenuOpen(false)}>
                <span className="navbar-link"><FaShippingFast /> Embarque</span>
              </Link>
            </>
          )}

          {role === 'EMBARQUE' && (
            <>
              <Link href="/Dispatch" onClick={() => setIsMenuOpen(false)}>
                <span className="navbar-link"><FaClipboardList /> Despacho</span>
              </Link>
              <Link href="/Boarding" onClick={() => setIsMenuOpen(false)}>
                <span className="navbar-link"><FaShippingFast /> Embarque</span>
              </Link>
            </>
          )}

          {role === 'LINEA' && (
            <>
              <Link href="/Request" onClick={() => setIsMenuOpen(false)}>
                <span className="navbar-link"><FaHome /> Solicitudes</span>
              </Link>
            </>
          )}
        </div>


        {/* Sección Usuario */}
        <div className="navbar-user">
          {user ? (
            <>
            <div className="navbar-user-badge">
              {roleLetter}
            </div>
              <span className="navbar-user-name">
                {userName || user.name}
              </span>
              <button onClick={handleLogout} className="navbar-logout">
                <FaSignOutAlt />
              </button>
            </>
          ) : (
            <Link href="/" className="navbar-link">
              Iniciar sesión
            </Link>
          )}
        </div>

        {/* Botón Hamburguesa */}
        <button 
          className="navbar-hamburger"
          onClick={toggleMobileMenu}
          aria-label="Menú"
        >
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>
    </nav>
  );
};