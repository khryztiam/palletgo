import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

const roleRoutes = {
  ADMIN: ['/admin/Dashboard', '/admin/Control', '/admin/Management','/Request', '/Dispatch', '/Boarding'],
  LINEA: ['/Request'],
  EMBARQUE: ['/Dispatch', '/Boarding'],
  SUPERVISOR: ['/admin/Dashboard', '/admin/Control']
  // agrega más roles y rutas que pueden ver
};

export default function AdminGate({ children }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (loading) return;

    const openRoutes = ['/', '/login'];
    const isOpenRoute = openRoutes.includes(router.pathname);
    if (!user && !isOpenRoute) {
      router.replace('/');
      return;
    }

    if (user) {
      // Si está en ruta abierta, redirigir al dashboard correspondiente
      if (isOpenRoute) {
        const targetRoute = roleRoutes[role]?.[0] || '/';
        router.replace(targetRoute);
        return;
      }

      // Controlar acceso a la ruta actual según rol
      const allowedRoutes = roleRoutes[role] || [];
      if (!allowedRoutes.includes(router.pathname)) {
        setAccessDenied(true);
      } else {
        setAccessDenied(false);
      }
    }
  }, [user, role, loading, router.pathname]);

  if (loading) return null;

  if (accessDenied) {
    return (
      <div className="admingate-modal-container">
        <div className='admingate-modal-content'>
          <h2>🚫 Acceso Denegado</h2>
          <p>El usuario <strong>{user?.email}</strong> no tiene permisos para ver esta página.</p>
          <button onClick={() => router.push(roleRoutes[role]?.[0] || '/')} className="admingate-back-btn">
            Volver
            </button>
          </div>
      </div>
    );
  }

  return <>{children}</>;
}