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
  Button,
  Avatar,
  Divider,
} from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions, PermissionService } from '../../utils/permissions';
import { theme, spacing, typography } from '../../theme';
import { API_ENDPOINTS } from '../../config/api';
import api from '../../config/api';
import moment from 'moment';
import Footer from '../Layout/Footer';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalInventory?: number;
  totalSales?: number;
  totalRevenue?: number;
  totalUsers?: number;
  lowStockItems?: number;
  todaySales?: number;
  expiringItems?: number;
  pendingOrders?: number;
  mySales?: number;
  myRevenue?: number;
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

interface UserDashboardProps {
  onNavigate: (path: string) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigate }) => {
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: string;
    color: string;
    subtitle?: string;
    onPress?: () => void;
  }> = ({ title, value, icon, color, subtitle, onPress }) => (
    <Card style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <Card.Content style={styles.statCardContent}>
        <View style={styles.statHeader}>
          <View style={[styles.iconContainer, { backgroundColor: color }]}>
            <IconButton
              icon={icon}
              iconColor="white"
              size={20}
              style={styles.statIcon}
            />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
            {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const QuickActionCard: React.FC<{
    title: string;
    description: string;
    icon: string;
    color: string;
    onPress: () => void;
    disabled?: boolean;
  }> = ({ title, description, icon, color, onPress, disabled }) => (
    <Card 
      style={[styles.quickActionCard, { opacity: disabled ? 0.5 : 1 }]} 
      onPress={disabled ? undefined : onPress}
    >
      <Card.Content style={styles.quickActionContent}>
        <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
          <IconButton
            icon={icon}
            iconColor="white"
            size={24}
          />
        </View>
        <View style={styles.quickActionText}>
          <Text style={styles.quickActionTitle}>{title}</Text>
          <Text style={styles.quickActionDescription}>{description}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
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
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  const dashboardStats = permissions.getDashboardStats();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Pharmacy Header */}
      <View style={styles.pharmacyHeader}>
        <Text style={styles.pharmacyName}>JELPAPHARM</Text>
        <Text style={styles.pharmacySubtitle}>Pharmacy Management System</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar.Text 
            size={50} 
            label={`${user?.firstName?.[0]}${user?.lastName?.[0]}`}
            style={{ backgroundColor: permissions.getRoleColor(user?.role || '') }}
          />
          <View style={styles.userDetails}>
            <Text style={styles.greeting}>{getGreeting()}, {user?.firstName}!</Text>
            <Text style={styles.role}>{permissions.getRoleDisplayName(user?.role || '')}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.date}>{moment().format('DD MMM YYYY')}</Text>
          <Text style={styles.time}>{moment().format('HH:mm')}</Text>
        </View>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <Chip
          selected={selectedPeriod === 'week'}
          onPress={() => setSelectedPeriod('week')}
          style={styles.periodChip}
        >
          This Week
        </Chip>
        <Chip
          selected={selectedPeriod === 'month'}
          onPress={() => setSelectedPeriod('month')}
          style={styles.periodChip}
        >
          This Month
        </Chip>
      </View>

      {/* Role-Specific Statistics */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Statistics</Text>
        
        {/* Sales Statistics - Show for Cashiers and above */}
        {dashboardStats.canViewSales && (
          <View style={styles.statRow}>
            <StatCard
              title="Today's Sales"
              value={stats?.todaySales || 0}
              icon="currency-ghs"
              color="#4CAF50"
              subtitle="GH₵"
              onPress={() => onNavigate('/sales/history')}
            />
            <StatCard
              title="Total Sales"
              value={stats?.totalSales || 0}
              icon="cart"
              color="#2196F3"
              subtitle="transactions"
              onPress={() => onNavigate('/sales/history')}
            />
          </View>
        )}

        {/* Inventory Statistics - Show for Pharmacists and above */}
        {dashboardStats.canViewInventory && (
          <View style={styles.statRow}>
            <StatCard
              title="Total Inventory"
              value={stats?.totalInventory || 0}
              icon="package-variant"
              color="#FF9800"
              subtitle="items"
              onPress={() => onNavigate('/inventory')}
            />
            <StatCard
              title="Low Stock Items"
              value={stats?.lowStockItems || 0}
              icon="alert"
              color="#F44336"
              subtitle="need restocking"
              onPress={() => onNavigate('/inventory/low-stock')}
            />
          </View>
        )}

        {/* Admin Statistics */}
        {permissions.isAdmin() && (
          <View style={styles.statRow}>
            <StatCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              icon="account-group"
              color="#9C27B0"
              subtitle="registered"
              onPress={() => onNavigate('/users')}
            />
            <StatCard
              title="Total Revenue"
              value={`GH₵${(stats?.totalRevenue || 0).toLocaleString()}`}
              icon="trending-up"
              color="#4CAF50"
              subtitle="all time"
              onPress={() => onNavigate('/reports/sales')}
            />
          </View>
        )}

        {/* Expiring Items - Show for Pharmacists and above */}
        {dashboardStats.canViewInventory && stats?.expiringItems && stats.expiringItems > 0 && (
          <View style={styles.statRow}>
            <StatCard
              title="Expiring Items"
              value={stats.expiringItems}
              icon="clock-alert"
              color="#FF5722"
              subtitle="within 30 days"
              onPress={() => onNavigate('/inventory/expiring')}
            />
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {/* New Sale - Available for Cashiers and above */}
          {permissions.canCreate('sales') && (
            <QuickActionCard
              title="New Sale"
              description="Create a new transaction"
              icon="cart-plus"
              color="#4CAF50"
              onPress={() => onNavigate('/sales/new')}
            />
          )}

          {/* Add Inventory - Available for Pharmacists and above */}
          {permissions.canCreate('inventory') && (
            <QuickActionCard
              title="Add Item"
              description="Add new inventory item"
              icon="package-variant-plus"
              color="#2196F3"
              onPress={() => onNavigate('/inventory/add')}
            />
          )}

          {/* Generate Report - Available for Pharmacists and above */}
          {permissions.canGenerateReports() && (
            <QuickActionCard
              title="Generate Report"
              description="Create detailed reports"
              icon="chart-line"
              color="#FF9800"
              onPress={() => onNavigate('/reports')}
            />
          )}

          {/* Manage Users - Admin only */}
          {permissions.canCreate('users') && (
            <QuickActionCard
              title="Manage Users"
              description="Add or edit users"
              icon="account-plus"
              color="#9C27B0"
              onPress={() => onNavigate('/users')}
            />
          )}

          {/* View Alerts - Available for all */}
          {dashboardStats.canViewAlerts && (
            <QuickActionCard
              title="View Alerts"
              description="Check system alerts"
              icon="bell"
              color="#F44336"
              onPress={() => onNavigate('/alerts')}
            />
          )}

          {/* Settings - Admin only */}
          {permissions.isAdmin() && (
            <QuickActionCard
              title="Settings"
              description="System configuration"
              icon="cog"
              color="#607D8B"
              onPress={() => onNavigate('/settings')}
            />
          )}
        </View>
      </View>

      {/* Sales Chart - Show for users with sales access */}
      {dashboardStats.canViewSales && salesData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Sales Trend</Text>
          <Card style={styles.chartCard}>
            <Card.Content>
              <LineChart
                data={salesChartData}
                width={width - 80}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Recent Activity */}
      <View style={styles.recentActivityContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Card style={styles.activityCard}>
          <Card.Content>
            <View style={styles.activityItem}>
              <IconButton icon="login" size={20} />
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Logged in</Text>
                <Text style={styles.activityTime}>{moment().format('HH:mm')}</Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.activityItem}>
              <IconButton icon="view-dashboard" size={20} />
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Dashboard accessed</Text>
                <Text style={styles.activityTime}>{moment().format('HH:mm')}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
      
      <Footer 
        customText="Real-time dashboard with live updates"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  pharmacyHeader: {
    backgroundColor: theme.colors.primary,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pharmacyName: {
    fontSize: typography.h4.fontSize,
    fontWeight: 'bold',
    color: theme.colors.onPrimary,
    textAlign: 'center',
  },
  pharmacySubtitle: {
    fontSize: typography.body1.fontSize,
    color: theme.colors.onPrimary,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.body1.fontSize,
    color: theme.colors.onBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  greeting: {
    fontSize: typography.h6.fontSize,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  role: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  email: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.onSurfaceVariant,
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  date: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  time: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.onSurfaceVariant,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  periodChip: {
    marginRight: spacing.sm,
  },
  statsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.h6.fontSize,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginBottom: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
    borderLeftWidth: 4,
  },
  statCardContent: {
    padding: spacing.sm,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  statIcon: {
    margin: 0,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: typography.h5.fontSize,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  statTitle: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.onSurfaceVariant,
  },
  statSubtitle: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.onSurfaceVariant,
  },
  quickActionsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    marginBottom: spacing.md,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  quickActionIcon: {
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: typography.body2.fontSize,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  quickActionDescription: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.onSurfaceVariant,
  },
  chartContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  chartCard: {
    marginBottom: spacing.md,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: 16,
  },
  recentActivityContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  activityCard: {
    marginBottom: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  activityText: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  activityTitle: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.onSurface,
  },
  activityTime: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.onSurfaceVariant,
  },
  divider: {
    marginVertical: spacing.xs,
  },
});

export default UserDashboard;
