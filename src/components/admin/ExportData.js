import React from 'react';
import { FaFileCsv } from 'react-icons/fa';
import Papa from 'papaparse';
import styles from '@/styles/Dashboard.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDateTime = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('es-MX', {
    timeZone: 'America/El_Salvador',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true,
  });
};

const formatOrdersForExport = (orders) =>
  orders.map((order) => ({
    ...order,
    ID_Orden:            order.id_order,
    Estatus:             order.status,
    Usuario_Solicitante: order.user_submit,
    Area_Solicitante:    order.area,
    Fecha_Solicitud:     formatDateTime(order.date_order),
    Fecha_Entrega:       formatDateTime(order.date_delivery),
  }));

// ─── Colores por status ───────────────────────────────────────────────────────
const SUMMARY_BOX_CLASS = {
  solicitado: styles.solicitado,
  progreso:   styles.progreso,
  entregado:  styles.entregado,
  cancelado:  styles.cancelado,
};

// ─── Component ────────────────────────────────────────────────────────────────
const ExportData = ({ data, dateRange, summary }) => {
  const handleExport = () => {
    if (data.length === 0) return; // El botón ya está disabled, pero por seguridad

    const csv  = Papa.unparse(formatOrdersForExport(data));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.download = `orders_${dateRange.start || 'inicio'}_${dateRange.end || 'fin'}.csv`;
    link.href = url;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const summaryItems = [
    { key: 'solicitado', label: 'Solicitado',   value: summary.request     },
    { key: 'progreso',   label: 'En Progreso',   value: summary.in_progress },
    { key: 'entregado',  label: 'Entregado',     value: summary.delivered   },
    { key: 'cancelado',  label: 'Cancelado',     value: summary.canceled    },
  ];

  return (
    <div className={styles.exportPanel}>
      <div className={styles.exportSummary}>
        <h4>Resumen de Datos</h4>
        <div className={styles.summaryGrid}>
          {summaryItems.map(({ key, label, value }) => (
            <div key={key} className={`${styles.summaryBox} ${SUMMARY_BOX_CLASS[key]}`}>
              <span className={styles.summaryLabel}>{label}</span>
              <span className={styles.summaryValue}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleExport}
        className={styles.csvExportBtn}
        disabled={data.length === 0}
      >
        <FaFileCsv />
        Exportar {data.length} Registros a CSV
      </button>
    </div>
  );
};

export default ExportData;