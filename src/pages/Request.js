import React, { useState, useEffect, useCallback, useRef } from "react";
import Select from "react-select";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import RoleGate from "../components/RoleGate";
import Modal from "react-modal";
import styles from "@/styles/Request.module.css";

Modal.setAppElement("#__next");

// ─── Constantes ───────────────────────────────────────────────────────────────
const RETIRO_CONTENEDOR = "RETIRO DE CONTENEDOR";
const RETIRO_TARIMA     = "RETIRO DE TARIMA";
const DESTINY_OPTIONS   = ["EMBARQUE", "EPC"];

const INITIAL_FORM = (userName = "") => ({
  area:        userName,
  user_submit: "",
  details:     [],
  destiny:     "",
  comments:    "",
  print_label: "",
  multilabel:  [],
});

// ─── Config de status ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  "SOLICITADO":  { color: "#f59e0b", bg: "#fffbeb", icon: "⏳" },
  "EN PROGRESO": { color: "#3b82f6", bg: "#eff6ff", icon: "🚛" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) =>
  new Date(iso).toLocaleString("es-MX", {
    day: "numeric", month: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  });

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

// ─── Subcomponente: Stepper ───────────────────────────────────────────────────
const STATUS_IDX = { "SOLICITADO": 0, "EN PROGRESO": 1, "ENTREGADO": 2 };
const STEPS = ["Solicitado", "En Progreso", "Entregado"];

