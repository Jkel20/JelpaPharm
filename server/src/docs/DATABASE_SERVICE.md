# Database Service Documentation

## Overview

The Database Service (`server/src/config/database.ts`) is a centralized service that handles all database operations with comprehensive role-based access control (RBAC) for the JELPAPHARM Pharmacy Management System.

## Features

### 🔐 **Role-Based Access Control (RBAC)**
- **Admin**: Full system access
- **Pharmacist**: Inventory and sales management
- **Cashier**: Limited sales and inventory viewing

### 🛡️ **Security Features**
- Permission validation for all operations
- Data filtering based on user role
- Ownership validation for updates/deletes
- Comprehensive error handling

### 📊 **Database Operations**
- User management
- Inventory management
- Sales management
- Reports generation
- Alerts management
- Dashboard statistics

## User Roles & Permissions

### **Admin Role** 👑
```typescript
Permissions: {
  users: ['create', 'read', 'update', 'delete'],
  inventory: ['create', 'read', 'update', 'delete'],
  sales: ['create', 'read', 'update', 'delete', 'void'],
  reports: ['read', 'generate'],
  alerts: ['read', 'create', 'update', 'delete'],
  system: ['configure', 'backup', 'restore']
}
```

### **Pharmacist Role** 💊
```typescript
Permissions: {
  users: ['read'],
  inventory: ['create', 'read', 'update'],
  sales: ['create', 'read', 'update'],
  reports: ['read', 'generate'],
  alerts: ['read', 'create', 'update']
}
```

### **Cashier Role** 💰
```typescript
Permissions: {
  users: ['read'],
  inventory: ['read'],
  sales: ['create', 'read'],
  reports: ['read'],
  alerts: ['read']
}
```

## Usage Examples

### 1. **User Management**

#### Create User (Admin Only)
```typescript
import { dbService } from '../config/database';

const newUser = await dbService.createUser({
  firstName: 'Kwame',
  lastName: 'Mensah',
  email: 'kwame@pharmacy.com',
  phone: '+233244123456',
  password: 'SecurePass123!',
  role: 'pharmacist'
}, adminUser);
```

#### Get Users (Role-Based Filtering)
```typescript
// Admins see all user data
// Others see limited info (name, email, role, status)
const users = await dbService.getUsers(currentUser, {
  role: 'pharmacist',
  isActive: true
});
```

### 2. **Inventory Management**

#### Create Inventory Item (Pharmacist/Admin)
```typescript
const newItem = await dbService.createInventoryItem({
  name: 'Paracetamol 500mg',
  brandName: 'Panadol',
  category: 'Analgesics',
  strength: '500mg',
  dosageForm: 'Tablet',
  quantity: 100,
  unitPrice: 2.50,
  sellingPrice: 3.00,
  reorderLevel: 20,
  expiryDate: new Date('2024-12-31'),
  manufacturer: 'GSK',
  supplier: 'MedSupply Ltd'
}, currentUser);
```

#### Get Inventory Items (Role-Based Access)
```typescript
// Cashiers see limited info (name, brand, quantity, price)
// Pharmacists/Admins see full details
const items = await dbService.getInventoryItems(currentUser, {
  category: 'Antibiotics',
  inStock: true
});
```

### 3. **Sales Management**

#### Create Sale (Cashier/Pharmacist/Admin)
```typescript
const newSale = await dbService.createSale({
  customerName: 'Ama Osei',
  customerPhone: '+233244123456',
  items: [
    {
      drug: 'inventory_item_id',
      name: 'Paracetamol 500mg',
      quantity: 2,
      unitPrice: 3.00,
      totalPrice: 6.00,
      prescriptionRequired: false
    }
  ],
  subtotal: 6.00,
  tax: 0.75,
  totalAmount: 6.75,
  paymentMethod: 'mobile_money',
  paymentStatus: 'completed'
}, currentUser);
```

#### Get Sales (Role-Based Filtering)
```typescript
// Cashiers see only their sales
// Pharmacists/Admins see all sales
const sales = await dbService.getSales(currentUser, {
  paymentStatus: 'completed',
  createdAt: {
    $gte: new Date('2024-01-01'),
    $lte: new Date('2024-01-31')
  }
});
```

### 4. **Reports Generation**

#### Generate Sales Report
```typescript
const salesReport = await dbService.generateReport('sales', currentUser, {
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

#### Generate Inventory Report
```typescript
const inventoryReport = await dbService.generateReport('inventory', currentUser, {
  category: 'Antibiotics',
  includeLowStock: true
});
```

### 5. **Dashboard Statistics**

#### Get Dashboard Stats
```typescript
const stats = await dbService.getDashboardStats(currentUser);
// Returns role-appropriate statistics
```

## Middleware Integration

### **Permission Checking**
```typescript
import { checkPermission } from '../middleware/databaseAuth';

