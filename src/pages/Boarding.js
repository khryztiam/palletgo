import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Modal from 'react-modal';
import RoleGate from '../components/RoleGate';
import { FaCrown, FaMedal } from 'react-icons/fa';
import styles from '@/styles/Boarding.module.css';

Modal.setAppElement('#__next');

// ─── Constantes ───────────────────────────────────────────────────────────────
const EMPTY_DELIVERER = { user_deliver: '' };
const OFFSET_SV = '-06:00';
const PAGE_SIZE = 50;

/**
 * Mapea el status de una orden al className del badge correspondiente.
 * Centralizado para evitar lógica inline en el JSX.
 */
const STATUS_CLASS = {
  'SOLICITADO':  styles.statusSolicitado,
  'EN PROGRESO': styles.statusEnProgreso,
  'ENTREGADO':   styles.statusEntregado,
  'CANCELADO':   styles.statusCancelado,
};

const formatDateInput = (fecha) => {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getDateBounds = (fechaInput) => ({
  startISO: new Date(`${fechaInput}T00:00:00.000${OFFSET_SV}`).toISOString(),
  endISO: new Date(`${fechaInput}T23:59:59.999${OFFSET_SV}`).toISOString(),
});

const isOrderFromToday = (dateISO) => {
  if (!dateISO) return false;
  const hoy = formatDateInput(new Date());
  const { startISO, endISO } = getDateBounds(hoy);
  const ts = new Date(dateISO).getTime();
  return ts >= new Date(startISO).getTime() && ts <= new Date(endISO).getTime();
};

const sortOrdersDesc = (arr) =>
  [...arr].sort(
    (a, b) => new Date(b.date_order || 0).getTime() - new Date(a.date_order || 0).getTime()
  );

const obtenerTurno = (fechaISO) => {
  if (!fechaISO) return null;
  const hora = new Date(fechaISO).getHours();
  if (hora >= 1 && hora < 14) return 'Turno 1';
  if (hora >= 14 && hora < 24) return 'Turno 2';
  return null;
};

const obtenerTurnoActual = () => {
  const hora = new Date().getHours();
  if (hora >= 1 && hora < 14) return 'Turno 1';
  if (hora >= 14 && hora < 24) return 'Turno 2';
  return null;
};

const getMsUntilNextShiftBoundary = () => {
  const now = new Date();
  const next = new Date(now);

  if (now.getHours() < 1) {
    next.setHours(1, 0, 0, 0);
  } else if (now.getHours() < 14) {
    next.setHours(14, 0, 0, 0);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(1, 0, 0, 0);
  }

  return Math.max(1000, next.getTime() - now.getTime());
};

const formatHora = (fechaISO) => {
  if (!fechaISO) return '—';
  return new Date(fechaISO).toLocaleTimeString('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatFechaLarga = (fecha) =>
  fecha.toLocaleDateString('es-SV', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

const limpiarNombre = (texto) => {
  if (!texto) return '—';
  return texto
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[^\p{L}\p{N}\s.-]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const formatDetalles = (detalles) => {
  if (detalles === null || detalles === undefined) return '—';
  if (typeof detalles === 'string') return detalles;
  if (Array.isArray(detalles)) {
    return detalles
      .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
      .join(' | ');
  }
  if (typeof detalles === 'object') return JSON.stringify(detalles);
  return String(detalles);
};

// ─── Subcomponente: ConfirmDeleteModal ────────────────────────────────────────
// Reemplaza window.confirm() — no bloquea el hilo principal y es estilizable.
const ConfirmDeleteModal = ({ isOpen, onConfirm, onCancel, name }) => (
  <Modal
    isOpen={isOpen}
    onRequestClose={onCancel}
    className={styles.confirmModal}
    overlayClassName={styles.modalOverlay}
    contentLabel="Confirmar eliminación"
  >
    <h3>¿Eliminar entregador?</h3>
    <p>
      Esta acción eliminará a <strong>{name}</strong> permanentemente y no se
      puede deshacer.
    </p>
    <div className={styles.confirmButtons}>
      <button onClick={onCancel}  className={styles.cancelButton}>Cancelar</button>
      <button onClick={onConfirm} className={styles.deleteButton}>Sí, eliminar</button>
    </div>
  </Modal>
);

// ─── Boarding Page ────────────────────────────────────────────────────────────
export default function Boarding() {
  const [deliverers,           setDeliverers]           = useState([]);
  const [orders,               setOrders]               = useState([]);
  const [selectedTurno,        setSelectedTurno]        = useState('AUTO');
  const [autoTurno,            setAutoTurno]            = useState(() => obtenerTurnoActual() || 'Turno 1');
  const [page,                 setPage]                 = useState(1);
  const [loading,              setLoading]              = useState(true);

  // Modal de entregador (crear / editar)
  const [isDelivererModalOpen, setIsDelivererModalOpen] = useState(false);
  const [currentDeliverer,     setCurrentDeliverer]     = useState(EMPTY_DELIVERER);
  const [hasChanges,           setHasChanges]           = useState(false);
  const [delivererError,       setDelivererError]       = useState('');

  // Modal de confirmación de eliminación
  const [isConfirmOpen,        setIsConfirmOpen]        = useState(false);

  // Modal de detalle de orden
  const [isOrderModalOpen,     setIsOrderModalOpen]     = useState(false);
  const [currentOrder,         setCurrentOrder]         = useState(null);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  const fetchDeliverers = useCallback(async () => {
    const { data, error } = await supabase.from('list_users').select('*');
    if (!error && data) setDeliverers(data);
  }, []);

  const fetchOrders = useCallback(async () => {
    const hoy = formatDateInput(new Date());
    const { startISO, endISO } = getDateBounds(hoy);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('date_order', startISO)
      .lte('date_order', endISO)
      .order('date_order', { ascending: false });
    if (!error && data) setOrders(data || []);
  }, []);

  // ── Realtime: órdenes ──────────────────────────────────────────────────────
  // MEJORA: La versión original cargaba las órdenes solo una vez (sin realtime).
  // Ahora se actualizan automáticamente cuando otro usuario cambia el estado.
  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchDeliverers(), fetchOrders()]);
      setLoading(false);
    };
    init();

    const channel = supabase
      .channel('boarding-realtime-today')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          if (!isOrderFromToday(payload.new.date_order)) return;

          setOrders(prev => {
            const exists = prev.some(o => o.id_order === payload.new.id_order);
            if (exists) return prev;
            return sortOrdersDesc([payload.new, ...prev]);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const includeOrder = isOrderFromToday(payload.new.date_order);

          setOrders(prev => {
            const exists = prev.some(o => o.id_order === payload.new.id_order);

            if (!includeOrder) {
              return prev.filter(o => o.id_order !== payload.new.id_order);
            }

            if (!exists) {
              return sortOrdersDesc([payload.new, ...prev]);
            }

            return sortOrdersDesc(
              prev.map(o => o.id_order === payload.new.id_order ? payload.new : o)
            );
          });

          // Si el modal de orden está abierto y es la misma orden → actualizar
          setCurrentOrder(prev =>
            prev?.id_order === payload.new.id_order ? payload.new : prev
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders(prev => prev.filter(o => o.id_order !== payload.old.id_order));
          setCurrentOrder(prev =>
            prev?.id_order === payload.old.id_order ? null : prev
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchDeliverers, fetchOrders]);

  useEffect(() => {
    const msUntilNextDay = (() => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      return next.getTime() - now.getTime();
    })();

    const timeoutId = setTimeout(() => {
      fetchOrders();
      setPage(1);
    }, msUntilNextDay);

    return () => clearTimeout(timeoutId);
  }, [fetchOrders]);

  useEffect(() => {
    let timeoutId;

    const scheduleShiftUpdate = () => {
      timeoutId = setTimeout(() => {
        setAutoTurno(obtenerTurnoActual() || 'Turno 1');
        scheduleShiftUpdate();
      }, getMsUntilNextShiftBoundary());
    };

    setAutoTurno(obtenerTurnoActual() || 'Turno 1');
    scheduleShiftUpdate();

    return () => clearTimeout(timeoutId);
  }, []);

  const effectiveTurno = selectedTurno === 'AUTO' ? autoTurno : selectedTurno;

  const todayLabel = formatFechaLarga(new Date());

  const filteredOrders = orders.filter(order => obtenerTurno(order.date_order) === effectiveTurno);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const top3Turno = filteredOrders.reduce((acc, order) => {
    if (order.status !== 'ENTREGADO') return acc;

    const nombre = limpiarNombre(order.user_deliver);
    if (!nombre || nombre === '—') return acc;

    acc[nombre] = (acc[nombre] || 0) + 1;
    return acc;
  }, {});

  const top3 = Object.entries(top3Turno)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count], index) => ({
      rank: index + 1,
      name,
      count,
    }));

  useEffect(() => {
    setPage(1);
  }, [effectiveTurno]);

  const midpoint = Math.ceil(deliverers.length / 2);
  const deliverersCol1 = deliverers.slice(0, midpoint);
  const deliverersCol2 = deliverers.slice(midpoint);

  // ── Handlers: Deliverer Modal ──────────────────────────────────────────────
  const handleOpenNewDeliverer = () => {
    setCurrentDeliverer(EMPTY_DELIVERER);
    setHasChanges(false);
    setDelivererError('');
    setIsDelivererModalOpen(true);
  };

  const handleRowClick = (deliverer) => {
    setCurrentDeliverer(deliverer);
    setHasChanges(false);
    setDelivererError('');
    setIsDelivererModalOpen(true);
  };

  const handleDelivererChange = (e) => {
    setCurrentDeliverer(prev => ({ ...prev, user_deliver: e.target.value }));
    setHasChanges(true);
    setDelivererError('');
  };

  const delivererNameSanitized = (currentDeliverer?.user_deliver || '').trim();
  const isSaveDisabled =
    !delivererNameSanitized || (!hasChanges && !!currentDeliverer?.id);

  const handleSaveDeliverer = async () => {
    if (!delivererNameSanitized) {
      setDelivererError('El nombre no puede estar vacío.');
      return;
    }

    try {
      if (currentDeliverer.id) {
        await supabase
          .from('list_users')
          .update({ user_deliver: delivererNameSanitized })
          .eq('id', currentDeliverer.id);
      } else {
        await supabase
          .from('list_users')
          .insert([{ user_deliver: delivererNameSanitized }]);
      }
      await fetchDeliverers();
      setIsDelivererModalOpen(false);
      setDelivererError('');
    } catch (err) {
      console.error('Error saving deliverer:', err);
    }
  };

  // ── Handlers: Confirm Delete ───────────────────────────────────────────────
  // MEJORA: reemplaza window.confirm() por un modal propio no bloqueante.
  const handleDeleteClick = () => {
    setIsDelivererModalOpen(false); // Cierra el modal de edición
    setIsConfirmOpen(true);         // Abre el de confirmación
  };

  const handleConfirmDelete = async () => {
    try {
      await supabase
        .from('list_users')
        .delete()
        .eq('id', currentDeliverer.id);

      await fetchDeliverers();
      setIsConfirmOpen(false);
    } catch (err) {
      console.error('Error deleting deliverer:', err);
    }
  };

  // ── Handlers: Order Modal ──────────────────────────────────────────────────
  const handleOrderRowClick = (order) => {
    setCurrentOrder(order);
    setIsOrderModalOpen(true);
  };

  // ── Render: Loading ────────────────────────────────────────────────────────
  if (loading) {
    return <div className={styles.loading}>Cargando datos...</div>;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <RoleGate allowedRoles={['EMBARQUE']}>
      <div className={styles.container}>

        <div className={styles.boardingRows}>

          {/* ── Fila 1: Top 3 entregas por turno ───────────────────────── */}
          <div className={`${styles.panel} ${styles.topPanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Top 3 entregadores</h2>
                <p className={styles.todayBanner}>{todayLabel}</p>
              </div>

              <div className={styles.turnoFilterBox}>
                <label htmlFor="turno-select" className={styles.turnoFilterLabel}>Turno</label>
                <select
                  id="turno-select"
                  className={styles.turnoSelect}
                  value={selectedTurno}
                  onChange={(e) => setSelectedTurno(e.target.value)}
                >
                  <option value="AUTO">Auto ({autoTurno})</option>
                  <option value="Turno 1">Turno 1</option>
                  <option value="Turno 2">Turno 2</option>
                </select>
              </div>
            </div>

            <div className={styles.topCardsRow}>
              {top3.length > 0 ? (
                top3.map(item => (
                  <article key={item.rank} className={styles.topCard}>
                    <div className={styles.topCardHeader}>
                      <span className={`${styles.topMedal} ${styles[`medal${item.rank}`]}`} aria-hidden="true">
                        {item.rank === 1 ? <FaCrown /> : <FaMedal />}
                      </span>
                      <span className={styles.topRank}>#{item.rank}</span>
                    </div>
                    <h3 className={styles.topName}>{item.name}</h3>
                    <p className={styles.topCount}>{item.count} entregas</p>
                  </article>
                ))
              ) : (
                <div className={styles.emptyTop}>Sin entregas registradas en {effectiveTurno}.</div>
              )}
            </div>
          </div>

          {/* ── Fila 2: Entregadores en dos columnas ───────────────────── */}
          <div className={`${styles.panel} ${styles.deliverersPanel}`}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Entregadores</h2>
              <button onClick={handleOpenNewDeliverer} className={styles.addButton}>
                + Agregar
              </button>
            </div>
            <div className={styles.panelContent}>
              <div className={styles.deliverersGrid}>
                <ul className={styles.deliverersList}>
                  {deliverersCol1.map(deliverer => (
                    <li key={deliverer.id}>
                      <button
                        type="button"
                        onClick={() => handleRowClick(deliverer)}
                        className={styles.delivererButton}
                      >
                        {deliverer.user_deliver}
                      </button>
                    </li>
                  ))}
                </ul>

                <ul className={styles.deliverersList}>
                  {deliverersCol2.map(deliverer => (
                    <li key={deliverer.id}>
                      <button
                        type="button"
                        onClick={() => handleRowClick(deliverer)}
                        className={styles.delivererButton}
                      >
                        {deliverer.user_deliver}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ── Fila 3: Órdenes de hoy ──────────────────────────────────── */}
          <div className={`${styles.panel} ${styles.ordersPanel}`}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Órdenes de hoy · {effectiveTurno} ({filteredOrders.length})</h2>
            </div>
            <div className={styles.panelContent}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>HORA SOLICITUD</th>
                    <th>USER SOLICITANTE</th>
                    <th>DETALLES</th>
                    <th>NUMERO ORDEN</th>
                    <th>DURACION</th>
                    <th>USUARIO ENTREGA</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedOrders.map(order => (
                    <tr
                      key={order.id_order}
                      onClick={() => handleOrderRowClick(order)}
                      className={styles.clickableRow}
                    >
                      <td>{formatHora(order.date_order)}</td>
                      <td>{order.user_submit || '—'}</td>
                      <td>{formatDetalles(order.details)}</td>
                      <td>{order.id_order || '—'}</td>
                      <td>{Number.isFinite(Number(order.duration)) ? `${Number(order.duration)} min` : '—'}</td>
                      <td>{limpiarNombre(order.user_deliver)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.paginationBar}>
                <button
                  type="button"
                  className={styles.pageButton}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </button>
                <span className={styles.pageInfo}>Página {page} de {totalPages} · {PAGE_SIZE} por página</span>
                <button
                  type="button"
                  className={styles.pageButton}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal: Crear / Editar Entregador ────────────────────────────── */}
        <Modal
          isOpen={isDelivererModalOpen}
          onRequestClose={() => setIsDelivererModalOpen(false)}
          className={styles.modal}
          overlayClassName={styles.modalOverlay}
          contentLabel={currentDeliverer?.id ? 'Editar Entregador' : 'Nuevo Entregador'}
        >
          <h2>{currentDeliverer?.id ? 'Editar Entregador' : 'Nuevo Entregador'}</h2>
          <div className={styles.modalForm}>
            <div className={styles.formGroup}>
              <label>Nombre del entregador:</label>
              <input
                type="text"
                value={currentDeliverer?.user_deliver || ''}
                onChange={handleDelivererChange}
                autoFocus
              />
              {delivererError && <small className={styles.formError}>{delivererError}</small>}
            </div>
            <div className={styles.modalButtons}>
              {currentDeliverer?.id && (
                <button onClick={handleDeleteClick} className={styles.deleteButton}>
                  Eliminar
                </button>
              )}
              <button
                onClick={() => setIsDelivererModalOpen(false)}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveDeliverer}
                className={styles.saveButton}
                disabled={isSaveDisabled}
              >
                Guardar
              </button>
            </div>
          </div>
        </Modal>

        {/* ── Modal: Confirmar Eliminación ─────────────────────────────────── */}
        <ConfirmDeleteModal
          isOpen={isConfirmOpen}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirmOpen(false)}
          name={currentDeliverer?.user_deliver}
        />

        {/* ── Modal: Detalle de Orden ──────────────────────────────────────── */}
        <Modal
          isOpen={isOrderModalOpen}
          onRequestClose={() => setIsOrderModalOpen(false)}
          className={styles.orderModal}
          overlayClassName={styles.modalOverlay}
          contentLabel="Detalles de la Orden"
        >
          <h2>Detalles de la Orden</h2>
          {currentOrder && (
            <div className={styles.orderContent}>

              {/* Campos de la orden */}
              {[
                { label: 'ID',          value: currentOrder.id_order },
                { label: 'Entregado',   value: currentOrder.user_deliver },
                { label: 'Fecha',       value: new Date(currentOrder.date_order).toLocaleString('es-MX') },
                { label: 'Área',        value: currentOrder.area },
                { label: 'Solicitante', value: currentOrder.user_submit },
                { label: 'Destino',     value: currentOrder.destiny },
              ].map(({ label, value }) => (
                <div key={label} className={styles.orderField}>
                  <span className={styles.orderLabel}>{label}:</span>
                  <span className={styles.orderValue}>{value || '—'}</span>
                </div>
              ))}

              {/* Status con badge */}
              <div className={styles.orderField}>
                <span className={styles.orderLabel}>Estado:</span>
                <span className={`${styles.statusBadge} ${STATUS_CLASS[currentOrder.status] ?? ''}`}>
                  {currentOrder.status}
                </span>
              </div>

              {/* Detalles (lista) */}
              <div className={styles.orderDetailsSection}>
                <span className={styles.orderLabel}>Detalles:</span>
                <ul className={styles.orderList}>
                  {(currentOrder.details || []).map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              </div>

              {/* Botones */}
              <div className={styles.orderButtons}>
                <button
                  className={styles.closeButton}
                  onClick={() => setIsOrderModalOpen(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </RoleGate>
  );
}