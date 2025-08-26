// /src/pages/admin/dashboard.js
import AdminGate from '@/components/AdminGate';
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

// Components
import DashboardHeader from '@/components/admin/DashboardHeader';
import DonutChart from '@/components/admin/DonutChart';
import BarChart from '@/components/admin/BarChart';
import Timeline from '@/components/admin/Timeline';
import ExportData from '@/components/admin/ExportData';

// --- Utils de fecha ---
function formatDateInput(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Devuelve rango ISO según reglas:
// 1) Si no hay start ni end → hoy
// 2) Si hay solo start → día único
// 3) Si hay start y end → rango completo
function getDateBounds(dateRange) {
  const today = new Date();
  const defaultDayStr = today.toISOString().split('T')[0];

  const startStr = dateRange.start || defaultDayStr;
  const endStr = dateRange.end;

  const startDate = new Date(`${startStr}T00:00:00`);
  const endDate = endStr
    ? new Date(`${endStr}T23:59:59.999`)
    : new Date(`${startStr}T23:59:59.999`);

  return { startISO: startDate.toISOString(), endISO: endDate.toISOString() };
}

export default function DashboardPage() {
  const todayStr = useMemo(() => formatDateInput(new Date()), []);
  const [dateRange, setDateRange] = useState({ start: todayStr, end: '' });

  const [summary, setSummary] = useState({
    request: 0,
    in_progress: 0,
    delivered: 0,
    canceled: 0,
  });

  const [userBars, setUserBars] = useState({}); // { user_submit: count }
  const [timeline, setTimeline] = useState([]); // últimos 10
  const [ordersData, setOrdersData] = useState([]); // para export
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setErrorMsg('');

      try {
        const { startISO, endISO } = getDateBounds(dateRange);

        // --- 1) DONA: resumen por status ---
        const estados = ['SOLICITADO', 'EN PROGRESO', 'ENTREGADO', 'CANCELADO'];
        const nextSummary = { request: 0, in_progress: 0, delivered: 0, canceled: 0 };

        for (const estado of estados) {
          const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', estado)
            .gte('date_order', startISO)
            .lte('date_order', endISO);

          if (error) throw error;

          if (estado === 'SOLICITADO') nextSummary.request = count;
          if (estado === 'EN PROGRESO') nextSummary.in_progress = count;
          if (estado === 'ENTREGADO') nextSummary.delivered = count;
          if (estado === 'CANCELADO') nextSummary.canceled = count;
        }

        // --- 2) BARRAS: conteo por usuario ---
        const { data: userRows, error: e2 } = await supabase
          .from('orders')
          .select('area')
          .gte('date_order', startISO)
          .lte('date_order', endISO);

        if (e2) throw e2;

        const nextUserBars = {};
        (userRows || []).forEach(r => {
          const key = r.area || '—';
          nextUserBars[key] = (nextUserBars[key] || 0) + 1;
        });

        // --- 3) TIMELINE: últimos 10 ---
        const { data: tRows, error: e3 } = await supabase
          .from('orders')
          .select('id_order, user_submit, area, status, date_order')
          .gte('date_order', startISO)
          .lte('date_order', endISO)
          .order('date_order', { ascending: false })
          .limit(10);

        if (e3) throw e3;

        const nextTimeline = (tRows || []).map(o => ({
          date: new Date(o.date_order),
          description: `Orden ${o.id_order} creada por ${o.user_submit || '—'} en ${o.area || '—'}`,
        }));

        // --- Opcional: ordersData para export ---
        // const { data: allOrders } = await supabase
        //   .from('orders')
        //   .select('*')
        //   .gte('date_order', startISO)
        //   .lte('date_order', endISO);
        // setOrdersData(allOrders || []);

        // --- Commit de estado ---
        setSummary(nextSummary);
        setUserBars(nextUserBars);
        setTimeline(nextTimeline);
      } catch (err) {
        console.error(err);
        setErrorMsg('No se pudieron cargar los datos del dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRange.start, dateRange.end]);

  return (
    <AdminGate>
      <div className="dashboard-container">
        <DashboardHeader
          dateRange={dateRange}
          onDateChange={(type, value) =>
            setDateRange(prev => ({ ...prev, [type]: value }))
          }
          onQuickToday={() => setDateRange({ start: todayStr, end: '' })}
          onClearAll={() => setDateRange({ start: '', end: '' })}
        />

        {loading && <div style={{ padding: 12 }}>Cargando…</div>}
        {errorMsg && <div style={{ color: 'crimson', padding: 12 }}>{errorMsg}</div>}

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

        <Timeline events={timeline} />
      </div>
    </AdminGate>
  );
}
