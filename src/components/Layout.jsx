// src/components/Layout.jsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  FaBars,
  FaChartBar,
  FaChartLine,
  FaClipboardList,
  FaHome,
  FaLayerGroup,
  FaShippingFast,
  FaTruck,
  FaUserCog,
} from 'react-icons/fa';
import Sidebar from './Sidebar';
import styles from '@/styles/Layout.module.css';

const HEADER_ICONS = {
  dashboard: <FaChartBar />,
  summary: <FaChartLine />,
  control: <FaClipboardList />,
  management: <FaUserCog />,
  request: <FaHome />,
  dispatch: <FaTruck />,
  boarding: <FaLayerGroup />,
  default: <FaShippingFast />,
};

// ─── Metadata de cada ruta (título y subtítulo del Page Header) ───────────────
// Agrega aquí las rutas nuevas que crees en el futuro.
const PAGE_META = {
  '/admin/Dashboard': { title: 'Dashboard',         subtitle: 'Panel de Administración'              },
  '/admin/Summary':   { title: 'Summary',           subtitle: 'Resumen ejecutivo de operación'       },
  '/admin/Control':   { title: 'Request Control',   subtitle: 'Control de solicitudes del día'       },
  '/admin/Management':{ title: 'Administration',    subtitle: 'Gestión de usuarios del sistema'      },
  '/Request':         { title: 'Solicitudes',       subtitle: 'Crea y consulta tus órdenes'          },
  '/Dispatch':        { title: 'Despacho',          subtitle: 'Órdenes activas en tiempo real'       },
  '/Boarding':        { title: 'Embarque',          subtitle: 'Registro y control de embarques'      },
};

const ROUTE_ICON_BY_PATH = {
  '/admin/Dashboard': 'dashboard',
  '/admin/Summary': 'summary',
  '/admin/Control': 'control',
  '/admin/Management': 'management',
  '/Request': 'request',
  '/Dispatch': 'dispatch',
  '/Boarding': 'boarding',
};

// Rutas donde no se muestra el layout (login / raíz)
const NO_LAYOUT_ROUTES = ['/', '/login'];

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  // En login y raíz renderizar solo el children sin layout
  if (NO_LAYOUT_ROUTES.includes(router.pathname)) {
    return <>{children}</>;
  }

  const meta = PAGE_META[router.pathname] || { title: 'PalletGo', subtitle: '' };
  const headerIcon = HEADER_ICONS[ROUTE_ICON_BY_PATH[router.pathname]] || HEADER_ICONS.default;

  return (
    <div className={styles.wrapper}>
      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Área principal ────────────────────────────────────────────── */}
      <div className={styles.main}>

        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            {/* Hamburger — visible en móvil vía CSS */}
            <button
              className={styles.hamburger}
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <FaBars size={20} />
            </button>

            <div className={styles.headerIcon} aria-hidden="true">
              {headerIcon}
            </div>

            <div className={styles.titleBlock}>
              <h1 className={styles.pageTitle}>{meta.title}</h1>
              {meta.subtitle && (
                <p className={styles.pageSubtitle}>{meta.subtitle}</p>
              )}
            </div>
          </div>
        </header>

        {/* Contenido de la página */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
