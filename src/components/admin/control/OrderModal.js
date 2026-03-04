// src/components/admin/control/OrderModal.js
import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { FaTimes } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import Select from 'react-select';
import styles from '@/styles/Control.module.css';

Modal.setAppElement('#__next');

// ─── Subcomponente: ConfirmDeleteModal ────────────────────────────────────────
// Reemplaza window.confirm() dentro del modal de orden
const ConfirmDeleteModal = ({ isOpen, orderId, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay} style={{ zIndex: 1200 }}>
      <div className={styles.confirmModal}>
        <h3>¿Eliminar orden?</h3>
        <p>
          La orden <strong>#{orderId}</strong> será eliminada permanentemente.
          Esta acción no se puede deshacer.
        </p>
        <div className={styles.confirmButtons}>
          <button onClick={onCancel}  className={styles.cancelBtn}>Cancelar</button>
          <button onClick={onConfirm} className={styles.deleteBtn}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
};

// ─── Subcomponente: FeedbackToast ─────────────────────────────────────────────
// Reemplaza alert() dentro del modal de orden
const InlineAlert = ({ message, type }) => {
  if (!message) return null;
  const bg = type === 'success' ? '#f0fdf4' : '#fff5f5';
  const border = type === 'success' ? '#28a745' : '#dc3545';
  const color  = type === 'success' ? '#166534' : '#991b1b';
  return (
    <div style={{
      background: bg, borderLeft: `4px solid ${border}`, color,
      padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: '0.9rem',
    }}>
      {message}
    </div>
  );
};

// ─── OrderModal ───────────────────────────────────────────────────────────────
const OrderModal = ({ order, isOpen, onClose, onSave, onDelete }) => {
  const [status,       setStatus]       = useState(order.status       || '');
  const [comments,     setComments]     = useState(order.comments     || '');
  const [destiny,      setDestiny]      = useState(order.destiny      || '');
  const [userDeliver,  setUserDeliver]  = useState(order.user_deliver || '');
  const [userSubmit,   setUserSubmit]   = useState(order.user_submit  || '');
  const [area,         setArea]         = useState(order.area         || '');
  const [details,      setDetails]      = useState(order.details      || []);
  const [userOptions,  setUserOptions]  = useState([]);
  const [detailOptions,setDetailOptions]= useState([]);
  const [loading,      setLoading]      = useState(false);
  const [confirmOpen,  setConfirmOpen]  = useState(false);
  const [alert,        setAlert]        = useState({ message: '', type: '' });

  // Sincronizar cuando la orden cambia
  useEffect(() => {
    setStatus(order.status       || '');
    setComments(order.comments   || '');
    setDestiny(order.destiny     || '');
    setUserDeliver(order.user_deliver || '');
    setUserSubmit(order.user_submit   || '');
    setArea(order.area           || '');
    setDetails(order.details     || []);
  }, [order]);

  // Carga paralela de usuarios y opciones de detalle
  const fetchData = useCallback(async () => {
    const [usersRes, detailsRes] = await Promise.all([
      supabase.from('list_users').select('user_deliver'),
      supabase.from('detail_options').select('*').order('label', { ascending: true }),
    ]);

    if (!usersRes.error   && usersRes.data)   setUserOptions(usersRes.data.map(r => r.user_deliver));
    if (!detailsRes.error && detailsRes.data) setDetailOptions(detailsRes.data);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showAlert = (message, type = 'error', duration = 4000) => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: '', type: '' }), duration);
  };

  // ── Guardar ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = { status, comments, destiny, details, user_deliver: userDeliver, user_submit: userSubmit, area };

      if (status === 'ENTREGADO' && order.status !== 'ENTREGADO' && !order.date_delivery) {
        updateData.date_delivery = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id_order', order.id_order);

      if (error) throw error;

      showAlert('Orden actualizada con éxito', 'success');
      onSave({ ...order, ...updateData });
      setTimeout(onClose, 800);
    } catch (err) {
      console.error('Error actualizando la orden:', err.message);
      showAlert('Error al actualizar la orden: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Eliminar ───────────────────────────────────────────────────────────────
  // FIX: reemplaza window.confirm() + alert() por modales propios
  const handleDeleteClick = () => setConfirmOpen(true);

  const handleConfirmDelete = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      await onDelete(order.id_order);
    } catch (err) {
      console.error('Error eliminando orden:', err);
      showAlert('Error al eliminar la orden: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        contentLabel="Modificar Orden"
        className={styles.modalContent}
        overlayClassName={styles.modalOverlay}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2>Modificar Orden #{order.id_order}</h2>
          <button onClick={onClose} disabled={loading} className={styles.modalClose} aria-label="Cerrar">
            <FaTimes />
          </button>
        </div>

        {/* Alerta inline (reemplaza alert) */}
        <div style={{ padding: '0 20px' }}>
          <InlineAlert message={alert.message} type={alert.type} />
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label>Área:</label>
            <input value={area} onChange={(e) => setArea(e.target.value)} disabled={loading} />
          </div>

          <div className={styles.formGroup}>
            <label>Solicitado por:</label>
            <input value={userSubmit} onChange={(e) => setUserSubmit(e.target.value)} disabled={loading} />
          </div>

          <div className={styles.formGroup}>
            <label>Detalles:</label>
            <Select
              isMulti
              options={detailOptions.map(opt => ({ value: opt.value, label: opt.label }))}
              value={detailOptions
                .filter(opt => details.includes(opt.value))
                .map(opt => ({ value: opt.value, label: opt.label }))}
              onChange={(selected) => setDetails(selected ? selected.map(o => o.value) : [])}
              placeholder="Seleccione los detalles..."
              noOptionsMessage={() => 'No hay más opciones'}
              classNamePrefix="react-select"
              isDisabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Estado:</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={loading}>
              <option value="">-- Seleccionar --</option>
              <option value="SOLICITADO">SOLICITADO</option>
              <option value="EN PROGRESO">EN PROGRESO</option>
              <option value="ENTREGADO">ENTREGADO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Destino:</label>
            <select value={destiny} onChange={(e) => setDestiny(e.target.value)} disabled={loading}>
              <option value="">-- Seleccionar --</option>
              <option value="EPC">EPC</option>
              <option value="EMPAQUE">EMPAQUE</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Entregado por:</label>
            <select value={userDeliver} onChange={(e) => setUserDeliver(e.target.value)} disabled={loading}>
              <option value="">-- Seleccionar --</option>
              {userOptions.map((user, idx) => (
                <option key={idx} value={user}>{user}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Comentarios:</label>
            <textarea value={comments} onChange={(e) => setComments(e.target.value)} disabled={loading} rows={3} />
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.footerLeft}>
            <button onClick={handleDeleteClick} className={styles.deleteBtn} disabled={loading}>
              {loading ? 'Procesando...' : 'Eliminar Orden'}
            </button>
          </div>
          <div className={styles.footerRight}>
            <button onClick={onClose}    className={styles.cancelBtn} disabled={loading}>Cancelar</button>
            <button onClick={handleSave} className={styles.saveBtn}   disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación de eliminación — fuera del Modal principal */}
      <ConfirmDeleteModal
        isOpen={confirmOpen}
        orderId={order.id_order}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
};

export default OrderModal;