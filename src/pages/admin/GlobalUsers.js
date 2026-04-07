// src/pages/admin/GlobalUsers.js
import { useState, useEffect, useCallback } from 'react';
import AdminGate from '@/components/AdminGate';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import styles from '@/styles/Management.module.css';

// ─── Constantes ───────────────────────────────────────────────────────────────
const ROLE_MAPPING = {
  SUPERADMIN: 7, ADMIN: 1, LINEA: 2, EMBARQUE: 3,
  SUPERVISOR: 4, TECNICO: 5, ADMIN_TEC: 6,
};

// TECNICO = usuarios que acceden al monitor de mtto, se muestran como "Home Position"
// list_tec es un catálogo separado de nombres de soporte (sin cuenta de auth)
const ROLE_OPTIONS = [
  { value: 'SUPERADMIN', label: 'Super Administrador' },
  { value: 'ADMIN',      label: 'Administrador'       },
  { value: 'LINEA',      label: 'Línea'               },
  { value: 'EMBARQUE',   label: 'Embarque'            },
  { value: 'SUPERVISOR', label: 'Supervisor'          },
  { value: 'TECNICO',    label: 'Home Position'       },
  { value: 'ADMIN_TEC',  label: 'Admin Técnico'       },
];

const ROLE_ORDER = ['SUPERADMIN', 'ADMIN', 'ADMIN_TEC', 'SUPERVISOR', 'LINEA', 'EMBARQUE', 'TECNICO'];

const ROLE_LABEL = {
  SUPERADMIN: 'Super Administrador',
  ADMIN:      'Administrador',
  LINEA:      'Línea',
  EMBARQUE:   'Embarque',
  SUPERVISOR: 'Supervisor',
  TECNICO:    'Home Position',
  ADMIN_TEC:  'Admin Técnico',
};

const ROLE_COLOR_ACCENT = {
  SUPERADMIN: '#0f172a',
  ADMIN:      '#3b82f6',
  ADMIN_TEC:  '#d946ef',
  SUPERVISOR: '#f59e0b',
  LINEA:      '#22c55e',
  EMBARQUE:   '#991caf',
  TECNICO:    '#ec4899',
};

const SUMMARY_CLASS = {
  SUPERADMIN: styles.summarySuperAdmin,
  ADMIN:      styles.summaryAdmin,
  LINEA:      styles.summaryLinea,
  EMBARQUE:   styles.summaryEmbarque,
  SUPERVISOR: styles.summarySupervisor,
  TECNICO:    styles.summaryTecnico,
  ADMIN_TEC:  styles.summaryAdminTec,
};

const INITIAL_SUMMARY = { SUPERADMIN: 0, ADMIN: 0, LINEA: 0, EMBARQUE: 0, SUPERVISOR: 0, TECNICO: 0, ADMIN_TEC: 0 };

// ─── ConfirmDeleteModal ───────────────────────────────────────────────────────
const ConfirmDeleteModal = ({ isOpen, userName, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.confirmModal}>
        <h3>¿Eliminar usuario?</h3>
        <p>Esta acción eliminará a <strong>{userName}</strong> permanentemente y no se puede deshacer.</p>
        <div className={styles.confirmButtons}>
          <button onClick={onCancel}  className={styles.secondaryBtn}>Cancelar</button>
          <button onClick={onConfirm} className={styles.dangerBtn}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
};

// ─── FeedbackToast ────────────────────────────────────────────────────────────
const FeedbackToast = ({ feedback, onClose }) => {
  if (!feedback.show) return null;
  return (
    <div className={`${styles.feedback} ${feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}`}>
      <span>{feedback.message}</span>
      <button onClick={onClose} aria-label="Cerrar">&times;</button>
    </div>
  );
};

