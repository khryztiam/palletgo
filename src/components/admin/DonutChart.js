// Componente DonutChart.js
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const DonutChart = ({ data }) => {
  console.log(data); 
  const chartData = {
    labels: ['SOLICITADO', 'EN PROGRESO', 'ENTREGADO', 'CANCELADO'],
    datasets: [
      {
        data: [
          data.request || 0,
          data.in_progress || 0,
          data.delivered || 0,
          data.canceled || 0,
        ],
        backgroundColor: ['#f39c12', '#3498db', '#28a745', '#e74c3c']
      }
    ]
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#444',
          font: {
            size: 10,
            weight: '500',
          },
        },
      },
    },
  };
  return (
    <div className="donutchart-container">
      <h3>Solicitudes por Estado</h3>
      <div className="donutchart-wrapper">
        <Doughnut data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};
export default DonutChart;