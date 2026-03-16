import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Card } from "../components/Card";
import { StatusModal } from "../components/StatusModal";
import RoleGate from "../components/RoleGate";
import styles from "@/styles/Dispatch.module.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Calcula los segundos transcurridos desde la creación de una orden. */
const calculateElapsedTime = (orderDate) => {
  const created = new Date(orderDate);
  const now     = new Date();
  return Math.floor((now - created) / 1000);
};

// ─── Dispatch Page ────────────────────────────────────────────────────────────
export default function Dispatch() {
  const [orders,         setOrders]         = useState([]);
  const [currentOrder,   setCurrentOrder]   = useState(null);
  const [isModalOpen,    setIsModalOpen]     = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // useRef para timers: no causa re-renders al mutar, a diferencia de useState
  const timers   = useRef({});
  const audioRef = useRef(null);

  // ── Interacción del usuario (activa audio/voz) ──────────────────────────────
  // FIX: Separado del useEffect principal para no re-suscribir el canal Supabase
  // cada vez que el usuario interactúa con la pantalla.
  useEffect(() => {
    const handleUserInteraction = () => {
      setUserInteracted(true);
      if (audioRef.current) audioRef.current.load();
    };

    document.addEventListener("click",      handleUserInteraction, { once: true });
    document.addEventListener("touchstart", handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener("click",      handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };
  // Sin deps: solo se registra una vez al montar el componente
  }, []);

  // ── Precargar voces de síntesis de voz ─────────────────────────────────────
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }, []);

  // ── Notificación de voz ────────────────────────────────────────────────────
  const playVoiceNotification = useCallback((order) => {
    if (!userInteracted || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(
      `Nueva orden de ${order.area} solicitada por ${order.user_submit}`
    );
    speech.lang   = "es-ES";
    speech.rate   = 0.9;
    speech.pitch  = 1.1;
    speech.volume = 0.8;

    const voices      = window.speechSynthesis.getVoices();
    const daliaVoice  = voices.find(v =>
      v.name === "Microsoft Dalia Online (Natural) - Spanish (Mexico)"
    );
    const spanishVoice = daliaVoice || voices.find(v => v.lang.includes("es"));

    if (spanishVoice) {
      speech.voice = spanishVoice;
      speech.lang  = spanishVoice.lang;
    }

    window.speechSynthesis.speak(speech);
  }, [userInteracted]);

  // ── Timer helpers ──────────────────────────────────────────────────────────
  const startTimer = useCallback((orderId, initialSeconds = 0) => {
    // Limpiar timer previo si existe
    if (timers.current[orderId]) clearInterval(timers.current[orderId]);

    timers.current[orderId] = setInterval(() => {
      setOrders(prev =>
        prev.map(order =>
          order.id_order === orderId
            ? { ...order, elapsedSeconds: (order.elapsedSeconds ?? initialSeconds) + 1 }
            : order
        )
      );
    }, 1000);
  }, []);

  const stopTimer = useCallback((orderId) => {
    if (timers.current[orderId]) {
      clearInterval(timers.current[orderId]);
      delete timers.current[orderId];
    }
  }, []);

  // ── Carga inicial de órdenes ───────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["SOLICITADO", "EN PROGRESO"])
      .order("date_order", { ascending: true });

    const withTimers = (data || []).map(order => ({
      ...order,
      elapsedSeconds: calculateElapsedTime(order.date_order || order.created_at),
    }));

    setOrders(withTimers);
    withTimers.forEach(order => startTimer(order.id_order, order.elapsedSeconds));
  }, [startTimer]);

  // ── Suscripción realtime ───────────────────────────────────────────────────
  // FIX: useEffect separado del de interacción para no re-suscribir al canal
  // cada vez que el usuario toca la pantalla.
  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("dispatch-realtime-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const nueva = payload.new;
          if (!["SOLICITADO", "EN PROGRESO"].includes(nueva.status)) return;

          setOrders(prev => {
            const exists = prev.some(o => o.id_order === nueva.id_order);
            if (exists) return prev;

            const orderWithTimer = {
              ...nueva,
              elapsedSeconds: calculateElapsedTime(nueva.date_order || nueva.created_at),
            };

            startTimer(nueva.id_order, orderWithTimer.elapsedSeconds);
            playVoiceNotification(nueva);

            return [...prev, orderWithTimer];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const actualizada = payload.new;

          if (!["SOLICITADO", "EN PROGRESO"].includes(actualizada.status)) {
            stopTimer(actualizada.id_order);
            setOrders(prev => prev.filter(o => o.id_order !== actualizada.id_order));
            return;
          }

          setOrders(prev =>
            prev.map(order =>
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
      Object.values(timers.current).forEach(clearInterval);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [fetchOrders, startTimer, stopTimer, playVoiceNotification]);

  // ── Update status ──────────────────────────────────────────────────────────
  const handleStatusUpdate = async (orderId, updates) => {
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch('/api/orders/updateStatus', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_order: orderId, updates }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Error actualizando:", err.error);
      return;
    }

    // Actualizar estado local inmediatamente (sin esperar realtime)
    const terminalStatuses = ["ENTREGADO", "CANCELADO"];
    if (terminalStatuses.includes(updates.status)) {
      stopTimer(orderId);
      setOrders(prev => prev.filter(o => o.id_order !== orderId));
    } else {
      setOrders(prev =>
        prev.map(order =>
          order.id_order === orderId
            ? { ...order, ...updates }
            : order
        )
      );
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <RoleGate allowedRoles={["EMBARQUE"]}>

      {/* Audio oculto para notificaciones */}
      <audio ref={audioRef} preload="auto" style={{ display: "none" }}>
        <source src="/notify01.mp3" type="audio/mpeg" />
      </audio>

      {/* Banner de activación de audio */}
      {!userInteracted && (
        <div className={styles.interactionPrompt}>
          👆 Haz clic en cualquier lugar para activar las notificaciones de audio
        </div>
      )}

      <div className={styles.container}>
        

        <div className={styles.ordersGrid}>
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