// ─── GlobalUsers ──────────────────────────────────────────────────────────────
export default function GlobalUsers() {
  const { loading: authLoading } = useAuth();

  const [users,             setUsers]             = useState([]);
  const [summary,           setSummary]           = useState(INITIAL_SUMMARY);
  const [newUser,           setNewUser]           = useState({ email: '', password: '', user_name: '', rol_name: 'LINEA' });
  const [editingUser,       setEditingUser]       = useState(null);
  const [isLoading,         setIsLoading]         = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmOpen,     setIsConfirmOpen]     = useState(false);
  const [feedback,          setFeedback]          = useState({ show: false, message: '', type: '' });

  const showFeedback = useCallback((msg, type = 'error', duration = 5000) => {
    setFeedback({ show: true, message: msg, type });
    setTimeout(() => setFeedback(f => ({ ...f, show: false })), duration);
  }, []);

  const updateSummary = (userList) => {
    const s = { ...INITIAL_SUMMARY };
    userList.forEach(u => { if (s[u.rol_name] !== undefined) s[u.rol_name]++; });
    setSummary(s);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) throw new Error('Sin sesión autenticada');
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al obtener usuarios');
      const data = result.data ?? result;
      if (!Array.isArray(data)) throw new Error('Respuesta inesperada del servidor');
      setUsers(data);
      updateSummary(data);
    } catch (err) {
      showFeedback(err.message || 'Error al cargar usuarios');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Registro ───────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    try {
      if (!newUser.email || !newUser.password || !newUser.user_name) throw new Error('Todos los campos son requeridos');
      if (newUser.password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          email:     `${newUser.email}@yazaki.com`.toLowerCase(),
          password:  newUser.password,
          user_name: newUser.user_name,
          rol_name:  newUser.rol_name,
          id_rol:    ROLE_MAPPING[newUser.rol_name],
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al crear usuario');
      showFeedback('✅ Usuario registrado exitosamente', 'success');
      setNewUser({ email: '', password: '', user_name: '', rol_name: 'LINEA' });
      setIsCreateModalOpen(false);
      fetchUsers();
    } catch (err) {
      showFeedback(err.message);
    }
  };

  // ── Actualización ──────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    try {
      if (!editingUser.user_name || !editingUser.rol_name) throw new Error('Nombre y rol son requeridos');
      if (editingUser.new_password && editingUser.new_password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
      const { data: { session } } = await supabase.auth.getSession();
      const payload = {
        user_name: editingUser.user_name,
        rol_name:  editingUser.rol_name,
        id_rol:    ROLE_MAPPING[editingUser.rol_name],
      };
      if (editingUser.new_password) payload.new_password = editingUser.new_password;
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al actualizar usuario');
      showFeedback('✅ Usuario actualizado exitosamente', 'success');
      setIsDetailModalOpen(false);
      fetchUsers();
    } catch (err) {
      showFeedback(err.message);
    }
  };

  // ── Eliminación ────────────────────────────────────────────────────────────
  const handleDeleteClick = () => {
    setIsDetailModalOpen(false);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al eliminar usuario');
      showFeedback('✅ Usuario eliminado correctamente', 'success');
      setIsConfirmOpen(false);
      fetchUsers();
    } catch (err) {
      showFeedback(err.message);
    }
  };

  const openDetailModal = (user) => {
    setEditingUser({ ...user, new_password: '' });
    setIsDetailModalOpen(true);
  };

  // Agrupar usuarios por rol preservando el orden definido
  const grouped = ROLE_ORDER.reduce((acc, rol) => {
    const list = users.filter(u => u.rol_name === rol);
    if (list.length > 0) acc[rol] = list;
    return acc;
  }, {});

  if (authLoading) return <div className={styles.loading}>Cargando...</div>;

  return (
    <AdminGate>
      <div className={styles.container}>

        {/* ── Resumen global ──────────────────────────────────────────── */}
        <div className={styles.summaryCompact}>
          {ROLE_ORDER.map(rol => (
            <div key={rol} className={`${styles.summaryItem} ${SUMMARY_CLASS[rol] ?? ''}`}>
              <span>{ROLE_LABEL[rol]}</span>
              <strong>{summary[rol]}</strong>
            </div>
          ))}
        </div>

        {/* ── Acción principal ─────────────────────────────────────────── */}
        <div className={styles.actionBar}>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={isLoading}
            className={styles.primaryBtn}
          >
            + Nuevo Usuario
          </button>
        </div>

        {/* ── Grupos por rol ───────────────────────────────────────────── */}
        {isLoading ? (
          <div className={styles.loading}>Cargando usuarios...</div>
        ) : (
          <div className={styles.tableContainer}>
            {Object.entries(grouped).map(([rol, userList]) => (
              <div key={rol} style={{ marginBottom: '32px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  paddingBottom: '8px', marginBottom: '8px',
                  borderBottom: `2px solid ${ROLE_COLOR_ACCENT[rol] ?? '#e5e7eb'}`,
                }}>
                  <span style={{
                    display: 'inline-block', width: '10px', height: '10px',
                    borderRadius: '50%', background: ROLE_COLOR_ACCENT[rol] ?? '#e5e7eb',
                    flexShrink: 0,
                  }} />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>
                    {ROLE_LABEL[rol]}
                  </h3>
                  <span style={{
                    marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 600,
                    background: `${ROLE_COLOR_ACCENT[rol]}22`,
                    color: ROLE_COLOR_ACCENT[rol],
                    padding: '2px 10px', borderRadius: '999px',
                    border: `1px solid ${ROLE_COLOR_ACCENT[rol]}44`,
                  }}>
                    {userList.length}
                  </span>
                </div>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userList.map(user => (
                      <tr
                        key={user.id}
                        onClick={() => openDetailModal(user)}
                        className={styles.row}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{user.user_name}</td>
                        <td>{user.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            {Object.keys(grouped).length === 0 && (
              <div className={styles.noResults}>No hay usuarios registrados</div>
            )}
          </div>
        )}

        {/* ── Modal: Crear Usuario ────────────────────────────────────── */}
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
                { label: 'Usuario (sin @yazaki.com)',   key: 'email',     type: 'text',     placeholder: 'usuario' },
                { label: 'Contraseña (mín. 6 chars)',   key: 'password',  type: 'password', placeholder: '' },
                { label: 'Nombre Completo',             key: 'user_name', type: 'text',     placeholder: '' },
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
                    setNewUser({ email: '', password: '', user_name: '', rol_name: 'LINEA' });
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: Editar Usuario ───────────────────────────────────── */}
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
                <label>Nueva Contraseña (opcional)</label>
                <input
                  type="password"
                  value={editingUser.new_password || ''}
                  onChange={e => setEditingUser(prev => ({ ...prev, new_password: e.target.value }))}
                  placeholder="Dejar vacío para no cambiar"
                />
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

        {/* ── Modal: Confirmar Eliminación ────────────────────────────── */}
        <ConfirmDeleteModal
          isOpen={isConfirmOpen}
          userName={editingUser?.user_name}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirmOpen(false)}
        />

        {/* ── Feedback Toast ───────────────────────────────────────────── */}
        <FeedbackToast
          feedback={feedback}
          onClose={() => setFeedback(f => ({ ...f, show: false }))}
        />
      </div>
    </AdminGate>
  );
}
