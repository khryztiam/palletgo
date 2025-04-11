import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

export default function AuthGate({ children }) {
  const router = useRouter();
  const { user } = useAuth();

  const isLoginPage = router.pathname === '/login';

  useEffect(() => {
    if (user === null && !isLoginPage) {
      router.replace('/login');
    }
    if (user && isLoginPage) {
      router.replace('/dashboard'); // o la ruta principal de tu app
    }
  }, [user, isLoginPage]);

  // ⚠️ Evita renderizar si aún se está evaluando el auth o redirigiendo
  if ((user === null && !isLoginPage) || (user && isLoginPage)) return null;

  return children;
}
