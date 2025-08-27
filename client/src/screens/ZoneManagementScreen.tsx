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
  ActivityIndicator,
  IconButton,
  Chip,
  FAB,
  Button,
  ProgressBar,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { theme, spacing, typography } from '../theme';
import api from '../config/api';

type ZoneManagementRouteProp = RouteProp<{
  ZoneManagement: { warehouseId: string };
}, 'ZoneManagement'>;

interface Zone {
  _id: string;
  name: string;
  code: string;
  zoneType: string;
  temperatureRange: { min: number; max: number };
  capacity: { total: number; used: number; available: number };
  securityLevel: string;
  isActive: boolean;
  utilizationPercentage: number;
}

const ZoneManagementScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ZoneManagementRouteProp>();
  const { warehouseId } = route.params;
  const { user } = useAuth();
  
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchZoneData();
  }, [warehouseId]);

  const fetchZoneData = async () => {
    try {
      const response = await api.get(`/api/zones/warehouse/${warehouseId}`);
      setZones(response.data.data);
    } catch (error) {
      console.error('Error fetching zone data:', error);
      Alert.alert('Error', 'Failed to load zone data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchZoneData();
    setRefreshing(false);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return theme.colors.error;
    if (percentage >= 75) return theme.colors.warning;
    return theme.colors.success;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading zone data...</Text>
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
        <View style={styles.header}>
          <Title style={styles.headerTitle}>Zone Management</Title>
          <Text style={styles.headerSubtitle}>
            Configure and monitor temperature zones
          </Text>
        </View>

        <View style={styles.zonesSection}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Zones</Title>
            <IconButton
              icon="plus"
              size={24}
              onPress={() => navigation.navigate('ZoneForm', { warehouseId })}
            />
          </View>

          {zones.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Text style={styles.emptyIcon}>🌡️</Text>
                <Title style={styles.emptyTitle}>No Zones Found</Title>
                <Text style={styles.emptyText}>
                  Create your first temperature zone
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('ZoneForm', { warehouseId })}
                  style={styles.emptyButton}
                >
                  Create Zone
                </Button>
              </Card.Content>
            </Card>
          ) : (
            zones.map((zone) => (
              <Card key={zone._id} style={styles.zoneCard}>
                <Card.Content>
                  <View style={styles.zoneHeader}>
                    <View style={styles.zoneInfo}>
                      <Title style={styles.zoneName}>{zone.name}</Title>
                      <Text style={styles.zoneCode}>Code: {zone.code}</Text>
                      <Text style={styles.zoneType}>
                        {zone.zoneType.charAt(0).toUpperCase() + zone.zoneType.slice(1)} Zone
                      </Text>
                    </View>
                    <View style={styles.zoneStatus}>
                      <Chip
                        mode="outlined"
                        style={[
                          styles.statusChip,
                          { backgroundColor: zone.isActive ? theme.colors.success : theme.colors.disabled }
                        ]}
                      >
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </Chip>
                    </View>
                  </View>

                  <View style={styles.capacitySection}>
                    <Text style={styles.capacityTitle}>Capacity Utilization</Text>
                    <View style={styles.capacityBar}>
                      <ProgressBar
                        progress={zone.utilizationPercentage / 100}
                        color={getUtilizationColor(zone.utilizationPercentage)}
                        style={styles.progressBar}
                      />
                      <Text style={styles.utilizationText}>
                        {zone.utilizationPercentage.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.capacityDetails}>
                      <Text style={styles.capacityText}>
                        Used: {zone.capacity.used.toLocaleString()} / {zone.capacity.total.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.zoneActions}>
                    <Button
                      mode="outlined"
                      onPress={() => navigation.navigate('RackLayout', { zoneId: zone._id })}
                      style={styles.actionButton}
                    >
                      Manage Racks
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => navigation.navigate('ZoneAnalytics', { zoneId: zone._id })}
                      style={styles.actionButton}
                    >
                      Analytics
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('ZoneForm', { warehouseId })}
        label="Add Zone"
      />
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
  zonesSection: {
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
  zoneCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: typography.h5.fontSize,
    fontWeight: typography.h5.fontWeight,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  zoneCode: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  zoneType: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.text,
  },
  zoneStatus: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: spacing.xs,
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
  zoneActions: {
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
});

export default ZoneManagementScreen;
