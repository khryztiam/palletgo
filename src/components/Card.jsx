import React from 'react';
import { MdTimer, MdLocalShipping, MdWarning, MdError } from 'react-icons/md';
import styles from '@/styles/Card.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formatea segundos a mm:ss.
 * @param {number} seconds
 * @returns {string} "mm:ss" o "--:--" si no hay valor
 */
const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Normaliza el status a className compatible (ej: "EN PROGRESO" → "enProgreso")
 * para mapear a los estilos del módulo.
 */
const statusToClass = {
  'SOLICITADO':  styles.solicitado,
  'EN PROGRESO': styles.enProgreso,
  'ENTREGADO':   styles.entregado,
};

// ─── Subcomponente: Timer ─────────────────────────────────────────────────────
const CardTimer = ({ elapsedSeconds, isAlerting, isCritical }) => {
  const exceededTime = elapsedSeconds > 15 * 60
    ? elapsedSeconds - 15 * 60
    : 0;

  return (
    <div className={styles.timer}>
      <span className={[
        styles.timerText,
        isAlerting  ? styles.timerAlert    : '',
        isCritical  ? styles.timerCritical : '',
      ].join(' ')}>
        <MdTimer className={styles.timerIcon} />
        {formatTime(elapsedSeconds)}
      </span>

      {exceededTime > 0 && (
        <span className={styles.exceededTime}>
          +{formatTime(exceededTime)}
          {isCritical
            ? <MdError className={styles.exceededIcon} />
            : <MdWarning className={styles.exceededIcon} />
          }
        </span>
      )}
    </div>
  );
};

// ─── Subcomponente: Footer ────────────────────────────────────────────────────
const CardFooter = ({ variant, order, isAlerting, onStatusClick }) => {
  if (variant === 'dispatch') {
    const label = order.status === 'SOLICITADO' ? 'Iniciar Despacho' : 'Marcar Entregado';

    return (
      <div className={styles.footer}>
        <button
          onClick={() => onStatusClick(order)}
          className={[
            styles.statusButton,
            statusToClass[order.status] ?? '',
            isAlerting ? styles.buttonAlert : '',
          ].join(' ')}
        >
          {label}
          {isAlerting && <MdWarning className={styles.buttonAlertIcon} />}
        </button>
      </div>
    );
  }

  // Variante default: solo muestra el status con ícono
  const iconStyle = { color: isAlerting ? '#ff4d4f' : undefined };

  return (
    <div className={styles.footer}>
      <div className={styles.statusIndicator}>
        {order.status === 'SOLICITADO' && (
          <MdTimer
            className={styles.statusIcon}
            style={{ ...iconStyle, color: iconStyle.color ?? '#FFA726' }}
          />
        )}
        {order.status === 'EN PROGRESO' && (
          <MdLocalShipping
            className={styles.statusIcon}
            style={{ ...iconStyle, color: iconStyle.color ?? '#66BB6A' }}
          />
        )}
        <span className={styles.statusText}>{order.status}</span>
      </div>
    </div>
  );
};

// ─── Card Principal ───────────────────────────────────────────────────────────
export const Card = ({
  order,
  variant = 'default',
  onStatusClick,
  showTimer = false,
  isAlerting = false,
}) => {
  const isCritical = order.elapsedSeconds > 20 * 60;

  return (
    <div className={[
      styles.card,
      variant === 'dispatch' ? styles.dispatch : '',
      isAlerting ? styles.alertPulse   : '',
      isCritical ? styles.criticalAlert : '',
    ].join(' ')}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <h3>{order.area} - Orden # {order.id_order}</h3>

        {showTimer && (
          <CardTimer
            elapsedSeconds={order.elapsedSeconds}
            isAlerting={isAlerting}
            isCritical={isCritical}
          />
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className={styles.body}>
        <div className={styles.columns}>

          {/* Columna Izquierda */}
          <div className={styles.column}>
            <p className={styles.highlight}>
              {new Date(order.date_order).toLocaleString('es-MX')}
            </p>

            <p className={styles.label}>Detalles:</p>
            <ul className={styles.list}>
              {Array.isArray(order.details)
                ? order.details.map((detail, index) => (
                    <li key={`${order.id_order}-detail-${index}`}>{detail}</li>
                  ))
                : <li>{order.details}</li>
              }
            </ul>
          </div>

          {/* Separador visual */}
          <div className={styles.columnDivider} />

          {/* Columna Derecha */}
          <div className={styles.column}>
            {variant === 'dispatch' && (
              <p>
                <span className={styles.label}>Solicitante:</span> {order.user_submit}
              </p>
            )}
            <p>
              <span className={styles.label}>Destino:</span> {order.destiny || 'N/A'}
            </p>
            <p>
              <span className={styles.label}>Comentarios:</span> {order.comments || 'N/A'}
            </p>
            {order.user_deliver && (
              <p>
                <span className={styles.label}>Entregado por:</span> {order.user_deliver}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <CardFooter
        variant={variant}
        order={order}
        isAlerting={isAlerting}
        onStatusClick={onStatusClick}
      />
    </div>
  );
};