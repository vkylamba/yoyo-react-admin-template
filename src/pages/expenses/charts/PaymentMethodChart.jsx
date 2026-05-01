import ReactApexChart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';

const METHOD_LABELS = {
  cash: 'Cash',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  other: 'Other'
};

export default function PaymentMethodChart({ data }) {
  const theme = useTheme();

  const series = data.map((d) => d.total);
  const labels = data.map((d) => METHOD_LABELS[d.method] || d.method);

  const options = {
    chart: { type: 'donut' },
    labels,
    legend: { position: 'bottom' },
    colors: [
      theme.palette.primary.main,
      theme.palette.warning.main,
      theme.palette.success.main,
      theme.palette.info.main,
      theme.palette.error.main,
      theme.palette.secondary.main
    ],
    plotOptions: {
      pie: {
        donut: { size: '60%' }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(1)}%`
    }
  };

  if (series.length === 0) return null;

  return <ReactApexChart options={options} series={series} type="donut" height={340} />;
}
