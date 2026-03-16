// /src/pages/admin/Management.jsx
import { useState, useEffect, useCallback } from 'react';
import AdminGate from '@/components/AdminGate';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import styles from '@/styles/Management.module.css';

// ─── Constantes ───────────────────────────────────────────────────────────────
const ROLE_MAPPING = { ADMIN: 1, LINEA: 2, EMBARQUE: 3, SUPERVISOR: 4 };

const ROLE_OPTIONS = [
  { value: 'ADMIN',      label: 'Administrador' },
  { value: 'LINEA',      label: 'Línea'         },
  { value: 'EMBARQUE',   label: 'Embarque'      },
  { value: 'SUPERVISOR', label: 'Supervisor'    },
];

// Mapea rol → clase CSS del item de resumen
const SUMMARY_CLASS = {
  ADMIN:      styles.summaryAdmin,
  LINEA:      styles.summaryLinea,
  EMBARQUE:   styles.summaryEmbarque,
  SUPERVISOR: styles.summarySupervisor,
};

// Mapea rol → clase CSS de la fila de tabla
const ROW_CLASS = {
  ADMIN:      styles.rowAdmin,
  LINEA:      styles.rowLinea,
  EMBARQUE:   styles.rowEmbarque,
  SUPERVISOR: '',
};

const EMPTY_NEW_USER = {
  email:     '',
  password:  '',
  user_name: '',
  rol_name:  'LINEA',
  id_rol:    ROLE_MAPPING['LINEA'],
};

const INITIAL_SUMMARY = { ADMIN: 0, LINEA: 0, EMBARQUE: 0, SUPERVISOR: 0 };

// ─── Subcomponente: ConfirmDeleteModal ────────────────────────────────────────
// Reemplaza window.confirm() — no bloquea el hilo principal.
const ConfirmDeleteModal = ({ isOpen, userName, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.confirmModal}>
        <h3>¿Eliminar usuario?</h3>
        <p>
          Esta acción eliminará a <strong>{userName}</strong> permanentemente y
          no se puede deshacer.
        </p>
        <div className={styles.confirmButtons}>
          <button onClick={onCancel}  className={styles.secondaryBtn}>Cancelar</button>
          <button onClick={onConfirm} className={styles.dangerBtn}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
};

// ─── Subcomponente: FeedbackToast ─────────────────────────────────────────────
// Antes usaba alert() para errores. Ahora es un toast no bloqueante.
const FeedbackToast = ({ feedback, onClose }) => {
  if (!feedback.show) return null;

  return (
    <div className={`${styles.feedback} ${feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}`}>
      <span>{feedback.message}</span>
      <button onClick={onClose} aria-label="Cerrar">&times;</button>
    </div>
  );
};

