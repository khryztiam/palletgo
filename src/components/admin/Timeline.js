import React from 'react';
import { FaClipboardList, FaShippingFast, FaCheckCircle, FaTimesCircle, FaClock, FaUser, FaTruck, FaMapMarkerAlt } from 'react-icons/fa';
import styles from '@/styles/Dashboard.module.css';

// ─── Config por estado ────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  'SOLICITADO':   { icon: <FaClipboardList />, color: '#3498db', label: 'Solicitado'   },
  'EN PROGRESO':  { icon: <FaShippingFast  />, color: '#f39c12', label: 'En progreso'  },
  'ENTREGADO':    { icon: <FaCheckCircle   />, color: '#27ae60', label: 'Entregado'    },
  'CANCELADO':    { icon: <FaTimesCircle   />, color: '#e74c3c', label: 'Cancelado'    },
};

// Elimina emojis y espacios extra del nombre
const sanitizar = (nombre) =>
  nombre?.replace(/[^\p{L}\p{N}\p{Z}\p{P}]/gu, '').replace(/\s+/g, ' ').trim() || '—';

const formatFecha = (date) =>
  date.toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

// ─── Component ────────────────────────────────────────────────────────────────
const Timeline = ({ events }) => (
  <div className={styles.timelineContainer}>
    <h3>📌 Últimos movimientos</h3>
    <ul className={styles.timelineGrid}>
      {events.map((event, index) => {
        const cfg   = STATUS_CONFIG[event.status] || { icon: <FaClock />, color: '#95a5a6', label: event.status };
        const fecha = event.status === 'ENTREGADO' && event.date_delivery
          ? event.date_delivery
          : event.date_order;

        return (
          <li key={index} className={styles.timelineCard} style={{ borderLeftColor: cfg.color }}>

            {/* Cabecera: ícono + id + badge */}
            <div className={styles.timelineCardHeader}>
              <div className={styles.timelineCardIcon} style={{ backgroundColor: cfg.color }}>
                {cfg.icon}
              </div>
              <div className={styles.timelineCardTitle}>
                <span className={styles.timelineOrderId}>#{event.id_order}</span>
                <span className={styles.timelineBadge} style={{ backgroundColor: cfg.color }}>
                  {cfg.label}
                </span>
              </div>
            </div>

            {/* Fecha */}
            <p className={styles.timelineDate}>{formatFecha(fecha)}</p>

            {/* Meta: solicitante / entregador / área */}
            <div className={styles.timelineMeta}>
              <span className={styles.timelineMetaRow}>
                <FaUser className={styles.timelineMetaIcon} />
                <span className={styles.timelineMetaLabel}>Solicitante:</span>
                {sanitizar(event.user_submit)}
              </span>
              {event.user_deliver && (
                <span className={styles.timelineMetaRow}>
                  <FaTruck className={styles.timelineMetaIcon} />
                  <span className={styles.timelineMetaLabel}>Entregado por:</span>
                  {sanitizar(event.user_deliver)}
                </span>
              )}
              {event.area && (
                <span className={styles.timelineMetaRow}>
                  <FaMapMarkerAlt className={styles.timelineMetaIcon} />
                  <span className={styles.timelineMetaLabel}>Área:</span>
                  {event.area}{event.destiny ? ` → ${event.destiny}` : ''}
                </span>
              )}
            </div>

          </li>
        );
      })}
    </ul>
  </div>
);

export default Timeline;