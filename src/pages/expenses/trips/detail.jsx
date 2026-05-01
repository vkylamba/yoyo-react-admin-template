import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
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

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { NumericFormat } from 'react-number-format';
import ReactApexChart from 'react-apexcharts';

import MainCard from 'components/MainCard';
import {
  getTrip,
  getTripDashboard,
  getExpenses,
  addExpensesToTrip,
  removeExpenseFromTrip
} from 'services/expenses';

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [tripExpenses, setTripExpenses] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [availableExpenses, setAvailableExpenses] = useState([]);
  const [selected, setSelected] = useState([]);

  const load = async () => {
    const [t, d, e] = await Promise.all([
      getTrip(id),
      getTripDashboard(id),
      getExpenses({ trip_id: id, page_size: 100 })
    ]);
    setTrip(t);
    setDashboard(d);
    setTripExpenses(e.items);
  };

  useEffect(() => { load(); }, [id]);

  const openAddDialog = async () => {
    const result = await getExpenses({ page_size: 100 });
    // Show expenses not already in this trip
    setAvailableExpenses(result.items.filter((e) => !e.trip_id || e.trip_id !== parseInt(id)));
    setSelected([]);
    setAddOpen(true);
  };

  const handleAdd = async () => {
    await addExpensesToTrip(id, selected);
    setAddOpen(false);
    load();
  };

  const handleRemove = async (expenseId) => {
    await removeExpenseFromTrip(id, expenseId);
    load();
  };

  const toggleSelect = (expId) => {
    setSelected((prev) => prev.includes(expId) ? prev.filter((x) => x !== expId) : [...prev, expId]);
  };

  if (!trip || !dashboard) return <Typography>Loading...</Typography>;

  const categoryBreakdown = dashboard.category_breakdown || [];
  const paidByBreakdown = dashboard.paid_by_breakdown || [];
  const splitSummary = dashboard.split_summary || [];

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* Header */}
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack>
            <Typography variant="h5">{trip.name}</Typography>
            {trip.description && <Typography variant="body2" color="text.secondary">{trip.description}</Typography>}
            {trip.start_date && (
              <Typography variant="caption" color="text.secondary">
                {new Date(trip.start_date).toLocaleDateString()}
                {trip.end_date && ` - ${new Date(trip.end_date).toLocaleDateString()}`}
              </Typography>
            )}
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<PlusOutlined />} onClick={openAddDialog}>
              Add Expenses
            </Button>
          </Stack>
        </Stack>
      </Grid>

      {/* Stats */}
      <Grid item xs={12} sm={4}>
        <MainCard>
          <Typography variant="h6" color="text.secondary">Total Expenses</Typography>
          <Typography variant="h3">
            <NumericFormat value={dashboard.total_expenses} displayType="text" thousandSeparator prefix="$" decimalScale={2} />
          </Typography>
        </MainCard>
      </Grid>
      <Grid item xs={12} sm={4}>
        <MainCard>
          <Typography variant="h6" color="text.secondary">Transactions</Typography>
          <Typography variant="h3">{dashboard.expense_count}</Typography>
        </MainCard>
      </Grid>
      <Grid item xs={12} sm={4}>
        <MainCard>
          <Typography variant="h6" color="text.secondary">Average</Typography>
          <Typography variant="h3">
            ${dashboard.expense_count > 0 ? (dashboard.total_expenses / dashboard.expense_count).toFixed(2) : '0.00'}
          </Typography>
        </MainCard>
      </Grid>

      {/* Charts */}
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
                tooltip: { y: { formatter: (val) => `$${val.toFixed(2)}` } }
              }}
              series={categoryBreakdown.map((d) => d.total)}
              type="donut"
              height={280}
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
                tooltip: { y: { formatter: (val) => `$${val.toFixed(2)}` } }
              }}
              series={paidByBreakdown.map((d) => d.total)}
              type="pie"
              height={280}
            />
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No data</Typography>
          )}
        </MainCard>
      </Grid>

      {/* Split Summary */}
      <Grid item xs={12}>
        <MainCard title="Split Summary" content={false}>
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
                  <TableRow><TableCell colSpan={4} align="center"><Typography color="text.secondary" sx={{ py: 2 }}>No split data</Typography></TableCell></TableRow>
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

      {/* Trip Expenses */}
      <Grid item xs={12}>
        <MainCard title="Trip Expenses" content={false}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Paid By</TableCell>
                  <TableCell align="right">Remove</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tripExpenses.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary" sx={{ py: 3 }}>No expenses in this trip</Typography></TableCell></TableRow>
                )}
                {tripExpenses.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell>{new Date(e.expense_date).toLocaleDateString()}</TableCell>
                    <TableCell>{e.title}</TableCell>
                    <TableCell><Chip label={e.category} size="small" /></TableCell>
                    <TableCell align="right">
                      <NumericFormat value={e.amount} displayType="text" thousandSeparator prefix="$" decimalScale={2} />
                    </TableCell>
                    <TableCell>{e.paid_by_name}</TableCell>
                    <TableCell align="right">
                      <IconButton color="error" onClick={() => handleRemove(e.id)} size="small">
                        <DeleteOutlined />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </MainCard>
      </Grid>

      {/* Add Expenses Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Expenses to Trip</DialogTitle>
        <DialogContent>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>Date</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {availableExpenses.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary" sx={{ py: 2 }}>No available expenses</Typography></TableCell></TableRow>
                )}
                {availableExpenses.map((e) => (
                  <TableRow key={e.id} hover onClick={() => toggleSelect(e.id)} sx={{ cursor: 'pointer' }}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selected.includes(e.id)} />
                    </TableCell>
                    <TableCell>{new Date(e.expense_date).toLocaleDateString()}</TableCell>
                    <TableCell>{e.title}</TableCell>
                    <TableCell><Chip label={e.category} size="small" /></TableCell>
                    <TableCell align="right">
                      <NumericFormat value={e.amount} displayType="text" thousandSeparator prefix="$" decimalScale={2} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={selected.length === 0}>
            Add {selected.length} Expense{selected.length !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
