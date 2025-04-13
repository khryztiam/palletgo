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

  // Función para seleccionar el estado
  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
  };

  // Función para manejar el clic en la fila y abrir el modal con los datos de la orden
  const handleRowClick = (request) => {
    setSelectedRequest(request);  // Abre el modal con la información de la solicitud
  };

  // Filtrar solicitudes por estado
  const filteredRequests = orders.filter(
    (order) => order.status === selectedStatus
  );

  // Cargar órdenes desde Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('date_order', { ascending: false });

      if (error) {
        console.error('Error cargando órdenes:', error.message);
      } else {
        setOrders(data);
      }
    };

    fetchOrders();
  }, []);

  // Función para manejar la actualización de la orden
  const handleSaveOrder = async (updatedOrder) => {
    const updateData = {
      status: updatedOrder.status,
      destiny: updatedOrder.destiny,
      comments: updatedOrder.comments,
      user_deliver: updatedOrder.user_deliver,
    };
  
    // Registrar fecha de entrega si cambió a ENTREGADO
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
      // Actualizar el estado local
      setOrders(prev =>
        prev.map(order =>
          order.id_order === updatedOrder.id_order
            ? { ...order, ...updateData }
            : order
        )
      );
      setSelectedRequest(null); // Cierra el modal
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

        {/* Tabla con últimas 5 solicitudes */}
        {selectedStatus && (
          <RequestTable requests={filteredRequests.slice(0, 5)} onRowClick={handleRowClick} />
        )}

        {/* Modal para editar la solicitud */}
        {selectedRequest && (
          <OrderModal 
            order={selectedRequest}
            isOpen={!!selectedRequest}  
            onSave={handleSaveOrder} 
            onClose={() => setSelectedRequest(null)} 
          />
        )}

        {/* Panel de gestión de opciones de detalle */}
        <DetailOptionsPanel />
      </div>
    </AdminGate>
  );
};

export default Control;
