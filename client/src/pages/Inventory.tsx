import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import axios from 'axios';

interface InventoryItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  price: number;
  supplier: string;
  expiryDate: string;
  reorderLevel: number;
  status: string;
}

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get('/api/inventory');
      setInventory(response.data);
    } catch (error) {
      setError('Failed to fetch inventory data');
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/inventory/${id}`);
      setInventory(inventory.filter(item => item._id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 250 },
    { field: 'category', headerName: 'Category', width: 150 },
    { field: 'quantity', headerName: 'Quantity', width: 100, type: 'number' },
    { 
      field: 'price', 
      headerName: 'Price (₵)', 
      width: 120, 
      type: 'number',
      valueFormatter: (params) => `₵${params.value.toFixed(2)}`
    },
    { field: 'supplier', headerName: 'Supplier', width: 150 },
    { 
      field: 'expiryDate', 
      headerName: 'Expiry Date', 
      width: 120,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString()
    },
    { field: 'reorderLevel', headerName: 'Reorder Level', width: 120, type: 'number' },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <Box
          sx={{
            backgroundColor: params.value === 'In Stock' ? '#4caf50' : '#f44336',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
          }}
        >
          {params.value}
        </Box>
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Edit />}
          label="Edit"
          onClick={() => console.log('Edit', params.id)}
        />,
        <GridActionsCellItem
          icon={<Delete />}
          label="Delete"
          onClick={() => handleDelete(params.id as string)}
        />,
      ],
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Inventory Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => console.log('Add new item')}
        >
          Add Item
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={inventory}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          checkboxSelection
          disableSelectionOnClick
          getRowId={(row) => row._id}
        />
      </Paper>
    </Box>
  );
};

export default Inventory;
