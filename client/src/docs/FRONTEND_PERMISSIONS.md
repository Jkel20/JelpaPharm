# Frontend Permission System Documentation

## Overview

The frontend implements a comprehensive permission system that mirrors the backend database service permissions and provides role-based access control for all UI components and navigation. This ensures that users only see and can interact with features they have permission to access.

## 🔐 **Permission System Architecture**

### **Core Components**

1. **Permission Service** (`utils/permissions.ts`)
   - Centralized permission management
   - Role-based access control
   - Permission validation utilities

2. **Permission Guards** (`components/Common/PermissionGuard.tsx`)
   - Conditional rendering based on permissions
   - Access denied fallbacks
   - Role-based component protection

3. **User Dashboard** (`components/Dashboard/UserDashboard.tsx`)
   - Role-specific dashboard content
   - Permission-aware statistics
   - Quick actions based on user role

4. **Navigation** (`components/Navigation/PermissionAwareNavigation.tsx`)
   - Dynamic menu filtering
   - Role-based navigation items
   - Permission-aware routing

## 🛡️ **Permission Validation Features**

### **1. Role-Based Access Control (RBAC)**

```typescript
// User roles with specific permissions
const ROLE_PERMISSIONS = {
  admin: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'sales', actions: ['create', 'read', 'update', 'delete', 'void'] },
    { resource: 'reports', actions: ['read', 'generate'] },
    { resource: 'alerts', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'system', actions: ['configure', 'backup', 'restore'] }
  ],
  pharmacist: [
    { resource: 'users', actions: ['read'] },
    { resource: 'inventory', actions: ['create', 'read', 'update'] },
    { resource: 'sales', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['read', 'generate'] },
    { resource: 'alerts', actions: ['read', 'create', 'update'] }
  ],
  cashier: [
    { resource: 'users', actions: ['read'] },
    { resource: 'inventory', actions: ['read'] },
    { resource: 'sales', actions: ['create', 'read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'alerts', actions: ['read'] }
  ]
};
```

### **2. Permission Validation on Every Operation**

```typescript
// Check permissions before any operation
const permissions = usePermissions(user);

// Validate specific permissions
if (permissions.canCreate('inventory')) {
  // Show add inventory button
}

if (permissions.canDelete('users')) {
  // Show delete user option
}

if (permissions.canVoidSales()) {
  // Show void sale functionality
}
```

### **3. Dedicated User Dashboards**

Each user role sees a different dashboard with role-specific content:

#### **Admin Dashboard**
- Total users count
- System-wide revenue
- All inventory statistics
- User management quick actions
- System settings access

#### **Pharmacist Dashboard**
- Inventory management statistics
- Sales data (limited)
- Report generation access
- Low stock alerts
- Expiring items warnings

#### **Cashier Dashboard**
- Personal sales statistics
- Today's transactions
- Basic inventory viewing
- Sales creation quick actions
- Limited report access

## 🎯 **Permission Guard Components**

### **Basic Permission Guard**

```typescript
import { PermissionGuard } from '../components/Common/PermissionGuard';

<PermissionGuard
  resource="users"
  action="create"
  showAccessDenied={true}
>
  <Button onPress={handleAddUser}>Add User</Button>
</PermissionGuard>
```

### **Role-Based Guards**

```typescript
import { AdminOnly, PharmacistOrAdmin, CashierOrHigher } from '../components/Common/PermissionGuard';

// Admin only content
<AdminOnly>
  <UserManagementPanel />
</AdminOnly>

// Pharmacist or admin content
<PharmacistOrAdmin>
  <InventoryManagementPanel />
</PharmacistOrAdmin>

// Cashier or higher content
<CashierOrHigher>
  <SalesPanel />
</CashierOrHigher>
```

### **Action-Specific Guards**

```typescript
import { CanCreate, CanRead, CanUpdate, CanDelete } from '../components/Common/PermissionGuard';

// Create permission
<CanCreate resource="inventory">
  <AddInventoryButton />
</CanCreate>

// Read permission
<CanRead resource="reports">
  <ReportsList />
</CanRead>

// Update permission
<CanUpdate resource="sales">
  <EditSaleButton />
</CanUpdate>

// Delete permission
<CanDelete resource="users">
  <DeleteUserButton />
</CanDelete>
```

## 📊 **Dedicated User Dashboard Features**

### **Role-Specific Statistics**

