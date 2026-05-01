import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';

export default function CategoryDonutChart({ data }) {
  const theme = useTheme();

  const series = data.map((d) => d.total);
  const labels = data.map((d) => d.category.charAt(0).toUpperCase() + d.category.slice(1));

  const options = {
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
      pie: {
        donut: {
          size: '60%'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(1)}%`
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: 300 },
          legend: { position: 'bottom' }
        }
      }
    ]
  };

  if (series.length === 0) return null;

  return <ReactApexChart options={options} series={series} type="donut" height={340} />;
}
