import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import RoleGate from '@/components/RoleGate';
import { useAuth } from '@/context/AuthContext';
import MaintenanceCard from '@/components/maintenance/MaintenanceCard';
import MaintenanceQueue from '@/components/maintenance/MaintenanceQueue';
import styles from '@/styles/MaintenanceRequest.module.css';

Modal.setAppElement("#__next");

/**
 * Vista RequestMaintenance - Crear solicitudes de mantenimiento
 * Disponible para: LINEA, ADMIN
 * Proporciona formulario categorizado para crear solicitudes de mtto
 */

// ─── Stepper para estados ─────────────────────────────────────────
const STATUS_IDX = { 'PENDIENTE': 0, 'EN PROGRESO': 1, 'COMPLETADO': 2 };
const STEPS = ['Pendiente', 'En Progreso', 'Completado'];

const MaintenanceStepper = ({ status }) => {
  const currentIdx = STATUS_IDX[status] ?? 0;
  return (
    <div className={styles.stepperWrapper}>
      <div className={styles.stepperTrack}>
        {STEPS.map((step, i) => {
          const isDone = i < currentIdx;
          const isActive = i === currentIdx;
          return (
            <div key={step} className={styles.stepperItem}>
              <div className={[
                styles.stepCircle,
                isDone ? styles.stepDone : '',
                isActive ? styles.stepActive : '',
              ].join(' ')}>
                {isDone ? '✓' : i + 1}
              </div>
              <span className={[
                styles.stepLabel,
                isActive ? styles.stepLabelActive : '',
                isDone ? styles.stepLabelDone : '',
              ].join(' ')}>
                {step}
              </span>
              {i < 2 && (
                <div className={`${styles.stepLine} ${isDone ? styles.stepLineDone : ''}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mensaje contextual */}
      <div className={styles.stepperMsg}>
        {status === 'PENDIENTE' && (
          <span className={styles.msgWaiting}>⏳ Tu solicitud está en espera</span>
        )}
        {status === 'EN PROGRESO' && (
          <span className={styles.msgProgress}>🔧 Un técnico está trabajando en tu solicitud</span>
        )}
        {status === 'COMPLETADO' && (
          <span className={styles.msgNext}>✅ ¡Tu solicitud ha sido completada!</span>
        )}
      </div>
    </div>
  );
};

export default function RequestMaintenance() {
  const { userName, loading: authLoading } = useAuth();

  // Estados del formulario
  const [formData, setFormData] = useState({
    category: 'Equipamiento',
    subcategory: '',
    description: '',
  });

  const [submittedRequests, setSubmittedRequests] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState({ show: false, message: '', type: '' });
  // Opciones de categorías con subcategorías
  const CATEGORIES = {
    Equipamiento: [
      'Conveyor dañado',
      'Sensor defectuoso',
      'Motor no funciona',
      'Frenos dañados',
      'Cilindro hidráulico',
      'Otro',
    ],
    Preventivo: [
      'Cambio de aceite',
      'Cambio de filtros',
      'Lubricación',
      'Inspección general',
      'Calibración',
      'Otro',
    ],
    Seguridad: [
      'Falta de resguardo',
      'Señalización dañada',
      'Fallo de emergencia',
      'Iluminación deficiente',
      'Piso resbaladizo',
      'Otro',
    ],
    Mantenimiento: [
      'Limpieza',
      'Soldadura',
      'Pintura',
      'Reparación estructura',
      'Aislamiento',
      'Otro',
    ],
  };

  // MOCKUP DATA - Solicitudes enviadas
  const mockRequests = [
    {
      id_maintenance: 101,
      title: 'Conveyor del área 2 hizo ruido extraño',
      description: 'Conveyor zona de descarga produciendo ruido',
      category: 'Equipamiento',
      created_by: userName,
      assigned_to: 'Carlos Técnico',
      status: 'COMPLETADO',
      priority: 'Media',
      date_created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      date_updated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id_maintenance: 102,
      title: 'Sensor de temperatura no leyendo bien',
      description: 'Lecturas inconsistentes en sensor zona A',
      category: 'Equipamiento',
      created_by: userName,
      assigned_to: 'Pedro Técnico',
      status: 'EN PROGRESO',
      priority: 'Alta',
      date_created: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      date_updated: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ];

  useEffect(() => {
    // Cargar solicitudes mockup
    setSubmittedRequests(mockRequests);
  }, [userName]);

  // Handlers del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Limpiar subcategoría si se cambia categoría
      ...(name === 'category' && { subcategory: '' }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category || !formData.subcategory || !formData.description.trim()) {
      showFeedback('Por favor completa todos los campos', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simular envío a servidor
      await new Promise(resolve => setTimeout(resolve, 500));

      // Agregar nueva solicitud al inicio
      const newRequest = {
        id_maintenance: Date.now(),
        title: `${formData.category} - ${formData.subcategory}`,
        description: formData.description,
        category: formData.category,
        created_by: userName,
        assigned_to: null,
        status: 'PENDIENTE',
        date_created: new Date().toISOString(),
        date_updated: null,
      };

      setSubmittedRequests(prev => [newRequest, ...prev]);
      setFormData({
        category: 'Equipamiento',
        subcategory: '',
        description: '',
      });

      showFeedback('✅ Solicitud creada exitosamente', 'success');
    } catch (err) {
      console.error('Error al crear solicitud:', err);
      showFeedback('Error al crear la solicitud', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  const showFeedback = (message, type = 'error', duration = 5000) => {
    setFeedback({ show: true, message, type });
    setTimeout(() => setFeedback(f => ({ ...f, show: false })), duration);
  };

  const handleOpenModal = () => {
    setFormData({ category: 'Equipamiento', subcategory: '', description: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando...</div>
      </div>
    );
  }

  return (
    <RoleGate allowedRoles={['LINEA']}>
      <div className={styles.container}>

          {/* Toast de feedback */}
          {feedback.show && (
            <div className={`${styles.toast} ${styles[`toast${feedback.type}`]}`}>
              <span>{feedback.message}</span>
              <button onClick={() => setFeedback(f => ({ ...f, show: false }))} aria-label="Cerrar">
                ×
              </button>
            </div>
          )}

          {/* Solicitud Activa */}
          <p className={styles.panelLabel}>Mi solicitud activa</p>
          {submittedRequests.length > 0 ? (
            <section className={styles.activeRequestSection}>
              <div className={styles.activeRequestHeader}>
                <span className={styles.activeRequestBadge}>★ Mi Solicitud</span>
                <h3 className={styles.activeRequestTitle}>
                  {submittedRequests[0].category} — #{submittedRequests[0].id_maintenance}
                </h3>
              </div>
              <div className={styles.activeRequestBody}>
                <div className={styles.infoCol}>
                  <p className={styles.infoLabel}>Tipo:</p>
                  <p className={styles.infoValue}>{submittedRequests[0].title}</p>
                </div>
                <div className={styles.colDivider} />
                <div className={styles.infoCol}>
                  <p className={styles.infoLabel}>Descripción:</p>
                  <p className={styles.infoValue}>{submittedRequests[0].description}</p>
                </div>
              </div>
              <MaintenanceStepper status={submittedRequests[0].status} />
            </section>
          ) : (
            <div className={styles.emptyOrder}>
              <span className={styles.emptyIcon}>🔧</span>
              <p className={styles.emptyTitle}>No tienes solicitudes activas</p>
              <p className={styles.emptySubtitle}>Usa el botón <strong>Solicitud</strong> para crear una nueva</p>
            </div>
          )}

          {/* Botón flotante */}
          <button onClick={handleOpenModal} className={styles.floatingBtn}>
            Solicitud
          </button>

          {/* Cola de Solicitudes */}
          {submittedRequests.length > 1 && (
            <div className={styles.queueSection}>
              <div className={styles.queueHeader}>
                <p className={styles.panelLabel} style={{ marginBottom: 0 }}>Total Solicitudes</p>
                <span className={styles.queueCount}>{submittedRequests.length} solicitudes</span>
              </div>
              <MaintenanceQueue queue={submittedRequests} filter="TODOS" />
            </div>
          )}

          {/* ── Modal nueva solicitud ─────────────────────────────────── */}
          <Modal
            isOpen={isModalOpen}
            onRequestClose={handleCloseModal}
            contentLabel="Nueva Solicitud de Mantenimiento"
            className={styles.modalContent}
            overlayClassName={styles.modalOverlay}
          >
            <h2>Nueva Solicitud de Mantenimiento</h2>
            <form onSubmit={handleSubmit}>
              {/* Usuario logueado (read-only) */}
              <div className={styles.formGroup}>
                <label>Solicitante</label>
                <div className={styles.readOnly}>{userName}</div>
              </div>

              {/* Categoría */}
              <div className={styles.formGroup}>
                <label htmlFor="category">Categoría *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                >
                  {Object.keys(CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategoría */}
              <div className={styles.formGroup}>
                <label htmlFor="subcategory">Tipo de Problema *</label>
                <select
                  id="subcategory"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                >
                  <option value="">Selecciona un problema</option>
                  {CATEGORIES[formData.category].map(subcat => (
                    <option key={subcat} value={subcat}>
                      {subcat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div className={styles.formGroup}>
                <label htmlFor="description">Descripción *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe el problema con detalle..."
                  rows="4"
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formActions}>
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className={styles.cancelButton} 
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={styles.submitButton} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '⏳ Enviando...' : '✓ Crear Solicitud'}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      </RoleGate>
  );
}