const OrderStepper = ({ status, aheadCount }) => {
  const currentIdx = STATUS_IDX[status] ?? 0;
  return (
    <div className={styles.stepperWrapper}>
      <div className={styles.stepperTrack}>
        {STEPS.map((step, i) => {
          const isDone   = i < currentIdx;
          const isActive = i === currentIdx;
          return (
            <div key={step} className={styles.stepperItem}>
              <div className={[
                styles.stepCircle,
                isDone   ? styles.stepDone   : "",
                isActive ? styles.stepActive : "",
              ].join(" ")}>
                {isDone ? "✓" : i + 1}
              </div>
              <span className={[
                styles.stepLabel,
                isActive ? styles.stepLabelActive : "",
                isDone   ? styles.stepLabelDone   : "",
              ].join(" ")}>
                {step}
              </span>
              {i < 2 && (
                <div className={`${styles.stepLine} ${isDone ? styles.stepLineDone : ""}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mensaje contextual */}
      <div className={styles.stepperMsg}>
        {status === "SOLICITADO" && aheadCount > 0 && (
          <span className={styles.msgWaiting}>
            Hay <strong>{aheadCount} orden{aheadCount !== 1 ? "es" : ""}</strong> antes que la tuya
          </span>
        )}
        {status === "SOLICITADO" && aheadCount === 0 && (
          <span className={styles.msgNext}>🎉 ¡Eres el siguiente en la cola!</span>
        )}
        {status === "EN PROGRESO" && (
          <span className={styles.msgProgress}>🚛 Tu orden está siendo atendida ahora</span>
        )}
      </div>
    </div>
  );
};

// ─── Subcomponente: Mi Orden Card ─────────────────────────────────────────────
const MyOrderCard = ({ order, queuePosition, aheadCount }) => (
  <div className={styles.myOrderCard}>
    {/* Header */}
    <div className={styles.myOrderHeader}>
      <div className={styles.myOrderHeaderLeft}>
        <span className={styles.myOrderBadge}>★ Tu orden</span>
        <span className={styles.myOrderTitle}>
          {order.area} — Orden #{order.id_order}
        </span>
      </div>
      {order.status === "SOLICITADO" && (
        <div className={styles.positionBadge}>
          <span className={styles.positionNumber}>#{queuePosition}</span>
          <span className={styles.positionLabel}>EN COLA</span>
        </div>
      )}
      {order.status === "EN PROGRESO" && (
        <div className={styles.inProgressBadge}>🚛 ATENDIENDO</div>
      )}
    </div>

    {/* Body */}
    <div className={styles.myOrderBody}>
      <div className={styles.myOrderCol}>
        <p className={styles.orderDate}>{fmtDate(order.date_order)}</p>
        <p className={styles.label}>Detalles:</p>
        <ul className={styles.detailsList}>
          {(order.details || []).map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      </div>
      <div className={styles.colDivider} />
      <div className={styles.myOrderCol}>
        <p><span className={styles.label}>Destino: </span>
          <strong>{order.destiny || "N/A"}</strong></p>
        <p><span className={styles.label}>Comentarios: </span>
          {order.comments || "N/A"}</p>
        {order.user_deliver && (
          <p><span className={styles.label}>Entregado por: </span>
            <strong>{order.user_deliver}</strong></p>
        )}
      </div>
    </div>

    {/* Stepper */}
    <OrderStepper status={order.status} aheadCount={aheadCount} />
  </div>
);

// ─── Subcomponente: Fila de Cola ──────────────────────────────────────────────
const QueueRow = ({ order, position, isOwn }) => {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG["SOLICITADO"];
  return (
    <div className={`${styles.queueRow} ${isOwn ? styles.queueRowOwn : ""}`}>
      <div className={`${styles.queuePosition} ${isOwn ? styles.queuePositionOwn : ""}`}>
        {position}
      </div>
      <div className={styles.queueInfo}>
        <span className={styles.queueOrderId}>#{order.id_order}</span>
        <span className={styles.queueArea}>{order.area}</span>
        {isOwn && <span className={styles.tuBadge}>TÚ</span>}
      </div>
      <span className={styles.queueTime}>{fmtTime(order.date_order)}</span>
      <div className={styles.queueStatus} style={{ background: cfg.bg }}>
        <span>{cfg.icon}</span>
        <span style={{ color: cfg.color, fontWeight: 700, fontSize: "0.7rem" }}>
          {order.status}
        </span>
      </div>
    </div>
  );
};

// ─── Request Page ─────────────────────────────────────────────────────────────
export default function Request() {
  const { userName, role } = useAuth();

  const [orders,        setOrders]        = useState([]);
  const [detailOptions, setDetailOptions] = useState([]);
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [isLoading,     setIsLoading]     = useState(false);
  const [formData,      setFormData]      = useState(INITIAL_FORM(userName));
  const [toast,         setToast]         = useState({ msg: "", type: "" });
  // FIX duplicidad: ref síncrona — bloquea doble submit antes de que React re-renderice
  const isSubmitting = useRef(false);

  // FIX: reemplaza alert() por toast no bloqueante
  const showToast = useCallback((msg, type = "error", ms = 4000) => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), ms);
  }, []);

  // ── Campos condicionales ────────────────────────────────────────────────────
  const showPrintLabel = formData.details.includes(RETIRO_CONTENEDOR);
  const showMultiLabel = formData.details.includes(RETIRO_TARIMA);

  useEffect(() => {
    if (!showPrintLabel) setFormData(prev => ({ ...prev, print_label: "" }));
    if (!showMultiLabel) setFormData(prev => ({ ...prev, multilabel:  [] }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPrintLabel, showMultiLabel]);

  useEffect(() => {
    if (userName) setFormData(prev => ({ ...prev, area: userName }));
  }, [userName]);

  // ── Fetch: trae TODAS las activas del día para construir la cola ────────────
  // NOTE: Uses /api/orders/queue endpoint (service role) instead of direct supabase
  // This bypasses RLS to show full queue while maintaining data security
  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders/queue');
      
      if (!response.ok) {
        console.error('Failed to fetch orders queue:', response.statusText);
        return;
      }

      const result = await response.json();
      if (result.success && result.data) {
        setOrders(result.data);
      } else {
        console.error('Queue endpoint error:', result.error);
      }
    } catch (err) {
      console.error('Error fetching orders queue:', err);
    }
  }, []);

  const fetchDetailOptions = useCallback(async () => {
    const { data, error } = await supabase
      .from("detail_options").select("value, label");
    if (!error && data)
      setDetailOptions(data.map(item => ({ value: item.value, label: item.label })));
  }, []);

  // ── Realtime ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchOrders();
    fetchDetailOptions();

    const channel = supabase
      .channel("realtime-orders-request")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const o = payload.new;
          if (o.status === "ENTREGADO" || o.status === "CANCELADO") return;
          setOrders(prev => {
            if (prev.some(x => x.id_order === o.id_order)) return prev;
            return [...prev, o].sort(
              (a, b) => new Date(a.date_order) - new Date(b.date_order)
            );
          });
        }
      )
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const o = payload.new;
          if (o.status === "ENTREGADO" || o.status === "CANCELADO") {
            setOrders(prev => prev.filter(x => x.id_order !== o.id_order));
          } else {
            setOrders(prev => prev.map(x => x.id_order === o.id_order ? o : x));
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchOrders, fetchDetailOptions]);

  // ── Derivar paneles ─────────────────────────────────────────────────────────
  // Cola: todas las activas del día, orden de llegada
  const queueOrders = orders;

  // Mi orden: la más reciente activa del usuario actual
  const myOrder = [...orders]
    .reverse()
    .find(o => o.area === userName);

  // Posición en cola (1-based)
  const myPosition = myOrder
    ? queueOrders.findIndex(o => o.id_order === myOrder.id_order) + 1
    : null;

  // Cuántas órdenes van antes en la cola
  const aheadCount = myOrder
    ? queueOrders.filter(o =>
        o.id_order !== myOrder.id_order &&
        (o.status === "EN PROGRESO" ||
          (o.status === "SOLICITADO" &&
            new Date(o.date_order) < new Date(myOrder.date_order)))
      ).length
    : 0;

  // ── Form handlers ───────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiLabelChange = (e) => {
    const arr = e.target.value
      .split(",").map(s => s.trim()).filter(Boolean).slice(0, 4);
    setFormData(prev => ({ ...prev, multilabel: arr }));
  };

  const handleOpenModal  = () => { setFormData(INITIAL_FORM(userName)); setIsModalOpen(true); };
  const handleCloseModal = () => setIsModalOpen(false);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // FIX duplicidad: bloqueo síncrono — si ya hay un insert en vuelo, ignorar
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    if (!formData.user_submit.trim()) {
      showToast("Nombre del solicitante es obligatorio");
      isSubmitting.current = false; return;
    }
    if (showPrintLabel && !formData.print_label.trim()) {
      showToast("La etiqueta de contenedor es obligatoria al seleccionar 'Retiro de contenedor'");
      isSubmitting.current = false; return;
    }
    if (showMultiLabel && formData.multilabel.length === 0) {
      showToast("Debe ingresar al menos una etiqueta de tarima al seleccionar 'Retiro de tarima'");
      isSubmitting.current = false; return;
    }

    setIsLoading(true);
    const { error } = await supabase.from("orders").insert([{
      ...formData,
      area:        userName || "Área no especificada",
      status:      "SOLICITADO",
      date_order:  new Date().toISOString(),
      print_label: showPrintLabel ? formData.print_label : null,
      multilabel:  showMultiLabel ? formData.multilabel  : [],
    }]);

    if (!error) {
      handleCloseModal();
      setFormData(INITIAL_FORM(userName));
    } else {
      console.error("Error al enviar solicitud:", error.message);
      showToast(`Error al enviar la solicitud: ${error.message}`);
    }

    setIsLoading(false);
    isSubmitting.current = false; // liberar para permitir nueva solicitud
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <RoleGate allowedRoles={["LINEA"]}>
      <div className={styles.container}>

        {/* ── Panel superior: Mi orden ─────────────────────────────────── */}
        <p className={styles.panelLabel}>Mi orden activa</p>

        {myOrder ? (
          <MyOrderCard
            order={myOrder}
            queuePosition={myPosition}
            aheadCount={aheadCount}
          />
        ) : (
          <div className={styles.emptyOrder}>
            <span className={styles.emptyIcon}>📋</span>
            <p className={styles.emptyTitle}>No tienes órdenes activas</p>
            <p className={styles.emptySubtitle}>
              Usa el botón <strong>Solicitar</strong> para crear una nueva orden
            </p>
          </div>
        )}

        {/* ── Panel inferior: Cola ─────────────────────────────────────── */}
        <div className={styles.queueSection}>
          <div className={styles.queueHeader}>
            <p className={styles.panelLabel} style={{ marginBottom: 0 }}>
              Cola de solicitudes activas
            </p>
            <span className={styles.queueCount}>{queueOrders.length} activas</span>
          </div>

          {queueOrders.length === 0 ? (
            <div className={styles.queueEmpty}>
              Sin órdenes activas en este momento
            </div>
          ) : (
            <div className={styles.queueTable}>
              <div className={styles.queueTableHead}>
                <div className={styles.queueColPos}>#</div>
                <div className={styles.queueColInfo}>Orden / Área</div>
                <div className={styles.queueColTime}>Hora</div>
                <div className={styles.queueColStatus}>Estado</div>
              </div>
              <div className={styles.queueTableBody}>
                {queueOrders.map((order, idx) => (
                  <QueueRow
                    key={order.id_order}
                    order={order}
                    position={idx + 1}
                    isOwn={order.area === userName}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── FAB Solicitar ─────────────────────────────────────────────── */}
        <button onClick={handleOpenModal} className={styles.floatingBtn}>
          Solicitar
        </button>

        {/* ── Toast ────────────────────────────────────────────────────── */}
        {toast.msg && (
          <div className={`${styles.toast} ${toast.type === "error" ? styles.toastError : styles.toastSuccess}`}>
            {toast.msg}
          </div>
        )}

        {/* ── Modal nueva solicitud ─────────────────────────────────────── */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={handleCloseModal}
          contentLabel="Nueva Solicitud"
          className={styles.modalContent}
          overlayClassName={styles.modalOverlay}
        >
          <h2>Nueva Solicitud</h2>
          <form onSubmit={handleSubmit}>

            <div className={styles.formGroup}>
              <label>Área:</label>
              <input type="text" name="area" value={formData.area} readOnly />
            </div>

            <div className={styles.formGroup}>
              <label>Solicitante *</label>
              <input
                type="text" name="user_submit"
                value={formData.user_submit} onChange={handleChange}
                required placeholder="Escriba su nombre..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Detalles (Selección múltiple)</label>
              <Select
                isMulti
                options={detailOptions}
                value={detailOptions.filter(opt => formData.details.includes(opt.value))}
                onChange={selected =>
                  setFormData(prev => ({ ...prev, details: selected.map(o => o.value) }))
                }
                placeholder="Seleccione los detalles..."
                noOptionsMessage={() => "No hay más opciones"}
                className={styles.reactSelectContainer}
                classNamePrefix="react-select"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Destino</label>
              <select name="destiny" value={formData.destiny} onChange={handleChange}>
                <option value="">Seleccione...</option>
                {DESTINY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {showPrintLabel && (
              <div className={styles.conditionalField}>
                <label>Etiqueta Contenedor</label>
                <input
                  type="text" name="print_label"
                  value={formData.print_label} onChange={handleChange}
                  placeholder="Ingrese la etiqueta del contenedor..."
                />
                <small>Obligatorio al seleccionar "Retiro de contenedor"</small>
              </div>
            )}

            {showMultiLabel && (
              <div className={styles.conditionalField}>
                <label>Etiquetas de Tarima</label>
                <input
                  type="text" name="multilabel"
                  value={formData.multilabel.join(", ")}
                  onChange={handleMultiLabelChange}
                  placeholder="Hasta 4 códigos separados por coma..."
                />
                <small>{formData.multilabel.length}/4 etiquetas ingresadas</small>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Comentarios</label>
              <textarea
                name="comments" value={formData.comments}
                onChange={handleChange} rows={3}
                placeholder="Información adicional..."
              />
            </div>

            <div className={styles.formActions}>
              <button type="button" onClick={handleCloseModal}
                className={styles.cancelButton} disabled={isLoading}>
                Cancelar
              </button>
              <button type="submit" className={styles.submitButton} disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar Solicitud"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </RoleGate>
  );
}