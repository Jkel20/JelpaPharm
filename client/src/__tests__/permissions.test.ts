import { PermissionService, UserRole } from '../../utils/permissions';

describe('PermissionService', () => {
  const mockAdminUser = {
    _id: '1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@pharmacy.com',
    role: UserRole.ADMIN,
    isActive: true,
  };

  const mockPharmacistUser = {
    _id: '2',
    firstName: 'Pharmacist',
    lastName: 'User',
    email: 'pharmacist@pharmacy.com',
    role: UserRole.PHARMACIST,
    isActive: true,
  };

  const mockCashierUser = {
    _id: '3',
    firstName: 'Cashier',
    lastName: 'User',
    email: 'cashier@pharmacy.com',
    role: UserRole.CASHIER,
    isActive: true,
  };

  describe('hasPermission', () => {
    it('should return true for admin with any permission', () => {
      expect(PermissionService.hasPermission(UserRole.ADMIN, 'users', 'create')).toBe(true);
      expect(PermissionService.hasPermission(UserRole.ADMIN, 'inventory', 'delete')).toBe(true);
      expect(PermissionService.hasPermission(UserRole.ADMIN, 'sales', 'void')).toBe(true);
    });

    it('should return correct permissions for pharmacist', () => {
      expect(PermissionService.hasPermission(UserRole.PHARMACIST, 'users', 'create')).toBe(false);
      expect(PermissionService.hasPermission(UserRole.PHARMACIST, 'inventory', 'create')).toBe(true);
      expect(PermissionService.hasPermission(UserRole.PHARMACIST, 'sales', 'update')).toBe(true);
    });

    it('should return correct permissions for cashier', () => {
      expect(PermissionService.hasPermission(UserRole.CASHIER, 'users', 'create')).toBe(false);
      expect(PermissionService.hasPermission(UserRole.CASHIER, 'inventory', 'create')).toBe(false);
      expect(PermissionService.hasPermission(UserRole.CASHIER, 'sales', 'create')).toBe(true);
    });
  });

  describe('canCreate', () => {
    it('should return true for admin creating any resource', () => {
      expect(PermissionService.canCreate(mockAdminUser, 'users')).toBe(true);
      expect(PermissionService.canCreate(mockAdminUser, 'inventory')).toBe(true);
      expect(PermissionService.canCreate(mockAdminUser, 'sales')).toBe(true);
    });

    it('should return correct create permissions for pharmacist', () => {
      expect(PermissionService.canCreate(mockPharmacistUser, 'users')).toBe(false);
      expect(PermissionService.canCreate(mockPharmacistUser, 'inventory')).toBe(true);
      expect(PermissionService.canCreate(mockPharmacistUser, 'sales')).toBe(true);
    });

    it('should return correct create permissions for cashier', () => {
      expect(PermissionService.canCreate(mockCashierUser, 'users')).toBe(false);
      expect(PermissionService.canCreate(mockCashierUser, 'inventory')).toBe(false);
      expect(PermissionService.canCreate(mockCashierUser, 'sales')).toBe(true);
    });
  });

  describe('canRead', () => {
    it('should return true for admin reading any resource', () => {
      expect(PermissionService.canRead(mockAdminUser, 'users')).toBe(true);
      expect(PermissionService.canRead(mockAdminUser, 'inventory')).toBe(true);
      expect(PermissionService.canRead(mockAdminUser, 'sales')).toBe(true);
    });

    it('should return correct read permissions for pharmacist', () => {
      expect(PermissionService.canRead(mockPharmacistUser, 'users')).toBe(true);
      expect(PermissionService.canRead(mockPharmacistUser, 'inventory')).toBe(true);
      expect(PermissionService.canRead(mockPharmacistUser, 'sales')).toBe(true);
    });

    it('should return correct read permissions for cashier', () => {
      expect(PermissionService.canRead(mockCashierUser, 'users')).toBe(true);
      expect(PermissionService.canRead(mockCashierUser, 'inventory')).toBe(true);
      expect(PermissionService.canRead(mockCashierUser, 'sales')).toBe(true);
    });
  });

  describe('canUpdate', () => {
    it('should return true for admin updating any resource', () => {
      expect(PermissionService.canUpdate(mockAdminUser, 'users')).toBe(true);
      expect(PermissionService.canUpdate(mockAdminUser, 'inventory')).toBe(true);
      expect(PermissionService.canUpdate(mockAdminUser, 'sales')).toBe(true);
    });

    it('should return correct update permissions for pharmacist', () => {
      expect(PermissionService.canUpdate(mockPharmacistUser, 'users')).toBe(false);
      expect(PermissionService.canUpdate(mockPharmacistUser, 'inventory')).toBe(true);
      expect(PermissionService.canUpdate(mockPharmacistUser, 'sales')).toBe(true);
    });

    it('should return correct update permissions for cashier', () => {
      expect(PermissionService.canUpdate(mockCashierUser, 'users')).toBe(false);
      expect(PermissionService.canUpdate(mockCashierUser, 'inventory')).toBe(false);
      expect(PermissionService.canUpdate(mockCashierUser, 'sales')).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('should return true for admin deleting any resource', () => {
      expect(PermissionService.canDelete(mockAdminUser, 'users')).toBe(true);
      expect(PermissionService.canDelete(mockAdminUser, 'inventory')).toBe(true);
      expect(PermissionService.canDelete(mockAdminUser, 'sales')).toBe(true);
    });

    it('should return false for pharmacist deleting resources', () => {
      expect(PermissionService.canDelete(mockPharmacistUser, 'users')).toBe(false);
      expect(PermissionService.canDelete(mockPharmacistUser, 'inventory')).toBe(false);
      expect(PermissionService.canDelete(mockPharmacistUser, 'sales')).toBe(false);
    });

    it('should return false for cashier deleting resources', () => {
      expect(PermissionService.canDelete(mockCashierUser, 'users')).toBe(false);
      expect(PermissionService.canDelete(mockCashierUser, 'inventory')).toBe(false);
      expect(PermissionService.canDelete(mockCashierUser, 'sales')).toBe(false);
    });
  });

  describe('role checks', () => {
    it('should correctly identify admin users', () => {
      expect(PermissionService.isAdmin(mockAdminUser)).toBe(true);
      expect(PermissionService.isAdmin(mockPharmacistUser)).toBe(false);
      expect(PermissionService.isAdmin(mockCashierUser)).toBe(false);
    });

    it('should correctly identify pharmacist or admin users', () => {
      expect(PermissionService.isPharmacistOrAdmin(mockAdminUser)).toBe(true);
      expect(PermissionService.isPharmacistOrAdmin(mockPharmacistUser)).toBe(true);
      expect(PermissionService.isPharmacistOrAdmin(mockCashierUser)).toBe(false);
    });

    it('should correctly identify cashier or higher users', () => {
      expect(PermissionService.isCashierOrHigher(mockAdminUser)).toBe(true);
      expect(PermissionService.isCashierOrHigher(mockPharmacistUser)).toBe(true);
      expect(PermissionService.isCashierOrHigher(mockCashierUser)).toBe(true);
    });
  });

  describe('getRoleDisplayName', () => {
    it('should return correct display names', () => {
      expect(PermissionService.getRoleDisplayName('admin')).toBe('Administrator');
      expect(PermissionService.getRoleDisplayName('pharmacist')).toBe('Pharmacist');
      expect(PermissionService.getRoleDisplayName('cashier')).toBe('Cashier');
      expect(PermissionService.getRoleDisplayName('unknown')).toBe('Unknown');
    });
  });

  describe('getRoleColor', () => {
    it('should return correct colors for roles', () => {
      expect(PermissionService.getRoleColor('admin')).toBe('#D32F2F');
      expect(PermissionService.getRoleColor('pharmacist')).toBe('#FF9800');
      expect(PermissionService.getRoleColor('cashier')).toBe('#2196F3');
      expect(PermissionService.getRoleColor('unknown')).toBe('#757575');
    });
  });
});
