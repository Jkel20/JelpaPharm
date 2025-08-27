import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Button, 
  Chip, 
  IconButton, 
  List,
  Divider,
  FAB
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../utils/permissions';
import { CanRead, CanCreate, CanUpdate, CanDelete } from '../components/Common/PermissionGuard';
import { theme, spacing, typography } from '../theme';
import { API_ENDPOINTS, apiHelpers } from '../config/api';
import api from '../config/api';
import moment from 'moment';
import Footer from '../components/Layout/Footer';

interface AlertItem {
  _id: string;
  type: 'low_stock' | 'expiry' | 'system' | 'custom';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: string;
  relatedItem?: {
    id: string;
    name: string;
    type: 'inventory' | 'sale' | 'user';
  };
  isDynamic?: boolean;
}

const AlertsScreen: React.FC = () => {
  const { user } = useAuth();
  const permissions = usePermissions(user);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'critical'>('all');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ALERTS.LIST);
      setAlerts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await api.put(API_ENDPOINTS.ALERTS.MARK_READ(alertId));
      setAlerts(alerts.map(alert => 
        alert._id === alertId ? { ...alert, isRead: true } : alert
      ));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(API_ENDPOINTS.ALERTS.DELETE(alertId));
              setAlerts(alerts.filter(alert => alert._id !== alertId));
              Alert.alert('Success', 'Alert deleted successfully');
            } catch (error) {
              console.error('Error deleting alert:', error);
              Alert.alert('Error', 'Failed to delete alert');
            }
          },
        },
      ]
    );
  };

  const handleCreateAlert = () => {
    Alert.alert('Create Alert', 'Navigate to create alert form');
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return theme.colors.error;
      case 'high': return theme.colors.warning;
      case 'medium': return theme.colors.info;
      case 'low': return theme.colors.success;
      default: return theme.colors.text;
    }
  };

  const getAlertIcon = (type: string): string => {
    switch (type) {
      case 'low_stock': return 'package-variant';
      case 'expiry': return 'clock-alert';
      case 'system': return 'cog';
      case 'custom': return 'bell';
      default: return 'alert';
    }
  };

  const getFilteredAlerts = () => {
    switch (selectedFilter) {
      case 'unread':
        return alerts.filter(alert => !alert.isRead);
      case 'critical':
        return alerts.filter(alert => alert.severity === 'critical');
      default:
        return alerts;
    }
  };

  const renderAlertItem = (alert: AlertItem) => (
    <Card key={alert._id} style={[styles.alertCard, !alert.isRead && styles.unreadAlert]}>
      <Card.Content>
        <View style={styles.alertHeader}>
          <View style={styles.alertInfo}>
            <View style={styles.alertTitleRow}>
              <IconButton
                icon={getAlertIcon(alert.type)}
                iconColor={getSeverityColor(alert.severity)}
                size={20}
                style={styles.alertIcon}
              />
              <Title style={styles.alertTitle}>{alert.title}</Title>
            </View>
            <Text style={styles.alertMessage}>{alert.message}</Text>
            <Text style={styles.alertTime}>
              {moment(alert.createdAt).fromNow()}
            </Text>
          </View>
          <View style={styles.alertActions}>
            <Chip
              mode="outlined"
              textStyle={{ color: getSeverityColor(alert.severity) }}
              style={[styles.severityChip, { borderColor: getSeverityColor(alert.severity) }]}
            >
              {alert.severity.toUpperCase()}
            </Chip>
          </View>
        </View>

        {alert.relatedItem && (
          <View style={styles.relatedItem}>
            <Text style={styles.relatedItemLabel}>Related:</Text>
            <Text style={styles.relatedItemName}>{alert.relatedItem.name}</Text>
          </View>
        )}

        <Divider style={styles.divider} />

        <View style={styles.actionButtons}>
          {!alert.isRead && !alert.isDynamic && (
            <CanUpdate resource="alerts">
              <Button
                mode="outlined"
                onPress={() => handleMarkAsRead(alert._id)}
                style={styles.actionButton}
                icon="check"
              >
                Mark as Read
              </Button>
            </CanUpdate>
          )}
          {alert.isDynamic && (
            <Button
              mode="outlined"
              style={styles.actionButton}
              icon="information"
              textColor={theme.colors.info}
              disabled
            >
              Dynamic Alert
            </Button>
          )}
          {!alert.isDynamic && (
            <CanDelete resource="alerts">
              <Button
                mode="outlined"
                onPress={() => handleDeleteAlert(alert._id)}
                style={styles.actionButton}
                icon="delete"
                textColor={theme.colors.error}
              >
                Delete
              </Button>
            </CanDelete>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const filteredAlerts = getFilteredAlerts();

  return (
    <CanRead resource="alerts" showAccessDenied={true}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.pharmacyName}>JELPAPHARM</Text>
            <Text style={styles.pharmacySubtitle}>Pharmacy Management System</Text>
            <Title style={styles.headerTitle}>Alerts & Notifications</Title>
            <Text style={styles.headerSubtitle}>
              Real-time alerts and push notifications integrated
            </Text>
          </View>

          {/* Filter Chips */}
          <View style={styles.filterContainer}>
            <Chip
              selected={selectedFilter === 'all'}
              onPress={() => setSelectedFilter('all')}
              style={styles.filterChip}
            >
              All ({alerts.length})
            </Chip>
            <Chip
              selected={selectedFilter === 'unread'}
              onPress={() => setSelectedFilter('unread')}
              style={styles.filterChip}
            >
              Unread ({alerts.filter(a => !a.isRead).length})
            </Chip>
            <Chip
              selected={selectedFilter === 'critical'}
              onPress={() => setSelectedFilter('critical')}
              style={styles.filterChip}
            >
              Critical ({alerts.filter(a => a.severity === 'critical').length})
            </Chip>
          </View>

          {/* Alerts List */}
          <View style={styles.alertsContainer}>
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map(renderAlertItem)
            ) : (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <Text style={styles.emptyText}>
                    {selectedFilter === 'all' 
                      ? 'No alerts found' 
                      : `No ${selectedFilter} alerts found`}
                  </Text>
                </Card.Content>
              </Card>
            )}
          </View>
          
          <Footer 
            customText="Real-time alerts and notifications system"
          />
        </ScrollView>

        {/* Floating Action Button */}
        <CanCreate resource="alerts">
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={handleCreateAlert}
            label="Create Alert"
          />
        </CanCreate>
      </View>
    </CanRead>
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
  header: {
    padding: spacing.lg,
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
    ...typography.h3,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  alertsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  alertCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  unreadAlert: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  alertInfo: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  alertIcon: {
    margin: 0,
    marginRight: spacing.xs,
  },
  alertTitle: {
    ...typography.h5,
    color: theme.colors.text,
    flex: 1,
  },
  alertMessage: {
    ...typography.body1,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  alertTime: {
    ...typography.caption,
    color: theme.colors.text,
    opacity: 0.7,
  },
  alertActions: {
    alignItems: 'flex-end',
  },
  severityChip: {
    alignSelf: 'flex-start',
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  relatedItemLabel: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
    marginRight: spacing.xs,
  },
  relatedItemName: {
    ...typography.body2,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  divider: {
    marginVertical: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: spacing.sm,
  },
  emptyCard: {
    marginTop: spacing.xl,
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body1,
    color: theme.colors.text,
    opacity: 0.7,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default AlertsScreen;
