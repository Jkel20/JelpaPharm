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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { theme, spacing, typography } from '../theme';
import api from '../config/api';

interface Rack {
  _id: string;
  name: string;
  code: string;
  rackType: string;
  capacity: {
    totalSlots: number;
    usedSlots: number;
    availableSlots: number;
  };
  isActive: boolean;
  utilizationPercentage: number;
  shelves: Shelf[];
}

interface Shelf {
  _id: string;
  name: string;
  shelfNumber: number;
  capacity: {
    totalSlots: number;
    usedSlots: number;
    availableSlots: number;
  };
  utilizationPercentage: number;
  cleaningStatus: string;
}

const RackLayoutScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { zoneId } = route.params as { zoneId: string };
  const { user } = useAuth();
  
  const [racks, setRacks] = useState<Rack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRackData();
  }, [zoneId]);

  const fetchRackData = async () => {
    try {
      const response = await api.get(`/api/racks/zone/${zoneId}`);
      setRacks(response.data.data);
    } catch (error) {
      console.error('Error fetching rack data:', error);
      Alert.alert('Error', 'Failed to load rack data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRackData();
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
        <Text style={styles.loadingText}>Loading rack layout...</Text>
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
          <Title style={styles.headerTitle}>Rack Layout</Title>
          <Text style={styles.headerSubtitle}>
            Visual rack layout with real-time capacity monitoring
          </Text>
        </View>

        <View style={styles.racksSection}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Racks</Title>
            <IconButton
              icon="plus"
              size={24}
              onPress={() => navigation.navigate('RackForm', { zoneId })}
            />
          </View>

          {racks.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Title style={styles.emptyTitle}>No Racks Found</Title>
                <Text style={styles.emptyText}>
                  Create your first rack in this zone
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('RackForm', { zoneId })}
                  style={styles.emptyButton}
                >
                  Create Rack
                </Button>
              </Card.Content>
            </Card>
          ) : (
            racks.map((rack) => (
              <Card key={rack._id} style={styles.rackCard}>
                <Card.Content>
                  <View style={styles.rackHeader}>
                    <View style={styles.rackInfo}>
                      <Title style={styles.rackName}>{rack.name}</Title>
                      <Text style={styles.rackCode}>Code: {rack.code}</Text>
                      <Text style={styles.rackType}>
                        {rack.rackType.charAt(0).toUpperCase() + rack.rackType.slice(1)} Rack
                      </Text>
                    </View>
                    <View style={styles.rackStatus}>
                      <Chip
                        mode="outlined"
                        style={[
                          styles.statusChip,
                          { backgroundColor: rack.isActive ? theme.colors.success : theme.colors.disabled }
                        ]}
                      >
                        {rack.isActive ? 'Active' : 'Inactive'}
                      </Chip>
                    </View>
                  </View>

                  <View style={styles.capacitySection}>
                    <Text style={styles.capacityTitle}>Slot Utilization</Text>
                    <View style={styles.capacityBar}>
                      <ProgressBar
                        progress={rack.utilizationPercentage / 100}
                        color={getUtilizationColor(rack.utilizationPercentage)}
                        style={styles.progressBar}
                      />
                      <Text style={styles.utilizationText}>
                        {rack.utilizationPercentage.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.capacityDetails}>
                      <Text style={styles.capacityText}>
                        Slots: {rack.capacity.usedSlots}/{rack.capacity.totalSlots}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rackActions}>
                    <Button
                      mode="outlined"
                      onPress={() => navigation.navigate('ShelfManagement', { rackId: rack._id })}
                      style={styles.actionButton}
                    >
                      Manage Shelves
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => navigation.navigate('RackAnalytics', { rackId: rack._id })}
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
        onPress={() => navigation.navigate('RackForm', { zoneId })}
        label="Add Rack"
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
  racksSection: {
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
  rackCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  rackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  rackInfo: {
    flex: 1,
  },
  rackName: {
    fontSize: typography.h5.fontSize,
    fontWeight: typography.h5.fontWeight,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  rackCode: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  rackType: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.text,
  },
  rackStatus: {
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
  rackActions: {
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

export default RackLayoutScreen;
