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

import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';

import MainCard from 'components/MainCard';
import { getTags, createTag, updateTag, deleteTag } from 'services/expenses';

const DEFAULT_COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#13c2c2', '#722ed1', '#eb2f96', '#fa8c16'];

export default function TagsPage() {
  const [tags, setTags] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#1890ff');

  const load = () => getTags().then(setTags);
  useEffect(() => { load(); }, []);

  const handleOpen = (tag = null) => {
    if (tag) {
      setEditing(tag);
      setName(tag.name);
      setColor(tag.color || '#1890ff');
    } else {
      setEditing(null);
      setName('');
      setColor(DEFAULT_COLORS[tags.length % DEFAULT_COLORS.length]);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      await updateTag(editing.id, { name, color });
    } else {
      await createTag({ name, color });
    }
    setOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this tag? It will be removed from all expenses.')) {
      await deleteTag(id);
      load();
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Tags</Typography>
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => handleOpen()}>
            Add Tag
          </Button>
        </Stack>
      </Grid>
      <Grid item xs={12}>
        <MainCard content={false}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tag</TableCell>
                  <TableCell>Color</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tags.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>No tags yet</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <Chip label={tag.name} sx={{ bgcolor: tag.color, color: '#fff' }} size="small" />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: tag.color || '#ccc', display: 'inline-block' }} />
                        <Typography variant="body2">{tag.color || '-'}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpen(tag)}><EditOutlined /></IconButton>
                      <IconButton color="error" onClick={() => handleDelete(tag.id)}><DeleteOutlined /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </MainCard>
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Edit Tag' : 'Add Tag'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack spacing={1}>
              <InputLabel>Name *</InputLabel>
              <OutlinedInput value={name} onChange={(e) => setName(e.target.value)} fullWidth placeholder="e.g. vacation" />
            </Stack>
            <Stack spacing={1}>
              <InputLabel>Color</InputLabel>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {DEFAULT_COLORS.map((c) => (
                  <span
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: c,
                      cursor: 'pointer',
                      border: color === c ? '3px solid #333' : '2px solid transparent'
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!name.trim()}>{editing ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
