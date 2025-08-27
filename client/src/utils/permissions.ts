// Define User interface locally to avoid circular dependency
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'pharmacist' | 'cashier';
  isActive: boolean;
  fullName: string;
}

// User roles enum
export enum UserRole {
  ADMIN = 'admin',
  PHARMACIST = 'pharmacist',
  CASHIER = 'cashier'
}

// Permission interface
export interface Permission {
  resource: string;
  actions: string[];
}

export interface RolePermissions {
  [key: string]: Permission[];
}

// Define role-based permissions (mirrors backend)
export const ROLE_PERMISSIONS: RolePermissions = {
  [UserRole.ADMIN]: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'sales', actions: ['create', 'read', 'update', 'delete', 'void'] },
    { resource: 'reports', actions: ['read', 'generate'] },
    { resource: 'alerts', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'system', actions: ['configure', 'backup', 'restore'] }
  ],
  [UserRole.PHARMACIST]: [
    { resource: 'users', actions: ['read'] },
    { resource: 'inventory', actions: ['create', 'read', 'update'] },
    { resource: 'sales', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['read', 'generate'] },
    { resource: 'alerts', actions: ['read', 'create', 'update'] }
  ],
  [UserRole.CASHIER]: [
    { resource: 'users', actions: ['read'] },
    { resource: 'inventory', actions: ['read'] },
    { resource: 'sales', actions: ['create', 'read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'alerts', actions: ['read'] }
  ]
};

// Navigation menu items with permissions
export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  resource: string;
  action: string;
  badge?: number;
  children?: MenuItem[];
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'view-dashboard',
    path: '/dashboard',
    resource: 'reports',
    action: 'read'
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: 'package-variant',
    path: '/inventory',
    resource: 'inventory',
    action: 'read',
    children: [
      {
        id: 'inventory-list',
        title: 'All Items',
        icon: 'format-list-bulleted',
        path: '/inventory',
        resource: 'inventory',
        action: 'read'
      },
      {
        id: 'inventory-add',
        title: 'Add Item',
        icon: 'plus',
        path: '/inventory/add',
        resource: 'inventory',
        action: 'create'
      },
      {
        id: 'low-stock',
        title: 'Low Stock',
        icon: 'alert',
        path: '/inventory/low-stock',
        resource: 'inventory',
        action: 'read'
      },
      {
        id: 'expiring',
        title: 'Expiring Items',
        icon: 'clock-alert',
        path: '/inventory/expiring',
        resource: 'inventory',
        action: 'read'
      }
    ]
  },
  {
    id: 'sales',
    title: 'Sales',
    icon: 'cart',
    path: '/sales',
    resource: 'sales',
    action: 'read',
    children: [
      {
        id: 'new-sale',
        title: 'New Sale',
        icon: 'plus',
        path: '/sales/new',
        resource: 'sales',
        action: 'create'
      },
      {
        id: 'sales-history',
        title: 'Sales History',
        icon: 'history',
        path: '/sales/history',
        resource: 'sales',
        action: 'read'
      },
      {
        id: 'void-sales',
        title: 'Void Sales',
        icon: 'close-circle',
        path: '/sales/void',
        resource: 'sales',
        action: 'void'
      }
    ]
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: 'chart-line',
    path: '/reports',
    resource: 'reports',
    action: 'read',
    children: [
      {
        id: 'sales-reports',
        title: 'Sales Reports',
        icon: 'chart-bar',
        path: '/reports/sales',
        resource: 'reports',
        action: 'generate'
      },
      {
        id: 'inventory-reports',
        title: 'Inventory Reports',
        icon: 'package-variant-closed',
        path: '/reports/inventory',
        resource: 'reports',
        action: 'generate'
      },
      {
        id: 'user-reports',
        title: 'User Reports',
        icon: 'account-group',
        path: '/reports/users',
        resource: 'reports',
        action: 'generate'
      }
    ]
  },
  {
    id: 'users',
    title: 'Users',
    icon: 'account-group',
    path: '/users',
    resource: 'users',
    action: 'read',
    children: [
      {
        id: 'user-list',
        title: 'All Users',
        icon: 'format-list-bulleted',
        path: '/users',
        resource: 'users',
        action: 'read'
      },
      {
        id: 'add-user',
        title: 'Add User',
        icon: 'account-plus',
        path: '/users/add',
        resource: 'users',
        action: 'create'
      }
    ]
  },
  {
    id: 'alerts',
    title: 'Alerts',
    icon: 'bell',
    path: '/alerts',
    resource: 'alerts',
    action: 'read'
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'cog',
    path: '/settings',
    resource: 'system',
    action: 'configure'
  }
];

// Permission utility functions
export class PermissionService {
  /**
   * Check if user has permission for specific action
   */
  static hasPermission(userRole: UserRole, resource: string, action: string): boolean {
    const permissions = ROLE_PERMISSIONS[userRole];
    if (!permissions) return false;

    const resourcePermission = permissions.find(p => p.resource === resource);
    if (!resourcePermission) return false;

    return resourcePermission.actions.includes(action);
  }

  /**
   * Get user's permissions for a specific resource
   */
  static getUserPermissions(userRole: UserRole, resource: string): string[] {
    const permissions = ROLE_PERMISSIONS[userRole];
    if (!permissions) return [];

    const resourcePermission = permissions.find(p => p.resource === resource);
    return resourcePermission ? resourcePermission.actions : [];
  }

  /**
   * Get all permissions for a user role
   */
  static getAllPermissions(userRole: UserRole): Permission[] {
    return ROLE_PERMISSIONS[userRole] || [];
  }

  /**
   * Check if user can access a specific menu item
   */
  static canAccessMenuItem(user: User | null, menuItem: MenuItem): boolean {
    if (!user) return false;
    return this.hasPermission(user.role as UserRole, menuItem.resource, menuItem.action);
  }

