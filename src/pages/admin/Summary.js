import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import { supabase } from "@/lib/supabase";
import styles from "@/styles/Summary.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Filler,
  Tooltip,
  Legend
);

const OFFSET_SV = "-06:00";
const TURN_COLORS = {
  "Turno 1": "#1e88e5",
  "Turno 2": "#1f2a9e",
};

const formatDateInput = (fecha) => {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getDateBounds = (rango) => {
  const hoy = new Date();
  const inicio = rango.start || formatDateInput(hoy);
  const fin = rango.end || inicio;

  return {
    startISO: new Date(`${inicio}T00:00:00.000${OFFSET_SV}`).toISOString(),
    endISO: new Date(`${fin}T23:59:59.999${OFFSET_SV}`).toISOString(),
  };
};

const getDefaultRange7Days = () => {
  const fin = new Date();
  const inicio = new Date();
  inicio.setDate(fin.getDate() - 6);

  return {
    start: formatDateInput(inicio),
    end: formatDateInput(fin),
  };
};

const diffDaysInclusive = (start, end) => {
  if (!start || !end) return 1;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const diffMs = endDate.getTime() - startDate.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, days);
};

const obtenerTurno = (fechaISO) => {
  if (!fechaISO) return null;
  const hora = new Date(fechaISO).getHours();
  if (hora >= 1 && hora < 14) return "Turno 1";
  if (hora >= 14 && hora < 24) return "Turno 2";
  return null;
};

const obtenerRangoDuracion = (duracion) => {
  const valor = Number(duracion);
  if (!Number.isFinite(valor)) return null;
  if (valor <= 10) return "0-10 min";
  if (valor <= 20) return "11-20 min";
  if (valor <= 30) return "21-30 min";
  return ">30 min";
};

const acumular = (obj, key) => {
  obj[key] = (obj[key] || 0) + 1;
};

