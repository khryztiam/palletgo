// /src/components/admin/ExportData.js
import React from 'react';
import { FaFileCsv } from 'react-icons/fa';
import Papa from 'papaparse';

const ExportData = ({ data, dateRange, summary }) => {
    // 🔁 Formatea los datos antes de exportar
    const formatOrdersForExport = (orders) => {
      return orders.map(order => ({
        ...order,
        date_order: order.date_order 
          ? new Date(order.date_order).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) 
          : ''
      }));
    };
  
    const handleExport = () => {
      const filteredData = data.filter(order => {
        const orderDate = new Date(order.date_order);
        return (
          (!dateRange.start || orderDate >= new Date(dateRange.start)) &&
          (!dateRange.end || orderDate <= new Date(dateRange.end))
        );
      });
  
      const formattedData = formatOrdersForExport(filteredData); // ✨
  
      const csv = Papa.unparse(formattedData);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'orders.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    };

  return (
    <div className="export-button">
      <div className="export-summary">
        <h4>Resumen de Datos</h4>
        <div className="summary-grid">
            <div className="summary-box solicitado">
            <span className="summary-label">Solicitado</span>
            <span className="summary-value">{summary.request}</span>
            </div>
            <div className="summary-box progreso">
            <span className="summary-label">En Progreso</span>
            <span className="summary-value">{summary.in_progress}</span>
            </div>
            <div className="summary-box entregado">
            <span className="summary-label">Entregado</span>
            <span className="summary-value">{summary.delivered}</span>
            </div>
            <div className="summary-box cancelado">
            <span className="summary-label">Cancelado</span>
            <span className="summary-value">{summary.canceled}</span>
            </div>
        </div>
        </div>

      <button onClick={handleExport} className="csv-export-btn">
        <FaFileCsv style={{ marginRight: '6px' }} />
        Exportar a CSV
      </button>
    </div>
  );
};

export default ExportData;
