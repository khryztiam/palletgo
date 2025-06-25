import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);  // Estado de carga para saber si estamos verificando la sesión

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
       email, password });
    if (error) throw error;
  
    // Esto va a activar getSession automáticamente por el listener
  };

useEffect(() => {
  const getSession = async (fromEvent = false) => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);

    if (session?.user) {
      const { data, error } = await supabase
        .from('users')
        .select('user_name, rol_name')
        .eq('email', session.user.email)
        .single();

      if (data) {
        setUserName(data.user_name);
        setRole(data.rol_name);
      } else if (!fromEvent) {
        console.error('Error al obtener datos del usuario:', error);
      }
    }

    if (!fromEvent) {
      setLoading(false);
    }
  };

  getSession(); // carga inicial

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user || null);
    if (session?.user) {
      getSession(true); // evita conflicto con loading
    } else {
      setUserName('');
      setRole('');
    }
  });

  return () => {
    if (listener && typeof listener.unsubscribe === 'function') {
      listener.unsubscribe();
    }
  };
}, []);


    // Función de logout
    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setUserName('');
        setRole('');
    };

  return (
    <AuthContext.Provider value={{ user, userName, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
