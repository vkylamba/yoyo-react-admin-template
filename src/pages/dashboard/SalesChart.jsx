import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// project import
import MainCard from 'components/MainCard';

// third-party
import ReactApexChart from 'react-apexcharts';
import { NumericFormat } from 'react-number-format';

const METHOD_LABELS = {
  cash: 'Cash',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  other: 'Other'
};

// chart options
const columnChartOptions = {
  chart: {
    type: 'bar',
    height: 430,
    toolbar: {
      show: false
    }
  },
  plotOptions: {
    bar: {
      horizontal: true,
      columnWidth: '50%',
      borderRadius: 4
    }
  },
  dataLabels: {
    enabled: false
  },
  fill: {
    opacity: 1
  },
  tooltip: {
    y: {
      formatter(val) {
        return `$${val.toFixed(2)}`;
      }
    }
  },
  legend: {
    show: false
  }
};

// ==============================|| PAYMENT METHOD CHART ||============================== //

export default function SalesChart({ data }) {
  const theme = useTheme();

  const { secondary } = theme.palette.text;
  const line = theme.palette.divider;
  const primaryMain = theme.palette.primary.main;

  const categories = (data || []).map((d) => METHOD_LABELS[d.method] || d.method);
  const values = (data || []).map((d) => d.total);
  const total = values.reduce((a, b) => a + b, 0);

  const [options, setOptions] = useState(columnChartOptions);

  useEffect(() => {
    setOptions((prevState) => ({
      ...prevState,
      colors: [primaryMain],
      xaxis: {
        categories,
        labels: {
          style: {
            colors: categories.map(() => secondary)
          },
          formatter: (val) => `$${Number(val).toFixed(0)}`
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: categories.map(() => secondary)
          }
        }
      },
      grid: {
        borderColor: line
      }
    }));
  }, [secondary, line, primaryMain, data]);

  const series = [{ name: 'Amount', data: values }];

  return (
    <MainCard sx={{ mt: 1 }} content={false}>
      <Box sx={{ p: 2.5, pb: 0 }}>
        <Typography variant="h6" color="secondary">
          Total by Payment Method
        </Typography>
        <Typography variant="h4">
          <NumericFormat value={total} displayType="text" thousandSeparator prefix="$" decimalScale={2} />
        </Typography>
      </Box>
      <Box id="chart" sx={{ bgcolor: 'transparent', px: 1 }}>
        {data && data.length > 0 ? (
          <ReactApexChart options={options} series={series} type="bar" height={360} />
        ) : (
          <Typography color="text.secondary" align="center" sx={{ py: 8 }}>
            No payment data
          </Typography>
        )}
      </Box>
    </MainCard>
  );
}

SalesChart.propTypes = { data: PropTypes.array };
