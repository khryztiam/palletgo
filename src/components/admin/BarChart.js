// Componente BarChart.js
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const BarChart = ({ areaData }) => {
  const chartData = {
    labels: Object.keys(areaData),
    datasets: [
      {
        label: '# Requests',
        data: Object.values(areaData),
        backgroundColor: '#3498db', // Color de las barras
        borderColor: '#2980b9', // Color del borde de las barras
        borderWidth: 1,
        hoverBackgroundColor: '#2980b9',
        hoverBorderColor: '#1f6d99',
      }
    ]
  };
    const options = {
      responsive: true,
      maintainAspectRatio: false, // Evitar que el aspecto se mantenga fijo
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {
              size: 14,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.raw}`; // Mostrar el valor sobre la barra
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 14,
            },
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: 14,
            },
          },
        },
      },
    };
  return (
    <div className="barchart-container">
      <h3>Solicitudes por Área</h3>
      <div className="barchart-wrapper">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};
export default BarChart;