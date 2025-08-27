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
  FAB,
  Searchbar,
  Menu,
  Badge,
  ActivityIndicator
} from 'react-native-paper';
import { useNotifications, NotificationItem } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../utils/permissions';
import { CanRead, CanCreate, CanUpdate, CanDelete } from '../components/Common/PermissionGuard';
import { theme, spacing, typography } from '../theme';
import moment from 'moment';
import Footer from '../components/Layout/Footer';

const NotificationsScreen: React.FC = () => {
  const { user } = useAuth();
  const permissions = usePermissions(user);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    refreshNotifications 
  } = useNotifications();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All Read',
          onPress: async () => {
            try {
              await markAllAsRead();
              Alert.alert('Success', 'All notifications marked as read');
            } catch (error) {
              console.error('Error marking all notifications as read:', error);
              Alert.alert('Error', 'Failed to mark all notifications as read');
            }
          },
        },
      ]
    );
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

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'low_stock': return 'package-variant';
      case 'expiry': return 'clock-alert';
      case 'sale': return 'cash-register';
      case 'system': return 'cog';
      case 'prescription': return 'pill';
      case 'customer': return 'account';
      case 'supplier': return 'truck';
      default: return 'bell';
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    switch (selectedFilter) {
      case 'unread':
        filtered = filtered.filter(notification => !notification.isRead);
        break;
      case 'critical':
        filtered = filtered.filter(notification => notification.severity === 'critical');
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  const renderNotificationItem = (notification: NotificationItem) => (
    <Card 
      key={notification._id} 
      style={[
        styles.notificationCard,
        !notification.isRead && styles.unreadCard
      ]}
      onPress={() => handleMarkAsRead(notification._id)}
    >
      <Card.Content>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationTitleContainer}>
            <IconButton
              icon={getNotificationIcon(notification.type)}
              size={20}
              iconColor={getSeverityColor(notification.severity)}
            />
            <View style={styles.notificationTitleWrapper}>
              <Title style={styles.notificationTitle}>
                {notification.title}
              </Title>
              {!notification.isRead && (
                <Badge size={8} style={styles.unreadBadge} />
              )}
            </View>
          </View>
          <View style={styles.notificationMeta}>
            <Chip 
              mode="outlined" 
              textStyle={{ fontSize: 10 }}
              style={[styles.severityChip, { borderColor: getSeverityColor(notification.severity) }]}
            >
              {notification.severity}
            </Chip>
            <Text style={styles.timestamp}>
              {moment(notification.createdAt).fromNow()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.notificationMessage}>
          {notification.message}
        </Text>
        
        {notification.data && (
          <View style={styles.notificationData}>
            {notification.data.itemName && (
              <Chip mode="outlined" style={styles.dataChip}>
                Item: {notification.data.itemName}
              </Chip>
            )}
            {notification.data.quantity !== undefined && (
              <Chip mode="outlined" style={styles.dataChip}>
                Qty: {notification.data.quantity}
              </Chip>
            )}
            {notification.data.expiryDate && (
              <Chip mode="outlined" style={styles.dataChip}>
                Expires: {moment(notification.data.expiryDate).format('MMM DD, YYYY')}
              </Chip>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pharmacyName}>JELPAPHARM</Text>
        <Text style={styles.pharmacySubtitle}>Pharmacy Management System</Text>
        <View style={styles.headerLeft}>
          <Title style={styles.headerTitle}>Notifications</Title>
          {unreadCount > 0 && (
            <Badge size={20} style={styles.unreadCountBadge}>
              {unreadCount}
            </Badge>
          )}
        </View>
        
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              handleMarkAllAsRead();
            }}
            title="Mark all as read"
            leadingIcon="check-all"
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              onRefresh();
            }}
            title="Refresh"
            leadingIcon="refresh"
          />
        </Menu>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search notifications..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <Chip
            selected={selectedFilter === 'all'}
            onPress={() => setSelectedFilter('all')}
            style={styles.filterChip}
          >
            All ({notifications.length})
          </Chip>
          <Chip
            selected={selectedFilter === 'unread'}
            onPress={() => setSelectedFilter('unread')}
            style={styles.filterChip}
          >
            Unread ({notifications.filter(n => !n.isRead).length})
          </Chip>
          <Chip
            selected={selectedFilter === 'critical'}
            onPress={() => setSelectedFilter('critical')}
            style={styles.filterChip}
          >
            Critical ({notifications.filter(n => n.severity === 'critical').length})
          </Chip>
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.notificationsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Footer 
          customText="Notification center with real-time updates"
        />
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconButton
              icon="bell-off"
              size={64}
              iconColor={theme.colors.disabled}
            />
            <Text style={styles.emptyText}>
              {searchQuery || selectedFilter !== 'all' 
                ? 'No notifications match your filters'
                : 'No notifications yet'
              }
            </Text>
            <Text style={styles.emptySubtext}>
              You'll see notifications here when they arrive
            </Text>
          </View>
        ) : (
          filteredNotifications.map(renderNotificationItem)
        )}
      </ScrollView>

      {/* FAB for quick actions */}
      <CanCreate permissions={permissions} resource="notifications">
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => {
            // Navigate to create notification screen (admin only)
            Alert.alert('Create Notification', 'Navigate to create notification form');
          }}
        />
      </CanCreate>
    </View>
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
    marginTop: spacing.medium,
    color: theme.colors.text,
    ...typography.bodyMedium,
  },
  header: {
    flexDirection: 'column',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    backgroundColor: theme.colors.surface,
    elevation: 2,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTitle: {
    ...typography.headlineSmall,
    color: theme.colors.text,
  },
  unreadCountBadge: {
    marginLeft: spacing.small,
    backgroundColor: theme.colors.error,
  },
  searchContainer: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    backgroundColor: theme.colors.surface,
  },
  searchbar: {
    marginBottom: spacing.small,
    elevation: 1,
  },
  filterContainer: {
    marginBottom: spacing.small,
  },
  filterContent: {
    paddingRight: spacing.medium,
  },
  filterChip: {
    marginRight: spacing.small,
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: spacing.medium,
  },
  notificationCard: {
    marginBottom: spacing.small,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.small,
  },
  notificationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationTitleWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTitle: {
    ...typography.titleMedium,
    color: theme.colors.text,
    flex: 1,
  },
  unreadBadge: {
    marginLeft: spacing.small,
    backgroundColor: theme.colors.primary,
  },
  notificationMeta: {
    alignItems: 'flex-end',
  },
  severityChip: {
    marginBottom: spacing.small,
  },
  timestamp: {
    ...typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  notificationMessage: {
    ...typography.bodyMedium,
    color: theme.colors.text,
    marginBottom: spacing.small,
  },
  notificationData: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
  dataChip: {
    marginBottom: spacing.small,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.extraLarge * 2,
  },
  emptyText: {
    ...typography.titleMedium,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: spacing.medium,
  },
  emptySubtext: {
    ...typography.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.small,
  },
  fab: {
    position: 'absolute',
    margin: spacing.medium,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default NotificationsScreen;
