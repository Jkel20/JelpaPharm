import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  ActivityIndicator,
  Chip,
  SegmentedButtons,
} from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { theme, spacing, typography } from '../theme';
import api from '../config/api';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  warehouseId: string;
  warehouseName: string;
  totalCapacity: number;
  totalUsed: number;
  totalAvailable: number;
  averageUtilization: number;
  zones: ZoneAnalytics[];
  monthlyUtilization: MonthlyData[];
  capacityByZone: ZoneCapacity[];
  cleaningSchedule: CleaningData[];
}

interface ZoneAnalytics {
  zoneId: string;
  zoneName: string;
  zoneType: string;
  utilizationPercentage: number;
  totalCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
  racks: RackAnalytics[];
}

interface RackAnalytics {
  rackId: string;
  rackName: string;
  rackType: string;
  utilizationPercentage: number;
  totalSlots: number;
  usedSlots: number;
  availableSlots: number;
}

interface MonthlyData {
  month: string;
  utilization: number;
  capacity: number;
}

interface ZoneCapacity {
  zoneName: string;
  capacity: number;
  color: string;
}

interface CleaningData {
  shelfName: string;
  lastCleaned: string;
  nextCleaning: string;
  status: string;
}

const WarehouseAnalyticsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { warehouseId } = route.params as { warehouseId: string };
  const { user } = useAuth();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    fetchAnalyticsData();
  }, [warehouseId, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      const response = await api.get(`/api/warehouses/${warehouseId}/analytics`, {
        params: { period: selectedPeriod }
      });
      setAnalyticsData(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return theme.colors.error;
    if (percentage >= 75) return theme.colors.warning;
    return theme.colors.success;
  };

  const getZoneTypeColor = (type: string) => {
    switch (type) {
      case 'refrigerated': return theme.colors.info;
      case 'freezer': return theme.colors.primary;
      case 'controlled': return theme.colors.warning;
      case 'secure': return theme.colors.error;
      case 'quarantine': return theme.colors.tertiary;
      default: return theme.colors.success;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading analytics data...</Text>
      </View>
    );
  }

  if (!analyticsData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No analytics data available</Text>
      </View>
    );
  }

  const monthlyChartData = {
    labels: analyticsData.monthlyUtilization.map(item => item.month),
    datasets: [
      {
        data: analyticsData.monthlyUtilization.map(item => item.utilization),
        color: (opacity = 1) => `rgba(30, 77, 43, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const zoneCapacityData = {
    labels: analyticsData.capacityByZone.map(item => item.zoneName),
    data: analyticsData.capacityByZone.map(item => item.capacity),
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Title style={styles.headerTitle}>Warehouse Analytics</Title>
          <Text style={styles.headerSubtitle}>
            {analyticsData.warehouseName} - Performance Metrics
          </Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSection}>
          <SegmentedButtons
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            buttons={[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'quarter', label: 'Quarter' },
            ]}
            style={styles.periodButtons}
          />
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsSection}>
          <Title style={styles.sectionTitle}>Key Metrics</Title>
          <View style={styles.metricsGrid}>
            <Card style={styles.metricCard}>
              <Card.Content>
                <Text style={styles.metricLabel}>Total Capacity</Text>
                <Text style={styles.metricValue}>
                  {analyticsData.totalCapacity.toLocaleString()}
                </Text>
                <Text style={styles.metricUnit}>units</Text>
              </Card.Content>
            </Card>

            <Card style={styles.metricCard}>
              <Card.Content>
                <Text style={styles.metricLabel}>Utilization</Text>
                <Text style={[
                  styles.metricValue,
                  { color: getUtilizationColor(analyticsData.averageUtilization) }
                ]}>
                  {analyticsData.averageUtilization.toFixed(1)}%
                </Text>
                <Text style={styles.metricUnit}>average</Text>
              </Card.Content>
            </Card>

            <Card style={styles.metricCard}>
              <Card.Content>
                <Text style={styles.metricLabel}>Used Space</Text>
                <Text style={styles.metricValue}>
                  {analyticsData.totalUsed.toLocaleString()}
                </Text>
                <Text style={styles.metricUnit}>units</Text>
              </Card.Content>
            </Card>

            <Card style={styles.metricCard}>
              <Card.Content>
                <Text style={styles.metricLabel}>Available</Text>
                <Text style={styles.metricValue}>
                  {analyticsData.totalAvailable.toLocaleString()}
                </Text>
                <Text style={styles.metricUnit}>units</Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Utilization Chart */}
        <View style={styles.chartSection}>
          <Title style={styles.sectionTitle}>Monthly Utilization Trend</Title>
          <Card style={styles.chartCard}>
            <Card.Content>
              <LineChart
                data={monthlyChartData}
                width={width - 80}
                height={220}
                chartConfig={{
                  backgroundColor: theme.colors.surface,
                  backgroundGradientFrom: theme.colors.surface,
                  backgroundGradientTo: theme.colors.surface,
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(30, 77, 43, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: theme.colors.primary,
                  },
                }}
                bezier
                style={styles.chart}
              />
            </Card.Content>
          </Card>
        </View>

        {/* Zone Analytics */}
        <View style={styles.zonesSection}>
          <Title style={styles.sectionTitle}>Zone Performance</Title>
          {analyticsData.zones.map((zone) => (
            <Card key={zone.zoneId} style={styles.zoneCard}>
              <Card.Content>
                <View style={styles.zoneHeader}>
                  <View style={styles.zoneInfo}>
                    <Title style={styles.zoneName}>{zone.zoneName}</Title>
                    <Chip
                      mode="outlined"
                      style={[
                        styles.zoneTypeChip,
                        { borderColor: getZoneTypeColor(zone.zoneType) }
                      ]}
                      textStyle={{ color: getZoneTypeColor(zone.zoneType) }}
                    >
                      {zone.zoneType}
                    </Chip>
                  </View>
                  <View style={styles.zoneMetrics}>
                    <Text style={[
                      styles.utilizationText,
                      { color: getUtilizationColor(zone.utilizationPercentage) }
                    ]}>
                      {zone.utilizationPercentage.toFixed(1)}%
                    </Text>
                    <Text style={styles.capacityText}>
                      {zone.usedCapacity}/{zone.totalCapacity}
                    </Text>
                  </View>
                </View>

                <View style={styles.racksSummary}>
                  <Text style={styles.racksTitle}>Racks: {zone.racks.length}</Text>
                  <View style={styles.racksList}>
                    {zone.racks.slice(0, 3).map((rack) => (
                      <Chip key={rack.rackId} mode="outlined" style={styles.rackChip}>
                        {rack.rackName} ({rack.utilizationPercentage.toFixed(0)}%)
                      </Chip>
                    ))}
                    {zone.racks.length > 3 && (
                      <Chip mode="outlined" style={styles.rackChip}>
                        +{zone.racks.length - 3} more
                      </Chip>
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Capacity Distribution */}
        <View style={styles.capacitySection}>
          <Title style={styles.sectionTitle}>Capacity Distribution</Title>
          <Card style={styles.chartCard}>
            <Card.Content>
              <PieChart
                data={analyticsData.capacityByZone.map((zone, index) => ({
                  name: zone.zoneName,
                  capacity: zone.capacity,
                  color: zone.color,
                  legendFontColor: theme.colors.text,
                  legendFontSize: 12,
                }))}
                width={width - 80}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="capacity"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </Card.Content>
          </Card>
        </View>

        {/* Cleaning Schedule */}
        <View style={styles.cleaningSection}>
          <Title style={styles.sectionTitle}>Cleaning Schedule</Title>
          {analyticsData.cleaningSchedule.map((item, index) => (
            <Card key={index} style={styles.cleaningCard}>
              <Card.Content>
                <View style={styles.cleaningHeader}>
                  <Text style={styles.cleaningShelf}>{item.shelfName}</Text>
                  <Chip
                    mode="outlined"
                    style={[
                      styles.cleaningStatusChip,
                      { borderColor: getUtilizationColor(70) }
                    ]}
                  >
                    {item.status}
                  </Chip>
                </View>
                <View style={styles.cleaningDates}>
                  <Text style={styles.cleaningDate}>
                    Last: {new Date(item.lastCleaned).toLocaleDateString()}
                  </Text>
                  <Text style={styles.cleaningDate}>
                    Next: {new Date(item.nextCleaning).toLocaleDateString()}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorText: {
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
  periodSection: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  periodButtons: {
    marginBottom: spacing.sm,
  },
  metricsSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: theme.colors.primary,
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    minWidth: width * 0.4,
    marginBottom: spacing.sm,
  },
  metricLabel: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  metricUnit: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.text,
    opacity: 0.6,
  },
  chartSection: {
    padding: spacing.lg,
  },
  chartCard: {
    elevation: 2,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: 16,
  },
  zonesSection: {
    padding: spacing.lg,
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
  zoneTypeChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  zoneMetrics: {
    alignItems: 'flex-end',
  },
  utilizationText: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    marginBottom: spacing.xs,
  },
  capacityText: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
  },
  racksSummary: {
    marginTop: spacing.sm,
  },
  racksTitle: {
    fontSize: typography.body2.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  racksList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  rackChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  capacitySection: {
    padding: spacing.lg,
  },
  cleaningSection: {
    padding: spacing.lg,
  },
  cleaningCard: {
    marginBottom: spacing.md,
    elevation: 1,
  },
  cleaningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cleaningShelf: {
    fontSize: typography.body1.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
  },
  cleaningStatusChip: {
    borderWidth: 1,
  },
  cleaningDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cleaningDate: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
  },
});

export default WarehouseAnalyticsScreen;
