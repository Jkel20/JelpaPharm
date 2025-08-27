import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  IconButton,
  Chip,
  FAB,
  Portal,
  Dialog,
  Button,
  ProgressBar,
  List,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../utils/permissions';
import { theme, spacing, typography } from '../theme';
import { API_BASE_URL, apiHelpers } from '../config/api';
import api from '../config/api';
import moment from 'moment';

const { width } = Dimensions.get('window');

interface Warehouse {
  _id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  region: string;
  capacity: {
    total: number;
    used: number;
    available: number;
  };
  temperatureZones: string[];
  securityLevel: 'low' | 'medium' | 'high';
  isActive: boolean;
  utilizationPercentage: number;
  zones: Zone[];
}

interface Zone {
  _id: string;
  name: string;
  code: string;
  zoneType: string;
  capacity: {
    total: number;
    used: number;
    available: number;
  };
  utilizationPercentage: number;
  racks: Rack[];
}

interface Rack {
  _id: string;
  name: string;
  code: string;
  rackType: string;
  capacity: {
    totalSlots: number;
    usedSlots: number;
    availableSlots: number;
    totalWeight: number;
    usedWeight: number;
    availableWeight: number;
  };
  utilizationPercentage: number;
  shelves: Shelf[];
}

interface Shelf {
  _id: string;
  name: string;
  code: string;
  shelfNumber: number;
  capacity: {
    totalSlots: number;
    usedSlots: number;
    availableSlots: number;
    totalWeight: number;
    usedWeight: number;
    availableWeight: number;
  };
  utilizationPercentage: number;
  cleaningStatus: 'clean' | 'needs_cleaning' | 'overdue';
  nextCleaningDate: string;
}

interface WarehouseStats {
  totalWarehouses: number;
  activeWarehouses: number;
  totalCapacity: number;
  totalUsed: number;
  totalAvailable: number;
  averageUtilization: number;
  criticalWarehouses: number;
  maintenanceDue: number;
}

const WarehouseDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const permissions = usePermissions(user);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stats, setStats] = useState<WarehouseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [showWarehouseDetails, setShowWarehouseDetails] = useState(false);

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const fetchWarehouseData = async () => {
    try {
      const [warehousesResponse, statsResponse] = await Promise.all([
        api.get('/api/warehouses'),
        api.get('/api/warehouses/stats'),
      ]);
      
      setWarehouses(warehousesResponse.data.data);
      setStats(statsResponse.data.data);
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
      Alert.alert('Error', 'Failed to load warehouse data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWarehouseData();
    setRefreshing(false);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return theme.colors.error;
    if (percentage >= 75) return theme.colors.warning;
    return theme.colors.success;
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.success;
      default: return theme.colors.disabled;
    }
  };

  const getCleaningStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return theme.colors.error;
      case 'needs_cleaning': return theme.colors.warning;
      case 'clean': return theme.colors.success;
      default: return theme.colors.disabled;
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
    icon: string;
  }> = ({ title, value, subtitle, color, icon }) => (
    <Card style={[styles.statCard, { borderLeftColor: color }]}>
      <Card.Content style={styles.statCardContent}>
        <View style={styles.statHeader}>
          <Text style={[styles.statIcon, { color }]}>{icon}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </Card.Content>
    </Card>
  );

  const WarehouseCard: React.FC<{ warehouse: Warehouse }> = ({ warehouse }) => (
    <Card style={styles.warehouseCard}>
      <Card.Content>
        <View style={styles.warehouseHeader}>
          <View style={styles.warehouseInfo}>
            <Title style={styles.warehouseName}>{warehouse.name}</Title>
            <Text style={styles.warehouseCode}>Code: {warehouse.code}</Text>
            <Text style={styles.warehouseLocation}>
              {warehouse.city}, {warehouse.region}
            </Text>
          </View>
          <View style={styles.warehouseStatus}>
            <Chip
              mode="outlined"
              style={[
                styles.statusChip,
                { backgroundColor: warehouse.isActive ? theme.colors.success : theme.colors.disabled }
              ]}
            >
              {warehouse.isActive ? 'Active' : 'Inactive'}
            </Chip>
            <Chip
              mode="outlined"
              style={[
                styles.securityChip,
                { borderColor: getSecurityLevelColor(warehouse.securityLevel) }
              ]}
              textStyle={{ color: getSecurityLevelColor(warehouse.securityLevel) }}
            >
              {warehouse.securityLevel.toUpperCase()}
            </Chip>
          </View>
        </View>

        <View style={styles.capacitySection}>
          <Text style={styles.capacityTitle}>Capacity Utilization</Text>
          <View style={styles.capacityBar}>
            <ProgressBar
              progress={warehouse.utilizationPercentage / 100}
              color={getUtilizationColor(warehouse.utilizationPercentage)}
              style={styles.progressBar}
            />
            <Text style={styles.utilizationText}>
              {warehouse.utilizationPercentage.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.capacityDetails}>
            <Text style={styles.capacityText}>
              Used: {warehouse.capacity.used.toLocaleString()} / {warehouse.capacity.total.toLocaleString()}
            </Text>
            <Text style={styles.capacityText}>
              Available: {warehouse.capacity.available.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.temperatureZones}>
          <Text style={styles.zonesTitle}>Temperature Zones:</Text>
          <View style={styles.zonesContainer}>
            {warehouse.temperatureZones.map((zone, index) => (
              <Chip key={index} mode="outlined" style={styles.zoneChip}>
                {zone}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.warehouseActions}>
          <Button
            mode="outlined"
            onPress={() => {
              setSelectedWarehouse(warehouse);
              setShowWarehouseDetails(true);
            }}
            style={styles.actionButton}
          >
            View Details
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('ZoneManagement', { warehouseId: warehouse._id })}
            style={styles.actionButton}
          >
            Manage Zones
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('WarehouseAnalytics', { warehouseId: warehouse._id })}
            style={styles.actionButton}
          >
            Analytics
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading warehouse data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Title style={styles.headerTitle}>Warehouse Management</Title>
          <Text style={styles.headerSubtitle}>
            Manage your warehouse infrastructure and monitor capacity utilization
          </Text>
        </View>

        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <StatCard
              title="Total Warehouses"
              value={stats.totalWarehouses}
              subtitle={`${stats.activeWarehouses} active`}
              color={theme.colors.primary}
              icon="🏭"
            />
            <StatCard
              title="Total Capacity"
              value={`${stats.totalCapacity.toLocaleString()}`}
              subtitle={`${stats.totalUsed.toLocaleString()} used`}
              color={theme.colors.info}
              icon="📦"
            />
            <StatCard
              title="Avg Utilization"
              value={`${stats.averageUtilization.toFixed(1)}%`}
              subtitle={`${stats.criticalWarehouses} critical`}
              color={theme.colors.warning}
              icon="📊"
            />
            <StatCard
              title="Maintenance Due"
              value={stats.maintenanceDue}
              subtitle="shelves need cleaning"
              color={theme.colors.error}
              icon="🧹"
            />
          </View>
        )}

        {/* Warehouses List */}
        <View style={styles.warehousesSection}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Warehouses</Title>
            <IconButton
              icon="plus"
              size={24}
              onPress={() => navigation.navigate('WarehouseForm')}
            />
          </View>

          {warehouses.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Text style={styles.emptyIcon}>🏭</Text>
                <Title style={styles.emptyTitle}>No Warehouses Found</Title>
                <Text style={styles.emptyText}>
                  Get started by creating your first warehouse
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('WarehouseForm')}
                  style={styles.emptyButton}
                >
                  Create Warehouse
                </Button>
              </Card.Content>
            </Card>
          ) : (
            warehouses.map((warehouse) => (
              <WarehouseCard key={warehouse._id} warehouse={warehouse} />
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('WarehouseForm')}
        label="Add Warehouse"
      />

      {/* Warehouse Details Dialog */}
      <Portal>
        <Dialog
          visible={showWarehouseDetails}
          onDismiss={() => setShowWarehouseDetails(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Warehouse Details</Dialog.Title>
          <Dialog.Content>
            {selectedWarehouse && (
              <ScrollView>
                <List.Section>
                  <List.Subheader>Basic Information</List.Subheader>
                  <List.Item
                    title="Name"
                    description={selectedWarehouse.name}
                    left={(props) => <List.Icon {...props} icon="warehouse" />}
                  />
                  <List.Item
                    title="Code"
                    description={selectedWarehouse.code}
                    left={(props) => <List.Icon {...props} icon="tag" />}
                  />
                  <List.Item
                    title="Address"
                    description={selectedWarehouse.address}
                    left={(props) => <List.Icon {...props} icon="map-marker" />}
                  />
                  <List.Item
                    title="Location"
                    description={`${selectedWarehouse.city}, ${selectedWarehouse.region}`}
                    left={(props) => <List.Icon {...props} icon="city" />}
                  />
                </List.Section>

                <Divider />

                <List.Section>
                  <List.Subheader>Capacity Information</List.Subheader>
                  <List.Item
                    title="Total Capacity"
                    description={selectedWarehouse.capacity.total.toLocaleString()}
                    left={(props) => <List.Icon {...props} icon="package-variant" />}
                  />
                  <List.Item
                    title="Used Space"
                    description={selectedWarehouse.capacity.used.toLocaleString()}
                    left={(props) => <List.Icon {...props} icon="package-variant-closed" />}
                  />
                  <List.Item
                    title="Available Space"
                    description={selectedWarehouse.capacity.available.toLocaleString()}
                    left={(props) => <List.Icon {...props} icon="package-variant-plus" />}
                  />
                  <List.Item
                    title="Utilization"
                    description={`${selectedWarehouse.utilizationPercentage.toFixed(1)}%`}
                    left={(props) => <List.Icon {...props} icon="chart-line" />}
                  />
                </List.Section>

                <Divider />

                <List.Section>
                  <List.Subheader>Zones & Racks</List.Subheader>
                  {selectedWarehouse.zones?.map((zone) => (
                    <List.Item
                      key={zone._id}
                      title={zone.name}
                      description={`${zone.racks?.length || 0} racks • ${zone.utilizationPercentage.toFixed(1)}% utilized`}
                      left={(props) => <List.Icon {...props} icon="view-grid" />}
                    />
                  ))}
                </List.Section>
              </ScrollView>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowWarehouseDetails(false)}>Close</Button>
            <Button
              mode="contained"
              onPress={() => {
                setShowWarehouseDetails(false);
                navigation.navigate('WarehouseForm', { warehouse: selectedWarehouse });
              }}
            >
              Edit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: width * 0.4,
    borderLeftWidth: 4,
    marginBottom: spacing.sm,
  },
  statCardContent: {
    padding: spacing.sm,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  statTitle: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
    flex: 1,
  },
  statValue: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    marginBottom: spacing.xs,
  },
  statSubtitle: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.text,
    opacity: 0.6,
  },
  warehousesSection: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: theme.colors.primary,
  },
  warehouseCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  warehouseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  warehouseInfo: {
    flex: 1,
  },
  warehouseName: {
    fontSize: typography.h5.fontSize,
    fontWeight: typography.h5.fontWeight,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  warehouseCode: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  warehouseLocation: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.text,
  },
  warehouseStatus: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: spacing.xs,
  },
  securityChip: {
    borderWidth: 1,
  },
  capacitySection: {
    marginBottom: spacing.md,
  },
  capacityTitle: {
    fontSize: typography.body2.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  capacityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  utilizationText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  capacityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  capacityText: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
  },
  temperatureZones: {
    marginBottom: spacing.md,
  },
  zonesTitle: {
    fontSize: typography.body2.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  zonesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  zoneChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  warehouseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  emptyCard: {
    marginTop: spacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  dialog: {
    maxHeight: '80%',
  },
});

export default WarehouseDashboardScreen;
