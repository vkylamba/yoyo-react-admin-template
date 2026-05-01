import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

// third-party
import ReactApexChart from 'react-apexcharts';

// ==============================|| EXPENSES STACKED BAR CHART BY CATEGORY ||============================== //

export default function IncomeAreaChart({ data, categories }) {
  const theme = useTheme();
  const { secondary } = theme.palette.text;
  const line = theme.palette.divider;

  const [series, setSeries] = useState([]);
  const [options, setOptions] = useState({});

  useEffect(() => {
    if (!data || data.length === 0) {
      setSeries([]);
      return;
    }

    const allCategories = categories
      ? categories.map((c) => c.category)
      : [...new Set(data.flatMap((d) => Object.keys(d.categories)))];

    const dates = data.map((d) => {
      const date = new Date(d.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const colorPalette = [
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
      theme.palette.secondary.main,
      '#8884d8',
      '#82ca9d',
      '#ffc658'
    ];

    setSeries(
      allCategories.map((cat) => ({
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        data: data.map((d) => d.categories[cat] || 0)
      }))
    );

    setOptions({
      chart: {
        type: 'bar',
        height: 450,
        stacked: true,
        toolbar: { show: false }
      },
      plotOptions: {
        bar: { columnWidth: '60%', borderRadius: 2 }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: dates,
        labels: { style: { colors: dates.map(() => secondary), fontSize: '11px' } }
      },
      yaxis: {
        labels: {
          style: { colors: [secondary] },
          formatter: (val) => `$${val.toFixed(0)}`
        }
      },
      colors: colorPalette.slice(0, allCategories.length),
      legend: { position: 'top', horizontalAlign: 'left' },
      tooltip: {
        y: { formatter: (val) => `$${val.toFixed(2)}` }
      },
      grid: { borderColor: line }
    });
  }, [data, categories, theme, secondary, line]);

  if (!data || data.length === 0) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 8 }}>
        No expense data for this period
      </Typography>
    );
  }

  if (series.length === 0) return null;

  return <ReactApexChart options={options} series={series} type="bar" height={450} />;
}

IncomeAreaChart.propTypes = { data: PropTypes.array, categories: PropTypes.array };
