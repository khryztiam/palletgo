import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import styles from '@/styles/Dashboard.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const DonutChart = ({ data, compact = false }) => {
  // Detectar si es mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isUltraSmall = typeof window !== 'undefined' && window.innerWidth < 478;
  
  const legendFontSize = isUltraSmall ? 10 : isMobile ? 11 : 12;
  const tooltipFontSize = isUltraSmall ? 10 : isMobile ? 10 : 11;
  const legendPadding = isUltraSmall ? 12 : isMobile ? 12 : 15;
  const boxWidth = isUltraSmall ? 10 : isMobile ? 11 : 12;

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
    cutout: compact ? '66%' : '58%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#444',
          font: { size: legendFontSize, weight: '500' },
          padding: legendPadding,
          boxWidth: boxWidth,
          boxHeight: boxWidth,
        },
        maxWidth: isUltraSmall ? 280 : isMobile ? 280 : 300,
      },
      tooltip: {
        padding: 8,
        titleFont: { size: tooltipFontSize },
        bodyFont: { size: tooltipFontSize - 1 },
      },
    },
  };

  return (
    <div className={`${styles.donutchartContainer} ${compact ? styles.donutchartContainerCompact : ''}`}>
      <h3>Solicitudes por Estado</h3>
      <div className={`${styles.donutchartWrapper} ${compact ? styles.donutchartWrapperCompact : ''}`}>
        <Doughnut data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default DonutChart;