// ─── Management Page ──────────────────────────────────────────────────────────
export default function Management() {
  const { role, loading: authLoading } = useAuth();

  const [users,             setUsers]             = useState([]);
  const [newUser,           setNewUser]           = useState(EMPTY_NEW_USER);
  const [editingUser,       setEditingUser]       = useState(null);
  const [summary,           setSummary]           = useState(INITIAL_SUMMARY);
  const [isLoading,         setIsLoading]         = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmOpen,     setIsConfirmOpen]     = useState(false);
  const [feedback,          setFeedback]          = useState({ show: false, message: '', type: '' });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showFeedback = useCallback((msg, type = 'error', duration = 5000) => {
    setFeedback({ show: true, message: msg, type });
    setTimeout(() => setFeedback(f => ({ ...f, show: false })), duration);
  }, []);

  const updateSummary = (userList) => {
    const s = { ...INITIAL_SUMMARY };
    userList.forEach(u => { if (s[u.rol_name] !== undefined) s[u.rol_name]++; });
    setSummary(s);
  };

  // ── Fetch usuarios ─────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get the current session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('No authenticated session found');
      }

      // Send request with Authorization header
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Error al obtener usuarios');
      
      const data = result.data ?? result; // Support both { data: [] } and [] formats
      if (!Array.isArray(data)) throw new Error('La respuesta del servidor no es una lista de usuarios.');

      setUsers(data);
      updateSummary(data);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      showFeedback(err.message || 'Error desconocido al cargar usuarios');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Re-fetch cuando el rol del auth cambia (ya estaba en el original)
  useEffect(() => {
    if (role === 'ADMIN') fetchUsers();
  }, [role, fetchUsers]);

  // ── Registro ───────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    try {
      if (!newUser.email || !newUser.password || !newUser.user_name) {
        throw new Error('Todos los campos son requeridos');
      }
      if (newUser.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Get the current session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('No authenticated session found');
      }

      const emailFinal = `${newUser.email}@yazaki.com`.toLowerCase();
      const body = {
        ...newUser,
        email:  emailFinal,
        id_rol: ROLE_MAPPING[newUser.rol_name],
      };

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al crear usuario');

      showFeedback('Usuario registrado exitosamente!', 'success');
      setNewUser(EMPTY_NEW_USER);
      setIsCreateModalOpen(false);
      fetchUsers();
    } catch (err) {
      showFeedback(err.message);
    }
  };

  // ── Actualización ──────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    try {
      if (!editingUser.user_name || !editingUser.rol_name) {
        throw new Error('Nombre y rol son requeridos');
      }

      // Get the current session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('No authenticated session found');
      }

      const payload = {
        user_name: editingUser.user_name,
        rol_name:  editingUser.rol_name,
        id_rol:    ROLE_MAPPING[editingUser.rol_name],
      };
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al actualizar usuario');

      showFeedback('Usuario actualizado exitosamente!', 'success');
      setIsDetailModalOpen(false);
      fetchUsers();
    } catch (err) {
      showFeedback(err.message);
    }
  };

  // ── Eliminación ────────────────────────────────────────────────────────────
  // FIX: reemplaza window.confirm() por modal propio no bloqueante.
  const handleDeleteClick = () => {
    setIsDetailModalOpen(false);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      // Get the current session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('No authenticated session found');
      }

      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al eliminar usuario');

      showFeedback('Usuario eliminado correctamente', 'success');
      setIsConfirmOpen(false);
      fetchUsers();
    } catch (err) {
      showFeedback(err.message);
    }
  };

  // ── Helpers de modal ───────────────────────────────────────────────────────
  const openDetailModal = (user) => {
    setEditingUser(user);
    setIsDetailModalOpen(true);
  };

  // ── Loading auth ───────────────────────────────────────────────────────────
  if (authLoading) return <div className={styles.loading}>Cargando...</div>;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminGate>
      <div className={styles.container}>

        {/* Resumen por rol */}
        <div className={styles.summaryCompact}>
          {Object.entries(summary).map(([rol, count]) => (
            <div key={rol} className={`${styles.summaryItem} ${SUMMARY_CLASS[rol] ?? ''}`}>
              <span>{rol}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>

        {/* Acción principal */}
        <div className={styles.actionBar}>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={isLoading}
            className={styles.primaryBtn}
          >
            + Nuevo Usuario
          </button>
        </div>

        {/* Tabla */}
        <div className={styles.tableContainer}>
          {isLoading ? (
            <div className={styles.loading}>Cargando usuarios...</div>
          ) : (
            <table className={styles.table}>
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
                      className={`${styles.row} ${ROW_CLASS[user.rol_name] ?? ''}`}
                    >
                      <td>{user.user_name}</td>
                      <td>{user.email}</td>
                      <td>{user.rol_name}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className={styles.noResults}>
                      No hay usuarios registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Modal: Crear Usuario ────────────────────────────────────────── */}
        {isCreateModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h2>Registrar Nuevo Usuario</h2>
              <button
                className={styles.modalClose}
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Cerrar"
              >
                &times;
              </button>

              {[
                { label: 'Usuario',                  key: 'email',     type: 'text',     placeholder: 'Usuario' },
                { label: 'Contraseña (mín. 6 chars)', key: 'password',  type: 'password', placeholder: '' },
                { label: 'Nombre Completo',           key: 'user_name', type: 'text',     placeholder: '' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} className={styles.formGroup}>
                  <label>{label}</label>
                  <input
                    type={type}
                    value={newUser[key]}
                    onChange={e => setNewUser(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    required
                  />
                </div>
              ))}

              <div className={styles.formGroup}>
                <label>Rol</label>
                <select
                  value={newUser.rol_name}
                  onChange={e => setNewUser(prev => ({ ...prev, rol_name: e.target.value }))}
                >
                  {ROLE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={handleRegister}
                  disabled={isLoading}
                  className={styles.primaryBtn}
                >
                  {isLoading ? 'Registrando...' : 'Registrar Usuario'}
                </button>
                <button
                  className={styles.secondaryBtn}
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewUser(EMPTY_NEW_USER);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: Editar Usuario ───────────────────────────────────────── */}
        {isDetailModalOpen && editingUser && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h2>Detalles del Usuario</h2>
              <button
                className={styles.modalClose}
                onClick={() => setIsDetailModalOpen(false)}
                aria-label="Cerrar"
              >
                &times;
              </button>

              <div className={styles.formGroup}>
                <label>Nombre</label>
                <input
                  type="text"
                  value={editingUser.user_name}
                  onChange={e => setEditingUser(prev => ({ ...prev, user_name: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email</label>
                <input type="email" value={editingUser.email} disabled />
              </div>

              <div className={styles.formGroup}>
                <label>Rol</label>
                <select
                  value={editingUser.rol_name}
                  onChange={e => setEditingUser(prev => ({ ...prev, rol_name: e.target.value }))}
                >
                  {ROLE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>ID Rol</label>
                <input type="text" value={ROLE_MAPPING[editingUser.rol_name]} disabled />
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className={styles.primaryBtn}
                >
                  {isLoading ? 'Actualizando...' : 'Actualizar'}
                </button>
                <button
                  onClick={handleDeleteClick}
                  className={styles.dangerBtn}
                  disabled={isLoading}
                >
                  Eliminar
                </button>
                <button
                  className={styles.secondaryBtn}
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: Confirmar Eliminación ─────────────────────────────────── */}
        <ConfirmDeleteModal
          isOpen={isConfirmOpen}
          userName={editingUser?.user_name}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirmOpen(false)}
        />

        {/* ── Feedback Toast ────────────────────────────────────────────────── */}
        <FeedbackToast
          feedback={feedback}
          onClose={() => setFeedback(f => ({ ...f, show: false }))}
        />
      </div>
    </AdminGate>
  );
}