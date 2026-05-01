import { useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { DeleteOutlined, EditOutlined, PlayCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { NumericFormat } from 'react-number-format';

import MainCard from 'components/MainCard';
import {
  getRecurringRules,
  createRecurringRule,
  updateRecurringRule,
  deleteRecurringRule,
  triggerRecurringRule,
  getPeople,
  getTags,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  FREQUENCIES
} from 'services/expenses';

const emptyForm = {
  title: '',
  amount: '',
  category: '',
  payment_method: '',
  paid_by_id: '',
  participant_ids: [],
  consider_for_split: true,
  notes: '',
  frequency: '',
  start_date: '',
  end_date: ''
};

export default function RecurringRulesPage() {
  const [rules, setRules] = useState([]);
  const [people, setPeople] = useState([]);
  const [tags, setTags] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const [r, p, t] = await Promise.all([getRecurringRules(), getPeople(), getTags()]);
    setRules(r);
    setPeople(p);
    setTags(t);
  };

  useEffect(() => { load(); }, []);

  const handleOpen = (rule = null) => {
    if (rule) {
      setEditing(rule);
      setForm({
        title: rule.title,
        amount: rule.amount,
        category: rule.category,
        payment_method: rule.payment_method,
        paid_by_id: rule.paid_by_id,
        participant_ids: rule.participant_ids,
        consider_for_split: rule.consider_for_split,
        notes: rule.notes || '',
        frequency: rule.frequency,
        start_date: rule.start_date.slice(0, 10),
        end_date: rule.end_date ? rule.end_date.slice(0, 10) : ''
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
      amount: parseFloat(form.amount),
      start_date: form.start_date,
      end_date: form.end_date || null
    };
    if (editing) {
      await updateRecurringRule(editing.id, data);
    } else {
      await createRecurringRule(data);
    }
    setOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this rule?')) {
      await deleteRecurringRule(id);
      load();
    }
  };

  const [triggerDialog, setTriggerDialog] = useState({
    open: false,
    ruleId: null,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    paid_by_id: '',
    tag_ids: []
  });

  const handleTriggerOpen = (id) => {
    const today = new Date().toISOString().slice(0, 10);
    const rule = rules.find((r) => r.id === id);
    setTriggerDialog({
      open: true,
      ruleId: id,
      start_date: today,
      end_date: today,
      paid_by_id: rule?.paid_by_id || '',
      tag_ids: []
    });
  };

  const handleTriggerConfirm = async () => {
    await triggerRecurringRule(triggerDialog.ruleId, {
      start_date: triggerDialog.start_date,
      end_date: triggerDialog.end_date,
      paid_by_id: triggerDialog.paid_by_id,
      tag_ids: triggerDialog.tag_ids
    });
    setTriggerDialog({ ...triggerDialog, open: false });
    alert('Expenses generated from rule');
    load();
  };

  const handleTrigger = async (id) => {
    handleTriggerOpen(id);
  };

  const handleToggle = async (rule) => {
    await updateRecurringRule(rule.id, { is_active: !rule.is_active });
    load();
  };

  const updateField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Recurring Rules</Typography>
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => handleOpen()}>
            Add Rule
          </Button>
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <MainCard content={false}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Generated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>No recurring rules</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {rules.map((rule) => (
                  <TableRow key={rule.id} hover>
                    <TableCell>{rule.title}</TableCell>
                    <TableCell align="right">
                      <NumericFormat value={rule.amount} displayType="text" thousandSeparator prefix="$" decimalScale={2} />
                    </TableCell>
                    <TableCell><Chip label={rule.category} size="small" /></TableCell>
                    <TableCell>{rule.frequency}</TableCell>
                    <TableCell>
                      <Chip
                        label={rule.is_active ? 'Active' : 'Inactive'}
                        color={rule.is_active ? 'success' : 'default'}
                        size="small"
                        onClick={() => handleToggle(rule)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell>{rule.last_generated_date ? new Date(rule.last_generated_date).toLocaleDateString() : 'Never'}</TableCell>
                    <TableCell align="right">
                      <IconButton color="success" onClick={() => handleTrigger(rule.id)} title="Generate now">
                        <PlayCircleOutlined />
                      </IconButton>
                      <IconButton color="primary" onClick={() => handleOpen(rule)}>
                        <EditOutlined />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(rule.id)}>
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

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Rule' : 'Add Rule'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <Stack spacing={1}>
                <InputLabel>Title *</InputLabel>
                <OutlinedInput value={form.title} onChange={updateField('title')} fullWidth placeholder="Monthly rent" />
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={1}>
                <InputLabel>Amount *</InputLabel>
                <OutlinedInput
                  type="number"
                  value={form.amount}
                  onChange={updateField('amount')}
                  startAdornment={<InputAdornment position="start">$</InputAdornment>}
                  fullWidth
                />
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={1}>
                <InputLabel>Category *</InputLabel>
                <Select value={form.category} onChange={updateField('category')} displayEmpty fullWidth>
                  <MenuItem value="" disabled>Select</MenuItem>
                  {EXPENSE_CATEGORIES.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                </Select>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={1}>
                <InputLabel>Payment Method *</InputLabel>
                <Select value={form.payment_method} onChange={updateField('payment_method')} displayEmpty fullWidth>
                  <MenuItem value="" disabled>Select</MenuItem>
                  {PAYMENT_METHODS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                </Select>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={1}>
                <InputLabel>Frequency *</InputLabel>
                <Select value={form.frequency} onChange={updateField('frequency')} displayEmpty fullWidth>
                  <MenuItem value="" disabled>Select</MenuItem>
                  {FREQUENCIES.map((f) => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
                </Select>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={1}>
                <InputLabel>Paid By *</InputLabel>
                <Select value={form.paid_by_id} onChange={updateField('paid_by_id')} displayEmpty fullWidth>
                  <MenuItem value="" disabled>Select</MenuItem>
                  {people.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={1}>
                <InputLabel>Start Date *</InputLabel>
                <OutlinedInput type="date" value={form.start_date} onChange={updateField('start_date')} fullWidth />
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={1}>
                <InputLabel>End Date</InputLabel>
                <OutlinedInput type="date" value={form.end_date} onChange={updateField('end_date')} fullWidth />
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Stack spacing={1}>
                <InputLabel>People Involved</InputLabel>
                <Select
                  multiple
                  value={form.participant_ids}
                  onChange={(e) => setForm({ ...form, participant_ids: e.target.value })}
                  fullWidth
                  renderValue={(selected) => selected.map((id) => people.find((p) => p.id === id)?.name || id).join(', ')}
                >
                  {people.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.consider_for_split}
                    onChange={(e) => setForm({ ...form, consider_for_split: e.target.checked })}
                  />
                }
                label="Consider for split?"
              />
            </Grid>
            <Grid item xs={12}>
              <Stack spacing={1}>
                <InputLabel>Notes</InputLabel>
                <OutlinedInput value={form.notes} onChange={updateField('notes')} multiline rows={2} fullWidth />
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.title || !form.amount || !form.category || !form.payment_method || !form.frequency || !form.start_date || !form.paid_by_id}
          >
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trigger date range dialog */}
      <Dialog open={triggerDialog.open} onClose={() => setTriggerDialog({ ...triggerDialog, open: false })} maxWidth="xs" fullWidth>
        <DialogTitle>Generate Expenses</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ mt: 1 }}>
            <InputLabel>Start Date</InputLabel>
            <OutlinedInput
              type="date"
              value={triggerDialog.start_date}
              onChange={(e) => setTriggerDialog({ ...triggerDialog, start_date: e.target.value })}
              fullWidth
            />
            <InputLabel>End Date</InputLabel>
            <OutlinedInput
              type="date"
              value={triggerDialog.end_date}
              onChange={(e) => setTriggerDialog({ ...triggerDialog, end_date: e.target.value })}
              fullWidth
            />
            <InputLabel>Paid By *</InputLabel>
            <Select
              value={triggerDialog.paid_by_id}
              onChange={(e) => setTriggerDialog({ ...triggerDialog, paid_by_id: e.target.value })}
              displayEmpty
              fullWidth
            >
              <MenuItem value="" disabled>Select</MenuItem>
              {people.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
            <InputLabel>Tags</InputLabel>
            <Select
              multiple
              value={triggerDialog.tag_ids}
              onChange={(e) => setTriggerDialog({ ...triggerDialog, tag_ids: e.target.value })}
              fullWidth
              renderValue={(selected) => selected.map((id) => tags.find((t) => t.id === id)?.name || id).join(', ')}
            >
              {tags.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTriggerDialog({ ...triggerDialog, open: false })}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleTriggerConfirm}
            disabled={
              !triggerDialog.start_date ||
              !triggerDialog.end_date ||
              !triggerDialog.paid_by_id ||
              triggerDialog.end_date < triggerDialog.start_date
            }
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
