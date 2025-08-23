import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { StatusModal } from '../components/StatusModal';
import RoleGate from '../components/RoleGate';

export default function Dispatch() {
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const timers = useRef({}); // Referencia para almacenar los intervalos

  const playNotificationSound = () => {
    const audio = new Audio('/notify01.mp3');
    audio.play().catch((err) => console.error('Error al reproducir el sonido:', err));
  };
  
  // Función para calcular el tiempo transcurrido desde la creación de la orden
  const calculateElapsedTime = (orderDate) => {
    const created = new Date(orderDate);
    const now = new Date();
    return Math.floor((now - created) / 1000); // Tiempo en segundos
  };

  // Iniciar cronómetro para una orden
  const startTimer = (orderId, initialSeconds = 0) => {
    // Limpiar timer existente si hay uno
    if (timers.current[orderId]) {
      clearInterval(timers.current[orderId]);
    }

    timers.current[orderId] = setInterval(() => {
      setOrders(prev => prev.map(order => {
        if (order.id_order === orderId) {
          const elapsedSeconds = (order.elapsedSeconds || initialSeconds) + 1;
          return { ...order, elapsedSeconds };
        }
        return order;
      }));
    }, 1000);
  };

  // Detener cronómetro para una orden
  const stopTimer = (orderId) => {
    if (timers.current[orderId]) {
      clearInterval(timers.current[orderId]);
      delete timers.current[orderId];
    }
  };

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['SOLICITADO', 'EN PROGRESO'])
      .order('date_order', { ascending: true });

    // Inicializar el tiempo transcurrido para cada orden
    const ordersWithTimer = (data || []).map(order => ({
      ...order,
      elapsedSeconds: calculateElapsedTime(order.date_order || order.created_at)
    }));

    setOrders(ordersWithTimer);

    // Iniciar timers para todas las órdenes
    ordersWithTimer.forEach(order => {
      startTimer(order.id_order, order.elapsedSeconds);
    });
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
            const orderWithTimer = {
              ...nueva,
              elapsedSeconds: calculateElapsedTime(nueva.date_order || nueva.created_at)
            };
            setOrders((prev) => [...prev, orderWithTimer]);
            startTimer(nueva.id_order, orderWithTimer.elapsedSeconds);
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

          // Si el nuevo estado ya no aplica, la removemos y detenemos el timer
          if (!['SOLICITADO', 'EN PROGRESO'].includes(actualizada.status)) {
            stopTimer(actualizada.id_order);
            setOrders((prev) =>
              prev.filter((o) => o.id_order !== actualizada.id_order)
            );
            return;
          }

          // Si sigue siendo válida, la actualizamos manteniendo el elapsedSeconds
          setOrders((prev) =>
            prev.map((order) =>
              order.id_order === actualizada.id_order 
                ? { ...actualizada, elapsedSeconds: order.elapsedSeconds } 
                : order
            )
          );
        }
      )
      .subscribe();

    // Limpieza: detener todos los timers al desmontar el componente
    return () => {
      supabase.removeChannel(channel);
      Object.values(timers.current).forEach(timer => clearInterval(timer));
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
              showTimer={true}
              isAlerting={order.elapsedSeconds >= 8 * 60}
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