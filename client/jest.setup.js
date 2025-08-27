// Mock React Native
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Dimensions: { get: () => ({ width: 375, height: 667 }) },
  Alert: { alert: jest.fn() },
  ScrollView: 'ScrollView',
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  Image: 'Image',
  StyleSheet: { create: jest.fn((styles) => styles) },
}));

// Mock expo modules
jest.mock('expo-status-bar');
jest.mock('expo-print');
jest.mock('expo-sharing');
jest.mock('expo-file-system');
jest.mock('expo-document-picker');
jest.mock('expo-constants');
jest.mock('expo-linking');
jest.mock('expo-splash-screen');
jest.mock('expo-updates');

// Mock react-native modules
jest.mock('react-native-gesture-handler');
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock react-native-chart-kit
jest.mock('react-native-chart-kit', () => ({
  LineChart: 'LineChart',
  BarChart: 'BarChart',
  PieChart: 'PieChart',
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(),
}));

// Mock moment.js
jest.mock('moment', () => {
  const moment = require.requireActual('moment');
  return moment;
});

// Global test setup
global.console = {
  ...console,
  error: jest.fn(),
};
