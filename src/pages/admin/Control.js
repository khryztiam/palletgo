// /src/pages/admin/Control.js
import AdminGate from '@/components/AdminGate';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
// Components
import StatusCards from '@/components/admin/control/StatusCards';
import RequestTable from '@/components/admin/control/OrdersTable';
import OrderModal from '@/components/admin/control/OrderModal';
import DetailOptionsPanel from '@/components/admin/control/DetailOptionsPanel';

const Control = () => {
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [orders, setOrders] = useState([]);

  // Selección por estado
  const handleStatusSelect = (status) => setSelectedStatus(status);

  // Clic en fila → abrir modal
  const handleRowClick = (request) => setSelectedRequest(request);

  // Filtrado por estado
  const filteredRequests = orders.filter(
    (order) => !selectedStatus || order.status === selectedStatus
  );

  // --- Carga órdenes del día actual ---
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

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
    };

    fetchOrders();
  }, []);

  // --- Guardar actualización de orden ---
  const handleSaveOrder = async (updatedOrder) => {
    const updateData = {
      status: updatedOrder.status,
      destiny: updatedOrder.destiny,
      comments: updatedOrder.comments,
      user_deliver: updatedOrder.user_deliver,
    };

    const originalOrder = orders.find(o => o.id_order === updatedOrder.id_order);

    const wasDelivered = originalOrder?.status === 'ENTREGADO';
    const isNowDelivered = updatedOrder.status === 'ENTREGADO';

    if (isNowDelivered && !wasDelivered && !originalOrder.date_delivery) {
      updateData.date_delivery = new Date().toISOString();
    }

    const { data, error } = await supabase
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

  // --- ELIMINAR ORDEN ---
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta orden? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id_order', orderId);

      if (error) throw error;

      // Actualizar estado local
      setOrders(prev => prev.filter(order => order.id_order !== orderId));
      
      // Cerrar modal si estaba abierto
      if (selectedRequest?.id_order === orderId) {
        setSelectedRequest(null);
      }

      alert('Orden eliminada correctamente');
    } catch (error) {
      console.error('Error eliminando orden:', error);
      alert('Error al eliminar la orden: ' + error.message);
    }
  };

  return (
    <AdminGate>
      <div className="control-container">
        <h1>Control de Solicitudes</h1>
        <p>Bienvenido a Control, aquí podrás modificar la información de las solicitudes.</p>

        {/* Tarjetas por estado */}
        <StatusCards
          selected={selectedStatus}
          onSelect={setSelectedStatus}
          orders={orders}
        />

        {/* Tabla últimas 10 */}
        <RequestTable
          requests={filteredRequests.slice(0, 10)}
          onRowClick={handleRowClick}
        />

        {/* Modal para editar */}
        {selectedRequest && (
          <OrderModal
            order={selectedRequest}
            isOpen={!!selectedRequest}
            onSave={handleSaveOrder}
            onDelete={handleDeleteOrder}
            onClose={() => setSelectedRequest(null)}
          />
        )}

        {/* Panel de opciones */}
        <DetailOptionsPanel />
      </div>
    </AdminGate>
  );
};

export default Control;