```typescript
// Admin sees all statistics
{permissions.isAdmin() && (
  <StatCard
    title="Total Users"
    value={stats?.totalUsers || 0}
    icon="account-group"
    color="#9C27B0"
  />
)}

// Pharmacist sees inventory stats
{permissions.canRead('inventory') && (
  <StatCard
    title="Total Inventory"
    value={stats?.totalInventory || 0}
    icon="package-variant"
    color="#FF9800"
  />
)}

// Cashier sees sales stats
{permissions.canRead('sales') && (
  <StatCard
    title="Today's Sales"
    value={stats?.todaySales || 0}
    icon="currency-ghs"
    color="#4CAF50"
  />
)}
```

### **Quick Actions Based on Permissions**

```typescript
// Show quick actions based on user permissions
{permissions.canCreate('sales') && (
  <QuickActionCard
    title="New Sale"
    description="Create a new transaction"
    icon="cart-plus"
    color="#4CAF50"
    onPress={() => onNavigate('/sales/new')}
  />
)}

{permissions.canCreate('inventory') && (
  <QuickActionCard
    title="Add Item"
    description="Add new inventory item"
    icon="package-variant-plus"
    color="#2196F3"
    onPress={() => onNavigate('/inventory/add')}
  />
)}

{permissions.canGenerateReports() && (
  <QuickActionCard
    title="Generate Report"
    description="Create detailed reports"
    icon="chart-line"
    color="#FF9800"
    onPress={() => onNavigate('/reports')}
  />
)}
```

## 🧭 **Permission-Aware Navigation**

### **Dynamic Menu Filtering**

```typescript
// Get filtered menu items based on user permissions
const getFilteredMenuItems = () => {
  return permissions.getFilteredMenuItems();
};

// Render only accessible menu items
{getFilteredMenuItems().map(menuItem => (
  <MenuItem
    key={menuItem.id}
    title={menuItem.title}
    icon={menuItem.icon}
    onPress={() => handleNavigation(menuItem.path)}
  />
))}
```

### **Role-Based Navigation Sections**

```typescript
// Main menu - filtered by permissions
<View style={styles.menuSection}>
  <Text style={styles.sectionTitle}>Main Menu</Text>
  {getFilteredMenuItems().map(menuItem => renderMenuItem(menuItem))}
</View>

// Quick actions - based on user capabilities
<View style={styles.menuSection}>
  <Text style={styles.sectionTitle}>Quick Actions</Text>
  {permissions.canCreate('sales') && (
    <QuickActionItem title="New Sale" icon="cart-plus" />
  )}
  {permissions.canCreate('inventory') && (
    <QuickActionItem title="Add Item" icon="package-variant-plus" />
  )}
</View>

// System section - admin only
<View style={styles.menuSection}>
  <Text style={styles.sectionTitle}>System</Text>
  {permissions.isAdmin() && (
    <SystemItem title="Settings" icon="cog" />
  )}
</View>
```

## 🔧 **Permission Hooks and Utilities**

### **usePermissions Hook**

```typescript
const permissions = usePermissions(user);

// Permission checks
permissions.canCreate('inventory')
permissions.canRead('sales')
permissions.canUpdate('users')
permissions.canDelete('alerts')
permissions.canVoidSales()
permissions.canGenerateReports()

// Role checks
permissions.isAdmin()
permissions.isPharmacistOrAdmin()
permissions.isCashierOrHigher()

// Dashboard stats
permissions.getDashboardStats()

// Menu filtering
permissions.getFilteredMenuItems()
```

### **Permission Service Utilities**

```typescript
import PermissionService from '../utils/permissions';

// Check specific permissions
PermissionService.hasPermission('admin', 'users', 'create')

// Get user permissions for resource
PermissionService.getUserPermissions('pharmacist', 'inventory')

// Get role display name
PermissionService.getRoleDisplayName('admin') // "Administrator"

// Get role color
PermissionService.getRoleColor('admin') // "#d32f2f"
```

## 🎨 **UI/UX Features**

### **Access Denied Messages**

```typescript
// Show access denied cards when permissions are insufficient
<PermissionGuard
  resource="users"
  action="create"
  showAccessDenied={true}
  fallbackMessage="Only administrators can create new users"
>
  <AddUserForm />
</PermissionGuard>
```

### **Role-Based Styling**

```typescript
// Different colors for different roles
<Avatar.Text
  size={50}
  label={`${user?.firstName?.[0]}${user?.lastName?.[0]}`}
  style={{ backgroundColor: permissions.getRoleColor(user?.role || '') }}
/>

// Role-specific badges
<Chip
  mode="outlined"
  textStyle={{ color: permissions.getRoleColor(user?.role || '') }}
>
  {permissions.getRoleDisplayName(user?.role || '')}
</Chip>
```

