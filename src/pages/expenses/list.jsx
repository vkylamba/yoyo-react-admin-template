import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';

import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { NumericFormat } from 'react-number-format';

import MainCard from 'components/MainCard';
import { getExpenses, deleteExpense, getTags, getTrips, EXPENSE_CATEGORIES, PAYMENT_METHODS } from 'services/expenses';

const categoryColors = {
  groceries: 'success',
  travel: 'info',
  rent: 'warning',
  utilities: 'secondary',
  entertainment: 'primary',
  dining: 'error',
  healthcare: 'warning',
  education: 'info',
  other: 'default'
};

export default function ExpenseListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 20 });
  const [filters, setFilters] = useState({ category: '', payment_method: '', search: '', date_from: '', date_to: '', tag_id: '', trip_id: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [allTags, setAllTags] = useState([]);
  const [allTrips, setAllTrips] = useState([]);

  useEffect(() => {
    getTags().then(setAllTags);
    getTrips().then(setAllTrips);
  }, []);

  const load = async () => {
    const params = { page: page + 1, page_size: rowsPerPage };
    if (filters.category) params.category = filters.category;
    if (filters.payment_method) params.payment_method = filters.payment_method;
    if (filters.search) params.search = filters.search;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filters.tag_id) params.tag_id = filters.tag_id;
    if (filters.trip_id) params.trip_id = filters.trip_id;
    const result = await getExpenses(params);
    setData(result);
  };

  useEffect(() => { load(); }, [page, rowsPerPage]);

  const handleFilter = () => {
    setPage(0);
    load();
  };

  const handleClear = () => {
    setFilters({ category: '', payment_method: '', search: '', date_from: '', date_to: '', tag_id: '', trip_id: '' });
    setPage(0);
    setTimeout(load, 0);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense?')) {
      await deleteExpense(id);
      load();
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Expenses</Typography>
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => navigate('/expenses/add')}>
            Add Expense
          </Button>
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <MainCard>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={6} md={2}>
              <Stack spacing={0.5}>
                <InputLabel>Category</InputLabel>
                <Select
                  size="small"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  displayEmpty
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                  ))}
                </Select>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Stack spacing={0.5}>
                <InputLabel>Payment</InputLabel>
                <Select
                  size="small"
                  value={filters.payment_method}
                  onChange={(e) => setFilters({ ...filters, payment_method: e.target.value })}
                  displayEmpty
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  {PAYMENT_METHODS.map((m) => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </Select>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Stack spacing={0.5}>
                <InputLabel>From</InputLabel>
                <OutlinedInput
                  size="small"
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                  fullWidth
                />
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Stack spacing={0.5}>
                <InputLabel>To</InputLabel>
                <OutlinedInput
                  size="small"
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                  fullWidth
                />
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Stack spacing={0.5}>
                <InputLabel>Search</InputLabel>
                <OutlinedInput
                  size="small"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search..."
                  endAdornment={<SearchOutlined />}
                  fullWidth
                />
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" size="small" onClick={handleFilter}>Filter</Button>
                <Button variant="outlined" size="small" onClick={handleClear}>Clear</Button>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Stack spacing={0.5}>
                <InputLabel>Tag</InputLabel>
                <Select
                  size="small"
                  value={filters.tag_id}
                  onChange={(e) => setFilters({ ...filters, tag_id: e.target.value })}
                  displayEmpty
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  {allTags.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </Select>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Stack spacing={0.5}>
                <InputLabel>Trip</InputLabel>
                <Select
                  size="small"
                  value={filters.trip_id}
                  onChange={(e) => setFilters({ ...filters, trip_id: e.target.value })}
                  displayEmpty
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  {allTrips.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </Select>
              </Stack>
            </Grid>
          </Grid>
        </MainCard>
      </Grid>

      <Grid item xs={12}>
        <MainCard content={false}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Paid By</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Tags</TableCell>
                  <TableCell>Split</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>No expenses found</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {data.items.map((expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                    <TableCell>{expense.title}</TableCell>
                    <TableCell>
                      <Chip label={expense.category} color={categoryColors[expense.category] || 'default'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <NumericFormat value={expense.amount} displayType="text" thousandSeparator prefix="$" decimalScale={2} />
                    </TableCell>
                    <TableCell>{expense.paid_by_name}</TableCell>
                    <TableCell>{PAYMENT_METHODS.find((m) => m.value === expense.payment_method)?.label || expense.payment_method}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {(expense.tags || []).map((t) => (
                          <Chip key={t.id} label={t.name} size="small" sx={{ bgcolor: t.color, color: '#fff', fontSize: '0.7rem' }} />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>{expense.consider_for_split ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => navigate(`/expenses/edit/${expense.id}`)}>
                        <EditOutlined />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(expense.id)}>
                        <DeleteOutlined />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={data.total}
            page={page}
            onPageChange={(e, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          />
        </MainCard>
      </Grid>
    </Grid>
  );
}
