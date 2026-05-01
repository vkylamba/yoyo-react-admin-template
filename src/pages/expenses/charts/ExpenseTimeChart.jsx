import ReactApexChart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';

export default function ExpenseTimeChart({ data }) {
  const theme = useTheme();

  const series = [
    {
      name: 'Expenses',
      data: data.map((d) => d.total)
    }
  ];

  const options = {
    chart: {
      type: 'area',
      toolbar: { show: false }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 }
    },
    xaxis: {
      categories: data.map((d) => {
        const date = new Date(d.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      labels: { style: { fontSize: '11px' } }
    },
    yaxis: {
      labels: {
        formatter: (val) => `$${val.toFixed(0)}`
      }
    },
    colors: [theme.palette.primary.main],
    tooltip: {
      y: {
        formatter: (val) => `$${val.toFixed(2)}`
      }
    },
    grid: {
      borderColor: theme.palette.divider
    }
  };

  if (data.length === 0) return null;

  return <ReactApexChart options={options} series={series} type="area" height={340} />;
}
