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
        labels: { font: { size: 14 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 14 } } },
      y: { beginAtZero: true,        ticks: { font: { size: 14 } } },
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