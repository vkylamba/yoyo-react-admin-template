import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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

import { DeleteOutlined, EditOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';

import MainCard from 'components/MainCard';
import { getPeople, createPerson, updatePerson, deletePerson } from 'services/expenses';

export default function PeopleManagement() {
  const [people, setPeople] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const load = async () => {
    const data = await getPeople();
    setPeople(data);
  };

  useEffect(() => { load(); }, []);

  const handleOpen = (person = null) => {
    if (person) {
      setEditing(person);
      setName(person.name);
      setEmail(person.email || '');
    } else {
      setEditing(null);
      setName('');
      setEmail('');
    }
    setOpen(true);
  };

  const handleSave = async () => {
    const data = { name, email: email || null };
    if (editing) {
      await updatePerson(editing.id, data);
    } else {
      await createPerson(data);
    }
    setOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this person?')) {
      await deletePerson(id);
      load();
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">People</Typography>
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => handleOpen()}>
            Add Person
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
                  <TableCell>Email</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {people.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <UserOutlined />
                        <Typography>{person.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{person.email || '-'}</TableCell>
                    <TableCell>
                      {person.is_self ? <Chip label="You" color="primary" size="small" /> : <Chip label="Member" size="small" />}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpen(person)}>
                        <EditOutlined />
                      </IconButton>
                      {!person.is_self && (
                        <IconButton color="error" onClick={() => handleDelete(person.id)}>
                          <DeleteOutlined />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </MainCard>
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Person' : 'Add Person'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack spacing={1}>
              <InputLabel>Name *</InputLabel>
              <OutlinedInput value={name} onChange={(e) => setName(e.target.value)} fullWidth placeholder="John Doe" />
            </Stack>
            <Stack spacing={1}>
              <InputLabel>Email</InputLabel>
              <OutlinedInput value={email} onChange={(e) => setEmail(e.target.value)} fullWidth placeholder="john@example.com" />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!name.trim()}>
            {editing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
