import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Define the root stack navigator param list
export type RootStackParamList = {
  Login: undefined;
  PasswordReset: undefined;
  Main: undefined;
  Receipt: { saleId: string };
  BarcodeScanner: undefined;
  ZoneForm: { warehouseId: string };
  ZoneAnalytics: { zoneId: string };
  RackLayout: { zoneId: string };
  ZoneManagement: { warehouseId: string };
};

// Define the main tab navigator param list
export type MainTabParamList = {
  Dashboard: undefined;
  Inventory: undefined;
  Sales: undefined;
  Reports: undefined;
  Users: undefined;
  Alerts: undefined;
  Notifications: undefined;
  Suppliers: undefined;
  Customers: undefined;
  Prescriptions: undefined;
};

// Navigation prop types
export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = StackNavigationProp<MainTabParamList>;

// Route prop types
export type ZoneManagementRouteProp = RouteProp<RootStackParamList, 'ZoneManagement'>;
export type ZoneFormRouteProp = RouteProp<RootStackParamList, 'ZoneForm'>;
export type ZoneAnalyticsRouteProp = RouteProp<RootStackParamList, 'ZoneAnalytics'>;
export type RackLayoutRouteProp = RouteProp<RootStackParamList, 'RackLayout'>;
export type ReceiptRouteProp = RouteProp<RootStackParamList, 'Receipt'>;

// Combined navigation type for components that need both
export type NavigationProp = RootStackNavigationProp & MainTabNavigationProp;
