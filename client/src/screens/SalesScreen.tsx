import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Button,
  FAB,
  List,
  IconButton,
  Chip,
  Divider,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../utils/permissions';
import { CanCreate, CanVoidSales, CashierOrHigher } from '../components/Common/PermissionGuard';
import { theme, spacing, typography } from '../theme';
import { API_ENDPOINTS, apiHelpers } from '../config/api';
import api from '../config/api';
import moment from 'moment';
import Footer from '../components/Layout/Footer';

interface SalesTransaction {
  _id: string;
  receiptNumber: string;
  customerName: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  cashier: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    totalPrice: number;
  }>;
}

const SalesScreen: React.FC = () => {
  const { user } = useAuth();
  const permissions = usePermissions(user);
  const [sales, setSales] = useState<SalesTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.SALES.LIST);
      setSales(response.data.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
      Alert.alert('Error', 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSales();
    setRefreshing(false);
  };

  const handleNewSale = () => {
    Alert.alert('New Sale', 'Navigate to new sale form');
  };

  const handleViewReceipt = (saleId: string) => {
    Alert.alert('View Receipt', `View receipt for sale: ${saleId}`);
  };

  const getPaymentMethodDisplay = (method: string): string => {
    const methods: { [key: string]: string } = {
      cash: 'Cash',
      mobile_money: 'Mobile Money',
      card: 'Card',
      bank_transfer: 'Bank Transfer',
    };
    return methods[method] || method;
  };

  const getPaymentStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  };

  const renderSalesItem = (sale: SalesTransaction) => (
    <Card key={sale._id} style={styles.salesCard}>
      <Card.Content>
        <View style={styles.saleHeader}>
          <View style={styles.saleInfo}>
            <Title style={styles.receiptNumber}>#{sale.receiptNumber}</Title>
            <Text style={styles.customerName}>{sale.customerName}</Text>
            <Text style={styles.saleDate}>
              {moment(sale.createdAt).format('DD MMM YYYY HH:mm')}
            </Text>
          </View>
          <View style={styles.saleAmount}>
            <Text style={styles.amountText}>
              {apiHelpers.formatCurrency(sale.totalAmount)}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.saleDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method:</Text>
            <Text style={styles.detailValue}>
              {getPaymentMethodDisplay(sale.paymentMethod)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Chip
              mode="outlined"
              textStyle={{
                color: getPaymentStatusColor(sale.paymentStatus),
              }}
              style={[
                styles.statusChip,
                { borderColor: getPaymentStatusColor(sale.paymentStatus) },
              ]}
            >
              {sale.paymentStatus.toUpperCase()}
            </Chip>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cashier:</Text>
            <Text style={styles.detailValue}>
              {sale.cashier.firstName} {sale.cashier.lastName}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Items:</Text>
            <Text style={styles.detailValue}>
              {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => handleViewReceipt(sale._id)}
            style={styles.actionButton}
            icon="receipt"
          >
            View Receipt
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pharmacyName}>JELPAPHARM</Text>
          <Text style={styles.pharmacySubtitle}>Pharmacy Management System</Text>
          <Title style={styles.headerTitle}>Sales Management</Title>
          <Text style={styles.headerSubtitle}>
            View and manage sales transactions
          </Text>
        </View>

        {/* Sales List */}
        <View style={styles.salesContainer}>
          {sales.length > 0 ? (
            sales.map(renderSalesItem)
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Text style={styles.emptyText}>No sales transactions found</Text>
                <CanCreate resource="sales">
                  <Button
                    mode="contained"
                    onPress={handleNewSale}
                    style={styles.addButton}
                  >
                    Create First Sale
                  </Button>
                </CanCreate>
              </Card.Content>
            </Card>
          )}
        </View>
        
        <Footer 
          customText="Sales management with receipt generation"
        />
      </ScrollView>

      {/* Floating Action Button */}
      <CanCreate resource="sales">
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleNewSale}
          label="New Sale"
        />
      </CanCreate>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  pharmacyName: {
    ...typography.h4,
    color: theme.colors.primary,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  pharmacySubtitle: {
    ...typography.body1,
    color: theme.colors.text,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
  },
  salesContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  salesCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  saleInfo: {
    flex: 1,
  },
  receiptNumber: {
    ...typography.h5,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  customerName: {
    ...typography.body1,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  saleDate: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
  },
  saleAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    ...typography.h4,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: spacing.sm,
  },
  saleDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
  },
  detailValue: {
    ...typography.body2,
    color: theme.colors.text,
    fontWeight: '500',
  },
  statusChip: {
    alignSelf: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: spacing.sm,
  },
  emptyCard: {
    marginTop: spacing.xl,
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body1,
    color: theme.colors.text,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  addButton: {
    marginTop: spacing.md,
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default SalesScreen;
