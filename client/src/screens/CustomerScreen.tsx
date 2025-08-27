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
  Avatar,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../utils/permissions';
import { CashierOrHigher, CanCreate, CanUpdate, CanDelete } from '../components/Common/PermissionGuard';
import { theme, spacing, typography } from '../theme';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';
import moment from 'moment';
import Footer from '../components/Layout/Footer';

interface Customer {
  _id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender: 'male' | 'female' | 'other';
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory: {
    allergies: string[];
    chronicConditions: string[];
    currentMedications: string[];
    notes: string;
  };
  loyaltyProgram: {
    memberSince: string;
    points: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    totalSpent: number;
    totalPurchases: number;
    lastPurchaseDate?: string;
  };
  preferences: {
    preferredPaymentMethod: 'cash' | 'mobile_money' | 'card' | 'bank_transfer';
    marketingConsent: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
  };
  isActive: boolean;
  createdAt: string;
}

interface LoyaltyTransaction {
  _id: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus';
  points: number;
  description: string;
  transactionDate: string;
  expiryDate?: string;
}

const CustomerScreen: React.FC = () => {
  const { user } = useAuth();
  const permissions = usePermissions(user);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState<'customers' | 'loyalty'>('customers');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchQuery]);

  const fetchData = async () => {
    try {
      if (selectedView === 'customers') {
        const response = await axios.get(`${API_BASE_URL}/api/customers`);
        setCustomers(response.data.data);
      } else {
        const response = await axios.get(`${API_BASE_URL}/api/loyalty-transactions`);
        setLoyaltyTransactions(response.data.data);
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

  const filterCustomers = () => {
    let filtered = customers;
    
    if (searchQuery) {
      filtered = filtered.filter(customer =>
        customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.customerId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredCustomers(filtered);
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setDialogVisible(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDialogVisible(true);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    Alert.alert(
      'Delete Customer',
      'Are you sure you want to delete this customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/api/customers/${customerId}`);
              fetchData();
              Alert.alert('Success', 'Customer deleted successfully');
            } catch (error) {
              console.error('Error deleting customer:', error);
              Alert.alert('Error', 'Failed to delete customer');
            }
          },
        },
      ]
    );
  };

  const handleSaveCustomer = async (customerData: Partial<Customer>) => {
    try {
      if (selectedCustomer) {
        await axios.put(`${API_BASE_URL}/api/customers/${selectedCustomer._id}`, customerData);
      } else {
        await axios.post(`${API_BASE_URL}/api/customers`, customerData);
      }
      setDialogVisible(false);
      fetchData();
      Alert.alert('Success', 'Customer saved successfully');
    } catch (error) {
      console.error('Error saving customer:', error);
      Alert.alert('Error', 'Failed to save customer');
    }
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'bronze':
        return '#CD7F32';
      case 'silver':
        return '#C0C0C0';
      case 'gold':
        return '#FFD700';
      case 'platinum':
        return '#E5E4E2';
      default:
        return theme.colors.primary;
    }
  };

  const getTierBenefits = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return { discount: 0, pointsMultiplier: 1 };
      case 'silver':
        return { discount: 5, pointsMultiplier: 1.2 };
      case 'gold':
        return { discount: 10, pointsMultiplier: 1.5 };
      case 'platinum':
        return { discount: 15, pointsMultiplier: 2 };
      default:
        return { discount: 0, pointsMultiplier: 1 };
    }
  };

  const renderCustomerItem = (customer: Customer) => {
    const benefits = getTierBenefits(customer.loyaltyProgram.tier);
    
    return (
      <Card key={customer._id} style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.customerInfo}>
              <Avatar.Text 
                size={50} 
                label={`${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`}
                style={{ backgroundColor: getTierColor(customer.loyaltyProgram.tier) }}
              />
              <View style={styles.customerDetails}>
                <Title style={styles.title}>{customer.firstName} {customer.lastName}</Title>
                <Text style={styles.customerId}>{customer.customerId}</Text>
                <Chip 
                  mode="outlined" 
                  style={[
                    styles.tierChip,
                    { backgroundColor: getTierColor(customer.loyaltyProgram.tier) }
                  ]}
                  textStyle={{ color: 'white', fontWeight: 'bold' }}
                >
                  {customer.loyaltyProgram.tier.toUpperCase()}
                </Chip>
              </View>
            </View>
            <Menu
              visible={menuVisible === customer._id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(customer._id)}
                />
              }
            >
              <CanUpdate resource="customers">
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    handleEditCustomer(customer);
                  }}
                  title="Edit"
                  leadingIcon="pencil"
                />
              </CanUpdate>
              <CanDelete resource="customers">
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    handleDeleteCustomer(customer._id);
                  }}
                  title="Delete"
                  leadingIcon="delete"
                />
              </CanDelete>
            </Menu>
          </View>
          
          <List.Item
            title="Contact"
            description={`${customer.phone}${customer.email ? ` • ${customer.email}` : ''}`}
            left={props => <List.Icon {...props} icon="phone" />}
          />
          
          <List.Item
            title="Address"
            description={`${customer.address.street}, ${customer.address.city}, ${customer.address.region}`}
            left={props => <List.Icon {...props} icon="map-marker" />}
          />
          
          <View style={styles.loyaltySection}>
            <Text style={styles.loyaltyTitle}>Loyalty Program</Text>
            <View style={styles.loyaltyDetails}>
              <View style={styles.loyaltyItem}>
                <Text style={styles.loyaltyLabel}>Points</Text>
                <Text style={styles.loyaltyValue}>{customer.loyaltyProgram.points}</Text>
              </View>
              <View style={styles.loyaltyItem}>
                <Text style={styles.loyaltyLabel}>Total Spent</Text>
                <Text style={styles.loyaltyValue}>GH₵ {customer.loyaltyProgram.totalSpent.toFixed(2)}</Text>
              </View>
              <View style={styles.loyaltyItem}>
                <Text style={styles.loyaltyLabel}>Purchases</Text>
                <Text style={styles.loyaltyValue}>{customer.loyaltyProgram.totalPurchases}</Text>
              </View>
            </View>
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsLabel}>Benefits:</Text>
              <Text style={styles.benefitsText}>
                {benefits.discount}% discount • {benefits.pointsMultiplier}x points
              </Text>
            </View>
          </View>
          
          {customer.medicalHistory.allergies.length > 0 && (
            <View style={styles.medicalSection}>
              <Text style={styles.medicalTitle}>Medical Alerts</Text>
              <View style={styles.allergiesContainer}>
                {customer.medicalHistory.allergies.map((allergy, index) => (
                  <Chip key={index} style={styles.allergyChip} textStyle={styles.allergyText}>
                    {allergy}
                  </Chip>
                ))}
              </View>
            </View>
          )}
          
          {customer.loyaltyProgram.lastPurchaseDate && (
            <Text style={styles.lastPurchaseText}>
              Last Purchase: {moment(customer.loyaltyProgram.lastPurchaseDate).format('DD/MM/YYYY')}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderLoyaltyTransactionItem = (transaction: LoyaltyTransaction) => (
    <Card key={transaction._id} style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Title style={styles.title}>{transaction.description}</Title>
            <Chip 
              mode="outlined" 
              style={[
                styles.transactionChip,
                { 
                  backgroundColor: transaction.type === 'earned' ? theme.colors.success : 
                                 transaction.type === 'redeemed' ? theme.colors.warning :
                                 theme.colors.error 
                }
              ]}
            >
              {transaction.type.toUpperCase()}
            </Chip>
          </View>
        </View>
        
        <List.Item
          title="Points"
          description={`${transaction.type === 'earned' ? '+' : '-'}${transaction.points} points`}
          left={props => <List.Icon {...props} icon="star" />}
        />
        
        <List.Item
          title="Date"
          description={moment(transaction.transactionDate).format('DD/MM/YYYY HH:mm')}
          left={props => <List.Icon {...props} icon="calendar" />}
        />
        
        {transaction.expiryDate && (
          <List.Item
            title="Expires"
            description={moment(transaction.expiryDate).format('DD/MM/YYYY')}
            left={props => <List.Icon {...props} icon="clock-outline" />}
          />
        )}
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
    <CashierOrHigher>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.pharmacyName}>JELPAPHARM</Text>
          <Text style={styles.pharmacySubtitle}>Pharmacy Management System</Text>
          <Title style={styles.headerTitle}>Customer Management</Title>
          <SegmentedButtons
            value={selectedView}
            onValueChange={setSelectedView}
            buttons={[
              { value: 'customers', label: 'Customers' },
              { value: 'loyalty', label: 'Loyalty' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {selectedView === 'customers' && (
          <>
            <Searchbar
              placeholder="Search customers..."
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
              {filteredCustomers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No customers found</Text>
                </View>
              ) : (
                filteredCustomers.map(renderCustomerItem)
              )}
            </ScrollView>
          </>
        )}

        {selectedView === 'loyalty' && (
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {loyaltyTransactions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No loyalty transactions found</Text>
              </View>
            ) : (
              loyaltyTransactions.map(renderLoyaltyTransactionItem)
            )}
          </ScrollView>
        )}

        <Footer 
          customText="Customer and loyalty program management"
        />

        <CanCreate resource="customers">
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={handleAddCustomer}
            label={selectedView === 'customers' ? 'Add Customer' : 'New Transaction'}
          />
        </CanCreate>

        <Portal>
          <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
            <Dialog.Title>
              {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
            </Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="First Name"
                value={selectedCustomer?.firstName || ''}
                onChangeText={(text) => setSelectedCustomer(prev => ({ ...prev, firstName: text }))}
                style={styles.input}
              />
              <TextInput
                label="Last Name"
                value={selectedCustomer?.lastName || ''}
                onChangeText={(text) => setSelectedCustomer(prev => ({ ...prev, lastName: text }))}
                style={styles.input}
              />
              <TextInput
                label="Phone"
                value={selectedCustomer?.phone || ''}
                onChangeText={(text) => setSelectedCustomer(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
                style={styles.input}
              />
              <TextInput
                label="Email"
                value={selectedCustomer?.email || ''}
                onChangeText={(text) => setSelectedCustomer(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                style={styles.input}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
              <Button onPress={() => handleSaveCustomer(selectedCustomer || {})}>Save</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </CashierOrHigher>
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
  customerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  customerDetails: {
    marginLeft: spacing.medium,
    flex: 1,
  },
  cardTitle: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: spacing.small,
  },
  customerId: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginBottom: spacing.small,
  },
  tierChip: {
    alignSelf: 'flex-start',
  },
  transactionChip: {
    alignSelf: 'flex-start',
  },
  loyaltySection: {
    marginTop: spacing.medium,
    paddingTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  loyaltyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.small,
  },
  loyaltyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.small,
  },
  loyaltyItem: {
    alignItems: 'center',
  },
  loyaltyLabel: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginBottom: 2,
  },
  loyaltyValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  benefitsContainer: {
    marginTop: spacing.small,
  },
  benefitsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  benefitsText: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  medicalSection: {
    marginTop: spacing.medium,
  },
  medicalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.small,
    color: theme.colors.error,
  },
  allergiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  allergyChip: {
    marginRight: spacing.small,
    marginBottom: spacing.small,
    backgroundColor: theme.colors.error,
  },
  allergyText: {
    fontSize: 12,
    color: 'white',
  },
  lastPurchaseText: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: spacing.small,
    fontStyle: 'italic',
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

export default CustomerScreen;