const formatHora = (fechaISO) => {
  if (!fechaISO) return "-";
  const fecha = new Date(fechaISO);
  return fecha.toLocaleTimeString("es-SV", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatFecha = (fechaISO) => {
  if (!fechaISO) return "-";
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString("es-SV", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const limpiarEmojis = (texto) => {
  if (!texto) return "-";
  return texto
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const formatDetalles = (detalles) => {
  if (detalles === null || detalles === undefined) return "-";
  if (typeof detalles === "string") return detalles;
  if (Array.isArray(detalles)) {
    return detalles.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join(" | ");
  }
  if (typeof detalles === "object") return JSON.stringify(detalles);
  return String(detalles);
};

const buildResumenEjecutivo = (ordenes, ordenesSla) => {
  const totalesTurno = {
    "Turno 1": 0,
    "Turno 2": 0,
  };

  const totalesDuracion = {
    "0-10 min": 0,
    "11-20 min": 0,
    "21-30 min": 0,
    ">30 min": 0,
  };

  const ordenesPorDia = {};
  const ordenesPorDiaTurno = {};
  const ordenesPorAreaTurno = {};
  const duracionPorTurno = {
    "0-10 min": { "Turno 1": 0, "Turno 2": 0 },
    "11-20 min": { "Turno 1": 0, "Turno 2": 0 },
    "21-30 min": { "Turno 1": 0, "Turno 2": 0 },
    ">30 min": { "Turno 1": 0, "Turno 2": 0 },
  };
  const filasResumen = [];

  (ordenes || []).forEach((orden) => {
    const turno = obtenerTurno(orden.date_order);
    if (!turno) return;

    const rango = obtenerRangoDuracion(orden.duration);
    const fecha = orden.date_order ? new Date(orden.date_order) : null;
    const dia = fecha ? formatDateInput(fecha) : "Sin fecha";

    acumular(totalesTurno, turno);
    if (rango) {
      acumular(totalesDuracion, rango);
      duracionPorTurno[rango][turno] += 1;
    }
    acumular(ordenesPorDia, dia);

    if (!ordenesPorDiaTurno[dia]) {
      ordenesPorDiaTurno[dia] = { "Turno 1": 0, "Turno 2": 0 };
    }
    ordenesPorDiaTurno[dia][turno] += 1;

    const area = orden.area || "SIN AREA";
    if (!ordenesPorAreaTurno[area]) {
      ordenesPorAreaTurno[area] = { "Turno 1": 0, "Turno 2": 0 };
    }
    ordenesPorAreaTurno[area][turno] += 1;

    filasResumen.push({
      fechaSolicitud: formatFecha(orden.date_order),
      horaSolicitud: formatHora(orden.date_order),
      userSolicitante: orden.user_submit || "-",
      detalles: formatDetalles(orden.details),
      numeroOrden: orden.id_order || "-",
      duracion: Number.isFinite(Number(orden.duration)) ? `${Number(orden.duration)} min` : "-",
      usuarioEntrega: limpiarEmojis(orden.user_deliver),
      fechaOrden: orden.date_order || null,
    });

  });

  let sumaDuracion = 0;
  let totalConDuracion = 0;
  let totalCumplen20 = 0;

  (ordenesSla || []).forEach((orden) => {
    const duracion = Number(orden.duration);
    if (!Number.isFinite(duracion)) return;

    sumaDuracion += duracion;
    totalConDuracion += 1;
    if (duracion <= 20) totalCumplen20 += 1;
  });

  const tiempoPromedio = totalConDuracion ? sumaDuracion / totalConDuracion : 0;

  const diasOrdenados = Object.keys(ordenesPorDia)
    .filter((d) => d !== "Sin fecha")
    .sort();

  const areasOrdenadas = Object.entries(ordenesPorAreaTurno)
    .sort((a, b) => {
      const totalB = b[1]["Turno 1"] + b[1]["Turno 2"];
      const totalA = a[1]["Turno 1"] + a[1]["Turno 2"];
      return totalB - totalA;
    });

  const filasOrdenadas = filasResumen
    .sort((a, b) => new Date(b.fechaOrden || 0).getTime() - new Date(a.fechaOrden || 0).getTime());

  return {
    kpis: {
      totalOrdenes: totalesTurno["Turno 1"] + totalesTurno["Turno 2"],
      tiempoPromedio,
      turno1: totalesTurno["Turno 1"],
      turno2: totalesTurno["Turno 2"],
      cumplimiento20: totalConDuracion
        ? (totalCumplen20 * 100) / totalConDuracion
        : 0,
    },
    totalesTurno,
    totalesDuracion,
    duracionPorTurno,
    ordenesPorDiaTurno,
    areasOrdenadas,
    diasOrdenados,
    filasResumen: filasOrdenadas,
  };
};

export default function SummaryPage() {
  const rangoInicial = useMemo(() => getDefaultRange7Days(), []);

  const [rangoFechas, setRangoFechas] = useState(rangoInicial);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [ordenes, setOrdenes] = useState([]);
  const [ordenesSla, setOrdenesSla] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      setCargando(true);
      setError("");
      try {
        const { startISO, endISO } = getDateBounds(rangoFechas);

        const { data, error: dbError } = await supabase
          .from("orders")
          .select("id_order, area, date_order, duration, status, user_submit, user_deliver, details")
          .gte("date_order", startISO)
          .lte("date_order", endISO)
          .limit(10000)
          .order("date_order", { ascending: true });

        if (dbError) throw dbError;

        const dataLimpia = (data || []).filter((orden) => {
          const turno = obtenerTurno(orden.date_order);
          const tieneId = orden.id_order !== null && orden.id_order !== undefined;
          const tieneFecha = !!orden.date_order;
          const tieneArea = !!orden.area;
          const tieneDuracion = orden.duration !== null && orden.duration !== undefined;
          const tieneSolicitante = !!orden.user_submit;
          const tieneEntrega = !!orden.user_deliver;
          const tieneDetalles = orden.details !== null && orden.details !== undefined && String(orden.details).trim() !== "";

          return (
            !!turno &&
            tieneId &&
            tieneFecha &&
            tieneArea &&
            tieneDuracion &&
            tieneSolicitante &&
            tieneEntrega &&
            tieneDetalles
          );
        });

        const dataSla = (data || []).filter((orden) => {
          return orden.status === "ENTREGADO" && Number.isFinite(Number(orden.duration));
        });

        setOrdenes(dataLimpia);
        setOrdenesSla(dataSla);
      } catch (e) {
        console.error("Error cargando summary:", e);
        setError(`No se pudo cargar el resumen ejecutivo: ${e.message || "Error desconocido"}`);
      } finally {
        setCargando(false);
      }
    };

    fetchData();
  }, [rangoFechas.start, rangoFechas.end]);

  const resumen = useMemo(() => buildResumenEjecutivo(ordenes, ordenesSla), [ordenes, ordenesSla]);
  const rangoDias = useMemo(
    () => diffDaysInclusive(rangoFechas.start, rangoFechas.end),
    [rangoFechas.start, rangoFechas.end]
  );
  const esHoy = rangoDias === 1;
  const mostrarColumnaFecha = !esHoy;
  const bloquearTabla = rangoDias >= 30;
  const paginarTabla = rangoDias >= 7 && rangoDias < 30;

  useEffect(() => {
    setPage(1);
  }, [rangoFechas.start, rangoFechas.end]);

  const totalRows = resumen.filasResumen.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  const filasTabla = useMemo(() => {
    if (bloquearTabla) return [];
    if (!paginarTabla || esHoy) return resumen.filasResumen;

    const inicio = (page - 1) * pageSize;
    const fin = inicio + pageSize;
    return resumen.filasResumen.slice(inicio, fin);
  }, [bloquearTabla, paginarTabla, esHoy, resumen.filasResumen, page, pageSize]);

  const lineData = {
    labels: resumen.diasOrdenados,
    datasets: [
      {
        label: "Turno 1",
        data: resumen.diasOrdenados.map((d) => resumen.ordenesPorDiaTurno[d]?.["Turno 1"] || 0),
        borderColor: TURN_COLORS["Turno 1"],
        backgroundColor: "rgba(37, 99, 235, 0.15)",
        pointBackgroundColor: TURN_COLORS["Turno 1"],
        pointRadius: 3,
        tension: 0.3,
        fill: true,
      },
      {
        label: "Turno 2",
        data: resumen.diasOrdenados.map((d) => resumen.ordenesPorDiaTurno[d]?.["Turno 2"] || 0),
        borderColor: TURN_COLORS["Turno 2"],
        backgroundColor: "rgba(31, 42, 158, 0.15)",
        pointBackgroundColor: TURN_COLORS["Turno 2"],
        pointRadius: 3,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const turnosData = {
    labels: Object.keys(resumen.totalesTurno),
    datasets: [
      {
        label: "Turnos",
        data: Object.values(resumen.totalesTurno),
        backgroundColor: [TURN_COLORS["Turno 1"], TURN_COLORS["Turno 2"]],
        borderWidth: 0,
      },
    ],
  };

  const duracionTurnoData = {
    labels: Object.keys(resumen.duracionPorTurno),
    datasets: [
      {
        label: "Turno 1",
        data: Object.keys(resumen.duracionPorTurno).map((key) => resumen.duracionPorTurno[key]["Turno 1"]),
        backgroundColor: TURN_COLORS["Turno 1"],
      },
      {
        label: "Turno 2",
        data: Object.keys(resumen.duracionPorTurno).map((key) => resumen.duracionPorTurno[key]["Turno 2"]),
        backgroundColor: TURN_COLORS["Turno 2"],
      },
    ],
  };

  const areaTurnoData = {
    labels: resumen.areasOrdenadas.map(([nombre]) => nombre),
    datasets: [
      {
        label: "Turno 1",
        data: resumen.areasOrdenadas.map(([, valor]) => valor["Turno 1"]),
        backgroundColor: TURN_COLORS["Turno 1"],
        borderRadius: 8,
      },
      {
        label: "Turno 2",
        data: resumen.areasOrdenadas.map(([, valor]) => valor["Turno 2"]),
        backgroundColor: TURN_COLORS["Turno 2"],
        borderRadius: 8,
      },
    ],
  };

  const areaMinWidth = Math.max(860, resumen.areasOrdenadas.length * 58);

  const handleRangoRapido = (dias) => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(fin.getDate() - (dias - 1));

    setRangoFechas({
      start: formatDateInput(inicio),
      end: formatDateInput(fin),
    });
  };

  return (
    <section className={styles.summaryPage}>
      <div className={styles.filterBar}>
        <div className={styles.filterBarTitle}>
          <span>Periodo de analisis</span>
          <small>Filtra el resumen operativo por fecha</small>
        </div>
        <div className={styles.filtros}>
          <label>
            Inicio
            <input
              type="date"
              value={rangoFechas.start}
              onChange={(e) => setRangoFechas((prev) => ({ ...prev, start: e.target.value }))}
            />
          </label>

          <label>
            Fin
            <input
              type="date"
              value={rangoFechas.end}
              onChange={(e) => setRangoFechas((prev) => ({ ...prev, end: e.target.value }))}
            />
          </label>

          <div className={styles.atajos}>
            <button type="button" onClick={() => handleRangoRapido(1)}>Hoy</button>
            <button type="button" onClick={() => handleRangoRapido(7)}>7D</button>
            <button type="button" onClick={() => handleRangoRapido(30)}>30D</button>
          </div>
        </div>
      </div>

      {cargando && <p className={styles.estado}>Cargando resumen...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!cargando && !error && (
        <>
          <div className={styles.kpis}>
            <article className={`${styles.kpiCard} ${styles.kpiTotal}`}>
              <span>Total de ordenes</span>
              <strong>{resumen.kpis.totalOrdenes}</strong>
            </article>

            <article className={`${styles.kpiCard} ${styles.kpiTurno1}`}>
              <span>Turno 1</span>
              <strong>{resumen.kpis.turno1}</strong>
            </article>

            <article className={`${styles.kpiCard} ${styles.kpiTurno2}`}>
              <span>Turno 2</span>
              <strong>{resumen.kpis.turno2}</strong>
            </article>

            <article className={`${styles.kpiCard} ${styles.kpiTiempo}`}>
              <span>Tiempo prom entrega</span>
              <strong>{resumen.kpis.tiempoPromedio.toFixed(1)} min</strong>
            </article>

            <article className={`${styles.kpiCard} ${styles.kpiSla}`}>
              <span>SLA &lt;= 20 min</span>
              <strong>{resumen.kpis.cumplimiento20.toFixed(1)}%</strong>
            </article>
          </div>

          <div className={styles.gridChart}>
            <article className={`${styles.chartCard} ${styles.fullWidthCard}`}>
              <h3>Ordenes por area y turno</h3>
              <div className={styles.chartScroll}>
                <div className={styles.chartAreaWide} style={{ minWidth: `${areaMinWidth}px` }}>
                  <Bar
                    data={areaTurnoData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: true, position: "bottom" } },
                      scales: {
                        x: {
                          stacked: true,
                          ticks: {
                            autoSkip: false,
                            font: { size: 10 },
                            callback: function(value) {
                              const label = this.getLabelForValue(value);
                              return String(label).split(" ");
                            },
                          },
                        },
                        y: { beginAtZero: true, stacked: true },
                      },
                    }}
                  />
                </div>
              </div>
            </article>

            <article className={`${styles.chartCard} ${styles.trendCard}`}>
              <h3>Tendencia diaria por turno</h3>
              <div className={styles.chartScroll}>
                <div className={`${styles.chartWrap} ${styles.chartTrendWide}`}>
                  <Line
                    data={lineData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: true, position: "bottom" } },
                      scales: { y: { beginAtZero: true } },
                    }}
                  />
                </div>
              </div>
            </article>

            <article className={`${styles.chartCard} ${styles.compactCard}`}>
              <h3>Distribucion por turno</h3>
              <div className={styles.chartWrapCompact}>
                <Doughnut
                  data={turnosData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "62%",
                    plugins: { legend: { position: "bottom", labels: { boxWidth: 11, font: { size: 11 } } } },
                  }}
                />
              </div>
            </article>

            <article className={`${styles.chartCard} ${styles.compactCard}`}>
              <h3>Rangos de tiempo de entrega</h3>
              <div className={styles.chartScroll}>
                <div className={`${styles.chartWrapCompact} ${styles.chartRangeWide}`}>
                  <Bar
                    data={duracionTurnoData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: true, position: "bottom", labels: { boxWidth: 11, font: { size: 11 } } } },
                      scales: {
                        x: { stacked: true, ticks: { maxRotation: 15, minRotation: 0, font: { size: 10 } } },
                        y: { beginAtZero: true, stacked: true },
                      },
                    }}
                  />
                </div>
              </div>
            </article>
          </div>

          <article className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h3>Resumen de ordenes</h3>
              <div className={styles.tableHeaderActions}>
                {paginarTabla && (
                  <label className={styles.pageSizeLabel}>
                    Filas
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                    </select>
                  </label>
                )}

                <span>
                  {bloquearTabla
                    ? `Rango ${rangoDias}D`
                    : paginarTabla
                      ? `${totalRows} registros | Pagina ${page}/${totalPages}`
                      : `${totalRows} registros`}
                </span>
              </div>
            </div>

            {bloquearTabla ? (
              <div className={styles.derivacionBox}>
                <p>
                  Para rangos de {rangoDias} dias, la tabla detallada se deriva a la vista Dashboard para descarga y exportacion.
                </p>
                <Link href="/admin/Dashboard" className={styles.linkDashboard}>
                  Ir a Dashboard
                </Link>
              </div>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.resumenTable}>
                    <thead>
                      <tr>
                        {mostrarColumnaFecha && <th>Fecha</th>}
                        <th>Hora solicitud</th>
                        <th>User solicitante</th>
                        <th>Detalles</th>
                        <th>Numero orden</th>
                        <th>Duracion</th>
                        <th>Usuario entrega</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filasTabla.length === 0 ? (
                        <tr>
                          <td colSpan={mostrarColumnaFecha ? 7 : 6} className={styles.emptyCell}>No hay datos en el rango seleccionado.</td>
                        </tr>
                      ) : (
                        filasTabla.map((fila, idx) => (
                          <tr key={`${fila.numeroOrden}-${idx}`}>
                            {mostrarColumnaFecha && <td>{fila.fechaSolicitud}</td>}
                            <td>{fila.horaSolicitud}</td>
                            <td>{fila.userSolicitante}</td>
                            <td className={styles.detalleCell}>{fila.detalles}</td>
                            <td>{fila.numeroOrden}</td>
                            <td>{fila.duracion}</td>
                            <td>{fila.usuarioEntrega}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {paginarTabla && totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </button>
                    <span>{page} / {totalPages}</span>
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={page === totalPages}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </article>
        </>
      )}
    </section>
  );
}
