import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// third-party
import ReactApexChart from 'react-apexcharts';

// ==============================|| CATEGORY DONUT CHART ||============================== //

export default function MonthlyBarChart({ data }) {
  const theme = useTheme();
  const [chartData, setChartData] = useState({ series: [], options: {} });

  useEffect(() => {
    if (!data || data.length === 0) return;

    const series = data.map((d) => d.total);
    const labels = data.map((d) => d.category.charAt(0).toUpperCase() + d.category.slice(1));

    setChartData({
      series,
      options: {
        chart: { type: 'donut' },
        labels,
        legend: { position: 'bottom' },
        colors: [
          theme.palette.primary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main,
          theme.palette.secondary.main,
          '#8884d8',
          '#82ca9d',
          '#ffc658'
        ],
        plotOptions: {
          pie: { donut: { size: '55%' } }
        },
        dataLabels: {
          enabled: true,
          formatter: (val) => `${val.toFixed(1)}%`
        },
        tooltip: {
          y: { formatter: (val) => `$${val.toFixed(2)}` }
        }
      }
    });
  }, [data, theme]);

  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary" align="center">No category data</Typography>
      </Box>
    );
  }

  if (chartData.series.length === 0) return null;

  return (
    <Box id="category-chart">
      <ReactApexChart options={chartData.options} series={chartData.series} type="donut" height={300} />
    </Box>
  );
}

MonthlyBarChart.propTypes = { data: PropTypes.array };
