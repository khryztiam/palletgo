import { useState, useEffect, useMemo } from 'react';
import AdminGate from '@/components/AdminGate';
import { useAuth } from '@/context/AuthContext';

const ROLE_MAPPING = { ADMIN: 1, LINEA: 2, EMBARQUE: 3, SUPERVISOR: 4 };
const ROLE_COLORS  = { ADMIN: 'bg-red-50', LINEA: 'bg-blue-50', EMBARQUE: 'bg-green-50', SUPERVISOR: 'bg-orange-50' };

export default function Management() {
  const { role, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    user_name: '',
    rol_name: 'LINEA',
    id_rol: ROLE_MAPPING['LINEA'],  // inicializar id_rol
  });
  const [editingUser, setEditingUser] = useState(null);
  const [feedback, setFeedback] = useState({ show: false, message: '', type: '' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState({ ADMIN: 0, LINEA: 0, EMBARQUE: 0 , SUPERVISOR: 0});

  const updateSummary = users => {
    const s = { ADMIN:0, LINEA:0, EMBARQUE:0 , SUPERVISOR:0 };
    users.forEach(u => s[u.rol_name]++);
    setSummary(s);
  };

  // Cargar usuarios

const fetchUsers = async () => {
  try {
    setIsLoading(true);
    const res = await fetch('/api/admin/users');
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error al obtener usuarios');
    }

    if (!Array.isArray(data)) {
      throw new Error('La respuesta del servidor no es una lista de usuarios.');
    }

    setUsers(data);
    updateSummary(data);
  } catch (err) {
    console.error('Error cargando usuarios:', err);
    showFeedback(err.message || 'Error desconocido al cargar usuarios');
    setUsers([]);
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    fetchUsers();
  }, []);

  const showFeedback = (msg, type='error', duration=5000) => {
    setFeedback({ show:true, message:msg, type });
    setTimeout(() => setFeedback(f=>({ ...f, show:false })), duration);
  };

  // 👉 Usando endpoint POST
  const handleRegister = async () => {
    try {
      if (!newUser.email || !newUser.password || !newUser.user_name) {
        throw new Error('Todos los campos son requeridos');
      }
      if (newUser.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // 👉 Forzar formato de email con dominio fijo
      const emailFinal = `${newUser.email}@yazaki.com`.toLowerCase();

      // Asegura que id_rol coincida con rol_name
      const body = { ...newUser, email:emailFinal, id_rol:ROLE_MAPPING[newUser.rol_name] };

      const res = await fetch('/api/admin/users', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al crear usuario');

      showFeedback('Usuario registrado exitosamente!', 'success');
      // Reset form
      setNewUser({ email:'', password:'', user_name:'', rol_name:'LINEA', id_rol:ROLE_MAPPING.LINEA });
      fetchUsers();
      setIsCreateModalOpen(false);
    } catch (err) {
      showFeedback(err.message);
    }
  };

  // 👉 Usando endpoint PUT Actualizacion
  const handleUpdate = async () => {
    try {
      if (!editingUser.user_name || !editingUser.rol_name) {
        throw new Error('Nombre y rol son requeridos');
      }
      const payload = {
        user_name: editingUser.user_name,
        rol_name: editingUser.rol_name,
        id_rol: ROLE_MAPPING[editingUser.rol_name]
      };
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method:'PUT',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al actualizar usuario');

      showFeedback('Usuario actualizado exitosamente!', 'success');
      fetchUsers();
      setIsDetailModalOpen(false);
    } catch (err) {
      showFeedback(err.message);
    }
  };

  // 👉 Usando endpoint DELETE
  const handleDelete = async () => {
    if (!confirm('¿Eliminar usuario permanentemente?')) return;
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method:'DELETE',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al eliminar usuario');

      showFeedback('Usuario eliminado correctamente', 'success');
      fetchUsers();
      setIsDetailModalOpen(false);
    } catch (err) {
      showFeedback(err.message);
    }
  };

  const openDetailModal = user => {
    setEditingUser(user);
    setIsDetailModalOpen(true);
  };

  useEffect(() => {
    if (role === 'ADMIN') fetchUsers();
  }, [role]);

  if (loading) return <div>Cargando...</div>;


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
                {users.length > 0 ? (
                  users.map(user => (
                    <tr
                      key={user.id}
                      onClick={() => openDetailModal(user)}
                      className={`management-row ${user.rol_name.toLowerCase()}`}
                    >
                      <td>{user.user_name}</td>
                      <td>{user.email}</td>
                      <td>{user.rol_name}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="management-no-results">
                      'No hay usuarios registrados'
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
                <label>Usuario</label>
                <input
                  type="text"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                  placeholder='Usuario'
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
                  <option value="SUPERVISOR">Supervisor</option>
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
                      id_rol:'',
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
                  <option value="SUPERVISOR">Supervisor</option>
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
                  disabled={isLoading}
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
