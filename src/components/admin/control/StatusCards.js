// src/components/admin/control/StatusCards.js
import React from 'react';
import { FaClipboardList, FaShippingFast, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'; // Importamos los iconos de react-icons

const StatusCards = ({ selected, onSelect, orders = [] }) => {
  // Contamos cuántas órdenes hay por estado
  const counts = orders.reduce((acc, order) => {
    const status = order.status || 'SIN ESTADO';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="control-status-cards-container">
      <div 
        className={`control-status-card ${selected === 'SOLICITADO' ? 'selected' : ''}`}
        onClick={() => onSelect('SOLICITADO')}
      >
        <FaClipboardList className="control-status-icon" />
        <div className="control-status-info">
          <h3>SOLICITADO</h3>
          <p>{counts['SOLICITADO'] || 0}</p>
        </div>
      </div>

      <div 
        className={`control-status-card ${selected === 'EN PROGRESO' ? 'selected' : ''}`}
        onClick={() => onSelect('EN PROGRESO')}
      >
        <FaShippingFast className="control-status-icon" />
        <div className="control-status-info">
          <h3>EN PROGRESO</h3>
          <p>{counts['EN PROGRESO'] || 0}</p>
        </div>
      </div>

      <div 
        className={`control-status-card ${selected === 'ENTREGADO' ? 'selected' : ''}`}
        onClick={() => onSelect('ENTREGADO')}
      >
        <FaCheckCircle className="control-status-icon" />
        <div className="control-status-info">
          <h3>ENTREGADO</h3>
          <p>{counts['ENTREGADO'] || 0}</p>
        </div>
      </div>

      <div 
        className={`control-status-card ${selected === 'CANCELADO' ? 'selected' : ''}`}
        onClick={() => onSelect('CANCELADO')}
      >
        <FaTimesCircle className="control-status-icon" />
        <div className="control-status-info">
          <h3>CANCELADO</h3>
          <p>{counts['CANCELADO'] || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default StatusCards;
