import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import InventoryScreen from './screens/InventoryScreen';
import SalesScreen from './screens/SalesScreen';
import ReportsScreen from './screens/ReportsScreen';
import UsersScreen from './screens/UsersScreen';
import AlertsScreen from './screens/AlertsScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import PasswordResetScreen from './screens/PasswordResetScreen';
import ReceiptScreen from './screens/ReceiptScreen';
import BarcodeScannerScreen from './screens/BarcodeScannerScreen';
import SupplierScreen from './screens/SupplierScreen';
import CustomerScreen from './screens/CustomerScreen';
import PrescriptionScreen from './screens/PrescriptionScreen';

// Import context and permissions
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { usePermissions } from './utils/permissions';
import { theme } from './theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator: React.FC = () => {
  const { user } = useAuth();
  const permissions = usePermissions(user);

  // Filter tabs based on user permissions
  const getFilteredTabs = () => {
    const tabs = [];

    // Dashboard - Available to all authenticated users
    tabs.push({
      name: 'Dashboard',
      component: DashboardScreen,
      icon: 'dashboard',
      permission: null // Always available
    });

    // Inventory - Available to users who can read inventory
    if (permissions.canRead('inventory')) {
      tabs.push({
        name: 'Inventory',
        component: InventoryScreen,
        icon: 'inventory',
        permission: 'inventory'
      });
    }

    // Sales - Available to users who can read sales
    if (permissions.canRead('sales')) {
      tabs.push({
        name: 'Sales',
        component: SalesScreen,
        icon: 'shopping-cart',
        permission: 'sales'
      });
    }

    // Reports - Available to users who can read reports
    if (permissions.canRead('reports')) {
      tabs.push({
        name: 'Reports',
        component: ReportsScreen,
        icon: 'assessment',
        permission: 'reports'
      });
    }

    // Users - Available only to admins
    if (permissions.canRead('users')) {
      tabs.push({
        name: 'Users',
        component: UsersScreen,
        icon: 'people',
        permission: 'users'
      });
    }

    // Suppliers - Available only to admins
    if (permissions.canRead('suppliers')) {
      tabs.push({
        name: 'Suppliers',
        component: SupplierScreen,
        icon: 'business',
        permission: 'suppliers'
      });
    }

    // Customers - Available to cashiers and above
    if (permissions.canRead('customers')) {
      tabs.push({
        name: 'Customers',
        component: CustomerScreen,
        icon: 'account-group',
        permission: 'customers'
      });
    }

    // Prescriptions - Available to pharmacists and admins
    if (permissions.canRead('prescriptions')) {
      tabs.push({
        name: 'Prescriptions',
        component: PrescriptionScreen,
        icon: 'pill',
        permission: 'prescriptions'
      });
    }

    // Alerts - Available to users who can read alerts
    if (permissions.canRead('alerts')) {
      tabs.push({
        name: 'Alerts',
        component: AlertsScreen,
        icon: 'warning',
        permission: 'alerts'
      });
    }

    // Notifications - Available to all authenticated users
    tabs.push({
      name: 'Notifications',
      component: NotificationsScreen,
      icon: 'notifications',
      permission: null // Always available
    });

    return tabs;
  };

  const filteredTabs = getFilteredTabs();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const tab = filteredTabs.find(t => t.name === route.name);
          const iconName = tab?.icon || 'help';

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      {filteredTabs.map((tab) => (
        <Tab.Screen 
          key={tab.name}
          name={tab.name} 
          component={tab.component}
          options={{
            tabBarLabel: tab.name,
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="Receipt" component={ReceiptScreen} />
          <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <NotificationProvider>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </NotificationProvider>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
};

export default App;
