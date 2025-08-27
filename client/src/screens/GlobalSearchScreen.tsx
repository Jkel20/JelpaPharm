import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Title,
  Text,
  Card,
  Chip,
  FAB,
  Portal,
  Dialog,
  Button,
  List,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import SearchComponent from '../components/Search/SearchComponent';
import { theme, spacing, typography } from '../theme';

interface SearchResult {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  prescriptionNumber?: string;
  customerId?: string;
  phone?: string;
  email?: string;
  status?: string;
  category?: string;
  quantity?: number;
  prescribedBy?: string;
  transactionNumber?: string;
  orderNumber?: string;
  contactPerson?: string;
  type: 'inventory' | 'customer' | 'prescription' | 'supplier' | 'sales' | 'purchase-order';
}

const GlobalSearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const permissions = usePermissions(user);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result);
    setDialogVisible(true);
  };

  const handleViewDetails = () => {
    if (!selectedResult) return;

    setDialogVisible(false);

    // Navigate to appropriate screen based on result type
    switch (selectedResult.type) {
      case 'inventory':
        navigation.navigate('Inventory', { selectedItem: selectedResult });
        break;
      case 'customer':
        navigation.navigate('Customer', { selectedCustomer: selectedResult });
        break;
      case 'prescription':
        navigation.navigate('Prescription', { selectedPrescription: selectedResult });
        break;
      case 'supplier':
        navigation.navigate('Supplier', { selectedSupplier: selectedResult });
        break;
      case 'sales':
        navigation.navigate('Sales', { selectedSale: selectedResult });
        break;
      case 'purchase-order':
        navigation.navigate('Supplier', { selectedOrder: selectedResult });
        break;
      default:
        Alert.alert('Error', 'Unable to navigate to this item');
    }
  };

  const handleQuickAction = (action: string) => {
    if (!selectedResult) return;

    setDialogVisible(false);

    switch (action) {
      case 'edit':
        // Navigate to edit screen
        Alert.alert('Info', 'Edit functionality will be implemented');
        break;
      case 'delete':
        Alert.alert(
          'Confirm Delete',
          'Are you sure you want to delete this item?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => {
              Alert.alert('Info', 'Delete functionality will be implemented');
            }},
          ]
        );
        break;
      case 'print':
        Alert.alert('Info', 'Print functionality will be implemented');
        break;
      default:
        break;
    }
  };

  const getAvailableSearchTypes = () => {
    const types: ('inventory' | 'customer' | 'prescription' | 'supplier' | 'sales' | 'purchase-order')[] = [];

    // Add search types based on user permissions
    if (permissions.canRead('inventory')) {
      types.push('inventory');
    }
    if (permissions.canRead('customers')) {
      types.push('customer');
    }
    if (permissions.canRead('prescriptions')) {
      types.push('prescription');
    }
    if (permissions.canRead('suppliers')) {
      types.push('supplier');
    }
    if (permissions.canRead('sales')) {
      types.push('sales');
    }
    if (permissions.canRead('suppliers')) {
      types.push('purchase-order');
    }

    return types;
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'inventory':
        return 'pill';
      case 'customer':
        return 'account';
      case 'prescription':
        return 'file-document';
      case 'supplier':
        return 'truck';
      case 'sales':
        return 'cart';
      case 'purchase-order':
        return 'clipboard-list';
      default:
        return 'magnify';
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case 'inventory':
        return theme.colors.primary;
      case 'customer':
        return theme.colors.secondary;
      case 'prescription':
        return theme.colors.tertiary;
      case 'supplier':
        return theme.colors.success;
      case 'sales':
        return theme.colors.warning;
      case 'purchase-order':
        return theme.colors.info;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pharmacyName}>JELPAPHARM</Text>
        <Text style={styles.pharmacySubtitle}>Pharmacy Management System</Text>
        <Title style={styles.headerTitle}>Global Search</Title>
        <Text style={styles.headerSubtitle}>
          Search across all pharmacy data
        </Text>
      </View>

      {/* Search Component */}
      <SearchComponent
        searchTypes={getAvailableSearchTypes()}
        onResultSelect={handleResultSelect}
        placeholder="Search drugs, customers, prescriptions, suppliers..."
        showFilters={true}
        style={styles.searchContainer}
      />

      {/* Quick Search Tips */}
      <Card style={styles.tipsCard}>
        <Card.Content>
          <Title style={styles.tipsTitle}>Search Tips</Title>
          <List.Item
            title="Drugs"
            description="Search by name, brand, or generic name"
            left={(props) => <List.Icon {...props} icon="pill" color={theme.colors.primary} />}
          />
          <List.Item
            title="Customers"
            description="Search by name, phone, or customer ID"
            left={(props) => <List.Icon {...props} icon="account" color={theme.colors.secondary} />}
          />
          <List.Item
            title="Prescriptions"
            description="Search by prescription number or doctor name"
            left={(props) => <List.Icon {...props} icon="file-document" color={theme.colors.tertiary} />}
          />
          <List.Item
            title="Suppliers"
            description="Search by company name or contact person"
            left={(props) => <List.Icon {...props} icon="truck" color={theme.colors.success} />}
          />
        </Card.Content>
      </Card>

      {/* Result Details Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            {selectedResult ? (
              <View style={styles.dialogHeader}>
                <Chip
                  mode="flat"
                  textStyle={{ color: 'white' }}
                  style={[
                    styles.dialogChip,
                    { backgroundColor: getResultColor(selectedResult.type) }
                  ]}
                >
                  {selectedResult.type.replace('-', ' ').toUpperCase()}
                </Chip>
                <Text style={styles.dialogTitle}>
                  {selectedResult.name || 
                   selectedResult.prescriptionNumber || 
                   `${selectedResult.firstName || ''} ${selectedResult.lastName || ''}`.trim() ||
                   selectedResult.transactionNumber ||
                   selectedResult.orderNumber ||
                   'Unknown Item'}
                </Text>
              </View>
            ) : 'Item Details'}
          </Dialog.Title>
          <Dialog.Content>
            {selectedResult && (
              <View style={styles.dialogContent}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>
                    {selectedResult.type.replace('-', ' ').toUpperCase()}
                  </Text>
                </View>
                
                {selectedResult.status && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={styles.detailValue}>{selectedResult.status}</Text>
                  </View>
                )}
                
                {selectedResult.category && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Category:</Text>
                    <Text style={styles.detailValue}>{selectedResult.category}</Text>
                  </View>
                )}
                
                {selectedResult.quantity !== undefined && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Quantity:</Text>
                    <Text style={styles.detailValue}>{selectedResult.quantity}</Text>
                  </View>
                )}
                
                {selectedResult.phone && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>{selectedResult.phone}</Text>
                  </View>
                )}
                
                {selectedResult.email && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedResult.email}</Text>
                  </View>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={() => handleQuickAction('edit')}>Edit</Button>
            <Button onPress={handleViewDetails} mode="contained">View Details</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Quick Actions FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          Alert.alert(
            'Quick Actions',
            'Choose an action:',
            [
              { text: 'Add Drug', onPress: () => navigation.navigate('Inventory') },
              { text: 'Add Customer', onPress: () => navigation.navigate('Customer') },
              { text: 'Add Prescription', onPress: () => navigation.navigate('Prescription') },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }}
        label="Quick Add"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  pharmacyName: {
    ...typography.h4,
    color: 'white',
    fontWeight: 'bold',
  },
  pharmacySubtitle: {
    ...typography.body2,
    color: 'white',
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  headerTitle: {
    ...typography.h5,
    color: 'white',
    marginTop: spacing.md,
  },
  headerSubtitle: {
    ...typography.body2,
    color: 'white',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  searchContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  tipsCard: {
    margin: spacing.lg,
    marginTop: 0,
  },
  tipsTitle: {
    ...typography.h6,
    marginBottom: spacing.sm,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dialogChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  dialogTitle: {
    ...typography.subtitle1,
    flex: 1,
  },
  dialogContent: {
    paddingVertical: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  detailLabel: {
    ...typography.body2,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  detailValue: {
    ...typography.body2,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
  },
});

export default GlobalSearchScreen;
