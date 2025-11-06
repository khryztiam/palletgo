import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link"; // Usamos Link de Next.js
import { useAuth } from "../context/AuthContext"; // Ajusta la ruta si es necesario
import Image from "next/image"; // Utilizamos Next.js Image para optimización de imágenes
import {
  FaHome,
  FaClipboardList,
  FaShippingFast,
  FaUserCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaChevronDown,
} from "react-icons/fa";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userName, logout, role } = useAuth();
  const router = useRouter();
  const roleLetter = role ? role.charAt(0) : "";
  const hideNavbarRoutes = ["/", "/login"]; // rutas donde no queremos navbar
  const [isAppDropdownOpen, setIsAppDropdownOpen] = useState(false);

  const toggleAppDropdown = (e) => {
    // Evita que el evento se propague al documento (para el detector de clic fuera)
    e.stopPropagation();
    setIsAppDropdownOpen(!isAppDropdownOpen);
  };

  // Función que se ejecuta al hacer clic en cualquier enlace
  const handleNavLinkClick = () => {
    setIsMenuOpen(false); // Cierra menú móvil
    setIsAppDropdownOpen(false); // Cierra dropdown de App
  };

  // Hook para cerrar el dropdown si se hace clic fuera de él (Desktop)
  useEffect(() => {
    const handleOutsideClick = (event) => {
      // Si el dropdown está abierto Y el clic no fue dentro del dropdown
      if (
        isAppDropdownOpen &&
        event.target.closest(".navbar-dropdown") === null
      ) {
        setIsAppDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isAppDropdownOpen]);

  if (hideNavbarRoutes.includes(router.pathname)) {
    return null;
  }

  // Función para manejar el cierre de sesión
  const handleLogout = async () => {
    await logout(); // Llama al método logout de Supabase
    router.push("/"); // Redirige al login, en Next.js usamos "window.location.href"
  };

  // Función para alternar el menú móvil
  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      {/* Logo + Nombre */}
      <div className="navbar-brand">
        <Image
          src="/logo_app.svg"
          alt="PalletGo Logo"
          width={40}
          height={40}
          className="navbar-logo"
          priority
        />
        <span className="navbar-title">PalletGo</span>
      </div>

      {/* Menú Desktop/Mobile */}
      <div className={`navbar-menu ${isMenuOpen ? "navbar-mobile" : ""}`}>
        {role === "ADMIN" && (
          <>
            <Link
              href="/admin/Dashboard"
              onClick={handleNavLinkClick}
              className={`navbar-link ${
                router.pathname === "/admin/Dashboard" ? "active" : ""
              }`}
            >
              <FaHome /> Dashboard
            </Link>
            <Link
              href="/admin/Control"
              onClick={handleNavLinkClick}
              className={`navbar-link ${
                router.pathname === "/admin/Control" ? "active" : ""
              }`}
            >
              <FaClipboardList /> Request Control
            </Link>
            <Link
              href="/admin/Management"
              onClick={handleNavLinkClick}
              className={`navbar-link ${
                router.pathname === "/admin/Management" ? "active" : ""
              }`}
            >
              <FaUserCog /> Administration
            </Link>

            {/* Menú desplegable "App" (ADMIN) */}
            <div
              className={`navbar-dropdown ${isAppDropdownOpen ? "open" : ""}`}
            >
              {/* Usamos un botón para mejor accesibilidad y semántica */}
              <button
                className={`navbar-link dropdown-toggle ${
                  router.pathname.startsWith("/admin") ? "active-dropdown" : ""
                }`}
                onClick={toggleAppDropdown}
              >
                App{" "}
                <FaChevronDown
                  className={`dropdown-arrow ${
                    isAppDropdownOpen ? "rotate" : ""
                  }`}
                />
              </button>

              {isAppDropdownOpen && (
                <div className="dropdown-content">
                  <Link
                    href="/Request"
                    onClick={handleNavLinkClick}
                    className={`navbar-link ${
                      router.pathname === "/Request" ? "active" : ""
                    }`}
                  >
                    <FaHome /> Solicitudes
                  </Link>
                  <Link
                    href="/Dispatch"
                    onClick={handleNavLinkClick}
                    className={`navbar-link ${
                      router.pathname === "/Dispatch" ? "active" : ""
                    }`}
                  >
                    <FaClipboardList /> Despacho
                  </Link>
                  <Link
                    href="/Boarding"
                    onClick={handleNavLinkClick}
                    className={`navbar-link ${
                      router.pathname === "/Boarding" ? "active" : ""
                    }`}
                  >
                    <FaShippingFast /> Embarque
                  </Link>
                </div>
              )}
            </div>
          </>
        )}

        {/* Links para EMBARQUE y LINEA (simplificados y con clase activa) */}
        {role === "EMBARQUE" && (
          <>
            <Link
              href="/Dispatch"
              onClick={handleNavLinkClick}
              className={`navbar-link ${
                router.pathname === "/Dispatch" ? "active" : ""
              }`}
            >
              <FaClipboardList /> Despacho
            </Link>
            <Link
              href="/Boarding"
              onClick={handleNavLinkClick}
              className={`navbar-link ${
                router.pathname === "/Boarding" ? "active" : ""
              }`}
            >
              <FaShippingFast /> Embarque
            </Link>
          </>
        )}

        {role === "LINEA" && (
          <Link
            href="/Request"
            onClick={handleNavLinkClick}
            className={`navbar-link ${
              router.pathname === "/Request" ? "active" : ""
            }`}
          >
            <FaHome /> Solicitudes
          </Link>
        )}
      </div>

      {/* Sección Usuario */}
      <div className="navbar-user">
        {user && (
          <>
            <div className="navbar-user-badge" title={role}>
              {roleLetter}
            </div>
            <span className="navbar-user-name">{userName || user.email}</span>
            <button
              onClick={handleLogout}
              className="navbar-logout"
              title="Cerrar sesión"
            >
              <FaSignOutAlt />
            </button>
          </>
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
    </nav>
  );
};
