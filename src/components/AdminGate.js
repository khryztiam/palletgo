import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/AdminGate.module.css';

// ─── Rutas permitidas por rol ─────────────────────────────────────────────────
// Centralizado: agregar un rol o ruta es una sola línea aquí.
const ROLE_ROUTES = {
  SUPERADMIN: ['/admin/Dashboard', '/admin/Control', '/admin/Management', '/admin/MaintenanceAdmin', '/admin/GlobalUsers', '/Request', '/Dispatch', '/Boarding', '/maintenance/RequestMaintenance', '/maintenance/Monitor'],
  ADMIN:      ['/admin/Dashboard', '/admin/Control', '/admin/Management', '/Request', '/Dispatch', '/Boarding'],
  LINEA:      ['/Request', '/maintenance/RequestMaintenance'],
  EMBARQUE:   ['/Dispatch', '/Boarding'],
  SUPERVISOR: ['/admin/Dashboard', '/admin/Control'],
  HOME_POSITION:    ['/maintenance/Monitor'],
  ADMIN_TEC:  ['/admin/Management', '/admin/MaintenanceAdmin', '/maintenance/Monitor'],
};

const OPEN_ROUTES = ['/', '/login'];

// ─── AdminGate ────────────────────────────────────────────────────────────────
export default function AdminGate({ children }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (loading) return;

    const isOpenRoute = OPEN_ROUTES.includes(router.pathname);

    // Sin sesión en ruta protegida → login
    if (!user && !isOpenRoute) {
      router.replace('/');
      return;
    }

    if (user) {
      // Con sesión en ruta abierta → redirigir a la primera ruta del rol
      if (isOpenRoute) {
        router.replace(ROLE_ROUTES[role]?.[0] || '/');
        return;
      }

      // Verificar acceso a la ruta actual
      const allowedRoutes = ROLE_ROUTES[role] || [];
      setAccessDenied(!allowedRoutes.includes(router.pathname));
    }
  }, [user, role, loading, router.pathname]);

  if (loading) return null;

  if (accessDenied) {
    return (
      <div className={styles.overlay}>
        <div className={styles.content}>
          <h2>🚫 Acceso Denegado</h2>
          <p>
            El usuario <strong>{user?.email}</strong> no tiene permisos para
            ver esta página.
          </p>
          <button
            onClick={() => router.push(ROLE_ROUTES[role]?.[0] || '/')}
            className={styles.backBtn}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}