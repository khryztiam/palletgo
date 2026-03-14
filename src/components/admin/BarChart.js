import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from '@/styles/Dashboard.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const BarChart = ({ areaData }) => {
  // Detectar si es mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isUltraSmall = typeof window !== 'undefined' && window.innerWidth < 478;
  
  const labelFontSize = isUltraSmall ? 9 : isMobile ? 10 : 12;
  const legendFontSize = isUltraSmall ? 10 : isMobile ? 11 : 12;
  const maxRotation = isUltraSmall ? 90 : isMobile ? 60 : 45;

  const chartData = {
    labels: Object.keys(areaData),
    datasets: [{
      label: '# Requests',
      data: Object.values(areaData),
      backgroundColor:      '#3498db',
      borderColor:          '#2980b9',
      borderWidth:           1,
      hoverBackgroundColor: '#2980b9',
      hoverBorderColor:     '#1f6d99',
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: legendFontSize },
          padding: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}`,
        },
        padding: 8,
        titleFont: { size: legendFontSize - 1 },
        bodyFont: { size: labelFontSize },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: labelFontSize },
          maxRotation: maxRotation,
          minRotation: 0,
          padding: isUltraSmall ? 5 : 5,
          callback: function(value) {
            // Si es ultra pequeño, abreviar los labels
            if (isUltraSmall && value.length > 10) {
              return value.substring(0, 8) + '...';
            }
            return value;
          }
        },
      },
      y: {
        beginAtZero: true,
        ticks: { 
          font: { size: labelFontSize },
          padding: 5,
        },
      },
    },
  };

  return (
    <div className={styles.barchartContainer}>
      <h3>Solicitudes por Área</h3>
      <div className={styles.barchartWrapper}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default BarChart;