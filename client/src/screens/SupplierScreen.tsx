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
  Searchbar,
  Button,
  Chip,
  FAB,
  List,
  IconButton,
  Menu,
  Divider,
  Dialog,
  Portal,
  TextInput,
  SegmentedButtons,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../utils/permissions';
import { AdminOnly, CanCreate, CanUpdate, CanDelete } from '../components/Common/PermissionGuard';
import { theme, spacing, typography } from '../theme';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';
import moment from 'moment';
import Footer from '../components/Layout/Footer';

interface Supplier {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  businessLicense: string;
  taxIdentificationNumber: string;
  paymentTerms: string;
  creditLimit: number;
  currentBalance: number;
  isActive: boolean;
  rating: number;
  categories: string[];
  createdAt: string;
}

interface PurchaseOrder {
  _id: string;
  orderNumber: string;
  supplier: {
    name: string;
    contactPerson: string;
  };
  totalAmount: number;
  status: 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';
  orderDate: string;
  expectedDeliveryDate: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

const SupplierScreen: React.FC = () => {
  const { user } = useAuth();
  const permissions = usePermissions(user);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState<'suppliers' | 'orders'>('suppliers');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, searchQuery]);

  const fetchData = async () => {
    try {
      if (selectedView === 'suppliers') {
        const response = await axios.get(`${API_BASE_URL}/api/suppliers`);
        setSuppliers(response.data.data);
      } else {
        const response = await axios.get(`${API_BASE_URL}/api/purchase-orders`);
        setPurchaseOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filterSuppliers = () => {
    let filtered = suppliers;
    
    if (searchQuery) {
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredSuppliers(filtered);
  };

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setDialogVisible(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDialogVisible(true);
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    Alert.alert(
      'Delete Supplier',
      'Are you sure you want to delete this supplier?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/api/suppliers/${supplierId}`);
              fetchData();
              Alert.alert('Success', 'Supplier deleted successfully');
            } catch (error) {
              console.error('Error deleting supplier:', error);
              Alert.alert('Error', 'Failed to delete supplier');
            }
          },
        },
      ]
    );
  };

  const handleSaveSupplier = async (supplierData: Partial<Supplier>) => {
    try {
      if (selectedSupplier) {
        await axios.put(`${API_BASE_URL}/api/suppliers/${selectedSupplier._id}`, supplierData);
      } else {
        await axios.post(`${API_BASE_URL}/api/suppliers`, supplierData);
      }
      setDialogVisible(false);
      fetchData();
      Alert.alert('Success', 'Supplier saved successfully');
    } catch (error) {
      console.error('Error saving supplier:', error);
      Alert.alert('Error', 'Failed to save supplier');
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'approved':
        return theme.colors.info;
      case 'ordered':
        return theme.colors.primary;
      case 'received':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  };

  const getStatusDisplay = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderSupplierItem = (supplier: Supplier) => (
    <Card key={supplier._id} style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Title style={styles.title}>{supplier.name}</Title>
            <Chip 
              mode="outlined" 
              style={[
                styles.statusChip,
                { backgroundColor: supplier.isActive ? theme.colors.success : theme.colors.error }
              ]}
            >
              {supplier.isActive ? 'Active' : 'Inactive'}
            </Chip>
          </View>
          <Menu
            visible={menuVisible === supplier._id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(supplier._id)}
              />
            }
          >
            <CanUpdate resource="suppliers">
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  handleEditSupplier(supplier);
                }}
                title="Edit"
                leadingIcon="pencil"
              />
            </CanUpdate>
            <CanDelete resource="suppliers">
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  handleDeleteSupplier(supplier._id);
                }}
                title="Delete"
                leadingIcon="delete"
              />
            </CanDelete>
          </Menu>
        </View>
        
        <List.Item
          title="Contact Person"
          description={supplier.contactPerson}
          left={props => <List.Icon {...props} icon="account" />}
        />
        
        <List.Item
          title="Email"
          description={supplier.email}
          left={props => <List.Icon {...props} icon="email" />}
        />
        
        <List.Item
          title="Phone"
          description={supplier.phone}
          left={props => <List.Icon {...props} icon="phone" />}
        />
        
        <List.Item
          title="Address"
          description={`${supplier.address.street}, ${supplier.address.city}, ${supplier.address.region}`}
          left={props => <List.Icon {...props} icon="map-marker" />}
        />
        
        <View style={styles.supplierDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Rating</Text>
            <Text style={styles.detailValue}>{supplier.rating}/5</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Credit Limit</Text>
            <Text style={styles.detailValue}>GH₵ {supplier.creditLimit.toFixed(2)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Balance</Text>
            <Text style={[
              styles.detailValue,
              { color: supplier.currentBalance > 0 ? theme.colors.error : theme.colors.success }
            ]}>
              GH₵ {supplier.currentBalance.toFixed(2)}
            </Text>
          </View>
        </View>
        
        {supplier.categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            <Text style={styles.categoriesLabel}>Categories:</Text>
            <View style={styles.categoriesList}>
              {supplier.categories.map((category, index) => (
                <Chip key={index} style={styles.categoryChip} textStyle={styles.categoryText}>
                  {category}
                </Chip>
              ))}
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderPurchaseOrderItem = (order: PurchaseOrder) => (
    <Card key={order._id} style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Title style={styles.title}>{order.orderNumber}</Title>
            <Chip 
              mode="outlined" 
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(order.status) }
              ]}
            >
              {getStatusDisplay(order.status)}
            </Chip>
          </View>
        </View>
        
        <List.Item
          title="Supplier"
          description={order.supplier.name}
          left={props => <List.Icon {...props} icon="business" />}
        />
        
        <List.Item
          title="Order Date"
          description={moment(order.orderDate).format('DD/MM/YYYY')}
          left={props => <List.Icon {...props} icon="calendar" />}
        />
        
        <List.Item
          title="Expected Delivery"
          description={moment(order.expectedDeliveryDate).format('DD/MM/YYYY')}
          left={props => <List.Icon {...props} icon="truck-delivery" />}
        />
        
        <List.Item
          title="Total Amount"
          description={`GH₵ ${order.totalAmount.toFixed(2)}`}
          left={props => <List.Icon {...props} icon="currency-ghs" />}
        />
        
        <View style={styles.itemsContainer}>
          <Text style={styles.itemsLabel}>Items ({order.items.length}):</Text>
          {order.items.slice(0, 3).map((item, index) => (
            <Text key={index} style={styles.itemText}>
              • {item.name} - {item.quantity} x GH₵ {item.unitPrice.toFixed(2)}
            </Text>
          ))}
          {order.items.length > 3 && (
            <Text style={styles.moreItemsText}>+{order.items.length - 3} more items</Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <AdminOnly>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.pharmacyName}>JELPAPHARM</Text>
          <Text style={styles.pharmacySubtitle}>Pharmacy Management System</Text>
          <Title style={styles.headerTitle}>Supplier Management</Title>
          <SegmentedButtons
            value={selectedView}
            onValueChange={setSelectedView}
            buttons={[
              { value: 'suppliers', label: 'Suppliers' },
              { value: 'orders', label: 'Purchase Orders' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {selectedView === 'suppliers' && (
          <>
            <Searchbar
              placeholder="Search suppliers..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
            />
            
            <ScrollView
              style={styles.scrollView}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {filteredSuppliers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No suppliers found</Text>
                </View>
              ) : (
                filteredSuppliers.map(renderSupplierItem)
              )}
            </ScrollView>
          </>
        )}

        {selectedView === 'orders' && (
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {purchaseOrders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No purchase orders found</Text>
              </View>
            ) : (
              purchaseOrders.map(renderPurchaseOrderItem)
            )}
          </ScrollView>
        )}

        <Footer 
          customText="Supplier and purchase order management"
        />

        <CanCreate resource="suppliers">
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={handleAddSupplier}
            label={selectedView === 'suppliers' ? 'Add Supplier' : 'New Order'}
          />
        </CanCreate>

        <Portal>
          <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
            <Dialog.Title>
              {selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Supplier Name"
                value={selectedSupplier?.name || ''}
                onChangeText={(text) => setSelectedSupplier(prev => ({ ...prev, name: text }))}
                style={styles.input}
              />
              <TextInput
                label="Contact Person"
                value={selectedSupplier?.contactPerson || ''}
                onChangeText={(text) => setSelectedSupplier(prev => ({ ...prev, contactPerson: text }))}
                style={styles.input}
              />
              <TextInput
                label="Email"
                value={selectedSupplier?.email || ''}
                onChangeText={(text) => setSelectedSupplier(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                style={styles.input}
              />
              <TextInput
                label="Phone"
                value={selectedSupplier?.phone || ''}
                onChangeText={(text) => setSelectedSupplier(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
              <Button onPress={() => handleSaveSupplier(selectedSupplier || {})}>Save</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </AdminOnly>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: spacing.medium,
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
    marginBottom: spacing.medium,
  },
  segmentedButtons: {
    marginBottom: spacing.small,
  },
  searchbar: {
    margin: spacing.medium,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: spacing.medium,
    marginTop: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.small,
  },
  cardTitle: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: spacing.small,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  supplierDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.medium,
    paddingTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    marginTop: spacing.medium,
  },
  categoriesLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.small,
  },
  categoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    marginRight: spacing.small,
    marginBottom: spacing.small,
  },
  categoryText: {
    fontSize: 12,
  },
  itemsContainer: {
    marginTop: spacing.medium,
  },
  itemsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.small,
  },
  itemText: {
    fontSize: 12,
    marginBottom: 2,
  },
  moreItemsText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: theme.colors.secondary,
  },
  fab: {
    position: 'absolute',
    margin: spacing.medium,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.secondary,
  },
  input: {
    marginBottom: spacing.small,
  },
});

export default SupplierScreen;
