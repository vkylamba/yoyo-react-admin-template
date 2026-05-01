import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { NumericFormat } from 'react-number-format';

import MainCard from 'components/MainCard';
import { getTrips, createTrip, updateTrip, deleteTrip } from 'services/expenses';

const emptyForm = { name: '', description: '', start_date: '', end_date: '' };

export default function TripListPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => getTrips().then(setTrips);
  useEffect(() => { load(); }, []);

  const handleOpen = (trip = null) => {
    if (trip) {
      setEditing(trip);
      setForm({
        name: trip.name,
        description: trip.description || '',
        start_date: trip.start_date ? trip.start_date.slice(0, 10) : '',
        end_date: trip.end_date ? trip.end_date.slice(0, 10) : ''
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    const data = {
      ...form,
      start_date: form.start_date || null,
      end_date: form.end_date || null
    };
    if (editing) {
      await updateTrip(editing.id, data);
    } else {
      await createTrip(data);
    }
    setOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this trip? Expenses will be unlinked but not deleted.')) {
      await deleteTrip(id);
      load();
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Trips</Typography>
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => handleOpen()}>
            New Trip
          </Button>
        </Stack>
      </Grid>
      <Grid item xs={12}>
        <MainCard content={false}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Date Range</TableCell>
                  <TableCell align="right">Expenses</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trips.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>No trips yet</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {trips.map((trip) => (
                  <TableRow key={trip.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{trip.name}</Typography>
                      {trip.description && <Typography variant="caption" color="text.secondary">{trip.description}</Typography>}
                    </TableCell>
                    <TableCell>
                      {trip.start_date
                        ? `${new Date(trip.start_date).toLocaleDateString()}${trip.end_date ? ' - ' + new Date(trip.end_date).toLocaleDateString() : ''}`
                        : '-'}
                    </TableCell>
                    <TableCell align="right">{trip.expense_count}</TableCell>
                    <TableCell align="right">
                      <NumericFormat value={trip.total_amount} displayType="text" thousandSeparator prefix="$" decimalScale={2} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => navigate(`/expenses/trips/${trip.id}`)} title="View">
                        <EyeOutlined />
                      </IconButton>
                      <IconButton color="primary" onClick={() => handleOpen(trip)} title="Edit">
                        <EditOutlined />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(trip.id)} title="Delete">
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

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Trip' : 'New Trip'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Stack spacing={1}>
                <InputLabel>Name *</InputLabel>
                <OutlinedInput value={form.name} onChange={update('name')} fullWidth placeholder="Goa Trip" />
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Stack spacing={1}>
                <InputLabel>Description</InputLabel>
                <OutlinedInput value={form.description} onChange={update('description')} fullWidth multiline rows={2} placeholder="Beach vacation..." />
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Stack spacing={1}>
                <InputLabel>Start Date</InputLabel>
                <OutlinedInput type="date" value={form.start_date} onChange={update('start_date')} fullWidth />
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Stack spacing={1}>
                <InputLabel>End Date</InputLabel>
                <OutlinedInput type="date" value={form.end_date} onChange={update('end_date')} fullWidth />
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim()}>
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
