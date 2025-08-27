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
import { PharmacistOrAdmin, CanCreate, CanUpdate, CanDelete } from '../components/Common/PermissionGuard';
import { theme, spacing, typography } from '../theme';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';
import moment from 'moment';
import Footer from '../components/Layout/Footer';

interface Prescription {
  _id: string;
  prescriptionNumber: string;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  prescribedBy: string;
  doctorLicense: string;
  prescriptionDate: string;
  expiryDate: string;
  status: 'active' | 'dispensed' | 'expired' | 'cancelled';
  items: Array<{
    drug: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions: string;
    isDispensed: boolean;
  }>;
  diagnosis: string;
  allergies: string[];
  refills: number;
  refillsRemaining: number;
  createdAt: string;
}

const PrescriptionScreen: React.FC = () => {
  const { user } = useAuth();
  const permissions = usePermissions(user);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    filterPrescriptions();
  }, [prescriptions, searchQuery, selectedStatus]);

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/prescriptions`);
      setPrescriptions(response.data.data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      Alert.alert('Error', 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPrescriptions();
    setRefreshing(false);
  };

  const filterPrescriptions = () => {
    let filtered = prescriptions;
    
    if (searchQuery) {
      filtered = filtered.filter(prescription =>
        prescription.prescriptionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${prescription.customer.firstName} ${prescription.customer.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prescription.prescribedBy.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(prescription => prescription.status === selectedStatus);
    }
    
    setFilteredPrescriptions(filtered);
  };

  const handleAddPrescription = () => {
    setSelectedPrescription(null);
    setDialogVisible(true);
  };

  const handleEditPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setDialogVisible(true);
  };

  const handleDispensePrescription = async (prescriptionId: string) => {
    try {
      await axios.put(`${API_BASE_URL}/api/prescriptions/${prescriptionId}/dispense`);
      fetchPrescriptions();
      Alert.alert('Success', 'Prescription dispensed successfully');
    } catch (error) {
      console.error('Error dispensing prescription:', error);
      Alert.alert('Error', 'Failed to dispense prescription');
    }
  };

  const handleDeletePrescription = async (prescriptionId: string) => {
    Alert.alert(
      'Delete Prescription',
      'Are you sure you want to delete this prescription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/api/prescriptions/${prescriptionId}`);
              fetchPrescriptions();
              Alert.alert('Success', 'Prescription deleted successfully');
            } catch (error) {
              console.error('Error deleting prescription:', error);
              Alert.alert('Error', 'Failed to delete prescription');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return theme.colors.success;
      case 'dispensed':
        return theme.colors.primary;
      case 'expired':
        return theme.colors.error;
      case 'cancelled':
        return theme.colors.secondary;
      default:
        return theme.colors.text;
    }
  };

  const getStatusDisplay = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const isExpired = (expiryDate: string): boolean => {
    return moment(expiryDate).isBefore(moment());
  };

  const daysUntilExpiry = (expiryDate: string): number => {
    return moment(expiryDate).diff(moment(), 'days');
  };

  const renderPrescriptionItem = (prescription: Prescription) => {
    const expired = isExpired(prescription.expiryDate);
    const daysLeft = daysUntilExpiry(prescription.expiryDate);
    
    return (
      <Card key={prescription._id} style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <Title style={styles.title}>{prescription.prescriptionNumber}</Title>
              <Chip 
                mode="outlined" 
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(prescription.status) }
                ]}
              >
                {getStatusDisplay(prescription.status)}
              </Chip>
            </View>
            <Menu
              visible={menuVisible === prescription._id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(prescription._id)}
                />
              }
            >
              {prescription.status === 'active' && (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    handleDispensePrescription(prescription._id);
                  }}
                  title="Dispense"
                  leadingIcon="pill"
                />
              )}
              <CanUpdate resource="prescriptions">
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    handleEditPrescription(prescription);
                  }}
                  title="Edit"
                  leadingIcon="pencil"
                />
              </CanUpdate>
              <CanDelete resource="prescriptions">
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    handleDeletePrescription(prescription._id);
                  }}
                  title="Delete"
                  leadingIcon="delete"
                />
              </CanDelete>
            </Menu>
          </View>
          
          <List.Item
            title="Patient"
            description={`${prescription.customer.firstName} ${prescription.customer.lastName}`}
            left={props => <List.Icon {...props} icon="account" />}
          />
          
          <List.Item
            title="Prescribed By"
            description={`${prescription.prescribedBy} (${prescription.doctorLicense})`}
            left={props => <List.Icon {...props} icon="doctor" />}
          />
          
          <List.Item
            title="Prescription Date"
            description={moment(prescription.prescriptionDate).format('DD/MM/YYYY')}
            left={props => <List.Icon {...props} icon="calendar" />}
          />
          
          <List.Item
            title="Expiry Date"
            description={
              <View>
                <Text>{moment(prescription.expiryDate).format('DD/MM/YYYY')}</Text>
                {expired ? (
                  <Text style={styles.expiredText}>EXPIRED</Text>
                ) : daysLeft <= 7 ? (
                  <Text style={styles.expiringText}>Expires in {daysLeft} days</Text>
                ) : null}
              </View>
            }
            left={props => <List.Icon {...props} icon="clock-outline" />}
          />
          
          <List.Item
            title="Diagnosis"
            description={prescription.diagnosis}
            left={props => <List.Icon {...props} icon="stethoscope" />}
          />
          
          <View style={styles.itemsContainer}>
            <Text style={styles.itemsLabel}>Medications ({prescription.items.length}):</Text>
            {prescription.items.map((item, index) => (
              <View key={index} style={styles.medicationItem}>
                <Text style={styles.medicationName}>{item.name}</Text>
                <Text style={styles.medicationDetails}>
                  {item.dosage} • {item.frequency} • {item.duration}
                </Text>
                <Text style={styles.medicationInstructions}>{item.instructions}</Text>
                <View style={styles.medicationStatus}>
                  <Text style={styles.quantityText}>Qty: {item.quantity}</Text>
                  {item.isDispensed && (
                    <Chip style={styles.dispensedChip} textStyle={styles.dispensedText}>
                      DISPENSED
                    </Chip>
                  )}
                </View>
              </View>
            ))}
          </View>
          
          {prescription.allergies.length > 0 && (
            <View style={styles.allergiesContainer}>
              <Text style={styles.allergiesLabel}>Allergies:</Text>
              <View style={styles.allergiesList}>
                {prescription.allergies.map((allergy, index) => (
                  <Chip key={index} style={styles.allergyChip} textStyle={styles.allergyText}>
                    {allergy}
                  </Chip>
                ))}
              </View>
            </View>
          )}
          
          <View style={styles.refillsContainer}>
            <Text style={styles.refillsLabel}>Refills:</Text>
            <Text style={styles.refillsText}>
              {prescription.refillsRemaining} of {prescription.refills} remaining
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <PharmacistOrAdmin>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.pharmacyName}>JELPAPHARM</Text>
          <Text style={styles.pharmacySubtitle}>Pharmacy Management System</Text>
          <Title style={styles.headerTitle}>Prescription Management</Title>
          <SegmentedButtons
            value={selectedStatus}
            onValueChange={setSelectedStatus}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'dispensed', label: 'Dispensed' },
              { value: 'expired', label: 'Expired' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        <Searchbar
          placeholder="Search prescriptions..."
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
          {filteredPrescriptions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No prescriptions found</Text>
            </View>
                      ) : (
              filteredPrescriptions.map(renderPrescriptionItem)
            )}
          </ScrollView>

          <Footer 
            customText="Prescription management with medication tracking"
          />

          <CanCreate resource="prescriptions">
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={handleAddPrescription}
            label="New Prescription"
          />
        </CanCreate>

        <Portal>
          <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
            <Dialog.Title>
              {selectedPrescription ? 'Edit Prescription' : 'Add New Prescription'}
            </Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Patient Name"
                value={selectedPrescription ? `${selectedPrescription.customer.firstName} ${selectedPrescription.customer.lastName}` : ''}
                style={styles.input}
              />
              <TextInput
                label="Prescribed By"
                value={selectedPrescription?.prescribedBy || ''}
                onChangeText={(text) => setSelectedPrescription(prev => ({ ...prev, prescribedBy: text }))}
                style={styles.input}
              />
              <TextInput
                label="Doctor License"
                value={selectedPrescription?.doctorLicense || ''}
                onChangeText={(text) => setSelectedPrescription(prev => ({ ...prev, doctorLicense: text }))}
                style={styles.input}
              />
              <TextInput
                label="Diagnosis"
                value={selectedPrescription?.diagnosis || ''}
                onChangeText={(text) => setSelectedPrescription(prev => ({ ...prev, diagnosis: text }))}
                multiline
                style={styles.input}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
              <Button onPress={() => setDialogVisible(false)}>Save</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </PharmacistOrAdmin>
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
  expiredText: {
    color: theme.colors.error,
    fontWeight: 'bold',
    fontSize: 12,
  },
  expiringText: {
    color: theme.colors.warning,
    fontWeight: 'bold',
    fontSize: 12,
  },
  itemsContainer: {
    marginTop: spacing.medium,
  },
  itemsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.small,
  },
  medicationItem: {
    marginBottom: spacing.medium,
    padding: spacing.small,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  medicationName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  medicationDetails: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  medicationInstructions: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  medicationStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dispensedChip: {
    backgroundColor: theme.colors.success,
  },
  dispensedText: {
    fontSize: 10,
    color: 'white',
  },
  allergiesContainer: {
    marginTop: spacing.medium,
  },
  allergiesLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.small,
    color: theme.colors.error,
  },
  allergiesList: {
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
  refillsContainer: {
    marginTop: spacing.medium,
    paddingTop: spacing.small,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  refillsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  refillsText: {
    fontSize: 12,
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

export default PrescriptionScreen;
