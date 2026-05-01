import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// third-party
import ReactApexChart from 'react-apexcharts';

// ==============================|| PAID BY PIE CHART ||============================== //

export default function PaidByPieChart({ data }) {
  const theme = useTheme();
  const [chartData, setChartData] = useState({ series: [], options: {} });

  useEffect(() => {
    if (!data || data.length === 0) return;

    const series = data.map((d) => d.total);
    const labels = data.map((d) => d.person_name);

    setChartData({
      series,
      options: {
        chart: { type: 'pie' },
        labels,
        legend: { position: 'bottom' },
        colors: [
          theme.palette.primary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main,
          theme.palette.secondary.main
        ],
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
      <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
        No data
      </Typography>
    );
  }

  if (chartData.series.length === 0) return null;

  return (
    <Box id="paid-by-chart">
      <ReactApexChart options={chartData.options} series={chartData.series} type="pie" height={300} />
    </Box>
  );
}

PaidByPieChart.propTypes = { data: PropTypes.array };
