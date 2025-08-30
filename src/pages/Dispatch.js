import React from "react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Card } from "../components/Card";
import { StatusModal } from "../components/StatusModal";
import RoleGate from "../components/RoleGate";

export default function Dispatch() {
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const timers = useRef({});
  const audioRef = useRef(null);

  // Función para manejar la interacción del usuario
  const handleUserInteraction = () => {
    if (!userInteracted) {
      setUserInteracted(true);
      // Precargar el audio después de la interacción
      if (audioRef.current) {
        audioRef.current.load();
      }
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    }
  };

  // Función para reproducir notificación de voz
  const playVoiceNotification = (order) => {
    if (!userInteracted) return;
    
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      const message = `Nueva orden de ${order.area} solicitada por ${order.user_submit}`;
      const speech = new SpeechSynthesisUtterance(message);

      speech.lang = "es-ES";
      speech.rate = 0.9;
      speech.pitch = 1.1;
      speech.volume = 0.8;

      // Buscar específicamente Microsoft Dalia
    const voices = window.speechSynthesis.getVoices();
    const daliaVoice = voices.find(
      (voice) => voice.name === 'Microsoft Dalia Online (Natural) - Spanish (Mexico)'
    );

    // Si no encuentra Dalia, buscar cualquier voz en español
    const spanishVoice = daliaVoice || voices.find(
      (voice) => voice.lang.includes("es")
    );

    if (spanishVoice) {
      speech.voice = spanishVoice;
      speech.lang = spanishVoice.lang; // Usar el idioma de la voz seleccionada
    }

    window.speechSynthesis.speak(speech);
  }
};

  // Función para reproducir sonido de notificación (solo después de interacción)
  const playNotificationSound = () => {
    if (!userInteracted) return;
    
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.error("Error al reproducir el sonido:", err);
      });
    }
  };

  const calculateElapsedTime = (orderDate) => {
    const created = new Date(orderDate);
    const now = new Date();
    return Math.floor((now - created) / 1000);
  };

  const startTimer = (orderId, initialSeconds = 0) => {
    if (timers.current[orderId]) {
      clearInterval(timers.current[orderId]);
    }

    timers.current[orderId] = setInterval(() => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id_order === orderId) {
            const elapsedSeconds = (order.elapsedSeconds || initialSeconds) + 1;
            return { ...order, elapsedSeconds };
          }
          return order;
        })
      );
    }, 1000);
  };

  const stopTimer = (orderId) => {
    if (timers.current[orderId]) {
      clearInterval(timers.current[orderId]);
      delete timers.current[orderId];
    }
  };

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["SOLICITADO", "EN PROGRESO"])
      .order("date_order", { ascending: true });

    const ordersWithTimer = (data || []).map((order) => ({
      ...order,
      elapsedSeconds: calculateElapsedTime(order.date_order || order.created_at),
    }));

    setOrders(ordersWithTimer);
    ordersWithTimer.forEach((order) => {
      startTimer(order.id_order, order.elapsedSeconds);
    });
  };

  useEffect(() => {
    // Configurar detectores de interacción del usuario
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    fetchOrders();

    const channel = supabase
      .channel("dispatch-realtime-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const nueva = payload.new;
          if (["SOLICITADO", "EN PROGRESO"].includes(nueva.status)) {
            setOrders((prev) => {
              const exists = prev.some((o) => o.id_order === nueva.id_order);
              if (exists) return prev;

              const orderWithTimer = {
                ...nueva,
                elapsedSeconds: calculateElapsedTime(nueva.date_order || nueva.created_at),
              };
              
              startTimer(nueva.id_order, orderWithTimer.elapsedSeconds);
              //playNotificationSound();
              playVoiceNotification(nueva);
              
              return [...prev, orderWithTimer];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const actualizada = payload.new;

          if (!["SOLICITADO", "EN PROGRESO"].includes(actualizada.status)) {
            stopTimer(actualizada.id_order);
            setOrders((prev) =>
              prev.filter((o) => o.id_order !== actualizada.id_order)
            );
            return;
          }

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

    return () => {
      supabase.removeChannel(channel);
      Object.values(timers.current).forEach((timer) => clearInterval(timer));
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [userInteracted]);

  const handleStatusUpdate = async (orderId, updates) => {
    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id_order", orderId);

    if (error) {
      console.error("Error actualizando:", error.message);
    }
  };

  return (
    <RoleGate allowedRoles={["EMBARQUE"]}>
      {/* Elemento de audio oculto para precargar y reproducir */}
      <audio ref={audioRef} preload="auto" style={{ display: 'none' }}>
        <source src="/notify01.mp3" type="audio/mpeg" />
      </audio>
      
      <div className="dispatch-container">
        {!userInteracted && (
          <div className="interaction-prompt" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: '#ffc107',
            color: '#000',
            padding: '10px',
            textAlign: 'center',
            zIndex: 1000
          }}>
            👆 Haz clic en cualquier lugar para activar las notificaciones de audio
          </div>
        )}
        
        <h1>Control de Despachos</h1>

        <div className="orders-grid">
          {orders.map((order) => (
            <Card
              key={order.id_order}
              order={order}
              variant="dispatch"
              onStatusClick={(order) => {
                setCurrentOrder(order);
                setIsModalOpen(true);
              }}
              showTimer={true}
              isAlerting={order.elapsedSeconds >= 15 * 60}
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