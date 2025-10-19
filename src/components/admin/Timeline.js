// /src/components/admin/Timeline.js
import React from "react";
import { FaClipboardList, FaShippingFast, FaCar, FaTag } from "react-icons/fa";

const Timeline = ({ events }) => {
  const getIconForArea = (area) => {
    switch (String(area).toUpperCase()) {
      case "LINEA":
        return <FaCar />;
      case "EMBARQUE":
        return <FaShippingFast />;
      case "ALMACÉN":
        return <FaClipboardList />;
      default:
        return <FaTag />; // Icono por defecto
    }
  };

  return (
    <div className="timeline-container">
      <h3>📌 Últimos movimientos</h3>
      <ul className="timeline">
        {events.map((event, index) => (
          <li key={index} className="timeline-item">
            {/* CORRECCIÓN: Usar la función getIconForArea con event.area */}
            <div className="timeline-icon">{getIconForArea(event.area)}</div>
            <div className="timeline-content">
              <p className="timeline-date">
                {event.date.toLocaleString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
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
