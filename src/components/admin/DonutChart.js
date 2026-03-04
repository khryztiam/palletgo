import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import styles from '@/styles/Dashboard.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const DonutChart = ({ data }) => {
  const chartData = {
    labels: ['SOLICITADO', 'EN PROGRESO', 'ENTREGADO', 'CANCELADO'],
    datasets: [{
      data: [
        data.request     || 0,
        data.in_progress || 0,
        data.delivered   || 0,
        data.canceled    || 0,
      ],
      backgroundColor: ['#f39c12', '#3498db', '#28a745', '#e74c3c'],
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#444',
          font: { size: 10, weight: '500' },
        },
      },
    },
  };

  return (
    <div className={styles.donutchartContainer}>
      <h3>Solicitudes por Estado</h3>
      <div className={styles.donutchartWrapper}>
        <Doughnut data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default DonutChart;