import { useEffect, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { LeftOutlined, RightOutlined } from '@ant-design/icons';

// third-party
import ReactApexChart from 'react-apexcharts';

// project import
import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import UniqueVisitorCard from './UniqueVisitorCard';
import SaleReportCard from './SaleReportCard';
import RecentExpensesTable from './OrdersTable';

// services
import { getExpenseDashboard } from 'services/expenses';

// ==============================|| DASHBOARD - DEFAULT ||============================== //

function getDateRange(period, offset) {
  const now = new Date();
  let start, end;

  if (period === 'week') {
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start = new Date(now);
    start.setDate(now.getDate() + mondayOffset + offset * 7);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59);
  } else {
    start = new Date(now.getFullYear() + offset, 0, 1);
    end = new Date(now.getFullYear() + offset, 11, 31, 23, 59, 59);
  }

  return { start, end };
}

function formatRange(period, offset) {
  const { start, end } = getDateRange(period, offset);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (period === 'week') {
    return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  } else if (period === 'month') {
    return `${months[start.getMonth()]} ${start.getFullYear()}`;
  }
  return `${start.getFullYear()}`;
}

export default function DashboardDefault() {
  const [period, setPeriod] = useState('month');
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);

  useEffect(() => {
    const { start, end } = getDateRange(period, offset);
    const dateFrom = start.toISOString().slice(0, 10);
    const dateTo = end.toISOString().slice(0, 10);
    getExpenseDashboard({ period, date_from: dateFrom, date_to: dateTo })
      .then(setData)
      .catch(() => {});
  }, [period, offset]);

  const handlePeriodChange = (p) => {
    setPeriod(p);
    setOffset(0);
  };

  if (!data) {
    return (
      <Grid container rowSpacing={4.5} columnSpacing={2.75}>
        <Grid item xs={12}>
          <Typography variant="h5">Dashboard</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography color="text.secondary">Loading expense data...</Typography>
        </Grid>
      </Grid>
    );
  }

  const categoryBreakdown = data.category_breakdown || [];
  const paymentBreakdown = data.payment_method_breakdown || [];
  const paidByBreakdown = data.paid_by_breakdown || [];
  const categoryOverTime = data.category_over_time || [];
  const splitSummary = data.split_summary || [];

  const avgExpense = data.expense_count > 0 ? (data.total_expenses / data.expense_count).toFixed(2) : '0.00';
  const topCategory =
    categoryBreakdown.length > 0
      ? categoryBreakdown.reduce((a, b) => (a.total > b.total ? a : b))
      : null;

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* row 1 - stats */}
      <Grid item xs={12} sx={{ mb: -2.25 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
          <Typography variant="h5">Dashboard</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {['week', 'month', 'year'].map((p) => (
              <Button key={p} size="small" variant={period === p ? 'contained' : 'outlined'} onClick={() => handlePeriodChange(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 1, pl: 1, borderLeft: 1, borderColor: 'divider' }}>
              <IconButton size="small" onClick={() => setOffset(offset - 1)}>
                <LeftOutlined />
              </IconButton>
              <Typography variant="subtitle2" sx={{ minWidth: 130, textAlign: 'center', whiteSpace: 'nowrap' }}>
                {formatRange(period, offset)}
              </Typography>
              <IconButton size="small" onClick={() => setOffset(offset + 1)} disabled={offset >= 0}>
                <RightOutlined />
              </IconButton>
              {offset !== 0 && (
                <Button size="small" variant="text" onClick={() => setOffset(0)} sx={{ ml: 0.5 }}>
                  Today
                </Button>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <AnalyticEcommerce
          title="Total Expenses"
          count={`$${data.total_expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          percentage={0}
          extra={`${data.expense_count} transactions`}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <AnalyticEcommerce title="Transactions" count={String(data.expense_count)} percentage={0} extra={formatRange(period, offset)} />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <AnalyticEcommerce title="Average Expense" count={`$${avgExpense}`} percentage={0} extra="Per transaction" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <AnalyticEcommerce
          title="Top Category"
          count={topCategory ? topCategory.category.charAt(0).toUpperCase() + topCategory.category.slice(1) : 'N/A'}
          percentage={0}
          extra={topCategory ? `$${topCategory.total.toFixed(2)}` : '-'}
        />
      </Grid>

      {/* row 2 - stacked bar chart (full width) */}
      <Grid item xs={12}>
        <UniqueVisitorCard data={categoryOverTime} categories={categoryBreakdown} />
      </Grid>

      {/* row 3 - pie charts */}
      <Grid item xs={12} md={6}>
        <MainCard title="By Category">
          {categoryBreakdown.length > 0 ? (
            <ReactApexChart
              options={{
                chart: { type: 'donut' },
                labels: categoryBreakdown.map((d) => d.category.charAt(0).toUpperCase() + d.category.slice(1)),
                legend: { position: 'bottom' },
                colors: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#13c2c2', '#722ed1', '#8884d8', '#82ca9d', '#ffc658'],
                plotOptions: { pie: { donut: { size: '55%' } } },
                dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(1)}%` },
                tooltip: { y: { formatter: (val) => `$${val.toFixed(2)}` } }
              }}
              series={categoryBreakdown.map((d) => d.total)}
              type="donut"
              height={300}
            />
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No data</Typography>
          )}
        </MainCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <MainCard title="By Paid By">
          {paidByBreakdown.length > 0 ? (
            <ReactApexChart
              options={{
                chart: { type: 'pie' },
                labels: paidByBreakdown.map((d) => d.person_name),
                legend: { position: 'bottom' },
                colors: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#13c2c2', '#722ed1'],
                dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(1)}%` },
                tooltip: { y: { formatter: (val) => `$${val.toFixed(2)}` } }
              }}
              series={paidByBreakdown.map((d) => d.total)}
              type="pie"
              height={300}
            />
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No data</Typography>
          )}
        </MainCard>
      </Grid>

      {/* row 4 - recent expenses + split summary */}
      <Grid item xs={12} md={7} lg={8}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h5">Recent Expenses</Typography>
          </Grid>
        </Grid>
        <MainCard sx={{ mt: 2 }} content={false}>
          <RecentExpensesTable />
        </MainCard>
      </Grid>
      <Grid item xs={12} md={5} lg={4}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h5">Split Summary</Typography>
          </Grid>
        </Grid>
        <MainCard sx={{ mt: 2 }} content={false}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Person</TableCell>
                  <TableCell align="right">Total Paid</TableCell>
                  <TableCell align="right">Fair Share</TableCell>
                  <TableCell align="right">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {splitSummary.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="text.secondary" sx={{ py: 2 }}>No split data yet</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {splitSummary.map((s) => (
                  <TableRow key={s.person_id}>
                    <TableCell>{s.person_name}</TableCell>
                    <TableCell align="right">${s.total_paid.toFixed(2)}</TableCell>
                    <TableCell align="right">${s.total_share.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color={s.net_balance >= 0 ? 'success.main' : 'error.main'}>
                        {s.net_balance >= 0 ? '+' : ''}${s.net_balance.toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </MainCard>
      </Grid>

      {/* row 5 - payment methods */}
      <Grid item xs={12} md={7} lg={8}>
        <SaleReportCard data={paymentBreakdown} />
      </Grid>
    </Grid>
  );
}
