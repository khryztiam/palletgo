import styles from '@/styles/Dashboard.module.css';

const DashboardHeader = ({
  dateRange,
  onDateChange,
  onQuickToday,
  onQuick7Days,
  onQuick30Days,
  onClearAll,
  onExport,
  exportLabel,
  disableExport,
  fixedToday = false,
}) => (
  <div className={styles.header}>
    <div className={styles.headerTopRow}>
      <div className={styles.filtersCompact}>
        <div className={styles.filterGroup}>
          <label>Inicio</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => onDateChange('start', e.target.value)}
              disabled={fixedToday}
          />
        </div>
        <div className={styles.filterGroup}>
          <label>Fin</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => onDateChange('end', e.target.value)}
              disabled={fixedToday}
          />
        </div>

          {!fixedToday && (
            <div className={styles.quickFilters}>
              {onQuickToday && <button type="button" onClick={onQuickToday}>Hoy</button>}
              {onQuick7Days && <button type="button" onClick={onQuick7Days}>7D</button>}
              {onQuick30Days && <button type="button" onClick={onQuick30Days}>30D</button>}
              {onClearAll && <button type="button" onClick={onClearAll}>Restablecer</button>}
            </div>
          )}

          {fixedToday && <span className={styles.todayBadge}>Filtro operativo: Hoy</span>}
      </div>

      {onExport && (
        <button
          type="button"
          onClick={onExport}
          className={styles.csvExportBtn}
          disabled={disableExport}
        >
          {exportLabel || 'Exportar CSV'}
        </button>
      )}
    </div>

    <div className={styles.headerHintRow}>
      <span>{fixedToday ? 'Vista operativa en tiempo real del dia actual' : 'Filtro rapido por rango de fechas'}</span>
      <span>Exporta exactamente el rango filtrado</span>
    </div>
  </div>
);

export default DashboardHeader;