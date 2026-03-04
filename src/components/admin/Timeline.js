import React from 'react';
import { FaClipboardList, FaShippingFast, FaCar, FaTag } from 'react-icons/fa';
import styles from '@/styles/Dashboard.module.css';

// ─── Helper ───────────────────────────────────────────────────────────────────
const getIconForArea = (area) => {
  switch (String(area).toUpperCase()) {
    case 'LINEA':    return <FaCar />;
    case 'EMBARQUE': return <FaShippingFast />;
    case 'ALMACÉN':  return <FaClipboardList />;
    default:         return <FaTag />;
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
const Timeline = ({ events }) => (
  <div className={styles.timelineContainer}>
    <h3>📌 Últimos movimientos</h3>
    <ul className={styles.timeline}>
      {events.map((event, index) => (
        <li key={index} className={styles.timelineItem}>
          <div className={styles.timelineIcon}>
            {getIconForArea(event.area)}
          </div>
          <div className={styles.timelineContent}>
            <p className={styles.timelineDate}>
              {event.date.toLocaleString('es-ES', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true,
              })}
            </p>
            <p className={styles.timelineDescription}>
              {event.description}
            </p>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

export default Timeline;