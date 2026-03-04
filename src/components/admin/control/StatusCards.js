// src/components/admin/control/StatusCards.js
import React from 'react';
import { FaClipboardList, FaShippingFast, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import styles from '@/styles/Control.module.css';

// ─── Configuración de tarjetas ────────────────────────────────────────────────
// Centralizado: agregar un nuevo status es una sola línea aquí.
const CARDS = [
  { status: 'SOLICITADO',  Icon: FaClipboardList  },
  { status: 'EN PROGRESO', Icon: FaShippingFast   },
  { status: 'ENTREGADO',   Icon: FaCheckCircle    },
  { status: 'CANCELADO',   Icon: FaTimesCircle    },
];

const StatusCards = ({ selected, onSelect, orders = [] }) => {
  // Conteo por status en un solo recorrido
  const counts = orders.reduce((acc, order) => {
    const s = order.status || 'SIN ESTADO';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={styles.statusCardsContainer}>
      {CARDS.map(({ status, Icon }) => (
        <div
          key={status}
          className={`${styles.statusCard} ${selected === status ? styles.statusCardSelected : ''}`}
          onClick={() => onSelect(status)}
          role="button"
          aria-pressed={selected === status}
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(status)}
        >
          <Icon className={styles.statusIcon} />
          <div className={styles.statusInfo}>
            <h3>{status}</h3>
            <p>{counts[status] || 0}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatusCards;