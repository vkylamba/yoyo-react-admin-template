import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { EditOutlined, LeftOutlined, LockOutlined, RightOutlined } from '@ant-design/icons';
import { NumericFormat } from 'react-number-format';
import ReactApexChart from 'react-apexcharts';

import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import IncomeAreaChart from 'pages/dashboard/IncomeAreaChart';
import { getMyExpenses, getMyDashboard, EXPENSE_CATEGORIES } from 'services/expenses';

const categoryColors = {
  groceries: 'success', travel: 'info', rent: 'warning', utilities: 'secondary',
  entertainment: 'primary', dining: 'error', healthcare: 'warning', education: 'info', other: 'default'
};

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
  if (period === 'week') return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  if (period === 'month') return `${months[start.getMonth()]} ${start.getFullYear()}`;
  return `${start.getFullYear()}`;
}

export default function MyExpensesPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');
  const [offset, setOffset] = useState(0);
  const [dashboard, setDashboard] = useState(null);
  const [expenses, setExpenses] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(0);

  const dateParams = () => {
    const { start, end } = getDateRange(period, offset);
    return { date_from: start.toISOString().slice(0, 10), date_to: end.toISOString().slice(0, 10) };
  };

  useEffect(() => {
    const dp = dateParams();
    getMyDashboard({ period, ...dp }).then(setDashboard).catch(() => {});
    getMyExpenses({ page: 1, page_size: 100, ...dp }).then(setExpenses).catch(() => {});
    setPage(0);
  }, [period, offset]);

  const handlePeriodChange = (p) => { setPeriod(p); setOffset(0); };

  if (!dashboard) return <Typography>Loading...</Typography>;

  const categoryBreakdown = dashboard.category_breakdown || [];
  const paymentBreakdown = dashboard.payment_method_breakdown || [];
  const categoryOverTime = dashboard.category_over_time || [];
  const splitSummary = dashboard.split_summary || [];
  const mySplit = splitSummary[0] || { total_paid: 0, total_share: 0, net_balance: 0 };

  const avgExpense = dashboard.expense_count > 0 ? (dashboard.total_expenses / dashboard.expense_count).toFixed(2) : '0.00';

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* Header */}
      <Grid item xs={12} sx={{ mb: -2.25 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
          <Typography variant="h5">My Expenses</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {['week', 'month', 'year'].map((p) => (
              <Button key={p} size="small" variant={period === p ? 'contained' : 'outlined'} onClick={() => handlePeriodChange(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 1, pl: 1, borderLeft: 1, borderColor: 'divider' }}>
              <IconButton size="small" onClick={() => setOffset(offset - 1)}><LeftOutlined /></IconButton>
              <Typography variant="subtitle2" sx={{ minWidth: 130, textAlign: 'center', whiteSpace: 'nowrap' }}>
                {formatRange(period, offset)}
              </Typography>
              <IconButton size="small" onClick={() => setOffset(offset + 1)} disabled={offset >= 0}><RightOutlined /></IconButton>
              {offset !== 0 && <Button size="small" variant="text" onClick={() => setOffset(0)} sx={{ ml: 0.5 }}>Today</Button>}
            </Stack>
          </Stack>
        </Stack>
      </Grid>

      {/* Stat cards */}
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce
          title="My Total Spend"
          count={`$${dashboard.total_expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          percentage={0}
          extra={`${dashboard.expense_count} transactions`}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce title="I Paid" count={`$${mySplit.total_paid.toFixed(2)}`} percentage={0} extra="Out of pocket" color="success" />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce title="My Share" count={`$${mySplit.total_share.toFixed(2)}`} percentage={0} extra="What I owe" color="warning" />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce
          title="Net Balance"
          count={`${mySplit.net_balance >= 0 ? '+' : ''}$${mySplit.net_balance.toFixed(2)}`}
          percentage={0}
          extra={mySplit.net_balance >= 0 ? 'Others owe me' : 'I owe others'}
          color={mySplit.net_balance >= 0 ? 'success' : 'error'}
        />
      </Grid>

      {/* Stacked bar chart */}
      <Grid item xs={12}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item><Typography variant="h5">My Spending Over Time</Typography></Grid>
        </Grid>
        <MainCard content={false} sx={{ mt: 1.5 }}>
          <Box sx={{ pt: 1, pr: 2 }}>
            <IncomeAreaChart data={categoryOverTime} categories={categoryBreakdown} />
          </Box>
        </MainCard>
      </Grid>

      {/* Pie charts */}
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
        <MainCard title="By Payment Method">
          {paymentBreakdown.length > 0 ? (
            <ReactApexChart
              options={{
                chart: { type: 'donut' },
                labels: paymentBreakdown.map((d) => d.method.replace(/_/g, ' ')),
                legend: { position: 'bottom' },
                colors: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#13c2c2', '#722ed1'],
                plotOptions: { pie: { donut: { size: '55%' } } },
                dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(1)}%` },
                tooltip: { y: { formatter: (val) => `$${val.toFixed(2)}` } }
              }}
              series={paymentBreakdown.map((d) => d.total)}
              type="donut"
              height={300}
            />
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No data</Typography>
          )}
        </MainCard>
      </Grid>

      {/* My transactions table */}
      <Grid item xs={12}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item><Typography variant="h5">My Transactions</Typography></Grid>
        </Grid>
        <MainCard sx={{ mt: 2 }} content={false}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Paid By</TableCell>
                  <TableCell>My Share</TableCell>
                  <TableCell>Private</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>No transactions for this period</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {expenses.items.slice(page * 10, (page + 1) * 10).map((e) => {
                  const participantCount = e.participants.length || 1;
                  const myShare = e.consider_for_split ? (e.amount / participantCount).toFixed(2) : e.amount.toFixed(2);
                  return (
                    <TableRow key={e.id} hover>
                      <TableCell>{new Date(e.expense_date).toLocaleDateString()}</TableCell>
                      <TableCell>{e.title}</TableCell>
                      <TableCell><Chip label={e.category} color={categoryColors[e.category] || 'default'} size="small" /></TableCell>
                      <TableCell align="right">
                        <NumericFormat value={e.amount} displayType="text" thousandSeparator prefix="$" decimalScale={2} />
                      </TableCell>
                      <TableCell>{e.paid_by_name}</TableCell>
                      <TableCell>${myShare}</TableCell>
                      <TableCell>
                        {e.is_private && <LockOutlined style={{ color: '#f5222d' }} />}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" size="small" onClick={() => navigate(`/expenses/edit/${e.id}`)}>
                          <EditOutlined />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={expenses.items.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={10}
            rowsPerPageOptions={[10]}
          />
        </MainCard>
      </Grid>
    </Grid>
  );
}
