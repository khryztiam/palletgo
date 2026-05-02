import React from 'react';
import {
  MdTimer,
  MdLocalShipping,
  MdWarning,
  MdError,
  MdPlayArrow,
  MdDone,
  MdPerson,
  MdPlace,
  MdNotes,
  MdInventory2,
  MdSchedule,
  MdCheckCircle,
} from 'react-icons/md';
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
    const isRequested = order.status === 'SOLICITADO';
    const label = isRequested ? 'Iniciar despacho' : 'Marcar entregado';
    const ActionIcon = isRequested ? MdPlayArrow : MdDone;

    return (
      <div className={styles.footer}>
        <button
          onClick={() => onStatusClick(order)}
          className={[
            styles.statusButton,
            statusToClass[order.status] ?? '',
          ].join(' ')}
        >
          <ActionIcon className={styles.buttonIcon} />
          <span>{label}</span>
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
  const priorityLabel = isCritical ? 'Critico' : isAlerting ? 'Alerta' : 'En tiempo';
  const PriorityIcon = isCritical ? MdError : isAlerting ? MdWarning : MdCheckCircle;
  const commentsText = typeof order.comments === 'string' ? order.comments.trim() : '';
  const hasComments = Boolean(commentsText && commentsText !== 'N/A');
  const shouldPulseCard = variant !== 'dispatch' && isAlerting;

  return (
    <div className={[
      styles.card,
      variant === 'dispatch' ? styles.dispatch : '',
      variant === 'dispatch'
        ? isCritical ? styles.dispatchCritical : isAlerting ? styles.dispatchAlert : styles.dispatchOk
        : '',
      shouldPulseCard ? styles.alertPulse : '',
      shouldPulseCard && isCritical ? styles.criticalAlert : '',
    ].join(' ')}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.orderEyebrow}>Orden #{order.id_order}</span>
          <h3>{order.area}</h3>
        </div>

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
        {variant === 'dispatch' ? (
          <div className={styles.dispatchTicket}>
            <div className={styles.dispatchInfoGrid}>
              <div className={[styles.infoTile, styles.infoTilePrimary].join(' ')}>
                <MdPlace className={styles.infoIcon} />
                <div>
                  <span>Destino</span>
                  <strong>{order.destiny || 'N/A'}</strong>
                </div>
              </div>

              <div className={styles.infoTile}>
                <MdPerson className={styles.infoIcon} />
                <div>
                  <span>Solicitante</span>
                  <strong>{order.user_submit || 'N/A'}</strong>
                </div>
              </div>

              <div className={styles.infoTile}>
                <MdSchedule className={styles.infoIcon} />
                <div>
                  <span>Creada</span>
                  <strong>{new Date(order.date_order).toLocaleString('es-MX')}</strong>
                </div>
              </div>

              <div className={[
                styles.infoTile,
                styles.priorityTile,
                isCritical ? styles.priorityTileCritical : isAlerting ? styles.priorityTileAlert : styles.priorityTileOk,
              ].join(' ')}>
                <span className={[
                  styles.priorityIconWrap,
                  isCritical ? styles.priorityIconCritical : isAlerting ? styles.priorityIconAlert : styles.priorityIconOk,
                ].join(' ')}>
                  <PriorityIcon />
                </span>
                <div>
                  <span>Prioridad</span>
                  <strong>{priorityLabel}</strong>
                </div>
              </div>
            </div>

            <div className={styles.dispatchPanels}>
              <section className={styles.detailPanel}>
                <div className={styles.panelTitle}>
                  <MdInventory2 className={styles.metaIcon} />
                  <span>Detalles</span>
                </div>
                <ul className={styles.list}>
                  {Array.isArray(order.details)
                    ? order.details.map((detail, index) => (
                        <li key={`${order.id_order}-detail-${index}`}>{detail}</li>
                      ))
                    : <li>{order.details}</li>
                  }
                </ul>
              </section>

              {hasComments && (
                <section className={styles.commentPanel}>
                  <div className={styles.panelTitle}>
                    <MdNotes className={styles.metaIcon} />
                    <span>Comentarios</span>
                  </div>
                  <p>{commentsText}</p>
                </section>
              )}
            </div>

            {order.user_deliver && (
              <div className={styles.deliverLine}>
                <MdDone className={styles.metaIcon} />
                <span>Asignado a {order.user_deliver}</span>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.columns}>

            {/* Columna Izquierda */}
            <div className={styles.column}>
              <p className={styles.metaLine}>
                <MdSchedule className={styles.metaIcon} />
                <span>{new Date(order.date_order).toLocaleString('es-MX')}</span>
              </p>

              <p className={styles.sectionLabel}>
                <MdInventory2 className={styles.metaIcon} />
                Detalles
              </p>
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
              <p className={styles.metaLine}>
                <MdPerson className={styles.metaIcon} />
                <span><span className={styles.label}>Solicitante:</span> {order.user_submit}</span>
              </p>
              <p className={styles.metaLine}>
                <MdPlace className={styles.metaIcon} />
                <span><span className={styles.label}>Destino:</span> {order.destiny || 'N/A'}</span>
              </p>
              <p className={styles.metaLine}>
                <MdNotes className={styles.metaIcon} />
                <span><span className={styles.label}>Comentarios:</span> {order.comments || 'N/A'}</span>
              </p>
              {order.user_deliver && (
                <p className={styles.metaLine}>
                  <MdDone className={styles.metaIcon} />
                  <span><span className={styles.label}>Entregado por:</span> {order.user_deliver}</span>
                </p>
              )}
            </div>
          </div>
        )}
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
