import React from 'react';
import { MdTimer, MdLocalShipping, MdDone } from 'react-icons/md';


export const Card = ({ 
  order,
  variant = 'default',
  onStatusClick
}) => {
  return (
    <div className={`card ${variant}`}>
      {/* Header con área (siempre visible) */}
      <div className="card-header">
        <h3>{order.area} - Orden # {order.id_order}</h3>
      </div>

      <div className="card-body">
        <div className="card-columns">
          {/* Columna Izquierda */}
          <div className="card-column">
            <p className="card-highlight">{new Date(order.date_order).toLocaleString('es-MX')}</p>
            {variant === 'dispatch' && (
              <p className="card-field">
                <span className="card-label">Solicitante:</span> {order.user_submit}
              </p>
            )}
            <div className="card-separator"></div>
            <p className="card-label">Detalles:</p>
            <ul className="card-list">
              {Array.isArray(order.details) ? (
                order.details.map((detail, index) => (
                  <li key={`${order.id_order}-detail-${index}`}>{detail}</li>
                ))
              ) : (
                <li>{order.details}</li>
              )}
            </ul>
          </div>
          
          {/* Separador visual */}
          <div className="card-column-divider"></div>
          
          {/* Columna Derecha */}
          <div className="card-column">
            <p className="card-field">
              <span className="card-label">Destino:</span> {order.destiny || 'N/A'}
            </p>
            <p className="card-field">
              <span className="card-label">Comentarios:</span> {order.comments || 'N/A'}
            </p>
            {order.user_deliver && (
              <p className="card-field">
                <span className="card-label">Entregado por:</span> {order.user_deliver}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer con lógica de estado */}
      <div className="card-footer">
        {variant === 'dispatch' ? (
          <button
            onClick={() => onStatusClick(order)}
            className={`status-button ${order.status.toLowerCase().replace(' ', '-')}`}
          >
            {order.status === 'SOLICITADO' ? 'Iniciar Despacho' : 'Marcar Entregado'}
          </button>
        ) : (
          <div className="status-indicator">
            {order.status === 'SOLICITADO' && (
              <MdTimer className="icon" style={{ color: '#FFA500' }} />
            )}
            {order.status === 'EN PROGRESO' && (
              <MdLocalShipping className="icon" style={{ color: '#1E90FF' }} />
            )}
            {order.status === 'ENTREGADO' && (
              <MdDone className="icon" style={{ color: '#32CD32' }} />
            )}
            <span className="status-text">{order.status}</span>
          </div>
        )}
      </div>
    </div>
  );
};