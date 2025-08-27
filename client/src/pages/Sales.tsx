import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Sales: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Sales Management
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Sales management functionality will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Sales;
