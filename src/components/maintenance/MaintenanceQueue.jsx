import React from 'react';
import styles from '@/styles/MaintenanceQueue.module.css';

/**
 * MaintenanceQueue - Panel que muestra la cola de solicitudes de mantenimiento
 * Similar a las vistas de cola en Request.js pero enfocado en mtto
 */
const MaintenanceQueue = ({ queue = [], filter = 'TODOS' }) => {
  // Filtrar según status
  const filteredQueue =
    filter === 'TODOS'
      ? queue
      : queue.filter(item => item.status === filter);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return { color: '#f59e0b', bg: '#fffbeb' };
      case 'EN PROGRESO':
        return { color: '#3b82f6', bg: '#eff6ff' };
      case 'COMPLETADO':
        return { color: '#10b981', bg: '#ecfdf5' };
      case 'RECHAZADO':
        return { color: '#ef4444', bg: '#fef2f2' };
      default:
        return { color: '#6b7280', bg: '#f9fafb' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return '⏳';
      case 'EN PROGRESO':
        return '🔧';
      case 'COMPLETADO':
        return '✅';
      case 'RECHAZADO':
        return '❌';
      default:
        return '•';
    }
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (filteredQueue.length === 0) {
    return (
      <div className={styles.queueContainer}>
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>No hay solicitudes en este momento</p>
      </div>
    );
  }

  return (
    <div className={styles.queueContainer}>
      {filteredQueue.map((item, idx) => {
        const cfg = getStatusColor(item.status);
        return (
          <div key={item.id_maintenance || idx} className={styles.queueRow}>
            <div className={styles.queuePosition}>
              {idx + 1}
            </div>
            <div className={styles.queueInfo}>
              <span className={styles.queueId}>#{item.id_maintenance || '--'}</span>
              <span className={styles.queueCategory}>{item.category || 'N/A'}</span>
            </div>
            <span className={styles.queueTime}>{formatTime(item.date_created)}</span>
            <div className={styles.queueStatus} style={{ background: cfg.bg }}>
              <span>{getStatusIcon(item.status)}</span>
              <span style={{ color: cfg.color, fontWeight: 700, fontSize: '0.7rem' }}>
                {item.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MaintenanceQueue;
