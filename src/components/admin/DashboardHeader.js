const DashboardHeader = ({ dateRange, area, onDateChange, onAreaChange }) => (
  <div className="dashboard-header">
    <h1>📈 Panel de Administración</h1>
    <div className="dashboard-filters">
      <div className="filter-group">
        <label>Desde:</label>
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => onDateChange('start', e.target.value)}
        />
      </div>
      <div className="filter-group">
        <label>Hasta:</label>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => onDateChange('end', e.target.value)}
        />
      </div>
      {/*  //No implementado debido a que solo existe area  Linea

      <div className="filter-group">
        <label>Área:</label>
        <select value={area} onChange={(e) => onAreaChange(e.target.value)}>
          <option value="">Todas</option>
          <option value="LINEA">Línea</option>
          <option value="EMBARQUE">Embarque</option>
          <option value="ALMACÉN">Almacén</option>
        </select>
      </div>
      
      */}
    </div>
  </div>
);

export default DashboardHeader;
