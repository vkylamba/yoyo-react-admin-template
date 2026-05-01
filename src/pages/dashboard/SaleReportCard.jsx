import PropTypes from 'prop-types';

// material-ui
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

// project import
import SalesChart from './SalesChart';

// ==============================|| DEFAULT - PAYMENT METHOD BREAKDOWN ||============================== //

export default function SaleReportCard({ data }) {
  return (
    <>
      <Grid container alignItems="center" justifyContent="space-between">
        <Grid item>
          <Typography variant="h5">Payment Methods</Typography>
        </Grid>
      </Grid>
      <SalesChart data={data} />
    </>
  );
}

SaleReportCard.propTypes = { data: PropTypes.array };
