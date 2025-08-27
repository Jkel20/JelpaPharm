import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000' 
  : 'https://jelpapharm-pharmacy.onrender.com';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Clear stored token
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
        
        // You might want to redirect to login here
        // This would typically be handled by your auth context
      } catch (storageError) {
        console.error('Error clearing auth data:', storageError);
      }
    }

    // Enhanced error handling
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          error.message = data.error?.message || 'Bad request. Please check your input.';
          break;
        case 401:
          error.message = 'Unauthorized. Please log in again.';
          break;
        case 403:
          error.message = 'Access denied. You don\'t have permission for this action.';
          break;
        case 404:
          error.message = 'Resource not found.';
          break;
        case 422:
          error.message = data.error?.message || 'Validation error. Please check your input.';
          break;
        case 429:
          error.message = 'Too many requests. Please try again later.';
          break;
        case 500:
          error.message = 'Server error. Please try again later.';
          break;
        default:
          error.message = data.error?.message || 'An unexpected error occurred.';
      }
    } else if (error.request) {
      // Network error
      error.message = 'Network error. Please check your internet connection.';
    } else {
      // Other error
      error.message = 'An unexpected error occurred.';
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    VERIFY_EMAIL: '/api/auth/verify-email',
    RESET_PASSWORD: '/api/auth/reset-password',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
  },
  
  // Users
  USERS: {
    LIST: '/api/users',
    CREATE: '/api/users',
    GET: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
  },
  
  // Inventory
  INVENTORY: {
    LIST: '/api/inventory',
    CREATE: '/api/inventory',
    GET: (id: string) => `/api/inventory/${id}`,
    UPDATE: (id: string) => `/api/inventory/${id}`,
    DELETE: (id: string) => `/api/inventory/${id}`,
    SEARCH: '/api/inventory/search',
    LOW_STOCK: '/api/inventory/low-stock',
    EXPIRING_SOON: '/api/inventory/expiring-soon',
  },
  
  // Sales
  SALES: {
    LIST: '/api/sales',
    CREATE: '/api/sales',
    GET: (id: string) => `/api/sales/${id}`,
    UPDATE: (id: string) => `/api/sales/${id}`,
    DELETE: (id: string) => `/api/sales/${id}`,
    VOID: (id: string) => `/api/sales/${id}/void`,
    RECEIPT: (id: string) => `/api/sales/${id}/receipt`,
  },
  
  // Reports
  REPORTS: {
    DASHBOARD_STATS: '/api/reports/dashboard-stats',
    SALES_CHART: '/api/reports/sales-chart',
    DAILY: '/api/reports/daily',
    WEEKLY: '/api/reports/weekly',
    MONTHLY: '/api/reports/monthly',
    ANNUAL: '/api/reports/annual',
    INVENTORY_REPORT: '/api/reports/inventory-report',
    SALES_REPORT: '/api/reports/sales-report',
  },
  
  // Alerts
  ALERTS: {
    LIST: '/api/alerts/list',
    CREATE: '/api/alerts',
    UPDATE: (id: string) => `/api/alerts/${id}`,
    DELETE: (id: string) => `/api/alerts/${id}`,
    MARK_READ: (id: string) => `/api/alerts/${id}/read`,
    LOW_STOCK_EMAIL: '/api/alerts/low-stock/email',
    EXPIRY_EMAIL: '/api/alerts/expiry/email',
    STATS: '/api/alerts/stats',
    CRITICAL: '/api/alerts/critical',
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
    UNREAD_COUNT: '/api/notifications/unread-count',
    SEND: '/api/notifications/send',
    SEND_TO_ROLE: '/api/notifications/send-to-role',
    SYSTEM: '/api/notifications/system',
    STATS: '/api/notifications/stats',
  },
  
  // Health check
  HEALTH: '/api/health',
  
  // Warehouse Management
  WAREHOUSES: {
    LIST: '/api/warehouses',
    CREATE: '/api/warehouses',
    GET: (id: string) => `/api/warehouses/${id}`,
    UPDATE: (id: string) => `/api/warehouses/${id}`,
    DELETE: (id: string) => `/api/warehouses/${id}`,
    STATS: '/api/warehouses/stats',
    ANALYTICS: (id: string) => `/api/warehouses/${id}/analytics`,
    LAYOUT: (id: string) => `/api/warehouses/${id}/layout`,
    CAPACITY_REPORT: (id: string) => `/api/warehouses/${id}/capacity-report`,
    SEARCH: (query: string) => `/api/warehouses/search/${query}`,
  },
  
  // Zone Management
  ZONES: {
    LIST: '/api/zones',
    CREATE: '/api/zones',
    GET: (id: string) => `/api/zones/${id}`,
    UPDATE: (id: string) => `/api/zones/${id}`,
    DELETE: (id: string) => `/api/zones/${id}`,
    BY_WAREHOUSE: (warehouseId: string) => `/api/zones/warehouse/${warehouseId}`,
    ANALYTICS: (id: string) => `/api/zones/${id}/analytics`,
    LAYOUT: (id: string) => `/api/zones/${id}/layout`,
    SEARCH: (query: string) => `/api/zones/search/${query}`,
    BY_TYPE: (type: string) => `/api/zones/type/${type}`,
  },
  
  // Rack Management
  RACKS: {
    LIST: '/api/racks',
    CREATE: '/api/racks',
    GET: (id: string) => `/api/racks/${id}`,
    UPDATE: (id: string) => `/api/racks/${id}`,
    DELETE: (id: string) => `/api/racks/${id}`,
    BY_ZONE: (zoneId: string) => `/api/racks/zone/${zoneId}`,
    ANALYTICS: (id: string) => `/api/racks/${id}/analytics`,
    LAYOUT: (id: string) => `/api/racks/${id}/layout`,
    SEARCH: (query: string) => `/api/racks/search/${query}`,
    BY_TYPE: (type: string) => `/api/racks/type/${type}`,
    CAPACITY_REPORT: (id: string) => `/api/racks/${id}/capacity-report`,
  },
  
  // Shelf Management
  SHELVES: {
    LIST: '/api/shelves',
    CREATE: '/api/shelves',
    GET: (id: string) => `/api/shelves/${id}`,
    UPDATE: (id: string) => `/api/shelves/${id}`,
    DELETE: (id: string) => `/api/shelves/${id}`,
    BY_RACK: (rackId: string) => `/api/shelves/rack/${rackId}`,
    ANALYTICS: (id: string) => `/api/shelves/${id}/analytics`,
    CLEANING: (id: string) => `/api/shelves/${id}/cleaning`,
    OVERDUE_CLEANING: '/api/shelves/cleaning/overdue',
    UPCOMING_CLEANING: '/api/shelves/cleaning/upcoming',
    SEARCH: (query: string) => `/api/shelves/search/${query}`,
    BY_TYPE: (type: string) => `/api/shelves/type/${type}`,
    CAPACITY_REPORT: (id: string) => `/api/shelves/${id}/capacity-report`,
    ASSIGN_ITEMS: (id: string) => `/api/shelves/${id}/assign-items`,
  },
  
  // Inventory Placement
  INVENTORY_PLACEMENT: {
    UNASSIGNED: '/api/inventory/unassigned',
    ASSIGN_TO_SHELF: (shelfId: string) => `/api/shelves/${shelfId}/assign-items`,
  },
};

// API helper functions
export const apiHelpers = {
  // Handle API errors consistently
  handleError: (error: any) => {
    console.error('API Error:', error);
    
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred.';
  },
  
  // Format currency for Ghanaian Cedi
  formatCurrency: (amount: number): string => {
    return `GH₵ ${amount.toFixed(2)}`;
  },
  
  // Format date for Ghanaian locale
  formatDate: (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },
  
  // Format date and time
  formatDateTime: (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
  
  // Validate Ghanaian phone number
  validateGhanaianPhone: (phone: string): boolean => {
    const phoneRegex = /^(\+233|0)[0-9]{9}$/;
    return phoneRegex.test(phone);
  },
  
  // Validate email
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
};

export default api;
