import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Alerts: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Alerts & Notifications
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Alerts and notifications functionality will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Alerts;
