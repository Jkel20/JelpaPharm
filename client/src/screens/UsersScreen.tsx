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
  Button,
  FAB,
  IconButton,
  Menu,
  Chip,
  Divider,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../utils/permissions';
import { AdminOnly, CanCreate, CanDelete, CanUpdate } from '../components/Common/PermissionGuard';
import { theme, spacing, typography } from '../theme';
import { API_ENDPOINTS, apiHelpers } from '../config/api';
import api from '../config/api';
import Footer from '../components/Layout/Footer';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'pharmacist' | 'cashier';
  isActive: boolean;
  lastLogin?: string;
  fullName: string;
}

const UsersScreen: React.FC = () => {
  const { user: currentUser } = useAuth();
  const permissions = usePermissions(currentUser);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.USERS.LIST);
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleAddUser = () => {
    Alert.alert('Add User', 'Navigate to add user form');
  };

  const handleEditUser = (userId: string) => {
    Alert.alert('Edit User', `Edit user with ID: ${userId}`);
  };

  const handleDeleteUser = async (userId: string) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(API_ENDPOINTS.USERS.DELETE(userId));
              await fetchUsers();
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'admin':
        return theme.colors.error;
      case 'pharmacist':
        return theme.colors.warning;
      case 'cashier':
        return theme.colors.info;
      default:
        return theme.colors.text;
    }
  };

  const getRoleDisplay = (role: string): string => {
    const roles: { [key: string]: string } = {
      admin: 'Administrator',
      pharmacist: 'Pharmacist',
      cashier: 'Cashier',
    };
    return roles[role] || role;
  };

  const renderUserItem = (user: User) => (
    <Card key={user._id} style={styles.userCard}>
      <Card.Content>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Title style={styles.userName}>{user.fullName}</Title>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userPhone}>{user.phone}</Text>
          </View>
          <Menu
            visible={menuVisible === user._id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(user._id)}
              />
            }
          >
            <CanUpdate resource="users">
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  handleEditUser(user._id);
                }}
                title="Edit"
                leadingIcon="pencil"
              />
            </CanUpdate>
            <CanDelete resource="users">
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  handleDeleteUser(user._id);
                }}
                title="Delete"
                leadingIcon="delete"
              />
            </CanDelete>
          </Menu>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.userDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Role:</Text>
            <Chip
              mode="outlined"
              textStyle={{
                color: getRoleColor(user.role),
              }}
              style={[
                styles.roleChip,
                { borderColor: getRoleColor(user.role) },
              ]}
            >
              {getRoleDisplay(user.role)}
            </Chip>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Chip
              mode="outlined"
              textStyle={{
                color: user.isActive ? theme.colors.success : theme.colors.error,
              }}
              style={[
                styles.statusChip,
                { borderColor: user.isActive ? theme.colors.success : theme.colors.error },
              ]}
            >
              {user.isActive ? 'Active' : 'Inactive'}
            </Chip>
          </View>
          {user.lastLogin && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Login:</Text>
              <Text style={styles.detailValue}>
                {apiHelpers.formatDateTime(user.lastLogin)}
              </Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <AdminOnly showAccessDenied={true}>
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
            <Title style={styles.headerTitle}>User Management</Title>
            <Text style={styles.headerSubtitle}>
              Manage system users and permissions
            </Text>
          </View>

          {/* Users List */}
          <View style={styles.usersContainer}>
            {users.length > 0 ? (
              users.map(renderUserItem)
            ) : (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <Text style={styles.emptyText}>No users found</Text>
                  <CanCreate resource="users">
                    <Button
                      mode="contained"
                      onPress={handleAddUser}
                      style={styles.addButton}
                    >
                      Add First User
                    </Button>
                  </CanCreate>
                </Card.Content>
              </Card>
            )}
                  </View>
        
        <Footer 
          customText="User management with role-based access control"
        />
      </ScrollView>

      {/* Floating Action Button */}
        <CanCreate resource="users">
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={handleAddUser}
        label="Add User"
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
  usersContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  userCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h5,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body1,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  userPhone: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  userDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
  },
  detailValue: {
    ...typography.body2,
    color: theme.colors.text,
    fontWeight: '500',
  },
  roleChip: {
    alignSelf: 'flex-end',
  },
  statusChip: {
    alignSelf: 'flex-end',
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
    marginBottom: spacing.lg,
  },
  addButton: {
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

export default UsersScreen;
