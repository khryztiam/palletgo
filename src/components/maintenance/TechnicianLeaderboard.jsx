import React from 'react';
import styles from '@/styles/TechnicianLeaderboard.module.css';

/**
 * TechnicianLeaderboard - Componente para mostrar ranking de técnicos por soportes realizados
 * Basado en el concepto de leaderboard con posiciones y estadísticas
 */
const TechnicianLeaderboard = ({ technicians = [] }) => {
  // Ordenar por número de soportes (descendente)
  const sortedTechnicians = [...technicians].sort((a, b) => (b.support_count || 0) - (a.support_count || 0));

  const getMedalEmoji = (position) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '•';
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 1:
        return '#fbbf24'; // Oro
      case 2:
        return '#d1d5db'; // Plata
      case 3:
        return '#d97706'; // Bronce
      default:
        return '#e5e7eb'; // Gris
    }
  };

  if (sortedTechnicians.length === 0) {
    return (
      <div className={styles.leaderboard}>
        <h3 className={styles.title}>Ranking de Técnicos</h3>
        <div className={styles.empty}>
          <p>No hay técnicos registrados aún</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.leaderboard}>
      <h3 className={styles.title}>🏆 Ranking de Técnicos</h3>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.position}>Pos.</th>
              <th className={styles.name}>Nombre</th>
              <th className={styles.supports}>Soportes Realizados</th>
              <th className={styles.status}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {sortedTechnicians.map((tech, idx) => {
              const position = idx + 1;
              const bgColor = getPositionColor(position);
              return (
                <tr
                  key={tech.id || idx}
                  className={`${styles.row} ${position <= 3 ? styles.rowTopThree : ''}`}
                  style={position <= 3 ? { backgroundColor: `${bgColor}20` } : {}}
                >
                  <td className={styles.position}>
                    <span className={styles.medal}>{getMedalEmoji(position)}</span>
                    {position}
                  </td>
                  <td className={styles.name}>
                    <span className={styles.techName}>{tech.name || 'Técnico'}</span>
                  </td>
                  <td className={styles.supports}>
                    <span className={styles.supportCount}>{tech.support_count || 0}</span>
                  </td>
                  <td className={styles.status}>
                    <span
                      className={`${styles.statusBadge} ${
                        tech.is_active ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {tech.is_active ? '🟢 Activo' : '🔴 Inactivo'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Técnicos:</span>
          <span className={styles.statValue}>{sortedTechnicians.length}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Soportes:</span>
          <span className={styles.statValue}>
            {sortedTechnicians.reduce((sum, t) => sum + (t.support_count || 0), 0)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Promedio por Técnico:</span>
          <span className={styles.statValue}>
            {(
              sortedTechnicians.reduce((sum, t) => sum + (t.support_count || 0), 0) /
              sortedTechnicians.length
            ).toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TechnicianLeaderboard;