### **Progressive Disclosure**

```typescript
// Show more options for higher-privilege users
{permissions.isAdmin() && (
  <AdvancedOptionsPanel />
)}

{permissions.isPharmacistOrAdmin() && (
  <InventoryManagementPanel />
)}

{permissions.isCashierOrHigher() && (
  <SalesPanel />
)}
```

## 🔒 **Security Features**

### **1. Client-Side Permission Validation**
- Every UI component checks permissions before rendering
- Navigation items filtered based on user role
- Action buttons only shown to authorized users

### **2. Server-Side Validation**
- All API calls validated on backend
- Database service enforces permissions
- Role-based data filtering

### **3. Graceful Degradation**
- Access denied messages instead of errors
- Fallback content for unauthorized users
- Clear permission requirements displayed

### **4. Audit Trail**
- All permission checks logged
- User actions tracked
- Access attempts monitored

## 📱 **Mobile-Specific Features**

### **Touch-Optimized Permission UI**
- Large touch targets for permission-based actions
- Swipe gestures for role-specific navigation
- Haptic feedback for access denied actions

### **Offline Permission Caching**
- Permissions cached locally for offline use
- Role-based offline functionality
- Synchronized when online

### **Responsive Permission Layout**
- Adaptive layouts based on screen size
- Role-specific dashboard layouts
- Mobile-optimized permission guards

## 🚀 **Usage Examples**

### **Complete Dashboard with Permissions**

```typescript
const DashboardScreen = () => {
  const { user } = useAuth();
  const permissions = usePermissions(user);

  return (
    <ScrollView>
      {/* Header with role info */}
      <View style={styles.header}>
        <Text>Welcome, {user?.firstName}!</Text>
        <Text style={{ color: permissions.getRoleColor(user?.role || '') }}>
          {permissions.getRoleDisplayName(user?.role || '')}
        </Text>
      </View>

      {/* Role-specific statistics */}
      {permissions.getDashboardStats().canViewSales && (
        <SalesStatistics />
      )}

      {permissions.getDashboardStats().canViewInventory && (
        <InventoryStatistics />
      )}

      {/* Quick actions */}
      {permissions.canCreate('sales') && (
        <QuickActionButton title="New Sale" onPress={handleNewSale} />
      )}

      {permissions.canCreate('inventory') && (
        <QuickActionButton title="Add Item" onPress={handleAddItem} />
      )}

      {/* Admin-only features */}
      <AdminOnly>
        <UserManagementPanel />
      </AdminOnly>
    </ScrollView>
  );
};
```

### **Permission-Aware Navigation**

```typescript
const NavigationDrawer = () => {
  const permissions = usePermissions(user);

  return (
    <Drawer>
      {/* User info with role */}
      <DrawerHeader>
        <Avatar.Text
          label={`${user?.firstName?.[0]}${user?.lastName?.[0]}`}
          style={{ backgroundColor: permissions.getRoleColor(user?.role || '') }}
        />
        <Text>{permissions.getRoleDisplayName(user?.role || '')}</Text>
      </DrawerHeader>

      {/* Filtered menu items */}
      {permissions.getFilteredMenuItems().map(item => (
        <DrawerItem
          key={item.id}
          label={item.title}
          icon={item.icon}
          onPress={() => navigate(item.path)}
        />
      ))}

      {/* Quick actions */}
      {permissions.canCreate('sales') && (
        <DrawerItem label="New Sale" icon="cart-plus" />
      )}
    </Drawer>
  );
};
```

## ✅ **Benefits**

### **1. Enhanced Security**
- Comprehensive permission validation
- Role-based access control
- Secure UI rendering

### **2. Better User Experience**
- Personalized dashboards
- Relevant content only
- Clear permission feedback

### **3. Maintainability**
- Centralized permission logic
- Reusable permission guards
- Easy to extend and modify

### **4. Scalability**
- Easy to add new roles
- Flexible permission system
- Performance optimized

## 🔄 **Integration with Backend**

The frontend permission system is designed to work seamlessly with the backend database service:

1. **Permission Synchronization**: Frontend permissions mirror backend permissions
2. **API Validation**: All API calls validated on backend
3. **Data Filtering**: Backend filters data based on user role
4. **Error Handling**: Consistent error messages across frontend and backend

This ensures a secure, consistent, and user-friendly experience across the entire JELPAPHARM Pharmacy Management System.
