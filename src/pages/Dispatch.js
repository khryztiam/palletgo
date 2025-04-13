import React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { StatusModal } from '../components/StatusModal';
import RoleGate from '../components/RoleGate';


export default function Dispatch() {
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const playNotificationSound = () => {
    const audio = new Audio('/notify01.mp3');
    audio.play().catch((err) => console.error('Error al reproducir el sonido:', err));
  };
  

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['SOLICITADO', 'EN PROGRESO'])
      .order('date_order', { ascending: true });

    setOrders(data || []);
  };

  useEffect(() => {
    fetchOrders(); // carga inicial

    const channel = supabase
      .channel('realtime-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const nueva = payload.new;
          if (['SOLICITADO', 'EN PROGRESO'].includes(nueva.status)) {
            setOrders((prev) => [...prev, nueva]);
            playNotificationSound();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const actualizada = payload.new;

          // Si el nuevo estado ya no aplica, la removemos
          if (!['SOLICITADO', 'EN PROGRESO'].includes(actualizada.status)) {
            setOrders((prev) =>
              prev.filter((o) => o.id_order !== actualizada.id_order)
            );
            return;
          }

          // Si sigue siendo válida, la actualizamos
          setOrders((prev) =>
            prev.map((order) =>
              order.id_order === actualizada.id_order ? actualizada : order
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // limpieza
    };
  }, []);

  const handleStatusUpdate = async (orderId, updates) => {
    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id_order', orderId);

    if (error) {
      console.error('Error actualizando:', error.message);
    }

    // Ya no hace falta fetchOrders() porque llega por realtime
  };

  return (
    <RoleGate allowedRoles={['EMBARQUE']}>
    <div className="dispatch-container">
      <h1>Control de Despachos</h1>
      
      <div className="orders-grid">
        {orders.map(order => (
          <Card
            key={order.id_order}
            order={order}
            variant="dispatch"
            onStatusClick={(order) => {
              setCurrentOrder(order);
              setIsModalOpen(true);
            }}
          />
        ))}
      </div>

      {isModalOpen && currentOrder && (
        <StatusModal
          order={currentOrder}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleStatusUpdate}
        />
      )}
    </div>
    </RoleGate>
  );
}