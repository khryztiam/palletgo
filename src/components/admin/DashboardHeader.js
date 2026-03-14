import styles from '@/styles/Dashboard.module.css';

const DashboardHeader = ({ dateRange, onDateChange, onQuickToday, onClearAll }) => (
  <div className={styles.header}>
    <div className={styles.filters}>
      {/* Fila 1: Filtros de fecha */}
      <div className={`${styles.filtersRow} ${styles.dates}`}>
        <div className={styles.filterGroup}>
          <label>Desde:</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => onDateChange('start', e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label>Hasta:</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => onDateChange('end', e.target.value)}
          />
        </div>
      </div>

      {/* Fila 2: Botones de acción */}
      <div className={`${styles.filtersRow} ${styles.buttons}`}>
        {onQuickToday && (
          <div className={styles.filterGroup}>
            <label>&nbsp;</label>
            <button onClick={onQuickToday}>
              Hoy
            </button>
          </div>
        )}
        {onClearAll && (
          <div className={styles.filterGroup}>
            <label>&nbsp;</label>
            <button onClick={onClearAll}>
              Limpiar
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default DashboardHeader;