import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Drawer,
  Text,
  Divider,
  Avatar,
  List,
  Badge,
  useTheme,
} from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions, MenuItem } from '../../utils/permissions';
import { theme, spacing, typography } from '../../theme';
import moment from 'moment';

const { width } = Dimensions.get('window');

interface PermissionAwareNavigationProps {
  visible: boolean;
  onDismiss: () => void;
  onNavigate: (path: string) => void;
  activeRoute?: string;
}

const PermissionAwareNavigation: React.FC<PermissionAwareNavigationProps> = ({
  visible,
  onDismiss,
  onNavigate,
  activeRoute,
}) => {
  const { user, logout } = useAuth();
  const permissions = usePermissions(user);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const paperTheme = useTheme();

  const handleItemPress = (menuItem: MenuItem) => {
    if (menuItem.children && menuItem.children.length > 0) {
      // Toggle expansion for items with children
      setExpandedItems(prev => 
        prev.includes(menuItem.id)
          ? prev.filter(id => id !== menuItem.id)
          : [...prev, menuItem.id]
      );
    } else {
      // Navigate to the route
      onNavigate(menuItem.path);
      onDismiss();
    }
  };

  const isItemActive = (menuItem: MenuItem): boolean => {
    if (activeRoute === menuItem.path) return true;
    if (menuItem.children) {
      return menuItem.children.some(child => child.path === activeRoute);
    }
    return false;
  };

  const isItemExpanded = (menuItem: MenuItem): boolean => {
    return expandedItems.includes(menuItem.id);
  };

  const renderMenuItem = (menuItem: MenuItem, level: number = 0) => {
    const hasChildren = menuItem.children && menuItem.children.length > 0;
    const isActive = isItemActive(menuItem);
    const isExpanded = isItemExpanded(menuItem);

    return (
      <View key={menuItem.id}>
        <List.Item
          title={menuItem.title}
          left={(props) => (
            <List.Icon
              {...props}
              icon={menuItem.icon}
              color={isActive ? theme.colors.primary : theme.colors.onSurface}
            />
          )}
          right={(props) => {
            if (hasChildren) {
              return (
                <List.Icon
                  {...props}
                  icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                  color={theme.colors.onSurfaceVariant}
                />
              );
            }
            if (menuItem.badge) {
              return (
                <Badge
                  {...props}
                  size={20}
                  style={styles.badge}
                >
                  {menuItem.badge}
                </Badge>
              );
            }
            return null;
          }}
          onPress={() => handleItemPress(menuItem)}
          style={[
            styles.menuItem,
            { paddingLeft: spacing.lg + (level * spacing.md) },
            isActive && styles.activeMenuItem,
          ]}
          titleStyle={[
            styles.menuItemTitle,
            isActive && styles.activeMenuItemTitle,
          ]}
        />
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <View style={styles.childrenContainer}>
            {menuItem.children.map(child => renderMenuItem(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  const getFilteredMenuItems = () => {
    return permissions.getFilteredMenuItems();
  };

  const handleLogout = async () => {
    try {
      await logout();
      onDismiss();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Drawer
      visible={visible}
      onDismiss={onDismiss}
      style={styles.drawer}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar.Text
            size={60}
            label={`${user?.firstName?.[0]}${user?.lastName?.[0]}`}
            style={{ 
              backgroundColor: permissions.getRoleColor(user?.role || ''),
              marginBottom: spacing.sm,
            }}
          />
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userRole}>
            {permissions.getRoleDisplayName(user?.role || '')}
          </Text>
          <Text style={styles.userEmail}>
            {user?.email}
          </Text>
        </View>
        <Divider style={styles.divider} />
        <Text style={styles.date}>
          {moment().format('dddd, MMMM Do YYYY')}
        </Text>
      </View>

      {/* Navigation Items */}
      <ScrollView style={styles.navigationContainer}>
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Main Menu</Text>
          {getFilteredMenuItems().map(menuItem => renderMenuItem(menuItem))}
        </View>

        {/* Quick Actions Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          {/* New Sale - Available for Cashiers and above */}
          {permissions.canCreate('sales') && (
            <List.Item
              title="New Sale"
              left={(props) => (
                <List.Icon {...props} icon="cart-plus" color="#4CAF50" />
              )}
              onPress={() => {
                onNavigate('/sales/new');
                onDismiss();
              }}
              style={styles.quickActionItem}
              titleStyle={styles.quickActionTitle}
            />
          )}

          {/* Add Inventory - Available for Pharmacists and above */}
          {permissions.canCreate('inventory') && (
            <List.Item
              title="Add Inventory Item"
              left={(props) => (
                <List.Icon {...props} icon="package-variant-plus" color="#2196F3" />
              )}
              onPress={() => {
                onNavigate('/inventory/add');
                onDismiss();
              }}
              style={styles.quickActionItem}
              titleStyle={styles.quickActionTitle}
            />
          )}

          {/* Generate Report - Available for Pharmacists and above */}
          {permissions.canGenerateReports() && (
            <List.Item
              title="Generate Report"
              left={(props) => (
                <List.Icon {...props} icon="chart-line" color="#FF9800" />
              )}
              onPress={() => {
                onNavigate('/reports');
                onDismiss();
              }}
              style={styles.quickActionItem}
              titleStyle={styles.quickActionTitle}
            />
          )}

          {/* Manage Users - Admin only */}
          {permissions.canCreate('users') && (
            <List.Item
              title="Manage Users"
              left={(props) => (
                <List.Icon {...props} icon="account-plus" color="#9C27B0" />
              )}
              onPress={() => {
                onNavigate('/users');
                onDismiss();
              }}
              style={styles.quickActionItem}
              titleStyle={styles.quickActionTitle}
            />
          )}
        </View>

        {/* System Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>System</Text>
          
          {/* View Alerts - Available for all */}
          {permissions.canRead('alerts') && (
            <List.Item
              title="View Alerts"
              left={(props) => (
                <List.Icon {...props} icon="bell" color="#F44336" />
              )}
              onPress={() => {
                onNavigate('/alerts');
                onDismiss();
              }}
              style={styles.systemItem}
              titleStyle={styles.systemItemTitle}
            />
          )}

          {/* Settings - Admin only */}
          {permissions.isAdmin() && (
            <List.Item
              title="Settings"
              left={(props) => (
                <List.Icon {...props} icon="cog" color="#607D8B" />
              )}
              onPress={() => {
                onNavigate('/settings');
                onDismiss();
              }}
              style={styles.systemItem}
              titleStyle={styles.systemItemTitle}
            />
          )}

          {/* Logout */}
          <List.Item
            title="Logout"
            left={(props) => (
              <List.Icon {...props} icon="logout" color="#F44336" />
            )}
            onPress={handleLogout}
            style={styles.logoutItem}
            titleStyle={styles.logoutItemTitle}
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          JELPAPHARM Pharmacy Management System
        </Text>
        <Text style={styles.footerVersion}>
          Version 1.0.0
        </Text>
      </View>
    </Drawer>
  );
};

const styles = StyleSheet.create({
  drawer: {
    width: width * 0.8,
    backgroundColor: theme.colors.surface,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: theme.colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userName: {
    fontSize: typography.h6.fontSize,
    fontWeight: 'bold',
    color: theme.colors.onPrimary,
    textAlign: 'center',
  },
  userRole: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.onPrimary,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  userEmail: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.onPrimary,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  divider: {
    backgroundColor: theme.colors.onPrimary,
    opacity: 0.2,
    marginVertical: spacing.md,
  },
  date: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.onPrimary,
    opacity: 0.8,
    textAlign: 'center',
  },
  navigationContainer: {
    flex: 1,
  },
  menuSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    marginHorizontal: spacing.sm,
    borderRadius: spacing.sm,
  },
  activeMenuItem: {
    backgroundColor: theme.colors.primaryContainer,
  },
  menuItemTitle: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.onSurface,
  },
  activeMenuItemTitle: {
    color: theme.colors.onPrimaryContainer,
    fontWeight: '500',
  },
  childrenContainer: {
    backgroundColor: theme.colors.surfaceVariant,
    marginLeft: spacing.lg,
    borderRadius: spacing.sm,
  },
  badge: {
    backgroundColor: theme.colors.error,
  },
  quickActionItem: {
    marginHorizontal: spacing.sm,
    borderRadius: spacing.sm,
    backgroundColor: theme.colors.surfaceVariant,
  },
  quickActionTitle: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  systemItem: {
    marginHorizontal: spacing.sm,
    borderRadius: spacing.sm,
  },
  systemItemTitle: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.onSurface,
  },
  logoutItem: {
    marginHorizontal: spacing.sm,
    borderRadius: spacing.sm,
    backgroundColor: theme.colors.errorContainer,
  },
  logoutItemTitle: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.onErrorContainer,
    fontWeight: '500',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  footerVersion: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.onSurfaceVariant,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
});

export default PermissionAwareNavigation;
