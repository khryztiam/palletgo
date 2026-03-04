// src/components/admin/control/OrdersTable.js
import React from 'react';
import styles from '@/styles/Control.module.css';

// ─── Helper ───────────────────────────────────────────────────────────────────
const formatDate = (isoString) => {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
const RequestTable = ({ requests, onRowClick }) => (
  <div className={styles.tableContainer}>
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Solicitud</th>
          <th>Fecha pedido</th>
          <th>Usuario</th>
          <th>Área</th>
          <th>Encargado</th>
          <th>Fecha entrega</th>
          <th>Duración</th>
          <th>HU Cnt</th>
          <th>HU Trm</th>
        </tr>
      </thead>
      <tbody>
        {requests.length === 0 ? (
          <tr>
            <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: '#718096' }}>
              No hay solicitudes en este estado.
            </td>
          </tr>
        ) : (
          requests.map((request) => (
            <tr key={request.id_order} onClick={() => onRowClick(request)}>
              <td>{request.id_order}</td>
              <td>{formatDate(request.date_order)}</td>
              <td>{request.user_submit}</td>
              <td>{request.area}</td>
              <td>{request.user_deliver    || '—'}</td>
              {/* FIX: date_delivery puede ser null — el original lanzaba Invalid Date */}
              <td>{formatDate(request.date_delivery)}</td>
              <td>{request.duration        ?? '—'}</td>
              <td>{request.print_label     ?? '—'}</td>
              {/* FIX: multilabel es array — el original mostraba "[object Object]" */}
              <td>
                {Array.isArray(request.multilabel) && request.multilabel.length > 0
                  ? request.multilabel.join(', ')
                  : '—'}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default RequestTable;