// src/components/admin/control/OrdersTable.js
import React from 'react';

const RequestTable = ({ requests, onRowClick }) => {
  return (
    <div className="control-table-container">
      <table className="control-request-table">
        <thead>
          <tr>
            <th>ID Solicitud</th>
            <th>Usuario</th>
            <th>Área</th>
            <th>Encargado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan="4">No hay solicitudes en este estado.</td>
            </tr>
          ) : (
            requests.map((request) => (
              <tr key={request.id_order} onClick={() => onRowClick(request)}>
                <td>{request.id_order}</td>
                <td>{request.user_submit}</td>
                <td>{request.area}</td>
                <td>{request.user_deliver}</td>
                <td>{new Date(request.date_order).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RequestTable;
