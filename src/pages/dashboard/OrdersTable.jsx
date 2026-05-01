import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// third-party
import { NumericFormat } from 'react-number-format';

// services
import { getExpenses } from 'services/expenses';

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

// ==============================|| RECENT EXPENSES TABLE ||============================== //

export default function OrderTable() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    getExpenses({ page: 1, page_size: 10 })
      .then((data) => setExpenses(data.items))
      .catch(() => {});
  }, []);

  return (
    <Box>
      <TableContainer
        sx={{
          width: '100%',
          overflowX: 'auto',
          position: 'relative',
          display: 'block',
          maxWidth: '100%',
          '& td, & th': { whiteSpace: 'nowrap' }
        }}
      >
        <Table aria-labelledby="tableTitle">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Paid By</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    No expenses yet. Add your first expense!
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {expenses.map((expense) => (
              <TableRow
                hover
                key={expense.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 }, cursor: 'pointer' }}
                onClick={() => navigate(`/expenses/edit/${expense.id}`)}
              >
                <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                <TableCell>{expense.title}</TableCell>
                <TableCell>
                  <Chip label={expense.category} color={categoryColors[expense.category] || 'default'} size="small" />
                </TableCell>
                <TableCell>{expense.paid_by_name}</TableCell>
                <TableCell align="right">
                  <NumericFormat value={expense.amount} displayType="text" thousandSeparator prefix="$" decimalScale={2} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
