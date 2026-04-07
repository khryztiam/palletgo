import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import RoleGate from '@/components/RoleGate';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/Monitor.module.css';

Modal.setAppElement("#__next");

/**
 * Vista Monitor - Gestión de solicitudes y asignación de técnicos
 * Disponible para: TECNICO, ADMIN_TEC, ADMIN
 * Layout: Cards de solicitudes (centro) + Panel de técnicos (sidebar derecho)
 */
export default function Monitor() {
  const { userName, loading: authLoading } = useAuth();
  
  // Estados
  const [maintenanceQueue, setMaintenanceQueue] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [selectedTechnic, setSelectedTechnic] = useState(null);
  const [feedback, setFeedback] = useState({ show: false, message: '', type: '' });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // MOCKUP DATA - Solicitudes
  const mockMaintenanceQueue = [
    {
      id_maintenance: 1,
      title: 'Reparación de Conveyor',
      description: 'Conveyor dañado en área de embarque',
      category: 'Equipamiento',
      created_by: 'Juan Operador',
      assigned_to: 'Carlos Técnico',
      status: 'EN PROGRESO',
      date_created: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id_maintenance: 2,
      title: 'Cambio de Aceite Máquina A',
      description: 'Cambio periódico de aceite',
      category: 'Preventivo',
      created_by: 'María Supervisor',
      assigned_to: null,
      status: 'PENDIENTE',
      date_created: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id_maintenance: 3,
      title: 'Revisión de Frenos',
      description: 'Inspección general de sistema de frenos',
      category: 'Seguridad',
      created_by: 'Juan Operador',
      assigned_to: null,
      status: 'PENDIENTE',
      date_created: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id_maintenance: 4,
      title: 'Reparación de Sensor',
      description: 'Sensor de temperatura dañado',
      category: 'Equipamiento',
      created_by: 'María Supervisor',
      assigned_to: 'Pedro Técnico',
      status: 'EN PROGRESO',
      date_created: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // MOCKUP DATA - Técnicos
  const mockTechnicians = [
    { id: 1, name: 'Carlos Técnico', support_count: 45, is_active: true },
    { id: 2, name: 'Pedro Técnico', support_count: 38, is_active: true },
    { id: 3, name: 'Luis Técnico', support_count: 10, is_active: true },
    { id: 4, name: 'Jorge Técnico', support_count: 0, is_active: true },
  ];

  // Cargar datos
  useEffect(() => {
    setIsLoading(true);
    try {
      setMaintenanceQueue(mockMaintenanceQueue);
      setTechnicians(mockTechnicians);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Gestionar fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.documentElement.classList.add('monitor-fullscreen');
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.classList.remove('monitor-fullscreen');
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.classList.remove('monitor-fullscreen');
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Handlers de Modal
  const handleAssignClick = (maintenance) => {
    setSelectedMaintenance(maintenance);
    setSelectedTechnic(null);
    setIsAssignModalOpen(true);
  };

  const handleCompleteClick = (maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsCompleteModalOpen(true);
  };

  const handleAssign = () => {
    if (!selectedTechnic) {
      showFeedback('Selecciona un técnico', 'error');
      return;
    }
    
    // Actualizar asignación
    setMaintenanceQueue(prev =>
      prev.map(m =>
        m.id_maintenance === selectedMaintenance.id_maintenance
          ? { ...m, assigned_to: selectedTechnic.name, status: 'EN PROGRESO' }
          : m
      )
    );
    
    showFeedback(`✅ Asignado a ${selectedTechnic.name}`, 'success');
    setIsAssignModalOpen(false);
    setSelectedMaintenance(null);
    setSelectedTechnic(null);
  };

  const handleComplete = () => {
    setMaintenanceQueue(prev =>
      prev.map(m =>
        m.id_maintenance === selectedMaintenance.id_maintenance
          ? { ...m, status: 'COMPLETADO' }
          : m
      )
    );
    
    showFeedback('✅ Solicitud completada', 'success');
    setIsCompleteModalOpen(false);
    setSelectedMaintenance(null);
  };

  const showFeedback = (message, type = 'error', duration = 3000) => {
    setFeedback({ show: true, message, type });
    setTimeout(() => setFeedback(f => ({ ...f, show: false })), duration);
  };

  // Filtrar solicitudes - Siempre mostrar TODOS
  const filteredQueue = maintenanceQueue;

  if (authLoading) {
    return <div className={styles.container}><div className={styles.loading}>Cargando...</div></div>;
  }

  return (
    <RoleGate allowedRoles={['TECNICO', 'ADMIN_TEC']}>
      <div className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''}`}>
        {/* Header - Oculto en fullscreen */}
        {!isFullscreen && (
          <div className={styles.header}>
            <h1>🔧 Monitor de Mantenimiento</h1>
            <p className={styles.subtitle}>Gestión y asignación de solicitudes</p>
          </div>
        )}

        {/* Botón Toggle Fullscreen */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className={styles.fullscreenToggle}
          title={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
        >
          {isFullscreen ? '⛔ Salir' : '🖥️ Pantalla'}
        </button>

        {/* Feedback Toast */}
        {feedback.show && (
          <div className={`${styles.feedback} ${styles['feedback' + feedback.type]}`}>
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(f => ({ ...f, show: false }))} aria-label="Cerrar">×</button>
          </div>
        )}

        {/* Layout: Solicitudes + Sidebar Técnicos */}
        <div className={styles.monitorLayout}>
          {/* Panel Solicitudes (Lado Izquierdo) */}
          <div className={styles.mainPanel}>
            {/* Título Solicitudes */}
            {!isFullscreen && (
              <div className={styles.filterBar}>
                <h2 className={styles.sectionTitle}>📋 Solicitudes</h2>
              </div>
            )}

            {/* Grid de Cards */}
            {isLoading ? (
              <div className={styles.loading}>Cargando solicitudes...</div>
            ) : filteredQueue.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No hay solicitudes en este filtro</p>
              </div>
            ) : (
              <div className={styles.cardsGrid}>
                {filteredQueue.map(maintenance => (
                  <div key={maintenance.id_maintenance} className={styles.maintenanceCard}>
                    <div className={styles.cardHeader}>
                      <div>
                        <h3 className={styles.cardTitle}>#{maintenance.id_maintenance} - {maintenance.title}</h3>
                        <p className={styles.cardMeta}>{maintenance.category}</p>
                      </div>
                      <span className={`${styles.statusBadge} ${styles['status' + maintenance.status.replace(/\s/g, '')]}`}>
                        {maintenance.status === 'EN PROGRESO' ? '🔧' : maintenance.status === 'COMPLETADO' ? '✅' : '⏳'}
                        {' '}{maintenance.status}
                      </span>
                    </div>

                    <p className={styles.cardDescription}>{maintenance.description}</p>

                    <div className={styles.cardFooter}>
                      <span className={styles.cardInfo}>
                        Solicitado por: <strong>{maintenance.created_by}</strong>
                      </span>
                      {maintenance.assigned_to && (
                        <span className={styles.cardInfo}>
                          Asignado a: <strong>{maintenance.assigned_to}</strong>
                        </span>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className={styles.cardActions}>
                      {maintenance.status === 'PENDIENTE' && (
                        <button
                          onClick={() => handleAssignClick(maintenance)}
                          className={styles.actionBtn}
                        >
                          Asignar Técnico
                        </button>
                      )}
                      {maintenance.status === 'EN PROGRESO' && (
                        <button
                          onClick={() => handleCompleteClick(maintenance)}
                          className={`${styles.actionBtn} ${styles.completeBtn}`}
                        >
                          Marcar Completada
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Técnicos (Lado Derecho) */}
          <aside className={styles.techniciansSidebar}>
            <h3 className={styles.sidebarTitle}>👨‍🔧 Técnicos Disponibles</h3>
            <p className={styles.sidebarSubtitle}>Ordena por disponibilidad</p>

            <div className={styles.techniciansList}>
              {technicians
                .sort((a, b) => a.support_count - b.support_count)
                .map(tech => (
                  <div
                    key={tech.id}
                    className={`${styles.technicianItem} ${!tech.is_active ? styles.inactive : ''} ${selectedTechnic?.id === tech.id ? styles.selected : ''}`}
                    onClick={() => setSelectedTechnic(tech)}
                  >
                    <div className={styles.technicianHeader}>
                      <span className={styles.technicianStatus}>{tech.is_active ? '🟢' : '🔴'}</span>
                      <span className={styles.technicianName}>{tech.name}</span>
                    </div>
                    <div className={styles.technicianMetrics}>
                      <span className={styles.supportCount}>{tech.support_count} soportes</span>
                      {tech.support_count === 0 && <span className={styles.availableBadge}>DISPONIBLE</span>}
                    </div>
                  </div>
                ))}
            </div>
          </aside>
        </div>

        {/* Modal: Asignar Técnico */}
        <Modal
          isOpen={isAssignModalOpen}
          onRequestClose={() => setIsAssignModalOpen(false)}
          contentLabel="Asignar Técnico"
          className={styles.modalContent}
          overlayClassName={styles.modalOverlay}
        >
          <h2>Asignar Solicitud #{selectedMaintenance?.id_maintenance}</h2>
          <div className={styles.modalBody}>
            <p><strong>{selectedMaintenance?.title}</strong></p>
            <p className={styles.modalDescription}>{selectedMaintenance?.description}</p>

            <div className={styles.techniciansSelection}>
              <p className={styles.selectionLabel}>Selecciona un técnico:</p>
              {technicians.map(tech => (
                <button
                  key={tech.id}
                  onClick={() => setSelectedTechnic(tech)}
                  className={`${styles.technicianOption} ${selectedTechnic?.id === tech.id ? styles.selected : ''}`}
                >
                  <span className={styles.optionStatus}>{tech.is_active ? '🟢' : '🔴'}</span>
                  <span className={styles.optionName}>{tech.name}</span>
                  <span className={styles.optionCount}>({tech.support_count} soportes)</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className={styles.cancelBtn}
            >
              Cancelar
            </button>
            <button
              onClick={handleAssign}
              className={styles.submitBtn}
              disabled={!selectedTechnic}
            >
              Asignar
            </button>
          </div>
        </Modal>

        {/* Modal: Completar Solicitud */}
        <Modal
          isOpen={isCompleteModalOpen}
          onRequestClose={() => setIsCompleteModalOpen(false)}
          contentLabel="Completar Solicitud"
          className={styles.modalContent}
          overlayClassName={styles.modalOverlay}
        >
          <h2>¿Marcar como Completada?</h2>
          <div className={styles.modalBody}>
            <p><strong>{selectedMaintenance?.title}</strong></p>
            <p className={styles.modalDescription}>Solicitud #{selectedMaintenance?.id_maintenance}</p>
            <p className={styles.confirmText}>¿Está seguro de que esta solicitud ha sido completada?</p>
          </div>

          <div className={styles.modalActions}>
            <button
              onClick={() => setIsCompleteModalOpen(false)}
              className={styles.cancelBtn}
            >
              Cancelar
            </button>
            <button
              onClick={handleComplete}
              className={styles.submitBtn}
            >
              Confirmar Completada
            </button>
          </div>
        </Modal>
      </div>
    </RoleGate>
  );
}
