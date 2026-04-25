// /src/pages/admin/Dashboard.jsx
import AdminGate from "@/components/AdminGate";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/admin/DashboardHeader";
import DonutChart from "@/components/admin/DonutChart";
import BarChart from "@/components/admin/BarChart";
import Top5Turno from "@/components/admin/Top5Turno";
import Timeline from "@/components/admin/Timeline";
import { exportOrdersCsv } from "@/components/admin/ExportData";
import styles from "@/styles/Dashboard.module.css";

// ─── Utils de fecha ───────────────────────────────────────────────────────────
const formatDateInput = (d) => {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// El Salvador es UTC-6 y no tiene horario de verano
const SV_OFFSET = '-06:00';

const getDateBounds = (dateRange) => {
  const today    = new Date();
  const startStr = dateRange.start || formatDateInput(today);
  const endStr   = dateRange.end   || startStr;

  return {
    startISO: new Date(`${startStr}T00:00:00.000${SV_OFFSET}`).toISOString(),
    endISO:   new Date(`${endStr}T23:59:59.999${SV_OFFSET}`).toISOString(),
  };
};

// ─── Procesador de datos ──────────────────────────────────────────────────────
// Fuera del componente: no se recrea en cada render.
const STATUS_MAP = {
  SOLICITADO:   "request",
  "EN PROGRESO":"in_progress",
  ENTREGADO:    "delivered",
  CANCELADO:    "canceled",
};

const processOrdersData = (orders) => {
  const nextSummary  = { request: 0, in_progress: 0, delivered: 0, canceled: 0 };
  const nextUserBars = {};
  const nextTimeline = [];
  const topTurnoMap = {
    "Turno 1": {},
    "Turno 2": {},
  };

  let sumaDuracion = 0;
  let totalConDuracion = 0;

  (orders || []).forEach((order, index) => {
    const statusKey = STATUS_MAP[order.status];
    if (statusKey) nextSummary[statusKey]++;

    const areaKey = order.area || "—";
    nextUserBars[areaKey] = (nextUserBars[areaKey] || 0) + 1;

    if (index < 10) {
      nextTimeline.push({
        id_order:     order.id_order,
        status:       order.status,
        area:         order.area,
        destiny:      order.destiny,
        user_submit:  order.user_submit  || "—",
        user_deliver: order.user_deliver || null,
        date_order:   new Date(order.date_order),
        date_delivery: order.date_delivery ? new Date(order.date_delivery) : null,
      });
    }

    const hora = order.date_order ? new Date(order.date_order).getHours() : null;
    const turno = hora !== null && hora >= 1 && hora < 14
      ? "Turno 1"
      : hora !== null && hora >= 14 && hora < 24
        ? "Turno 2"
        : null;

    if (turno) {
      const areaTurno = order.area || "SIN AREA";
      topTurnoMap[turno][areaTurno] = (topTurnoMap[turno][areaTurno] || 0) + 1;
    }

    const duracion = Number(order.duration);
    if (order.status === 'ENTREGADO' && Number.isFinite(duracion)) {
      sumaDuracion += duracion;
      totalConDuracion += 1;
    }
  });

  const avgDuration = totalConDuracion ? (sumaDuracion / totalConDuracion) : 0;

  const topTurno = {
    "Turno 1": Object.entries(topTurnoMap["Turno 1"])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
    "Turno 2": Object.entries(topTurnoMap["Turno 2"])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
  };

  return { nextSummary, nextUserBars, nextTimeline, avgDuration, topTurno };
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const todayStr = useMemo(() => formatDateInput(new Date()), []);
  const defaultRange = useMemo(() => ({ start: todayStr, end: todayStr }), [todayStr]);

  const [dateRange, setDateRange] = useState(defaultRange);
  const [summary,   setSummary]   = useState({ request: 0, in_progress: 0, delivered: 0, canceled: 0 });
  const [userBars,  setUserBars]  = useState({});
  const [timeline,  setTimeline]  = useState([]);
  const [topTurno, setTopTurno] = useState({ "Turno 1": [], "Turno 2": [] });
  const [avgDuration, setAvgDuration] = useState(0);
  const [ordersData,setOrdersData]= useState([]);
  const [loading,   setLoading]   = useState(false);
  const [errorMsg,  setErrorMsg]  = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        const { startISO, endISO } = getDateBounds(dateRange);

        const { data: allOrders, error } = await supabase
          .from("orders")
          .select("*")
          .gte("date_order", startISO)
          .lte("date_order", endISO)
          .order("date_order", { ascending: false });

        if (error) throw error;

          const { nextSummary, nextUserBars, nextTimeline, avgDuration, topTurno } = processOrdersData(allOrders);

        setSummary(nextSummary);
        setUserBars(nextUserBars);
        setTimeline(nextTimeline);
          setTopTurno(topTurno);
          setAvgDuration(avgDuration);
        setOrdersData(allOrders);
      } catch (err) {
        console.error("Error cargando dashboard:", err);
        setErrorMsg("Error al cargar datos: " + (err.message || "Error desconocido."));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRange.start, dateRange.end]);

  const totalOrdenes = ordersData.length;
  const activas = summary.request + summary.in_progress;

  const estadoSla = avgDuration <= 20
    ? { texto: "Cumpliendo SLA", clase: styles.slaOk }
    : avgDuration <= 23
      ? { texto: "En riesgo", clase: styles.slaWarn }
      : { texto: "Fuera de SLA", clase: styles.slaBad };

  // ── Handlers de fecha ────────────────────────────────────────────────────
  const handleDateChange = (type, value) => {
    setDateRange((prev) => {
      if (type === 'start') {
        const nextStart = value || prev.start;
        const nextEnd = !prev.end || prev.end < nextStart ? nextStart : prev.end;
        return { start: nextStart, end: nextEnd };
      }

      const nextEnd = value || prev.end || prev.start || todayStr;
      const nextStart = !prev.start || prev.start > nextEnd ? nextEnd : prev.start;
      return { start: nextStart, end: nextEnd };
    });
  };

  const handleQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    setDateRange({
      start: formatDateInput(start),
      end: formatDateInput(end),
    });
  };

  const handleExport = () => {
    exportOrdersCsv(ordersData, dateRange);
  };

  return (
    <AdminGate>
      <div className={styles.container}>
        <DashboardHeader
          dateRange={dateRange}
          onDateChange={handleDateChange}
          onQuickToday={() => setDateRange({ start: todayStr, end: todayStr })}
          onQuick7Days={() => handleQuickRange(7)}
          onQuick30Days={() => handleQuickRange(30)}
          onClearAll={() => setDateRange(defaultRange)}
          onExport={handleExport}
          exportLabel={`Exportar ${ordersData.length} CSV`}
          disableExport={ordersData.length === 0}
        />

        {/* Estados de carga y error: antes eran style={{}} inline */}
        {loading  && <div className={styles.loading}>Cargando…</div>}
        {errorMsg && <div className={styles.error}>{errorMsg}</div>}

        {!loading && (
          <>
            <div className={styles.quickKpis}>
              <article className={styles.quickKpiCard}>
                <span>Total ordenes</span>
                <strong>{totalOrdenes}</strong>
              </article>
              <article className={styles.quickKpiCard}>
                <span>Ordenes activas</span>
                <strong>{activas}</strong>
              </article>
                <article className={`${styles.quickKpiCard} ${estadoSla.clase}`}>
                  <span>SLA promedio (meta 20 min)</span>
                  <strong>{avgDuration.toFixed(1)} min</strong>
                  <small>{estadoSla.texto}</small>
              </article>
            </div>

            <div className={styles.barLine}>
              <BarChart areaData={userBars} />
            </div>

              <div className={styles.bottomLine}>
                <div className={styles.bottomDonut}>
                  <DonutChart data={summary} compact />
                </div>
                <div className={styles.bottomTop}>
                  <Top5Turno topTurno={topTurno} />
                </div>
              </div>
          </>
        )}

        {timeline.length > 0 && <Timeline events={timeline} />}

        {timeline.length === 0 && !loading && (
          <p className={styles.empty}>
            No hay movimientos en este rango de fechas.
          </p>
        )}
      </div>
    </AdminGate>
  );
}