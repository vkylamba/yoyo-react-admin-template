import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import * as Yup from 'yup';
import { Formik } from 'formik';

import Chip from '@mui/material/Chip';

import AnimateButton from 'components/@extended/AnimateButton';
import MainCard from 'components/MainCard';
import { getPeople, getTags, getTrips, EXPENSE_CATEGORIES, PAYMENT_METHODS } from 'services/expenses';

export default function ExpenseForm({ initialValues, onSubmit, isEdit = false }) {
  const navigate = useNavigate();
  const [people, setPeople] = useState([]);
  const [tags, setTags] = useState([]);
  const [trips, setTrips] = useState([]);
  const [file, setFile] = useState(null);

  useEffect(() => {
    getPeople().then(setPeople);
    getTags().then(setTags);
    getTrips().then(setTrips);
  }, []);

  const now = new Date();
  const defaultDate = now.toISOString().slice(0, 16);

  const defaults = {
    title: '',
    amount: '',
    category: '',
    payment_method: '',
    paid_by_id: '',
    participant_ids: [],
    tag_ids: [],
    trip_id: '',
    consider_for_split: true,
    is_private: false,
    expense_date: defaultDate,
    notes: '',
    submit: null,
    ...initialValues
  };

  const normalizedDefaults = {
    ...defaults,
    paid_by_id: defaults.paid_by_id === '' || defaults.paid_by_id == null ? '' : String(defaults.paid_by_id),
    participant_ids: Array.isArray(defaults.participant_ids) ? defaults.participant_ids.map((id) => String(id)) : [],
    tag_ids: Array.isArray(defaults.tag_ids) ? defaults.tag_ids.map((id) => String(id)) : [],
    trip_id: defaults.trip_id === '' || defaults.trip_id == null ? '' : String(defaults.trip_id)
  };

  return (
    <MainCard title={isEdit ? 'Edit Expense' : 'Add Expense'}>
      <Formik
        initialValues={normalizedDefaults}
        enableReinitialize
        validationSchema={Yup.object().shape({
          title: Yup.string().max(500).required('Title is required'),
          amount: Yup.number().positive('Must be positive').required('Amount is required'),
          category: Yup.string().required('Category is required'),
          payment_method: Yup.string().required('Payment method is required'),
          paid_by_id: Yup.number().required('Paid by is required'),
          expense_date: Yup.string().required('Date is required')
        })}
        onSubmit={async (values, { setErrors, setSubmitting }) => {
          try {
            const payload = {
              ...values,
              paid_by_id: Number(values.paid_by_id),
              participant_ids: (values.participant_ids || []).map((id) => Number(id)),
              tag_ids: (values.tag_ids || []).map((id) => Number(id)),
              trip_id: values.trip_id === '' ? '' : Number(values.trip_id)
            };
            await onSubmit(payload, file);
            navigate('/expenses/list');
          } catch (error) {
            setErrors({ submit: error.response?.data?.detail || 'Something went wrong' });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values, setFieldValue }) => (
          <form noValidate onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <InputLabel>Title *</InputLabel>
                  <OutlinedInput
                    name="title"
                    value={values.title}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="Grocery shopping"
                    fullWidth
                    error={Boolean(touched.title && errors.title)}
                  />
                </Stack>
                {touched.title && errors.title && <FormHelperText error>{errors.title}</FormHelperText>}
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <InputLabel>Amount *</InputLabel>
                  <OutlinedInput
                    name="amount"
                    type="number"
                    value={values.amount}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="0.00"
                    startAdornment={<InputAdornment position="start">$</InputAdornment>}
                    fullWidth
                    error={Boolean(touched.amount && errors.amount)}
                  />
                </Stack>
                {touched.amount && errors.amount && <FormHelperText error>{errors.amount}</FormHelperText>}
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <InputLabel>Category *</InputLabel>
                  <Select
                    name="category"
                    value={values.category}
                    onChange={handleChange}
                    displayEmpty
                    fullWidth
                    error={Boolean(touched.category && errors.category)}
                  >
                    <MenuItem value="" disabled>Select category</MenuItem>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                    ))}
                  </Select>
                </Stack>
                {touched.category && errors.category && <FormHelperText error>{errors.category}</FormHelperText>}
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <InputLabel>Payment Method *</InputLabel>
                  <Select
                    name="payment_method"
                    value={values.payment_method}
                    onChange={handleChange}
                    displayEmpty
                    fullWidth
                    error={Boolean(touched.payment_method && errors.payment_method)}
                  >
                    <MenuItem value="" disabled>Select method</MenuItem>
                    {PAYMENT_METHODS.map((m) => (
                      <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                    ))}
                  </Select>
                </Stack>
                {touched.payment_method && errors.payment_method && <FormHelperText error>{errors.payment_method}</FormHelperText>}
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <InputLabel>Paid By *</InputLabel>
                  <Select
                    name="paid_by_id"
                    value={values.paid_by_id}
                    onChange={handleChange}
                    displayEmpty
                    fullWidth
                    error={Boolean(touched.paid_by_id && errors.paid_by_id)}
                  >
                    <MenuItem value="" disabled>Select person</MenuItem>
                    {people.map((p) => (
                      <MenuItem key={p.id} value={String(p.id)}>{p.name}{p.is_self ? ' (You)' : ''}</MenuItem>
                    ))}
                  </Select>
                </Stack>
                {touched.paid_by_id && errors.paid_by_id && <FormHelperText error>{errors.paid_by_id}</FormHelperText>}
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <InputLabel>People Involved (for split)</InputLabel>
                  <Select
                    name="participant_ids"
                    multiple
                    value={values.participant_ids}
                    onChange={handleChange}
                    fullWidth
                    renderValue={(selected) =>
                      selected
                        .map((id) => {
                          const person = people.find((p) => String(p.id) === String(id));
                          return person?.name || id;
                        })
                        .join(', ')
                    }
                  >
                    {people.map((p) => (
                      <MenuItem key={p.id} value={String(p.id)}>{p.name}{p.is_self ? ' (You)' : ''}</MenuItem>
                    ))}
                  </Select>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <InputLabel>Tags</InputLabel>
                  <Select
                    name="tag_ids"
                    multiple
                    value={values.tag_ids}
                    onChange={handleChange}
                    fullWidth
                    renderValue={(selected) =>
                      selected.map((id) => {
                        const tag = tags.find((t) => String(t.id) === String(id));
                        return tag ? tag.name : id;
                      }).join(', ')
                    }
                  >
                    {tags.map((t) => (
                      <MenuItem key={t.id} value={String(t.id)}>
                        <Chip label={t.name} size="small" sx={{ bgcolor: t.color, color: '#fff', mr: 1 }} />
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <InputLabel>Trip</InputLabel>
                  <Select
                    name="trip_id"
                    value={values.trip_id}
                    onChange={handleChange}
                    displayEmpty
                    fullWidth
                  >
                    <MenuItem value="">None</MenuItem>
                    {trips.map((t) => (
                      <MenuItem key={t.id} value={String(t.id)}>{t.name}</MenuItem>
                    ))}
                  </Select>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <InputLabel>Date & Time *</InputLabel>
                  <OutlinedInput
                    name="expense_date"
                    type="datetime-local"
                    value={values.expense_date}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    fullWidth
                    error={Boolean(touched.expense_date && errors.expense_date)}
                  />
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <InputLabel>Attachment</InputLabel>
                  <OutlinedInput
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    fullWidth
                    inputProps={{ accept: 'image/*,.pdf,.doc,.docx' }}
                  />
                  {isEdit && initialValues?.attachment_filename && !file && (
                    <Typography variant="caption" color="text.secondary">
                      Current: {initialValues.attachment_filename}
                    </Typography>
                  )}
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values.consider_for_split}
                      onChange={(e) => setFieldValue('consider_for_split', e.target.checked)}
                      name="consider_for_split"
                    />
                  }
                  label="Consider for split?"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values.is_private}
                      onChange={(e) => {
                        setFieldValue('is_private', e.target.checked);
                        if (e.target.checked) {
                          setFieldValue('consider_for_split', false);
                          setFieldValue('participant_ids', []);
                        }
                      }}
                      name="is_private"
                    />
                  }
                  label="Private (only visible to you)"
                />
              </Grid>

              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel>Notes</InputLabel>
                  <OutlinedInput
                    name="notes"
                    value={values.notes}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="Additional details..."
                    multiline
                    rows={3}
                    fullWidth
                  />
                </Stack>
              </Grid>

              {errors.submit && (
                <Grid item xs={12}>
                  <FormHelperText error>{errors.submit}</FormHelperText>
                </Grid>
              )}

              <Grid item xs={12}>
                <Stack direction="row" spacing={2}>
                  <AnimateButton>
                    <Button disableElevation disabled={isSubmitting} type="submit" variant="contained" size="large">
                      {isEdit ? 'Update Expense' : 'Add Expense'}
                    </Button>
                  </AnimateButton>
                  <Button variant="outlined" size="large" onClick={() => navigate('/expenses/list')}>
                    Cancel
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>
    </MainCard>
  );
}
