import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';

export default function AdminGate({ children }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (role !== 'ADMIN') {
    return (
      <div className="admingate-modal-container">
        <div className='admingate-modal-content'>
          <h2>🚫 Acceso Denegado</h2>
          <p>El usuario <strong>{user?.email}</strong> no tiene permisos para ver esta página.</p>
          <button onClick={() => router.back()} className="admingate-back-btn">Volver</button>
          </div>
      </div>
    );
  }

  return children;
}