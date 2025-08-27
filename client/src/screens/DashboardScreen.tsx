import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  IconButton,
  Chip,
} from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../utils/permissions';
import { theme, spacing, typography } from '../theme';
import { API_ENDPOINTS, apiHelpers } from '../config/api';
import api from '../config/api';
import moment from 'moment';
import UserDashboard from '../components/Dashboard/UserDashboard';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalInventory: number;
  totalSales: number;
  totalRevenue: number;
  totalUsers: number;
  lowStockItems: number;
  todaySales: number;
  expiringItems: number;
  pendingOrders: number;
}

interface SalesData {
  date: string;
  sales: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const permissions = usePermissions(user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, salesResponse] = await Promise.all([
        api.get(API_ENDPOINTS.REPORTS.DASHBOARD_STATS),
        api.get(API_ENDPOINTS.REPORTS.SALES_CHART, {
          params: { period: selectedPeriod }
        }),
      ]);
      
      setStats(statsResponse.data.data);
      setSalesData(salesResponse.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: string;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <Card style={[styles.statCard, { borderLeftColor: color }]}>
      <Card.Content style={styles.statCardContent}>
        <View style={styles.statHeader}>
          <View style={[styles.iconContainer, { backgroundColor: color }]}>
            <IconButton
              icon={icon}
              iconColor="white"
              size={20}
              style={styles.icon}
            />
          </View>
          <View style={styles.statText}>
            <Text style={styles.statTitle}>{title}</Text>
            <Text style={styles.statValue}>{value}</Text>
            {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleDisplay = (role: string): string => {
    return permissions.getRoleDisplayName(role);
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(30, 77, 43, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(26, 26, 26, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  const salesChartData: ChartData = {
    labels: salesData.map(item => moment(item.date).format('DD/MM')),
    datasets: [
      {
        data: salesData.map(item => item.sales),
        color: (opacity = 1) => `rgba(30, 77, 43, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <UserDashboard onNavigate={(path) => {
      // Handle navigation to different screens
      console.log('Navigate to:', path);
      // In a real app, you would use navigation.navigate(path)
    }} />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    ...typography.body1,
    color: theme.colors.text,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.md,
  },
  greeting: {
    ...typography.h4,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  role: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  date: {
    ...typography.body1,
    color: theme.colors.text,
    fontWeight: '500',
  },
  time: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  periodChip: {
    marginRight: spacing.sm,
  },
  statsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statCard: {
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    elevation: 2,
  },
  statCardContent: {
    paddingVertical: spacing.sm,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    borderRadius: 8,
    marginRight: spacing.md,
  },
  icon: {
    margin: 0,
  },
  statText: {
    flex: 1,
  },
  statTitle: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
  },
  statValue: {
    ...typography.h4,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  statSubtitle: {
    ...typography.caption,
    color: theme.colors.text,
    opacity: 0.5,
  },
  chartCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  chartTitle: {
    ...typography.h5,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  chartSubtitle: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
    marginBottom: spacing.md,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: 8,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    ...typography.body1,
    color: theme.colors.text,
    opacity: 0.5,
  },
  actionsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  actionsTitle: {
    ...typography.h5,
    color: theme.colors.primary,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  actionIcon: {
    margin: 0,
    marginBottom: spacing.xs,
  },
  actionText: {
    ...typography.body2,
    color: theme.colors.text,
    textAlign: 'center',
  },
  activityCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  activityTitle: {
    ...typography.h5,
    color: theme.colors.primary,
    marginBottom: spacing.md,
  },
  activityList: {
    gap: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    ...typography.body1,
    color: theme.colors.text,
  },
  activityTime: {
    ...typography.caption,
    color: theme.colors.text,
    opacity: 0.7,
  },
});

export default DashboardScreen;
