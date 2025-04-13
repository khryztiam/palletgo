// Componente Timeline.js
import React from 'react';
import { FaClipboardList, FaShippingFast, FaHome } from 'react-icons/fa';

const Timeline = ({ events }) => {
  const getIconForArea = (area) => {
    switch (area) {
      case 'LINEA':
        return <FaHome />;
      case 'EMBARQUE':
        return <FaShippingFast />;
      case 'ALMACÉN':
        return <FaClipboardList />;
      default:
        return null;
    }
  };
  return (
    <div className="timeline-container">
      <h3>📌 Últimos movimientos</h3>
      <ul className="timeline">
        {events.map((event, index) => (
          <li key={index} className="timeline-item">
            <div className="timeline-icon">< FaClipboardList/></div>
            <div className="timeline-content">
              <p className="timeline-date">
                {event.date.toLocaleString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
              <p className="timeline-description">{event.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
  export default Timeline;