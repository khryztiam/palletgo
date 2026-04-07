import React from 'react';
import styles from '@/styles/MaintenanceCard.module.css';

/**
 * MaintenanceCard - Componente para mostrar una solicitud de mantenimiento
 * Similar a MyOrderCard en Request.js pero adaptado para solicitudes de mtto
 */
const MaintenanceCard = ({ maintenance, position = null, totalAhead = 0 }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return '#f59e0b'; // Amber
      case 'EN PROGRESO':
        return '#3b82f6'; // Blue
      case 'COMPLETADO':
        return '#10b981'; // Green
      case 'RECHAZADO':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
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

  const formatDateTime = (isoString) => {
    return new Date(isoString).toLocaleString('es-MX', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <span className={styles.statusIcon} style={{ color: getStatusColor(maintenance.status) }}>
            {getStatusIcon(maintenance.status)}
          </span>
          <div>
            <h3 className={styles.title}>{maintenance.title || 'Solicitud de Mantenimiento'}</h3>
            <p className={styles.subtitle}>
              Creada por: <strong>{maintenance.created_by || 'N/A'}</strong>
            </p>
          </div>
        </div>
        <span className={styles.status} style={{ backgroundColor: getStatusColor(maintenance.status) }}>
          {maintenance.status}
        </span>
      </div>

      <div className={styles.content}>
        <div className={styles.row}>
          <span className={styles.label}>Categoría:</span>
          <span className={styles.value}>{maintenance.category || 'N/A'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Descripción:</span>
          <span className={styles.value}>{maintenance.description || 'Sin descripción'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Prioridad:</span>
          <span className={styles.value}>{maintenance.priority || 'Normal'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Asignado a:</span>
          <span className={styles.value}>{maintenance.assigned_to || 'Sin asignar'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Fecha Creación:</span>
          <span className={styles.value}>{formatDateTime(maintenance.date_created)}</span>
        </div>
        {maintenance.date_updated && (
          <div className={styles.row}>
            <span className={styles.label}>Última Actualización:</span>
            <span className={styles.value}>{formatDateTime(maintenance.date_updated)}</span>
          </div>
        )}
      </div>

      {maintenance.status === 'PENDIENTE' && position !== null && totalAhead >= 0 && (
        <div className={styles.queueInfo}>
          {totalAhead === 0 ? (
            <p className={styles.queueInfoText}>🎉 ¡Eres el siguiente en ser atendido!</p>
          ) : (
            <p className={styles.queueInfoText}>
              Hay <strong>{totalAhead} solicitud{totalAhead !== 1 ? 'es' : ''}</strong> antes que la tuya
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MaintenanceCard;
