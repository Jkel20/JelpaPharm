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

interface Shelf {
  _id: string;
  name: string;
  code: string;
  shelfNumber: number;
  shelfType: string;
  capacity: {
    totalSlots: number;
    usedSlots: number;
    availableSlots: number;
    totalWeight: number;
    usedWeight: number;
    availableWeight: number;
  };
  isActive: boolean;
  utilizationPercentage: number;
  cleaningStatus: 'clean' | 'needs_cleaning' | 'overdue';
  lastCleaned: string;
  nextCleaningDate: string;
}

const ShelfManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { rackId } = route.params as { rackId: string };
  const { user } = useAuth();
  
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchShelfData();
  }, [rackId]);

  const fetchShelfData = async () => {
    try {
      const response = await api.get(`/api/shelves/rack/${rackId}`);
      setShelves(response.data.data);
    } catch (error) {
      console.error('Error fetching shelf data:', error);
      Alert.alert('Error', 'Failed to load shelf data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShelfData();
    setRefreshing(false);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return theme.colors.error;
    if (percentage >= 75) return theme.colors.warning;
    return theme.colors.success;
  };

  const getCleaningStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return theme.colors.error;
      case 'needs_cleaning': return theme.colors.warning;
      case 'clean': return theme.colors.success;
      default: return theme.colors.disabled;
    }
  };

  const getCleaningStatusText = (status: string) => {
    switch (status) {
      case 'overdue': return 'Overdue';
      case 'needs_cleaning': return 'Needs Cleaning';
      case 'clean': return 'Clean';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading shelf data...</Text>
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
          <Title style={styles.headerTitle}>Shelf Management</Title>
          <Text style={styles.headerSubtitle}>
            Individual shelf operations and cleaning schedules
          </Text>
        </View>

        <View style={styles.shelvesSection}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Shelves</Title>
            <IconButton
              icon="plus"
              size={24}
              onPress={() => navigation.navigate('ShelfForm', { rackId })}
            />
          </View>

          {shelves.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Text style={styles.emptyIcon}>📚</Text>
                <Title style={styles.emptyTitle}>No Shelves Found</Title>
                <Text style={styles.emptyText}>
                  Create your first shelf in this rack
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('ShelfForm', { rackId })}
                  style={styles.emptyButton}
                >
                  Create Shelf
                </Button>
              </Card.Content>
            </Card>
          ) : (
            shelves.map((shelf) => (
              <Card key={shelf._id} style={styles.shelfCard}>
                <Card.Content>
                  <View style={styles.shelfHeader}>
                    <View style={styles.shelfInfo}>
                      <Title style={styles.shelfName}>{shelf.name}</Title>
                      <Text style={styles.shelfCode}>Code: {shelf.code}</Text>
                      <Text style={styles.shelfType}>
                        Shelf {shelf.shelfNumber} - {shelf.shelfType}
                      </Text>
                    </View>
                    <View style={styles.shelfStatus}>
                      <Chip
                        mode="outlined"
                        style={[
                          styles.statusChip,
                          { backgroundColor: shelf.isActive ? theme.colors.success : theme.colors.disabled }
                        ]}
                      >
                        {shelf.isActive ? 'Active' : 'Inactive'}
                      </Chip>
                      <Chip
                        mode="outlined"
                        style={[
                          styles.cleaningChip,
                          { borderColor: getCleaningStatusColor(shelf.cleaningStatus) }
                        ]}
                        textStyle={{ color: getCleaningStatusColor(shelf.cleaningStatus) }}
                      >
                        {getCleaningStatusText(shelf.cleaningStatus)}
                      </Chip>
                    </View>
                  </View>

                  <View style={styles.capacitySection}>
                    <Text style={styles.capacityTitle}>Capacity Utilization</Text>
                    <View style={styles.capacityBar}>
                      <ProgressBar
                        progress={shelf.utilizationPercentage / 100}
                        color={getUtilizationColor(shelf.utilizationPercentage)}
                        style={styles.progressBar}
                      />
                      <Text style={styles.utilizationText}>
                        {shelf.utilizationPercentage.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.capacityDetails}>
                      <Text style={styles.capacityText}>
                        Slots: {shelf.capacity.usedSlots}/{shelf.capacity.totalSlots}
                      </Text>
                      <Text style={styles.capacityText}>
                        Weight: {shelf.capacity.usedWeight.toFixed(1)}/{shelf.capacity.totalWeight.toFixed(1)} kg
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cleaningSection}>
                    <Text style={styles.cleaningTitle}>Cleaning Schedule</Text>
                    <View style={styles.cleaningInfo}>
                      <Text style={styles.cleaningText}>
                        Last Cleaned: {new Date(shelf.lastCleaned).toLocaleDateString()}
                      </Text>
                      <Text style={styles.cleaningText}>
                        Next Cleaning: {new Date(shelf.nextCleaningDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.shelfActions}>
                    <Button
                      mode="outlined"
                      onPress={() => navigation.navigate('InventoryPlacement', { shelfId: shelf._id })}
                      style={styles.actionButton}
                    >
                      Place Items
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => navigation.navigate('ShelfAnalytics', { shelfId: shelf._id })}
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
        onPress={() => navigation.navigate('ShelfForm', { rackId })}
        label="Add Shelf"
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
  shelvesSection: {
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
  shelfCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  shelfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  shelfInfo: {
    flex: 1,
  },
  shelfName: {
    fontSize: typography.h5.fontSize,
    fontWeight: typography.h5.fontWeight,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  shelfCode: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  shelfType: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.text,
  },
  shelfStatus: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: spacing.xs,
  },
  cleaningChip: {
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
  cleaningSection: {
    marginBottom: spacing.md,
  },
  cleaningTitle: {
    fontSize: typography.body2.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  cleaningInfo: {
    gap: spacing.xs,
  },
  cleaningText: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
  },
  shelfActions: {
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

export default ShelfManagementScreen;
