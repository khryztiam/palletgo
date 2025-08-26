import React from 'react';
import { MdTimer, MdLocalShipping, MdDone, MdWarning, MdError } from 'react-icons/md';


export const Card = ({ 
  order,
  variant = 'default',
  onStatusClick,
  showTimer = false,
  isAlerting =false
}) => {

   // Función para formatear el tiempo en mm:ss
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcular si está en alerta crítica (más de 20 minutos)
  const isCritical = order.elapsedSeconds > 20 * 60;
  
  // Calcular tiempo excedido si pasa de 15 minutos
  const exceededTime = order.elapsedSeconds > 15 * 60 
    ? order.elapsedSeconds - 15 * 60 
    : 0;
  
  return (
    <div className={`card ${variant} ${isAlerting ? 'alert-pulse' : ''} ${isCritical ? 'critical-alert' : ''}`}>
      {/* Header con área y timer */}
      <div className="card-header">
        <h3>{order.area} - Orden # {order.id_order}</h3>
        
        {/* Mostrar cronómetro si está habilitado */}
        {showTimer && (
          <div className="card-timer">
            <span className={`timer-text ${isAlerting ? 'timer-alert' : ''} ${isCritical ? 'timer-critical' : ''}`}>
              <MdTimer className="timer-icon" />
              {formatTime(order.elapsedSeconds)}
            </span>
            
            {/* Mostrar tiempo excedido si aplica */}
            {exceededTime > 0 && (
              <span className="exceeded-time">
                +{formatTime(exceededTime)}
                {isCritical ? <MdError className="exceeded-icon" /> : <MdWarning className="exceeded-icon" />}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="card-body">
        <div className="card-columns">
          {/* Columna Izquierda */}
          <div className="card-column">
            <p className="card-highlight">{new Date(order.date_order).toLocaleString('es-MX')}</p>

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
          {variant === 'dispatch' && (
              <p className="card-field">
                <span className="card-label">Solicitante:</span> {order.user_submit}
              </p>
            )}
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
            className={`status-button ${order.status.toLowerCase().replace(' ', '-')} ${isAlerting ? 'button-alert' : ''}`}
          >
            {order.status === 'SOLICITADO' ? 'Iniciar Despacho' : 'Marcar Entregado'}
            {isAlerting && <MdWarning className="button-alert-icon" />}
          </button>
        ) : (
          <div className="status-indicator">
            {order.status === 'SOLICITADO' && (
              <MdTimer className="icon" style={{ color: isAlerting ? '#ff4d4f' : '#FFA726' }} />
            )}
            {order.status === 'EN PROGRESO' && (
              <MdLocalShipping className="icon" style={{ color: isAlerting ? '#ff4d4f' : '#66BB6A' }} />
            )}
            <span className="status-text">{order.status}</span>
          </div>
        )}
      </div>
    </div>
  );
};