import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Modal from 'react-modal';
import RoleGate from '../components/RoleGate';
import styles from '@/styles/Boarding.module.css';

Modal.setAppElement('#__next');

// ─── Constantes ───────────────────────────────────────────────────────────────
const EMPTY_DELIVERER = { user_deliver: '' };

/**
 * Mapea el status de una orden al className del badge correspondiente.
 * Centralizado para evitar lógica inline en el JSX.
 */
const STATUS_CLASS = {
  'SOLICITADO':  styles.statusSolicitado,
  'EN PROGRESO': styles.statusEnProgreso,
  'ENTREGADO':   styles.statusEntregado,
  'CANCELADO':   styles.statusCancelado,
};

// ─── Subcomponente: ConfirmDeleteModal ────────────────────────────────────────
// Reemplaza window.confirm() — no bloquea el hilo principal y es estilizable.
const ConfirmDeleteModal = ({ isOpen, onConfirm, onCancel, name }) => (
  <Modal
    isOpen={isOpen}
    onRequestClose={onCancel}
    className={styles.confirmModal}
    overlayClassName={styles.modalOverlay}
    contentLabel="Confirmar eliminación"
  >
    <h3>¿Eliminar entregador?</h3>
    <p>
      Esta acción eliminará a <strong>{name}</strong> permanentemente y no se
      puede deshacer.
    </p>
    <div className={styles.confirmButtons}>
      <button onClick={onCancel}  className={styles.cancelButton}>Cancelar</button>
      <button onClick={onConfirm} className={styles.deleteButton}>Sí, eliminar</button>
    </div>
  </Modal>
);

