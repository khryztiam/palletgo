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
    const getSession = async () => {
      // Obtiene la sesión de Supabase
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);  // Establece el usuario

      if (session?.user) {
        // Realiza una consulta a la tabla public.users usando el email
        const { data, error } = await supabase
          .from('users') // Asegúrate de que la tabla se llama así
          .select('user_name, rol_name')  // Los campos a los que accedemos
          .eq('email', session.user.email) // Usamos el email como filtro
          .single(); // Asegura que solo regrese un resultado

        if (data) {
          setUserName(data.user_name);  // Almacena el user_name
          setRole(data.rol_name);  // Almacena el role_name
        } else {
          console.error('Error al obtener datos del usuario:', error);
        }
      }

      setLoading(false);  // Indica que la sesión ha sido cargada
    };

    // Llamamos a la función para obtener la sesión y los datos del usuario
    getSession();

    // Escucha los cambios de sesión y renueva la sesión automáticamente
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        getSession();
      } else {
        setUserName('');
        setRole('');
      }
    });

    // Desuscribirse correctamente al desmontar el componente
    return () => {
      if (listener && typeof listener.unsubscribe === 'function') {
        listener.unsubscribe();
      }
    };
  }, []); // Solo se ejecuta una vez al cargar el componente

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
