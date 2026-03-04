import styles from '@/styles/Dashboard.module.css';

const DashboardHeader = ({ dateRange, onDateChange, onQuickToday, onClearAll }) => (
  <div className={styles.header}>
    <div className={styles.filters}>
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
      {onQuickToday && (
        <div className={styles.filterGroup}>
          <label>&nbsp;</label>
          <button onClick={onQuickToday} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc' }}>
            Hoy
          </button>
        </div>
      )}
      {onClearAll && (
        <div className={styles.filterGroup}>
          <label>&nbsp;</label>
          <button onClick={onClearAll} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc' }}>
            Limpiar
          </button>
        </div>
      )}
    </div>
  </div>
);

export default DashboardHeader;