// ─── Boarding Page ────────────────────────────────────────────────────────────
export default function Boarding() {
  const [deliverers,           setDeliverers]           = useState([]);
  const [orders,               setOrders]               = useState([]);
  const [loading,              setLoading]              = useState(true);

  // Modal de entregador (crear / editar)
  const [isDelivererModalOpen, setIsDelivererModalOpen] = useState(false);
  const [currentDeliverer,     setCurrentDeliverer]     = useState(EMPTY_DELIVERER);
  const [hasChanges,           setHasChanges]           = useState(false);

  // Modal de confirmación de eliminación
  const [isConfirmOpen,        setIsConfirmOpen]        = useState(false);

  // Modal de detalle de orden
  const [isOrderModalOpen,     setIsOrderModalOpen]     = useState(false);
  const [currentOrder,         setCurrentOrder]         = useState(null);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  const fetchDeliverers = useCallback(async () => {
    const { data, error } = await supabase.from('list_users').select('*');
    if (!error && data) setDeliverers(data);
  }, []);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('date_order', { ascending: false })
      .limit(25);
    if (!error && data) setOrders(data);
  }, []);

  // ── Realtime: órdenes ──────────────────────────────────────────────────────
  // MEJORA: La versión original cargaba las órdenes solo una vez (sin realtime).
  // Ahora se actualizan automáticamente cuando otro usuario cambia el estado.
  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchDeliverers(), fetchOrders()]);
      setLoading(false);
    };
    init();

    const channel = supabase
      .channel('boarding-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders(prev => {
            const exists = prev.some(o => o.id_order === payload.new.id_order);
            if (exists) return prev;
            // Mantener solo las últimas 25
            return [payload.new, ...prev].slice(0, 25);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders(prev =>
            prev.map(o => o.id_order === payload.new.id_order ? payload.new : o)
          );
          // Si el modal de orden está abierto y es la misma orden → actualizar
          setCurrentOrder(prev =>
            prev?.id_order === payload.new.id_order ? payload.new : prev
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchDeliverers, fetchOrders]);

  // ── Handlers: Deliverer Modal ──────────────────────────────────────────────
  const handleOpenNewDeliverer = () => {
    setCurrentDeliverer(EMPTY_DELIVERER);
    setHasChanges(false);
    setIsDelivererModalOpen(true);
  };

  const handleRowClick = (deliverer) => {
    setCurrentDeliverer(deliverer);
    setHasChanges(false);
    setIsDelivererModalOpen(true);
  };

  const handleDelivererChange = (e) => {
    setCurrentDeliverer(prev => ({ ...prev, user_deliver: e.target.value }));
    setHasChanges(true);
  };

  const handleSaveDeliverer = async () => {
    try {
      if (currentDeliverer.id) {
        await supabase
          .from('list_users')
          .update({ user_deliver: currentDeliverer.user_deliver })
          .eq('id', currentDeliverer.id);
      } else {
        await supabase
          .from('list_users')
          .insert([{ user_deliver: currentDeliverer.user_deliver }]);
      }
      await fetchDeliverers();
      setIsDelivererModalOpen(false);
    } catch (err) {
      console.error('Error saving deliverer:', err);
    }
  };

  // ── Handlers: Confirm Delete ───────────────────────────────────────────────
  // MEJORA: reemplaza window.confirm() por un modal propio no bloqueante.
  const handleDeleteClick = () => {
    setIsDelivererModalOpen(false); // Cierra el modal de edición
    setIsConfirmOpen(true);         // Abre el de confirmación
  };

  const handleConfirmDelete = async () => {
    try {
      await supabase
        .from('list_users')
        .delete()
        .eq('id', currentDeliverer.id);

      await fetchDeliverers();
      setIsConfirmOpen(false);
    } catch (err) {
      console.error('Error deleting deliverer:', err);
    }
  };

  // ── Handlers: Order Modal ──────────────────────────────────────────────────
  const handleOrderRowClick = (order) => {
    setCurrentOrder(order);
    setIsOrderModalOpen(true);
  };

  // ── Render: Loading ────────────────────────────────────────────────────────
  if (loading) {
    return <div className={styles.loading}>Cargando datos...</div>;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <RoleGate allowedRoles={['EMBARQUE']}>
      <div className={styles.container}>

        <div className={styles.panelsContainer}>

          {/* ── Panel: Entregadores ─────────────────────────────────────── */}
          <div className={`${styles.panel} ${styles.deliverersPanel}`}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Entregadores</h2>
              <button onClick={handleOpenNewDeliverer} className={styles.addButton}>
                + Agregar
              </button>
            </div>
            <div className={styles.panelContent}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Nombre</th></tr>
                </thead>
                <tbody>
                  {deliverers.map(deliverer => (
                    <tr
                      key={deliverer.id}
                      onClick={() => handleRowClick(deliverer)}
                      className={styles.clickableRow}
                    >
                      <td>{deliverer.user_deliver}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Panel: Últimas Órdenes ──────────────────────────────────── */}
          <div className={`${styles.panel} ${styles.ordersPanel}`}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Últimas 25 solicitudes</h2>
            </div>
            <div className={styles.panelContent}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Área</th>
                    <th>Estado</th>
                    <th>Destino</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr
                      key={order.id_order}
                      onClick={() => handleOrderRowClick(order)}
                      className={styles.clickableRow}
                    >
                      <td>{new Date(order.date_order).toLocaleDateString('es-MX')}</td>
                      <td>{order.area}</td>
                      <td>{order.status}</td>
                      <td>{order.destiny}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Modal: Crear / Editar Entregador ────────────────────────────── */}
        <Modal
          isOpen={isDelivererModalOpen}
          onRequestClose={() => setIsDelivererModalOpen(false)}
          className={styles.modal}
          overlayClassName={styles.modalOverlay}
          contentLabel={currentDeliverer?.id ? 'Editar Entregador' : 'Nuevo Entregador'}
        >
          <h2>{currentDeliverer?.id ? 'Editar Entregador' : 'Nuevo Entregador'}</h2>
          <div className={styles.modalForm}>
            <div className={styles.formGroup}>
              <label>Nombre del entregador:</label>
              <input
                type="text"
                value={currentDeliverer?.user_deliver || ''}
                onChange={handleDelivererChange}
                autoFocus
              />
            </div>
            <div className={styles.modalButtons}>
              {currentDeliverer?.id && (
                <button onClick={handleDeleteClick} className={styles.deleteButton}>
                  Eliminar
                </button>
              )}
              <button
                onClick={() => setIsDelivererModalOpen(false)}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveDeliverer}
                className={styles.saveButton}
                disabled={!hasChanges && !!currentDeliverer?.id}
              >
                Guardar
              </button>
            </div>
          </div>
        </Modal>

        {/* ── Modal: Confirmar Eliminación ─────────────────────────────────── */}
        <ConfirmDeleteModal
          isOpen={isConfirmOpen}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirmOpen(false)}
          name={currentDeliverer?.user_deliver}
        />

        {/* ── Modal: Detalle de Orden ──────────────────────────────────────── */}
        <Modal
          isOpen={isOrderModalOpen}
          onRequestClose={() => setIsOrderModalOpen(false)}
          className={styles.orderModal}
          overlayClassName={styles.modalOverlay}
          contentLabel="Detalles de la Orden"
        >
          <h2>Detalles de la Orden</h2>
          {currentOrder && (
            <div className={styles.orderContent}>

              {/* Campos de la orden */}
              {[
                { label: 'ID',          value: currentOrder.id_order },
                { label: 'Entregado',   value: currentOrder.user_deliver },
                { label: 'Fecha',       value: new Date(currentOrder.date_order).toLocaleString('es-MX') },
                { label: 'Área',        value: currentOrder.area },
                { label: 'Solicitante', value: currentOrder.user_submit },
                { label: 'Destino',     value: currentOrder.destiny },
              ].map(({ label, value }) => (
                <div key={label} className={styles.orderField}>
                  <span className={styles.orderLabel}>{label}:</span>
                  <span className={styles.orderValue}>{value || '—'}</span>
                </div>
              ))}

              {/* Status con badge */}
              <div className={styles.orderField}>
                <span className={styles.orderLabel}>Estado:</span>
                <span className={`${styles.statusBadge} ${STATUS_CLASS[currentOrder.status] ?? ''}`}>
                  {currentOrder.status}
                </span>
              </div>

              {/* Detalles (lista) */}
              <div className={styles.orderDetailsSection}>
                <span className={styles.orderLabel}>Detalles:</span>
                <ul className={styles.orderList}>
                  {(currentOrder.details || []).map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              </div>

              {/* Botones */}
              <div className={styles.orderButtons}>
                <button
                  className={styles.closeButton}
                  onClick={() => setIsOrderModalOpen(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </RoleGate>
  );
}