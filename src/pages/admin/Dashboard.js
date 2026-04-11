// /src/pages/admin/Dashboard.jsx
import AdminGate from "@/components/AdminGate";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/admin/DashboardHeader";
import DonutChart from "@/components/admin/DonutChart";
import BarChart from "@/components/admin/BarChart";
import Timeline from "@/components/admin/Timeline";
import ExportData from "@/components/admin/ExportData";
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
  });

  return { nextSummary, nextUserBars, nextTimeline };
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const todayStr = useMemo(() => formatDateInput(new Date()), []);

  const [dateRange, setDateRange] = useState({ start: todayStr, end: todayStr });
  const [summary,   setSummary]   = useState({ request: 0, in_progress: 0, delivered: 0, canceled: 0 });
  const [userBars,  setUserBars]  = useState({});
  const [timeline,  setTimeline]  = useState([]);
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

        const { nextSummary, nextUserBars, nextTimeline } = processOrdersData(allOrders);

        setSummary(nextSummary);
        setUserBars(nextUserBars);
        setTimeline(nextTimeline);
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

  // ── Handlers de fecha ────────────────────────────────────────────────────
  const handleDateChange = (type, value) => {
    if (type === "start" && !value) {
      setDateRange({ start: "", end: "" });
    } else {
      setDateRange(prev => ({ ...prev, [type]: value || prev.start }));
    }
  };

  return (
    <AdminGate>
      <div className={styles.container}>
        <DashboardHeader
          dateRange={dateRange}
          onDateChange={handleDateChange}
          onQuickToday={() => setDateRange({ start: todayStr, end: todayStr })}
          onClearAll={()  => setDateRange({ start: "", end: "" })}
        />

        {/* Estados de carga y error: antes eran style={{}} inline */}
        {loading  && <div className={styles.loading}>Cargando…</div>}
        {errorMsg && <div className={styles.error}>{errorMsg}</div>}

        {!loading && (
          <div className={styles.visuals}>
            <DonutChart data={summary} />
            <ExportData
              data={ordersData}
              dateRange={dateRange}
              summary={summary}
            />
            <BarChart areaData={userBars} />
          </div>
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