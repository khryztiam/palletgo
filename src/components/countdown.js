import React, { useState, useEffect, useCallback } from "react";

// Constantes para los cálculos (fuera del componente para evitar re-creación)
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const MS_PER_HOUR = MS_PER_MINUTE * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;

// Función de ayuda para formatear con cero inicial
const pad = (num) => (num < 10 ? "0" + num : num);

const ChristmasCountdown = () => {
  // 1. Estados para almacenar el tiempo restante
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  const [isChristmas, setIsChristmas] = useState(false);

  // 2. Lógica de cálculo (usando useCallback para optimización)
  const calculateTimeLeft = useCallback(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    let christmas = new Date(currentYear, 11, 25); // Mes 11 es Diciembre

    // Ajustar al próximo año si ya pasó Navidad
    if (now > christmas) {
      christmas = new Date(currentYear + 1, 11, 25);
    }

    const difference = christmas - now;

    if (difference <= 0) {
      setIsChristmas(true);
      return setTimeLeft({
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
      });
    }

    // Conversión y actualización
    setTimeLeft({
      days: pad(Math.floor(difference / MS_PER_DAY)),
      hours: pad(Math.floor((difference % MS_PER_DAY) / MS_PER_HOUR)),
      minutes: pad(Math.floor((difference % MS_PER_HOUR) / MS_PER_MINUTE)),
      seconds: pad(Math.floor((difference % MS_PER_MINUTE) / MS_PER_SECOND)),
    });
  }, []);

  // 3. useEffect: Maneja el intervalo de actualización (El corazón del contador)
  useEffect(() => {
    // Ejecutar inmediatamente para evitar el parpadeo inicial
    calculateTimeLeft();

    // Configurar el intervalo
    const interval = setInterval(calculateTimeLeft, 1000);

    // Función de limpieza: CLAVE en React
    // Se ejecuta cuando el componente se desmonta o antes de re-ejecutar el efecto.
    return () => clearInterval(interval);
  }, [calculateTimeLeft]);

  return (
    <div
      id="christmas-countdown-widget"
      className="countdown-widget visible-always"
    >
      {isChristmas ? (
        <div style={{ padding: "10px", textAlign: "center", color: "#c0392b" }}>
          ¡Feliz Navidad!
        </div>
      ) : (
        <>
          <div className="countdown-title">Faltan</div>

          <div className="countdown-display">
            {/* 🛑 AÑADIMOS LA CLASE 'block' A CADA UNIDAD 🛑 */}
            <div className="time-unit block">
              <span className="value">{timeLeft.days}</span>
              <small>Días</small>
            </div>
            <div className="time-unit block">
              <span className="value">{timeLeft.hours}</span>
              <small>Horas</small>
            </div>
            <div className="time-unit block">
              <span className="value">{timeLeft.minutes}</span>
              <small>Min</small> {/* Cambiado a Minutos completo */}
            </div>
            <div className="time-unit block">
              <span className="value">{timeLeft.seconds}</span>
              <small>Seg</small> {/* Cambiado a Segundos completo */}
            </div>
          </div>

          {/* 🛑 NUEVO TEXTO INFERIOR 🛑 */}
          <div className="countdown-footer">para **Navidad!**</div>
        </>
      )}
    </div>
  );
};

export default ChristmasCountdown;
