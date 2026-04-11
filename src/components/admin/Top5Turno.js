import React from 'react';
import styles from '@/styles/Dashboard.module.css';

const Top5Turno = ({ topTurno }) => {
  const listaTurno1 = topTurno?.['Turno 1'] || [];
  const listaTurno2 = topTurno?.['Turno 2'] || [];

  const renderLista = (titulo, items) => {
    const maximo = Math.max(...items.map(([, total]) => total), 1);

    return (
    <div className={styles.topTurnoCol}>
      <h4>{titulo}</h4>
      {items.length === 0 ? (
        <p className={styles.topTurnoEmpty}>Sin datos</p>
      ) : (
        <ul className={styles.topTurnoBars}>
          {items.map(([area, total], index) => (
            <li key={`${titulo}-${area}-${index}`} className={styles.topTurnoBarItem}>
              <div className={styles.topTurnoBarHead}>
                <span title={area}>{area}</span>
                <strong>{total}</strong>
              </div>
              <div className={styles.topTurnoTrack}>
                <div
                  className={styles.topTurnoFill}
                  style={{ width: `${Math.max(8, (total / maximo) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
    );
  };

  return (
    <div className={styles.topTurnoCard}>
      <h3>Top 5 areas por turno</h3>
      <div className={styles.topTurnoGrid}>
        {renderLista('Turno 1', listaTurno1)}
        {renderLista('Turno 2', listaTurno2)}
      </div>
    </div>
  );
};

export default Top5Turno;
