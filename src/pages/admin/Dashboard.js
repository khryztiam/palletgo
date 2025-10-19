// /src/pages/admin/dashboard.js
import AdminGate from "@/components/AdminGate";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";

// Components
import DashboardHeader from "@/components/admin/DashboardHeader";
import DonutChart from "@/components/admin/DonutChart";
import BarChart from "@/components/admin/BarChart";
import Timeline from "@/components/admin/Timeline";
import ExportData from "@/components/admin/ExportData";

// --- Utils de fecha ---
function formatDateInput(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDateBounds(dateRange) {
  const today = new Date();
  // Si no hay fecha de inicio, usa hoy. Si hay inicio pero no fin, usa inicio como fin.
  const startStr = dateRange.start || formatDateInput(today);
  const endStr = dateRange.end || startStr;

  const startDate = new Date(`${startStr}T00:00:00.000Z`);
  const endDate = new Date(`${endStr}T23:59:59.999Z`);

  return {
    startISO: startDate.toISOString(),
    endISO: endDate.toISOString(),
  };
}

// Función para procesar todos los datos en un solo lugar
const processOrdersData = (orders) => {
  const nextSummary = { request: 0, in_progress: 0, delivered: 0, canceled: 0 };
  const nextUserBars = {};
  const nextTimeline = [];

  const statusMap = {
    SOLICITADO: "request",
    "EN PROGRESO": "in_progress",
    ENTREGADO: "delivered",
    CANCELADO: "canceled",
  };

  // 1. Recorrido único
  (orders || []).forEach((order, index) => {
    // Resumen
    const statusKey = statusMap[order.status];
    if (statusKey) nextSummary[statusKey]++;

    // Barras (por área)
    const areaKey = order.area || "—";
    nextUserBars[areaKey] = (nextUserBars[areaKey] || 0) + 1;

    // Timeline (últimos 10, ya vienen ordenados si la API lo hace)
    if (index < 10) {
      nextTimeline.push({
        date: new Date(order.date_order),
        description: `Orden ${order.id_order} ${order.status} por ${
          order.user_submit || "—"
        } en ${order.area || "—"}`,
        area: order.area, // Pasamos el área para el ícono
      });
    }
  });

  return { nextSummary, nextUserBars, nextTimeline };
};

export default function DashboardPage() {
  const todayStr = useMemo(() => formatDateInput(new Date()), []);
  // Se inicializa con hoy para asegurar un filtro por defecto
  const [dateRange, setDateRange] = useState({
    start: todayStr,
    end: todayStr,
  });

  const [summary, setSummary] = useState({
    request: 0,
    in_progress: 0,
    delivered: 0,
    canceled: 0,
  });
  const [userBars, setUserBars] = useState({});
  const [timeline, setTimeline] = useState([]);
  const [ordersData, setOrdersData] = useState([]); // Datos para exportación
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        const { startISO, endISO } = getDateBounds(dateRange);

        // --- Consulta Única: Obtener TODAS las órdenes del rango ordenadas por fecha ---
        const { data: allOrders, error } = await supabase
          .from("orders")
          .select("*")
          .gte("date_order", startISO)
          .lte("date_order", endISO)
          .order("date_order", { ascending: false }); // Ordenar para que el timeline sea fácil

        if (error) throw error;

        // --- Procesar y consolidar datos localmente ---
        const { nextSummary, nextUserBars, nextTimeline } =
          processOrdersData(allOrders);

        // --- Commit de estado ---
        setSummary(nextSummary);
        setUserBars(nextUserBars);
        setTimeline(nextTimeline);
        setOrdersData(allOrders); // Guardar los datos completos para exportar
      } catch (err) {
        console.error("Error cargando dashboard:", err);
        setErrorMsg(
          "Error al cargar datos: " + (err.message || "Error desconocido.")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRange.start, dateRange.end]); // Dependencias: solo cambian si el rango de fecha cambia

  return (
    <AdminGate>
      <div className="dashboard-container">
        <DashboardHeader
          dateRange={dateRange}
          onDateChange={(type, value) => {
            // Limpia el 'end' si el 'start' se vacía, o lo asigna al 'start' si el 'end' está vacío.
            if (type === "start" && !value) {
              setDateRange({ start: "", end: "" });
            } else {
              setDateRange((prev) => ({
                ...prev,
                [type]: value || prev.start,
              }));
            }
          }}
          onQuickToday={() => setDateRange({ start: todayStr, end: todayStr })}
          onClearAll={() => setDateRange({ start: "", end: "" })} // Permite limpiar ambos, lo que activaría la regla de hoy
        />

        {loading && <div style={{ padding: 12 }}>Cargando…</div>}
        {errorMsg && (
          <div style={{ color: "crimson", padding: 12 }}>{errorMsg}</div>
        )}

        {!loading && (
          <div className="dashboard-visuals">
            <DonutChart data={summary} />
            <ExportData
              data={ordersData}
              dateRange={dateRange}
              summary={summary}
            />
            <BarChart areaData={userBars} />
          </div>
        )}

        {/* Solo mostramos la línea de tiempo si hay eventos */}
        {timeline.length > 0 && <Timeline events={timeline} />}
        {timeline.length === 0 && !loading && (
          <p style={{ textAlign: "center", marginTop: "20px" }}>
            No hay movimientos en este rango de fechas.
          </p>
        )}
      </div>
    </AdminGate>
  );
}
