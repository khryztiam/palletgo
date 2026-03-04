// /src/pages/admin/Control.jsx
import AdminGate from '@/components/AdminGate';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import StatusCards from '@/components/admin/control/StatusCards';
import RequestTable from '@/components/admin/control/OrdersTable';
import OrderModal from '@/components/admin/control/OrderModal';
import DetailOptionsPanel from '@/components/admin/control/DetailOptionsPanel';
import styles from '@/styles/Control.module.css';

// ─── Subcomponente: ConfirmDeleteModal ────────────────────────────────────────
// Reemplaza window.confirm() y alert() de handleDeleteOrder
const ConfirmDeleteModal = ({ isOpen, orderId, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
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
// Reemplaza alert() para resultados de operaciones
const FeedbackToast = ({ message, type, onClose }) => {
  if (!message) return null;

  return (
    <div
      className={styles.modalOverlay}
      style={{ background: 'transparent', pointerEvents: 'none' }}
    >
      <div
        style={{
          position: 'fixed',
          top: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          borderRadius: '8px',
          background: type === 'success' ? '#38a169' : '#e53e3e',
          color: 'white',
          zIndex: 1200,
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          pointerEvents: 'all',
          minWidth: '280px',
        }}
      >
        <span>{message}</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.1rem' }}
          aria-label="Cerrar"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

// ─── Control Page ─────────────────────────────────────────────────────────────
const Control = () => {
  const [selectedStatus,  setSelectedStatus]  = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [orders,          setOrders]          = useState([]);

  // Estado para el modal de confirmación de eliminación
  const [confirmDelete,   setConfirmDelete]   = useState({ open: false, orderId: null });
  // Estado para el toast de feedback (reemplaza alert)
  const [toast,           setToast]           = useState({ message: '', type: '' });

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), duration);
  }, []);

  // Filtrado reactivo por status
  const filteredRequests = orders.filter(
    order => !selectedStatus || order.status === selectedStatus
  );

  // ── Carga de órdenes del día ───────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const today      = new Date();
      const startOfDay = new Date(today.setHours(0,  0,  0,   0)).toISOString();
      const endOfDay   = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('date_order', startOfDay)
        .lte('date_order', endOfDay)
        .order('date_order', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error cargando órdenes:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Guardar orden ──────────────────────────────────────────────────────────
  const handleSaveOrder = async (updatedOrder) => {
    const updateData    = {
      status:       updatedOrder.status,
      destiny:      updatedOrder.destiny,
      comments:     updatedOrder.comments,
      user_deliver: updatedOrder.user_deliver,
    };
    const originalOrder = orders.find(o => o.id_order === updatedOrder.id_order);

    // Asignar fecha de entrega solo si transiciona a ENTREGADO por primera vez
    if (
      updatedOrder.status === 'ENTREGADO' &&
      originalOrder?.status !== 'ENTREGADO' &&
      !originalOrder?.date_delivery
    ) {
      updateData.date_delivery = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id_order', updatedOrder.id_order);

    if (error) {
      console.error('Error al guardar la orden:', error.message);
    } else {
      setOrders(prev =>
        prev.map(order =>
          order.id_order === updatedOrder.id_order
            ? { ...order, ...updateData }
            : order
        )
      );
      setSelectedRequest(null);
    }
  };

  // ── Eliminar orden ─────────────────────────────────────────────────────────
  // FIX: reemplaza window.confirm() + alert() por modales propios
  const handleDeleteOrder = (orderId) => {
    setSelectedRequest(null);             // Cerrar modal de edición
    setConfirmDelete({ open: true, orderId }); // Abrir confirmación
  };

  const handleConfirmDelete = async () => {
    const { orderId } = confirmDelete;
    setConfirmDelete({ open: false, orderId: null });

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id_order', orderId);

      if (error) throw error;

      setOrders(prev => prev.filter(order => order.id_order !== orderId));
      showToast('Orden eliminada correctamente', 'success');
    } catch (err) {
      console.error('Error eliminando orden:', err);
      showToast('Error al eliminar la orden: ' + err.message, 'error');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminGate>
      <div className={styles.container}>
        <StatusCards
          selected={selectedStatus}
          onSelect={setSelectedStatus}
          orders={orders}
        />

        <RequestTable
          requests={filteredRequests.slice(0, 10)}
          onRowClick={setSelectedRequest}
        />

        {selectedRequest && (
          <OrderModal
            order={selectedRequest}
            isOpen={!!selectedRequest}
            onSave={handleSaveOrder}
            onDelete={handleDeleteOrder}
            onClose={() => setSelectedRequest(null)}
          />
        )}

        <DetailOptionsPanel />

        {/* Modal de confirmación de eliminación */}
        <ConfirmDeleteModal
          isOpen={confirmDelete.open}
          orderId={confirmDelete.orderId}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete({ open: false, orderId: null })}
        />

        {/* Toast de feedback (reemplaza alert) */}
        <FeedbackToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: '' })}
        />
      </div>
    </AdminGate>
  );
};

export default Control;