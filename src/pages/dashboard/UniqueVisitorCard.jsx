import PropTypes from 'prop-types';

// material-ui
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project import
import MainCard from 'components/MainCard';
import IncomeAreaChart from './IncomeAreaChart';

// ==============================|| DEFAULT - EXPENSES OVER TIME (STACKED BY CATEGORY) ||============================== //

export default function UniqueVisitorCard({ data, categories }) {
  return (
    <>
      <Grid container alignItems="center" justifyContent="space-between">
        <Grid item>
          <Typography variant="h5">Expenses Over Time</Typography>
        </Grid>
      </Grid>
      <MainCard content={false} sx={{ mt: 1.5 }}>
        <Box sx={{ pt: 1, pr: 2 }}>
          <IncomeAreaChart data={data} categories={categories} />
        </Box>
      </MainCard>
    </>
  );
}

UniqueVisitorCard.propTypes = { data: PropTypes.array, categories: PropTypes.array };