  /**
   * Get filtered menu items based on user permissions
   */
  static getFilteredMenuItems(user: User | null): MenuItem[] {
    if (!user) return [];

    return MENU_ITEMS.filter(menuItem => {
      // Check main menu item permission
      const canAccess = this.canAccessMenuItem(user, menuItem);
      
      if (!canAccess) return false;

      // Filter children based on permissions
      if (menuItem.children) {
        menuItem.children = menuItem.children.filter(child =>
          this.canAccessMenuItem(user, child)
        );
      }

      return true;
    });
  }

  /**
   * Get role display name
   */
  static getRoleDisplayName(role: string): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrator';
      case UserRole.PHARMACIST:
        return 'Pharmacist';
      case UserRole.CASHIER:
        return 'Cashier';
      default:
        return 'Unknown Role';
    }
  }

  /**
   * Get role color for UI
   */
  static getRoleColor(role: string): string {
    switch (role) {
      case UserRole.ADMIN:
        return '#d32f2f'; // Red
      case UserRole.PHARMACIST:
        return '#1976d2'; // Blue
      case UserRole.CASHIER:
        return '#388e3c'; // Green
      default:
        return '#757575'; // Grey
    }
  }

  /**
   * Check if user can perform action on resource
   */
  static canPerformAction(user: User | null, resource: string, action: string): boolean {
    if (!user) return false;
    return this.hasPermission(user.role as UserRole, resource, action);
  }

  /**
   * Get dashboard stats based on user role
   */
  static getDashboardStats(user: User | null): {
    canViewSales: boolean;
    canViewInventory: boolean;
    canViewUsers: boolean;
    canViewAlerts: boolean;
    canGenerateReports: boolean;
  } {
    if (!user) {
      return {
        canViewSales: false,
        canViewInventory: false,
        canViewUsers: false,
        canViewAlerts: false,
        canGenerateReports: false
      };
    }

    return {
      canViewSales: this.hasPermission(user.role as UserRole, 'sales', 'read'),
      canViewInventory: this.hasPermission(user.role as UserRole, 'inventory', 'read'),
      canViewUsers: this.hasPermission(user.role as UserRole, 'users', 'read'),
      canViewAlerts: this.hasPermission(user.role as UserRole, 'alerts', 'read'),
      canGenerateReports: this.hasPermission(user.role as UserRole, 'reports', 'generate')
    };
  }

  /**
   * Get available actions for a resource
   */
  static getAvailableActions(user: User | null, resource: string): string[] {
    if (!user) return [];
    return this.getUserPermissions(user.role as UserRole, resource);
  }

  /**
   * Check if user can create items
   */
  static canCreate(user: User | null, resource: string): boolean {
    return this.canPerformAction(user, resource, 'create');
  }

  /**
   * Check if user can read items
   */
  static canRead(user: User | null, resource: string): boolean {
    return this.canPerformAction(user, resource, 'read');
  }

  /**
   * Check if user can update items
   */
  static canUpdate(user: User | null, resource: string): boolean {
    return this.canPerformAction(user, resource, 'update');
  }

  /**
   * Check if user can delete items
   */
  static canDelete(user: User | null, resource: string): boolean {
    return this.canPerformAction(user, resource, 'delete');
  }

  /**
   * Check if user can void sales
   */
  static canVoidSales(user: User | null): boolean {
    return this.canPerformAction(user, 'sales', 'void');
  }

  /**
   * Check if user can generate reports
   */
  static canGenerateReports(user: User | null): boolean {
    return this.canPerformAction(user, 'reports', 'generate');
  }

  /**
   * Check if user is admin
   */
  static isAdmin(user: User | null): boolean {
    return user?.role === UserRole.ADMIN;
  }

  /**
   * Check if user is pharmacist or admin
   */
  static isPharmacistOrAdmin(user: User | null): boolean {
    return user?.role === UserRole.PHARMACIST || user?.role === UserRole.ADMIN;
  }

  /**
   * Check if user is cashier or higher
   */
  static isCashierOrHigher(user: User | null): boolean {
    return user?.role === UserRole.CASHIER || 
           user?.role === UserRole.PHARMACIST || 
           user?.role === UserRole.ADMIN;
  }
}

// React Hook for permissions
export const usePermissions = (user: User | null) => {
  return {
    hasPermission: (resource: string, action: string) => 
      PermissionService.hasPermission(user?.role as UserRole, resource, action),
    canPerformAction: (resource: string, action: string) => 
      PermissionService.canPerformAction(user, resource, action),
    canCreate: (resource: string) => PermissionService.canCreate(user, resource),
    canRead: (resource: string) => PermissionService.canRead(user, resource),
    canUpdate: (resource: string) => PermissionService.canUpdate(user, resource),
    canDelete: (resource: string) => PermissionService.canDelete(user, resource),
    canVoidSales: () => PermissionService.canVoidSales(user),
    canGenerateReports: () => PermissionService.canGenerateReports(user),
    isAdmin: () => PermissionService.isAdmin(user),
    isPharmacistOrAdmin: () => PermissionService.isPharmacistOrAdmin(user),
    isCashierOrHigher: () => PermissionService.isCashierOrHigher(user),
    getDashboardStats: () => PermissionService.getDashboardStats(user),
    getAvailableActions: (resource: string) => PermissionService.getAvailableActions(user, resource),
    getFilteredMenuItems: () => PermissionService.getFilteredMenuItems(user),
    getRoleDisplayName: (role: string) => PermissionService.getRoleDisplayName(role),
    getRoleColor: (role: string) => PermissionService.getRoleColor(role)
  };
};

export default PermissionService;
