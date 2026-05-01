import { useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
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
import Alert from '@mui/material/Alert';

import { NumericFormat } from 'react-number-format';

import MainCard from 'components/MainCard';
import {
  getMonthlyReport,
  getReportSubscription,
  sendReportSubscriptionTestEmail,
  testReportSubscriptionEmail,
  upsertReportSubscription
} from 'services/expenses';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ReportsPage() {
  const [sub, setSub] = useState({ is_active: false, email: '', day_of_month: 1 });
  const [subMsg, setSubMsg] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [testPreview, setTestPreview] = useState(null);
  const [testError, setTestError] = useState('');
  const [sendMsg, setSendMsg] = useState('');
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getReportSubscription()
      .then(setSub)
      .catch(() => {});
  }, []);

  const handleSaveSub = async () => {
    await upsertReportSubscription(sub);
    setSubMsg('Subscription saved!');
    setTimeout(() => setSubMsg(''), 3000);
  };

  const handleGenerate = async () => {
    const data = await getMonthlyReport(month, year);
    setReport(data);
  };

  const handleTestEmail = async () => {
    setTestError('');
    setSendMsg('');
    setSendError('');
    try {
      const preview = await testReportSubscriptionEmail(month, year);
      setTestPreview(preview);
    } catch (error) {
      setTestPreview(null);
      setTestError(error?.response?.data?.detail || 'Failed to generate test email preview');
    }
  };

  const handleSendTestEmail = async () => {
    setSendMsg('');
    setSendError('');
    setSending(true);
    try {
      const result = await sendReportSubscriptionTestEmail(month, year);
      setSendMsg(result?.message || 'Test email sent successfully');
    } catch (error) {
      setSendError(error?.response?.data?.detail || 'Failed to send test email');
    } finally {
      setSending(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5">Reports</Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <MainCard title="Report Subscription">
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Subscribe to receive monthly expense reports via email.
            </Typography>
            <Stack spacing={1}>
              <InputLabel>Email</InputLabel>
              <OutlinedInput
                value={sub.email}
                onChange={(e) => setSub({ ...sub, email: e.target.value })}
                placeholder="your@email.com"
                fullWidth
              />
            </Stack>
            <Stack spacing={1}>
              <InputLabel>Day of Month</InputLabel>
              <Select
                value={sub.day_of_month}
                onChange={(e) => setSub({ ...sub, day_of_month: e.target.value })}
                fullWidth
              >
                {Array.from({ length: 28 }, (_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
                ))}
              </Select>
            </Stack>
            <FormControlLabel
              control={
                <Checkbox
                  checked={sub.is_active}
                  onChange={(e) => setSub({ ...sub, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
            <Button variant="contained" onClick={handleSaveSub} disabled={!sub.email}>
              Save Subscription
            </Button>
            {subMsg && <Alert severity="success">{subMsg}</Alert>}
          </Stack>
        </MainCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <MainCard title="Generate Monthly Report">
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Stack spacing={1}>
                  <InputLabel>Month</InputLabel>
                  <Select value={month} onChange={(e) => setMonth(e.target.value)} fullWidth>
                    {MONTHS.map((m, i) => (
                      <MenuItem key={i} value={i + 1}>{m}</MenuItem>
                    ))}
                  </Select>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack spacing={1}>
                  <InputLabel>Year</InputLabel>
                  <Select value={year} onChange={(e) => setYear(e.target.value)} fullWidth>
                    {years.map((y) => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                </Stack>
              </Grid>
            </Grid>
            <Button variant="contained" onClick={handleGenerate}>
              Generate Report
            </Button>
            <Button variant="outlined" onClick={handleTestEmail}>
              Test Email
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleSendTestEmail} disabled={sending}>
              {sending ? 'Sending...' : 'Send Real Test Email'}
            </Button>
            {testError && <Alert severity="error">{testError}</Alert>}
            {sendError && <Alert severity="error">{sendError}</Alert>}
            {sendMsg && <Alert severity="success">{sendMsg}</Alert>}
          </Stack>
        </MainCard>
      </Grid>

      {testPreview && (
        <Grid item xs={12}>
          <MainCard title="Test Email Preview">
            <Stack spacing={1}>
              <Typography variant="body2"><strong>To:</strong> {testPreview.to_email}</Typography>
              <Typography variant="body2"><strong>Subject:</strong> {testPreview.subject}</Typography>
              <OutlinedInput
                value={testPreview.body}
                multiline
                minRows={8}
                readOnly
                fullWidth
              />
            </Stack>
          </MainCard>
        </Grid>
      )}

      {report && (
        <>
          <Grid item xs={12}>
            <MainCard title={`Report: ${MONTHS[report.month - 1]} ${report.year}`}>
              <Typography variant="h4" sx={{ mb: 2 }}>
                Total: <NumericFormat value={report.total_expenses} displayType="text" thousandSeparator prefix="$" decimalScale={2} />
              </Typography>
            </MainCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <MainCard title="By Category" content={false}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.category_breakdown.map((c) => (
                      <TableRow key={c.category}>
                        <TableCell>{c.category.charAt(0).toUpperCase() + c.category.slice(1)}</TableCell>
                        <TableCell align="right">
                          <NumericFormat value={c.total} displayType="text" thousandSeparator prefix="$" decimalScale={2} />
                        </TableCell>
                        <TableCell align="right">{c.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </MainCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <MainCard title="By Payment Method" content={false}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Method</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.payment_method_breakdown.map((p) => (
                      <TableRow key={p.method}>
                        <TableCell>{p.method.replace('_', ' ')}</TableCell>
                        <TableCell align="right">
                          <NumericFormat value={p.total} displayType="text" thousandSeparator prefix="$" decimalScale={2} />
                        </TableCell>
                        <TableCell align="right">{p.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </MainCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <MainCard title="By Person" content={false}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Person</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell align="right">Share</TableCell>
                      <TableCell align="right">Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.person_breakdown.map((p) => (
                      <TableRow key={p.person_id}>
                        <TableCell>{p.person_name}</TableCell>
                        <TableCell align="right">
                          <NumericFormat value={p.total_paid} displayType="text" thousandSeparator prefix="$" decimalScale={2} />
                        </TableCell>
                        <TableCell align="right">
                          <NumericFormat value={p.total_share} displayType="text" thousandSeparator prefix="$" decimalScale={2} />
                        </TableCell>
                        <TableCell align="right">
                          <Typography color={p.net_balance >= 0 ? 'success.main' : 'error.main'}>
                            {p.net_balance >= 0 ? '+' : ''}${p.net_balance.toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </MainCard>
          </Grid>
        </>
      )}
    </Grid>
  );
}
