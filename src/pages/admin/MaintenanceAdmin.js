import React, { useState, useEffect, useCallback } from 'react';
import RoleGate from '@/components/RoleGate';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import styles from '@/styles/MaintenanceAdmin.module.css';

// ─── Constantes de dominio Mtto ───────────────────────────────────────────────
// TECNICO es un rol de auth real: usuarios que acceden a /maintenance/Monitor
// list_tec es un catálogo separado (como la lista de entregadores en boarding)
const ROLE_MAPPING_MTTO = { HOME_POSITION: 5, ADMIN_TEC: 6 };
const ROLE_OPTIONS_MTTO = [
  { value: 'HOME_POSITION',   label: 'Home Position' },
  { value: 'ADMIN_TEC', label: 'Admin Técnico' },
];
const ROLE_LABELS_MTTO = { HOME_POSITION: 'Home Position', ADMIN_TEC: 'Admin Técnico' };
const SUMMARY_CLASS_MTTO = {
  HOME_POSITION:   styles.summaryHomePosition,
  ADMIN_TEC: styles.summaryAdminTec,
};

// ─── ConfirmDeleteModal ───────────────────────────────────────────────────────
const ConfirmDeleteModal = ({ isOpen, userName, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.confirmModal}>
        <h3>¿Eliminar?</h3>
        <p>Esta acción eliminará a <strong>{userName}</strong> permanentemente.</p>
        <div className={styles.confirmButtons}>
          <button onClick={onCancel}  className={styles.cancelBtn}>Cancelar</button>
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

// ─── MaintenanceAdmin ─────────────────────────────────────────────────────────
export default function MaintenanceAdmin() {
  const { loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // ── Estado: Tab Usuarios Auth ───────────────────────────────────────────────
  const [users,             setUsers]             = useState([]);
  const [userSummary,       setUserSummary]       = useState({ HOME_POSITION: 0, ADMIN_TEC: 0 });
  const [isUserLoading,     setIsUserLoading]     = useState(false);
  const [editingUser,       setEditingUser]       = useState(null);
  const [isCreateUserOpen,  setIsCreateUserOpen]  = useState(false);
  const [isEditUserOpen,    setIsEditUserOpen]    = useState(false);
  const [isConfirmUserOpen, setIsConfirmUserOpen] = useState(false);
  const [newUser,           setNewUser]           = useState({ email: '', password: '', user_name: '', rol_name: 'HOME_POSITION' });

  // ── Estado: Tab Home Positions (list_tec) ───────────────────────────────────
  const [technicians,      setTechnicians]      = useState([]);
  const [isTecLoading,     setIsTecLoading]     = useState(false);
  const [isTecModalOpen,   setIsTecModalOpen]   = useState(false);
  const [tecModalMode,     setTecModalMode]     = useState('create');
  const [selectedTec,      setSelectedTec]      = useState(null);
  const [tecForm,          setTecForm]          = useState({ tecnico: '' });
  const [isConfirmTecOpen, setIsConfirmTecOpen] = useState(false);

  // ── Feedback compartido ─────────────────────────────────────────────────────
  const [feedback, setFeedback] = useState({ show: false, message: '', type: '' });
  const showFeedback = useCallback((msg, type = 'error', duration = 4000) => {
    setFeedback({ show: true, message: msg, type });
    setTimeout(() => setFeedback(f => ({ ...f, show: false })), duration);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab 1: Usuarios Auth
  // ─────────────────────────────────────────────────────────────────────────────
  const updateUserSummary = (list) => {
    const s = { HOME_POSITION: 0, ADMIN_TEC: 0 };
    list.forEach(u => { if (s[u.rol_name] !== undefined) s[u.rol_name]++; });
    setUserSummary(s);
  };

  const fetchUsers = useCallback(async () => {
    setIsUserLoading(true);
    try {
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
      updateUserSummary(data);
    } catch (err) {
      showFeedback(err.message || 'Error al cargar usuarios');
    } finally {
      setIsUserLoading(false);
    }
  }, [showFeedback]);

  const handleRegisterUser = async () => {
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
          id_rol:    ROLE_MAPPING_MTTO[newUser.rol_name],
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al crear usuario');
      showFeedback('✅ Usuario creado exitosamente', 'success');
      setIsCreateUserOpen(false);
      setNewUser({ email: '', password: '', user_name: '', rol_name: 'HOME_POSITION' });
      fetchUsers();
    } catch (err) {
      showFeedback(err.message);
    }
  };

  const openEditUser = (user) => {
    setEditingUser({ ...user, new_password: '' });
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async () => {
    try {
      if (!editingUser.user_name || !editingUser.rol_name) throw new Error('Nombre y rol son requeridos');
      if (editingUser.new_password && editingUser.new_password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
      const { data: { session } } = await supabase.auth.getSession();
      const payload = {
        user_name: editingUser.user_name,
        rol_name:  editingUser.rol_name,
        id_rol:    ROLE_MAPPING_MTTO[editingUser.rol_name],
      };
      if (editingUser.new_password) payload.new_password = editingUser.new_password;
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al actualizar usuario');
      showFeedback('✅ Usuario actualizado', 'success');
      setIsEditUserOpen(false);
      fetchUsers();
    } catch (err) {
      showFeedback(err.message);
    }
  };

  const handleDeleteUserClick = () => {
    setIsEditUserOpen(false);
    setIsConfirmUserOpen(true);
  };

  const handleConfirmDeleteUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al eliminar usuario');
      showFeedback('✅ Usuario eliminado', 'success');
      setIsConfirmUserOpen(false);
      fetchUsers();
    } catch (err) {
      showFeedback(err.message);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab 2: Home Positions (list_tec)
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchTechnicians = useCallback(async () => {
    setIsTecLoading(true);
    try {
      const { data, error } = await supabase.from('list_tec').select('id, tecnico').order('tecnico');
      if (error) throw error;
      setTechnicians(data || []);
    } catch (err) {
      showFeedback(err.message || 'Error al cargar técnicos');
    } finally {
      setIsTecLoading(false);
    }
  }, [showFeedback]);

  const openCreateTec = () => {
    setTecModalMode('create');
    setSelectedTec(null);
    setTecForm({ tecnico: '' });
    setIsTecModalOpen(true);
  };

  const openEditTec = (tec) => {
    setTecModalMode('edit');
    setSelectedTec(tec);
    setTecForm({ tecnico: tec.tecnico });
    setIsTecModalOpen(true);
  };

  const handleSaveTec = async () => {
    if (!tecForm.tecnico.trim()) { showFeedback('El nombre es requerido'); return; }
    try {
      if (tecModalMode === 'create') {
        const { error } = await supabase.from('list_tec').insert({ tecnico: tecForm.tecnico.trim() });
        if (error) throw error;
        showFeedback(`✅ ${tecForm.tecnico} agregado`, 'success');
      } else {
        const { error } = await supabase.from('list_tec').update({ tecnico: tecForm.tecnico.trim() }).eq('id', selectedTec.id);
        if (error) throw error;
        showFeedback('✅ Home Position actualizada', 'success');
      }
      setIsTecModalOpen(false);
      await fetchTechnicians();
    } catch (err) {
      showFeedback(err.message || 'Error al guardar');
    }
  };

  const handleDeleteTecClick = (tec) => {
    setSelectedTec(tec);
    setIsConfirmTecOpen(true);
  };

  const handleConfirmDeleteTec = async () => {
    try {
      const { error } = await supabase.from('list_tec').delete().eq('id', selectedTec.id);
      if (error) throw error;
      showFeedback('✅ Home Position eliminada', 'success');
      setIsConfirmTecOpen(false);
      await fetchTechnicians();
    } catch (err) {
      showFeedback(err.message || 'Error al eliminar');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => { fetchUsers(); },       [fetchUsers]);
  useEffect(() => { fetchTechnicians(); }, [fetchTechnicians]);

  if (authLoading) {
    return <div className={styles.container}><div className={styles.loading}>Cargando...</div></div>;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <RoleGate allowedRoles={['ADMIN_TEC']}>
      <div className={styles.container}>
        <FeedbackToast feedback={feedback} onClose={() => setFeedback(f => ({ ...f, show: false }))} />

        <div className={styles.panelHeader}>
          <h2>Administración Mantenimiento</h2>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className={styles.panelTabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👤 Usuarios
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'technicians' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('technicians')}
          >
            👨‍🔧 Técnicos
          </button>
        </div>

        <div className={styles.panelContent}>

          {/* ── Tab 1: Usuarios Auth ─────────────────────────────────────── */}
          {activeTab === 'users' && (
            <div className={styles.panel}>

              {/* Summary grid */}
              <div className={styles.summaryGrid}>
                {Object.entries(userSummary).map(([rol, count]) => (
                  <div key={rol} className={`${styles.summaryGridItem} ${SUMMARY_CLASS_MTTO[rol] ?? ''}`}>
                    <span className={styles.summaryLabel}>{ROLE_LABELS_MTTO[rol]}</span>
                    <strong className={styles.summaryCount}>{count}</strong>
                  </div>
                ))}
              </div>

              {/* Action bar */}
              <div className={styles.actionBar}>
                <button className={styles.addBtn} onClick={() => setIsCreateUserOpen(true)}>
                  + Nuevo Usuario
                </button>
              </div>

              {/* Table */}
              {isUserLoading ? (
                <div className={styles.loading}>Cargando usuarios...</div>
              ) : users.length === 0 ? (
                <div className={styles.emptyState}>No hay usuarios registrados</div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Tipo</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td>{u.user_name}</td>
                          <td className={styles.cellEmail}>{u.email}</td>
                          <td>
                            <span className={`${styles.roleBadge} ${styles['role' + u.rol_name] ?? ''}`}>
                              {ROLE_LABELS_MTTO[u.rol_name] ?? u.rol_name}
                            </span>
                          </td>
                          <td className={styles.cellActions}>
                            <button className={styles.actionBtn} onClick={() => openEditUser(u)} title="Editar">✏️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Modal: Crear usuario */}
              {isCreateUserOpen && (
                <div className={styles.modalOverlay}>
                  <div className={styles.modalContent}>
                    <h2 className={styles.modalTitle}>➕ Nuevo Usuario Mtto</h2>
                    <div className={styles.modalBody}>
                      <div className={styles.formGroup}>
                        <label>Usuario (sin @yazaki.com)</label>
                        <input type="text" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="usuario" autoFocus />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Contraseña</label>
                        <input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Nombre Completo</label>
                        <input type="text" value={newUser.user_name} onChange={e => setNewUser(p => ({ ...p, user_name: e.target.value }))} placeholder="Nombre del usuario" />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Tipo</label>
                        <select value={newUser.rol_name} onChange={e => setNewUser(p => ({ ...p, rol_name: e.target.value }))}>
                          {ROLE_OPTIONS_MTTO.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className={styles.modalActions}>
                      <button className={styles.cancelBtn} onClick={() => setIsCreateUserOpen(false)}>Cancelar</button>
                      <button className={styles.submitBtn} onClick={handleRegisterUser}>Registrar</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal: Editar usuario */}
              {isEditUserOpen && editingUser && (
                <div className={styles.modalOverlay}>
                  <div className={styles.modalContent}>
                    <h2 className={styles.modalTitle}>✏️ Editar Usuario</h2>
                    <div className={styles.modalBody}>
                      <div className={styles.formGroup}>
                        <label>Nombre</label>
                        <input type="text" value={editingUser.user_name} onChange={e => setEditingUser(p => ({ ...p, user_name: e.target.value }))} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Email</label>
                        <input type="email" value={editingUser.email} disabled />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Tipo</label>
                        <select value={editingUser.rol_name} onChange={e => setEditingUser(p => ({ ...p, rol_name: e.target.value }))}>
                          {ROLE_OPTIONS_MTTO.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Nueva Contraseña (opcional)</label>
                        <input type="password" value={editingUser.new_password} onChange={e => setEditingUser(p => ({ ...p, new_password: e.target.value }))} placeholder="Dejar vacío para no cambiar" />
                      </div>
                    </div>
                    <div className={styles.modalActions}>
                      <button className={styles.cancelBtn} onClick={() => setIsEditUserOpen(false)}>Cancelar</button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={handleDeleteUserClick}>Eliminar</button>
                      <button className={styles.submitBtn} onClick={handleUpdateUser}>Actualizar</button>
                    </div>
                  </div>
                </div>
              )}

              <ConfirmDeleteModal
                isOpen={isConfirmUserOpen}
                userName={editingUser?.user_name}
                onConfirm={handleConfirmDeleteUser}
                onCancel={() => setIsConfirmUserOpen(false)}
              />
            </div>
          )}

          {/* ── Tab 2: Tecnicos (list_tec) ─────────────────────────── */}
          {activeTab === 'technicians' && (
            <div className={styles.panel}>
              
              {/* Summary + action */}
              <div className={styles.panelHeader}>
                <div className={styles.summaryCard}>
                  <p className={styles.summaryLabel}>Total de técnicos</p>
                  <h3 className={styles.summaryCount}>{technicians.length}</h3>
                </div>
                <button className={styles.addBtn} onClick={openCreateTec}>
                  + Nuevo Tecnico
                </button>
              </div>

              {/* Table */}
              {isTecLoading ? (
                <div className={styles.loading}>Cargando...</div>
              ) : technicians.length === 0 ? (
                <div className={styles.emptyState}>No hay técnicos registrados</div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Técnicos</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {technicians.map(tec => (
                        <tr key={tec.id}>
                          <td>{tec.tecnico}</td>
                          <td className={styles.cellActions}>
                            <button className={styles.actionBtn} onClick={() => openEditTec(tec)} title="Editar">✏️</button>
                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDeleteTecClick(tec)} title="Eliminar">🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Modal: crear / editar Tecnico */}
              {isTecModalOpen && (
                <div className={styles.modalOverlay}>
                  <div className={styles.modalContent}>
                    <h2 className={styles.modalTitle}>
                      {tecModalMode === 'create' ? '➕ Nuevo Técnico' : '✏️ Editar Técnico'}
                    </h2>
                    <div className={styles.modalBody}>
                      <div className={styles.formGroup}>
                        <label>Técnico *</label>
                        <input
                          type="text"
                          value={tecForm.tecnico}
                          onChange={e => setTecForm({ tecnico: e.target.value })}
                          placeholder="Nombre del técnico"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className={styles.modalActions}>
                      <button className={styles.cancelBtn} onClick={() => setIsTecModalOpen(false)}>Cancelar</button>
                      <button className={styles.submitBtn} onClick={handleSaveTec}>
                        {tecModalMode === 'create' ? 'Agregar' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <ConfirmDeleteModal
                isOpen={isConfirmTecOpen}
                userName={selectedTec?.tecnico}
                onConfirm={handleConfirmDeleteTec}
                onCancel={() => setIsConfirmTecOpen(false)}
              />
            </div>
          )}

        </div>
      </div>
    </RoleGate>
  );
}