// Route with permission check
router.post('/users', 
  checkPermission('users', 'create'),
  DatabaseController.createUser
);
```

### **Role-Based Access**
```typescript
import { requireAdmin, requirePharmacistOrAdmin } from '../middleware/databaseAuth';

// Admin only route
router.delete('/users/:id', requireAdmin, DatabaseController.deleteUser);

// Pharmacist or Admin route
router.put('/inventory/:id', requirePharmacistOrAdmin, DatabaseController.updateInventoryItem);
```

### **Data Filtering**
```typescript
import { filterDataByRole } from '../middleware/databaseAuth';

// Apply role-based filters to all routes
router.use(filterDataByRole);
```

## Error Handling

### **Permission Errors**
```typescript
try {
  await dbService.createUser(userData, currentUser);
} catch (error) {
  if (error.message.includes('Insufficient permissions')) {
    // Handle permission error
    res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action'
    });
  }
}
```

### **Validation Errors**
```typescript
try {
  await dbService.updateInventoryItem(itemId, updateData, currentUser);
} catch (error) {
  if (error.name === 'ValidationError') {
    // Handle validation error
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }
}
```

## Database Models

### **User Model**
```typescript
interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: 'admin' | 'pharmacist' | 'cashier';
  isActive: boolean;
  // ... other fields
}
```

### **Inventory Model**
```typescript
interface IInventory {
  name: string;
  brandName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  expiryDate: Date;
  // ... other fields
}
```

### **Sales Model**
```typescript
interface ISales {
  receiptNumber: string;
  customerName: string;
  items: ISalesItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  cashier: ObjectId;
  // ... other fields
}
```

## Security Features

### **1. Permission Validation**
- Every database operation checks user permissions
- Role-based access control enforced at service level
- Granular permissions for different resources and actions

### **2. Data Filtering**
- Cashiers can only see their own sales
- Non-admin users see limited user information
- Role-appropriate data access

### **3. Ownership Validation**
- Users can only modify their own resources
- Admins can modify any resource
- Pharmacists can modify inventory items

### **4. Input Validation**
- All inputs validated against schemas
- Ghanaian phone number format validation
- Strong password requirements
- Email format validation

## Best Practices

### **1. Always Use the Database Service**
```typescript
// ✅ Good - Use database service
const users = await dbService.getUsers(currentUser, filters);

// ❌ Bad - Direct model access
const users = await User.find(filters);
```

### **2. Check Permissions Before Operations**
```typescript
// ✅ Good - Check permissions
if (!dbService.hasPermission(user.role, 'users', 'create')) {
  throw new Error('Insufficient permissions');
}

// ❌ Bad - No permission check
await User.create(userData);
```

### **3. Use Role-Based Filtering**
```typescript
// ✅ Good - Apply role filters
const filters = { ...queryFilters, ...req.roleFilters };
const data = await dbService.getData(currentUser, filters);

// ❌ Bad - No role filtering
const data = await dbService.getData(currentUser, queryFilters);
```

### **4. Handle Errors Properly**
```typescript
// ✅ Good - Proper error handling
try {
  const result = await dbService.operation(data, currentUser);
  res.json({ success: true, data: result });
} catch (error) {
  res.status(400).json({
    success: false,
    message: error.message
  });
}
```

## Testing

### **Unit Tests**
```typescript
describe('DatabaseService', () => {
  it('should check permissions correctly', () => {
    expect(dbService.hasPermission('admin', 'users', 'create')).toBe(true);
    expect(dbService.hasPermission('cashier', 'users', 'create')).toBe(false);
  });

  it('should filter data by role', async () => {
    const cashierUser = { role: 'cashier', _id: 'cashier_id' };
    const sales = await dbService.getSales(cashierUser);
    expect(sales.every(sale => sale.cashier.toString() === 'cashier_id')).toBe(true);
  });
});
```

## Performance Considerations

### **1. Use Indexes**
- Ensure proper database indexes for frequently queried fields
- Index user roles, sale dates, inventory categories

### **2. Pagination**
- Implement pagination for large datasets
- Use `limit` and `skip` for better performance

### **3. Caching**
- Cache frequently accessed data
- Use Redis for session and permission caching

### **4. Connection Pooling**
- Configure MongoDB connection pooling
- Monitor connection usage

## Monitoring & Logging

### **Operation Logging**
```typescript
// All database operations are logged
const logData = {
  timestamp: new Date(),
  user: req.user._id,
  operation: 'create_user',
  resource: userData,
  ip: req.ip
};
```

### **Error Monitoring**
```typescript
// Database errors are logged and monitored
mongoose.connection.on('error', (err) => {
  console.error('Database Error:', err);
  // Send to monitoring service
});
```

## Conclusion

The Database Service provides a secure, scalable, and maintainable way to handle all database operations in the JELPAPHARM Pharmacy Management System. It enforces role-based access control, ensures data integrity, and provides comprehensive error handling.

For questions or issues, please refer to the API documentation or contact the development team.
