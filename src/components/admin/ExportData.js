// /src/components/admin/ExportData.js
import React from "react";
import { FaFileCsv } from "react-icons/fa";
import Papa from "papaparse";

const ExportData = ({ data, dateRange, summary }) => {
  // Usar formato ISO simplificado para mejor compatibilidad CSV
  const formatDateTime = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
// Configuramos las opciones para obtener el formato deseado
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true, // Esto asegura que use AM/PM
            // La zona horaria se toma por defecto del cliente (navegador/servidor)
        };

        // Usamos 'es-MX' o 'es-ES' como locale para asegurar el formato DD/MM/YYYY
        // y el formato de hora con AM/PM que es común en muchos países hispanohablantes.
        const formattedDate = d.toLocaleString('es-MX', options);

        // Dependiendo del locale, el resultado podría ser: 18/10/2025, 09:53:59 p. m.
        // Si necesitas limpiar el resultado de comas o la 'a. m./p. m.' con puntos, 
        // puedes usar un replace adicional, pero el formato ya es local y preciso.

        return formattedDate;
  };

  // 🔁 Formatea los datos antes de exportar
  const formatOrdersForExport = (orders) => {
    // Se asume que 'orders' ya viene filtrado por el componente principal
    return orders.map((order) => ({
      ...order,
      // Renombrar y formatear las claves importantes
      ID_Orden: order.id_order,
      Estatus: order.status,
      Usuario_Solicitante: order.user_submit,
      Area_Solicitante: order.area,
      Fecha_Solicitud: formatDateTime(order.date_order),
      Fecha_Entrega: formatDateTime(order.date_delivery),
      // Excluir campos sensibles/innecesarios si es requerido (e.g., id_user)
    }));
  };

  const handleExport = () => {
    if (data.length === 0) {
      alert("No hay datos para exportar en el rango de fechas seleccionado.");
      return;
    }

    const formattedData = formatOrdersForExport(data);

    const csv = Papa.unparse(formattedData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Nombre del archivo con rango de fechas para mayor claridad
    const start = dateRange.start || "inicio";
    const end = dateRange.end || "fin";
    link.download = `orders_${start}_${end}.csv`;

    link.href = url;
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

      <button
        onClick={handleExport}
        className="csv-export-btn"
        disabled={data.length === 0}
      >
        <FaFileCsv style={{ marginRight: "6px" }} />
        Exportar {data.length} Registros a CSV
      </button>
    </div>
  );
};

export default ExportData;
