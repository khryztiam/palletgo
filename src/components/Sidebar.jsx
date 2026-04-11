// src/components/Sidebar.jsx
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
  FaHome, FaClipboardList, FaShippingFast, FaUserCog,
  FaSignOutAlt, FaTimes, FaChartBar, FaTruck, FaLayerGroup, FaUsers,
} from 'react-icons/fa';
import styles from '@/styles/Sidebar.module.css';

// ─── Colores y datos por rol ──────────────────────────────────────────────────
const ROLE_COLOR = {
  SUPERADMIN: '#0f172a',
  ADMIN:      '#3b82f6',
  EMBARQUE:   '#991caf',
  LINEA:      '#22c55e',
  SUPERVISOR: '#f59e0b',
};

// Mapeo de nombre de icono → componente (evita pasar JSX en constantes)
const ICONS = {
  dashboard:    <FaChartBar />,
  clipboard:    <FaClipboardList />,
  users:        <FaUserCog />,
  globalusers:  <FaUsers />,
  request:      <FaHome />,
  dispatch:     <FaTruck />,
  boarding:     <FaLayerGroup />,
  shipping:     <FaShippingFast />,
};

// ─── Navegación por rol ───────────────────────────────────────────────────────
// Agrega rutas/secciones aquí sin tocar el JSX.
const NAV_BY_ROLE = {
  SUPERADMIN: [
    {
      label: 'Administración',
      links: [
        { href: '/admin/Dashboard',   icon: 'dashboard',   label: 'Dashboard'       },
        { href: '/admin/Control',     icon: 'clipboard',   label: 'Request Control' },
        { href: '/admin/GlobalUsers', icon: 'globalusers', label: 'Global Users'    },
      ],
    },
    {
      label: 'Operaciones',
      links: [
        { href: '/Request',  icon: 'request',  label: 'Solicitudes' },
        { href: '/Dispatch', icon: 'dispatch', label: 'Despacho'    },
        { href: '/Boarding', icon: 'boarding', label: 'Embarque'    },
      ],
    },
  ],
  ADMIN: [
    {
      label: 'Administración',
      links: [
        { href: '/admin/Dashboard',  icon: 'dashboard', label: 'Dashboard'       },
        { href: '/admin/Control',    icon: 'clipboard', label: 'Request Control' },
        { href: '/admin/Management', icon: 'users',     label: 'Administration'  },
      ],
    },
  ],
  SUPERVISOR: [
    {
      label: 'Supervisión',
      links: [
        { href: '/admin/Dashboard', icon: 'dashboard', label: 'Dashboard'      },
        { href: '/admin/Control',   icon: 'clipboard', label: 'Request Control'},
      ],
    },
  ],
  EMBARQUE: [
    {
      label: 'Mi área',
      links: [
        { href: '/Dispatch', icon: 'dispatch', label: 'Despacho' },
        { href: '/Boarding', icon: 'boarding', label: 'Embarque' },
      ],
    },
  ],
  LINEA: [
    {
      label: 'Mi área',
      links: [
        { href: '/Request', icon: 'request', label: 'Solicitudes' },
      ],
    },
  ],
};

// ─── Rutas donde el Sidebar no se renderiza ───────────────────────────────────
const HIDDEN_ROUTES = ['/', '/login'];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar({ isOpen, onClose }) {
  const { user, userName, logout, role } = useAuth();
  const router = useRouter();

  // No renderizar en login ni en la raíz
  if (HIDDEN_ROUTES.includes(router.pathname)) return null;

  const sections  = NAV_BY_ROLE[role] || [];
  const roleColor = ROLE_COLOR[role]  || '#3b82f6';

  const handleLogout = async () => {
    onClose();
    await logout();
    router.push('/');
  };

  const handleLinkClick = () => {
    // En móvil cierra el drawer al navegar
    onClose();
  };

  return (
    <>
      {/* Overlay — solo visible en móvil cuando el drawer está abierto */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
        aria-label="Navegación principal"
      >
        {/* ── Brand ───────────────────────────────────────────────────── */}
        <div className={styles.brand}>
          <div className={styles.brandInner}>
            <div className={styles.logoMark}>
              <Image
                src="/logo_app.svg"
                alt="PalletGo"
                width={22}
                height={22}
                priority
              />
            </div>
            <span className={styles.brandTitle}>PalletGo</span>
          </div>

          {/* Botón cerrar — solo visible en móvil vía CSS */}
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* ── Navegación ──────────────────────────────────────────────── */}
        <nav className={styles.nav}>
          {sections.map((section, idx) => (
            <div key={idx} className={styles.section}>
              <p className={styles.sectionLabel}>{section.label}</p>

              {section.links.map(({ href, icon, label }) => {
                const isActive = router.pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={handleLinkClick}
                    className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                    // CSS custom property para el color de la barra activa por rol
                    style={{ '--role-color': roleColor }}
                  >
                    <span className={styles.navIcon}>
                      {ICONS[icon]}
                    </span>
                    {label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className={styles.footer}>

          {/* Badge de rol */}
          <div
            className={styles.roleBadge}
            style={{
              background: `${roleColor}22`,
              borderColor: `${roleColor}44`,
            }}
          >
            <span className={styles.roleDot} style={{ background: roleColor }} />
            <span className={styles.roleLabel} style={{ color: roleColor }}>
              {role}
            </span>
          </div>

          {/* Fila usuario + logout */}
          <div className={styles.userRow}>
            <div className={styles.userInfo}>
              <div
                className={styles.avatar}
                style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}88)` }}
              >
                {(userName || user?.email || '?')[0].toUpperCase()}
              </div>
              <div className={styles.userDetails}>
                <p className={styles.userName}>{userName || user?.email}</p>
                <p className={styles.userEmail}>{user?.email}</p>
              </div>
            </div>

            <button
              className={styles.logoutBtn}
              onClick={handleLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <FaSignOutAlt size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}