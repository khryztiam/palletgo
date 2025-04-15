// /src/pages/admin/dashboard.js
import AdminGate from '@/components/AdminGate';
import React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
//Components
import DashboardHeader from '@/components/admin/DashboardHeader';
import DonutChart from '@/components/admin/DonutChart';
import BarChart from '@/components/admin/BarChart';
import Timeline from '@/components/admin/Timeline';
import ExportData from '@/components/admin/ExportData'; 

export default function DashboardPage() {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    //const [areaFilter, setAreaFilter] = useState('');
    const [summary, setSummary] = useState({ request: 0, in_progress: 0, delivered: 0, canceled: 0 });
    const [areaData, setAreaData] = useState({});
    const [timeline, setTimeline] = useState([]);
    const [ordersData, setOrdersData] = useState([]);
  
    useEffect(() => {
      const fetchDashboardData = async () => {
        // Lógica con filtros
        const { data: orders } = await supabase.from('orders').select('*');
  
        // Procesamiento de datos
        const stateSummary = { request: 0, in_progress: 0, delivered: 0, canceled: 0 };
        const areaCount = {};
        const timelineList = [];
  
        orders.forEach(order => {
          //if (areaFilter && order.area !== areaFilter) return;
          if (dateRange.start && new Date(order.date_order) < new Date(dateRange.start)) return;
          if (dateRange.end && new Date(order.date_order) > new Date(dateRange.end)) return;
  
            // Asegúrate de que los valores del estado coincidan con los esperados
            if (order.status === 'SOLICITADO') stateSummary.request++;
            if (order.status === 'EN PROGRESO') stateSummary.in_progress++;
            if (order.status === 'ENTREGADO') stateSummary.delivered++;
            if (order.status === 'CANCELADO') stateSummary.canceled++;
          areaCount[order.area] = (areaCount[order.area] || 0) + 1;
  
          timelineList.push({
            date: new Date(order.date_order),
            description: `Orden ${order.id_order} creada por ${order.user_submit} en ${order.area}`
          });
        });
  
        setSummary(stateSummary);
        setAreaData(areaCount);
        setTimeline(timelineList.sort((a, b) => b.date - a.date));
        setOrdersData(orders); // Guardamos todos los datos para la exportación
      };
  
      fetchDashboardData();
    }, [dateRange]);
  
    return (
      <AdminGate>
        <div className="dashboard-container">
          <DashboardHeader 
            dateRange={dateRange}
            
            onDateChange={(type, value) => setDateRange(prev => ({ ...prev, [type]: value }))}
            
          />
          <div className="dashboard-visuals">
            <DonutChart data={summary} />
            <ExportData data={ordersData} dateRange={dateRange} summary={summary} /> {/* Botón para exportar datos con resumen */}
            <BarChart areaData={areaData} />
          </div>
          <Timeline events={timeline.slice(0, 10)} />
        </div>
      </AdminGate>
    );
  }

  //datos del header 
  //area={areaFilter}
  //onAreaChange={setAreaFilter}