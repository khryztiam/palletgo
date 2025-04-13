import { useState, useEffect, useMemo } from 'react';
import AdminGate from '@/components/AdminGate';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

// Mapeo de roles a IDs
const ROLE_MAPPING = {
  ADMIN: 1,
  LINEA: 2,
  EMBARQUE: 3
};

// Colores por rol
const ROLE_COLORS = {
  ADMIN: 'bg-red-50',
  LINEA: 'bg-blue-50',
  EMBARQUE: 'bg-green-50'
};

export default function Management() {
  const { role, loading } = useAuth();
  const [dbUsers, setDbUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    user_name: '',
    rol_name: 'LINEA',
  });
  const [editingUser, setEditingUser] = useState(null);
  const [feedback, setFeedback] = useState({ show: false, message: '', type: '' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState({ ADMIN: 0, LINEA: 0, EMBARQUE: 0 });

  // Calcula usuarios filtrados
  const filteredUsers = useMemo(() => {
    return dbUsers.filter(user => 
      user.user_name.toLowerCase().includes(filter.toLowerCase()) || 
      user.email.toLowerCase().includes(filter.toLowerCase())
    );
  }, [dbUsers, filter]);

  // Actualiza el resumen por rol
  const updateSummary = (users) => {
    const summaryData = { ADMIN: 0, LINEA: 0, EMBARQUE: 0 };
    users.forEach(user => {
      summaryData[user.rol_name]++;
    });
    setSummary(summaryData);
  };

  // Obtiene usuarios
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDbUsers(data);
      updateSummary(data);
    } catch (error) {
      showFeedback(`Error al cargar usuarios: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Muestra feedback
  const showFeedback = (message, type = 'error', duration = 5000) => {
    setFeedback({ show: true, message, type });
    setTimeout(() => setFeedback(f => ({ ...f, show: false })), duration);
  };

  // Registra nuevo usuario
  const handleRegister = async () => {
    try {
      // Validaciones
      if (!newUser.email || !newUser.password || !newUser.user_name) {
        throw new Error('Todos los campos son requeridos');
      }

      if (newUser.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Verificar si el email ya existe
      const { data: existingUsers, error: emailError } = await supabase
        .from('users')
        .select('email')
        .eq('email', newUser.email);

      if (emailError) throw emailError;
      if (existingUsers.length > 0) {
        throw new Error('El email ya está registrado');
      }

      // Crear usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            user_name: newUser.user_name,
            role: newUser.rol_name
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      // Crear registro en public.users con id_rol correcto
      const { error: dbError } = await supabase.from('users').insert([{
        id: authData.user.id,
        email: newUser.email,
        user_name: newUser.user_name,
        rol_name: newUser.rol_name,
        id_rol: ROLE_MAPPING[newUser.rol_name], // Asignamos el ID numérico
        is_active: true // Estado por defecto
      }]);

      if (dbError) throw dbError;

      showFeedback('Usuario registrado exitosamente!', 'success');
      setNewUser({ email: '', password: '', user_name: '', rol_name: 'LINEA' });
      fetchUsers();
      setIsCreateModalOpen(false);
    } catch (error) {
      showFeedback(error.message);
    }
  };

  // Actualizar usuario
  const handleUpdate = async () => {
    try {
      if (!editingUser.user_name || !editingUser.rol_name) {
        throw new Error('Nombre y rol son requeridos');
      }

      // Actualizar en public.users con id_rol correcto
      const { error: dbError } = await supabase
        .from('users')
        .update({
          user_name: editingUser.user_name,
          rol_name: editingUser.rol_name,
          id_rol: ROLE_MAPPING[editingUser.rol_name] // Actualizar ID numérico
        })
        .eq('id', editingUser.id);

      if (dbError) throw dbError;

      // Actualizar metadata en Auth
      const { error: authError } = await supabase.auth.admin.updateUserById(
        editingUser.id,
        { user_metadata: { role: editingUser.rol_name } }
      );

      if (authError) throw authError;

      showFeedback('Usuario actualizado exitosamente!', 'success');
      fetchUsers();
      setIsDetailModalOpen(false);
    } catch (error) {
      showFeedback(`Error al actualizar usuario: ${error.message}`);
    }
  };

  // Eliminar usuario
  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este usuario permanentemente?')) {
      return;
    }

    try {
      // Primero eliminar de Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(editingUser.id);
      if (authError) throw authError;

      // Luego eliminar de public.users
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', editingUser.id);

      if (dbError) throw dbError;

      showFeedback('Usuario eliminado correctamente', 'success');
      fetchUsers();
      setIsDetailModalOpen(false);
    } catch (error) {
      showFeedback(`Error al eliminar usuario: ${error.message}`);
    }
  };

  // Abrir modal de detalles
  const openDetailModal = (user) => {
    setEditingUser(user);
    setIsDetailModalOpen(true);
  };

  useEffect(() => {
    if (role === 'ADMIN') fetchUsers();
  }, [role]);

  if (loading) return <div className="management-loading">Cargando...</div>;

  return (
    <AdminGate>
      <div className="management-container">
        <h1>Administración de Usuarios</h1>

        {/* Resumen compacto por rol */}
        <div className="management-summary-compact">
          {Object.entries(summary).map(([rol, count]) => (
            <div key={rol} className={`management-summary-item ${rol.toLowerCase()}`}>
              <span>{rol}:</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>

        {/* Búsqueda y acciones */}
        <div className="management-action-bar">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            onChange={(e) => setFilter(e.target.value)}
            disabled={isLoading}
          />
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            disabled={isLoading}
            className="management-primary-btn"
          >
            + Nuevo Usuario
          </button>
        </div>

        {/* Tabla de usuarios */}
        <div className="management-table-container">
          {isLoading ? (
            <div className="management-loading">Cargando usuarios...</div>
          ) : (
            <table className="management-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <tr 
                      key={user.id} 
                      onClick={() => openDetailModal(user)}
                      className={`management-clickable-row ${ROLE_COLORS[user.rol_name]}`}
                    >
                      <td>{user.user_name}</td>
                      <td>{user.email}</td>
                      <td>{user.rol_name}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="management-no-results">
                      {filter ? 'No hay coincidencias' : 'No hay usuarios registrados'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal de creación */}
        {isCreateModalOpen && (
          <div className="management-modal-overlay">
            <div className="management-modal-content">
              <h2>Registrar Nuevo Usuario</h2>
              <button 
                className="management-modal-close" 
                onClick={() => setIsCreateModalOpen(false)}
              >
                &times;
              </button>
              
              <div className="management-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>

              <div className="management-form-group">
                <label>Contraseña (mín. 6 caracteres)</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>

              <div className="management-form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  value={newUser.user_name}
                  onChange={(e) => setNewUser({...newUser, user_name: e.target.value})}
                  required
                />
              </div>

              <div className="management-form-group">
                <label>Rol</label>
                <select
                  value={newUser.rol_name}
                  onChange={(e) => setNewUser({...newUser, rol_name: e.target.value})}
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="LINEA">Línea</option>
                  <option value="EMBARQUE">Embarque</option>
                </select>
              </div>

              <div className="management-modal-actions">
                <button 
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="management-primary-btn"
                >
                  {isLoading ? 'Registrando...' : 'Registrar Usuario'}
                </button>
                <button 
                  className="management-secondary-btn" 
                  onClick={() => {setIsCreateModalOpen(false);
                    setNewUser({
                      email: '',
                      password: '',
                      user_name: '',
                      rol_name: 'LINEA'
                    });
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de detalles */}
        {isDetailModalOpen && editingUser && (
          <div className="management-modal-overlay">
            <div className="management-modal-content">
              <h2>Detalles del Usuario</h2>
              <button 
                className="management-modal-close" 
                onClick={() => setIsDetailModalOpen(false)}
              >
                &times;
              </button>
              
              <div className="management-form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={editingUser.user_name}
                  onChange={(e) => setEditingUser({...editingUser, user_name: e.target.value})}
                  required
                />
              </div>

              <div className="management-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                />
              </div>

              <div className="management-form-group">
                <label>Rol</label>
                <select
                  value={editingUser.rol_name}
                  onChange={(e) => setEditingUser({...editingUser, rol_name: e.target.value})}
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="LINEA">Línea</option>
                  <option value="EMBARQUE">Embarque</option>
                </select>
              </div>

              <div className="management-form-group">
                <label>ID Rol</label>
                <input
                  type="text"
                  value={ROLE_MAPPING[editingUser.rol_name]}
                  disabled
                />
              </div>

              <div className="management-form-group">
                <label>Estado</label>
                <div className="management-status-text">
                  {editingUser.is_active ? 'Activo' : 'Inactivo'}
                </div>
              </div>

              <div className="management-modal-actions">
                <button 
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className="management-primary-btn"
                >
                  {isLoading ? 'Actualizando...' : 'Actualizar'}
                </button>
                <button 
                  onClick={handleDelete}
                  className="management-danger-btn"
                >
                  Eliminar
                </button>
                <button 
                  className="management-secondary-btn" 
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback */}
        {feedback.show && (
          <div className={`management-feedback ${feedback.type}`}>
            {feedback.message}
            <button onClick={() => setFeedback({...feedback, show: false})}>
              &times;
            </button>
          </div>
        )}
      </div>
    </AdminGate>
  );
}