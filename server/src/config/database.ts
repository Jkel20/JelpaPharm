import mongoose from 'mongoose';
import { IUser } from '../models/User';
import { IInventory } from '../models/Inventory';
import { ISales } from '../models/Sales';
import { ISupplier, IPurchaseOrder } from '../models/Supplier';
import { ICustomer, ILoyaltyTransaction } from '../models/Customer';
import { IPrescription, IPrescriptionRefill } from '../models/Prescription';

// Database connection configuration
const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI!);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// User roles and permissions
export enum UserRole {
  ADMIN = 'admin',
  PHARMACIST = 'pharmacist',
  CASHIER = 'cashier'
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface RolePermissions {
  [key: string]: Permission[];
}

// Define role-based permissions with new resources
export const ROLE_PERMISSIONS: RolePermissions = {
  [UserRole.ADMIN]: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'sales', actions: ['create', 'read', 'update', 'delete', 'void'] },
    { resource: 'reports', actions: ['read', 'generate'] },
    { resource: 'alerts', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'system', actions: ['configure', 'backup', 'restore'] },
    { resource: 'suppliers', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'purchase-orders', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'customers', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'loyalty-transactions', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'prescriptions', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'prescription-refills', actions: ['create', 'read', 'update', 'delete'] }
  ],
  [UserRole.PHARMACIST]: [
    { resource: 'users', actions: ['read'] },
    { resource: 'inventory', actions: ['create', 'read', 'update'] },
    { resource: 'sales', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['read', 'generate'] },
    { resource: 'alerts', actions: ['read', 'create', 'update'] },
    { resource: 'suppliers', actions: ['read'] },
    { resource: 'purchase-orders', actions: ['read'] },
    { resource: 'customers', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'loyalty-transactions', actions: ['create', 'read', 'update'] },
    { resource: 'prescriptions', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'prescription-refills', actions: ['create', 'read', 'update', 'delete'] }
  ],
  [UserRole.CASHIER]: [
    { resource: 'users', actions: ['read'] },
    { resource: 'inventory', actions: ['read'] },
    { resource: 'sales', actions: ['create', 'read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'alerts', actions: ['read'] },
    { resource: 'suppliers', actions: ['read'] },
    { resource: 'purchase-orders', actions: ['read'] },
    { resource: 'customers', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'loyalty-transactions', actions: ['create', 'read', 'update'] },
    { resource: 'prescriptions', actions: ['read'] }
  ]
};

// Database service class for centralized operations
export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Check if user has permission for specific action
  public hasPermission(userRole: UserRole, resource: string, action: string): boolean {
    const permissions = ROLE_PERMISSIONS[userRole];
    if (!permissions) return false;

    const resourcePermission = permissions.find(p => p.resource === resource);
    if (!resourcePermission) return false;

    return resourcePermission.actions.includes(action);
  }

  // User Management Operations
  public async createUser(userData: Partial<IUser>, createdBy: IUser): Promise<IUser> {
    if (!this.hasPermission(createdBy.role as UserRole, 'users', 'create')) {
      throw new Error('Insufficient permissions to create users');
    }

    const User = mongoose.model<IUser>('User');
    return await User.create(userData);
  }

  public async getUsers(user: IUser, filters: any = {}): Promise<IUser[]> {
    if (!this.hasPermission(user.role as UserRole, 'users', 'read')) {
      throw new Error('Insufficient permissions to view users');
    }

    const User = mongoose.model<IUser>('User');
    let query = User.find(filters);

    // Admins can see all users, others see limited info
    if (user.role !== UserRole.ADMIN) {
      query = query.select('firstName lastName email phone role isActive createdAt');
    }

    return await query.exec();
  }

  public async updateUser(userId: string, updateData: Partial<IUser>, updatedBy: IUser): Promise<IUser> {
    if (!this.hasPermission(updatedBy.role as UserRole, 'users', 'update')) {
      throw new Error('Insufficient permissions to update users');
    }

    const User = mongoose.model<IUser>('User');
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }

  public async deleteUser(userId: string, deletedBy: IUser): Promise<void> {
    if (!this.hasPermission(deletedBy.role as UserRole, 'users', 'delete')) {
      throw new Error('Insufficient permissions to delete users');
    }

    const User = mongoose.model<IUser>('User');
    await User.findByIdAndDelete(userId);
  }

  // Inventory Management Operations
  public async createInventoryItem(itemData: Partial<IInventory>, createdBy: IUser): Promise<IInventory> {
    if (!this.hasPermission(createdBy.role as UserRole, 'inventory', 'create')) {
      throw new Error('Insufficient permissions to create inventory items');
    }

    const Inventory = mongoose.model<IInventory>('Inventory');
    return await Inventory.create({
      ...itemData,
      createdBy: createdBy._id
    });
  }

  public async getInventoryItems(user: IUser, filters: any = {}): Promise<IInventory[]> {
    if (!this.hasPermission(user.role as UserRole, 'inventory', 'read')) {
      throw new Error('Insufficient permissions to view inventory');
    }

    const Inventory = mongoose.model<IInventory>('Inventory');
    let query = Inventory.find(filters);

    // Cashiers see limited inventory info
    if (user.role === UserRole.CASHIER) {
      query = query.select('name brandName quantity unitPrice sellingPrice isActive barcode');
    }

    return await query.exec();
  }

  public async getInventoryByBarcode(barcode: string, user: IUser): Promise<IInventory | null> {
    if (!this.hasPermission(user.role as UserRole, 'inventory', 'read')) {
      throw new Error('Insufficient permissions to view inventory');
    }

    const Inventory = mongoose.model<IInventory>('Inventory');
    return await Inventory.findOne({ barcode, isActive: true });
  }

  public async updateInventoryItem(itemId: string, updateData: Partial<IInventory>, updatedBy: IUser): Promise<IInventory> {
    if (!this.hasPermission(updatedBy.role as UserRole, 'inventory', 'update')) {
      throw new Error('Insufficient permissions to update inventory items');
    }

    const Inventory = mongoose.model<IInventory>('Inventory');
    const updatedItem = await Inventory.findByIdAndUpdate(itemId, {
      ...updateData,
      updatedBy: updatedBy._id
    }, { new: true, runValidators: true });
    if (!updatedItem) {
      throw new Error('Inventory item not found');
    }
    return updatedItem;
  }

  public async deleteInventoryItem(itemId: string, deletedBy: IUser): Promise<void> {
    if (!this.hasPermission(deletedBy.role as UserRole, 'inventory', 'delete')) {
      throw new Error('Insufficient permissions to delete inventory items');
    }

    const Inventory = mongoose.model<IInventory>('Inventory');
    await Inventory.findByIdAndDelete(itemId);
  }

  // Sales Management Operations
  public async createSale(saleData: Partial<ISales>, createdBy: IUser): Promise<ISales> {
    if (!this.hasPermission(createdBy.role as UserRole, 'sales', 'create')) {
      throw new Error('Insufficient permissions to create sales');
    }

    const Sales = mongoose.model<ISales>('Sales');
    const sale = await Sales.create({
      ...saleData,
      cashier: createdBy._id
    });

    // Update inventory quantities
    await this.updateInventoryQuantities(sale.items, createdBy);

    // Update customer loyalty if customer exists
    if (saleData.customerName) {
      // Find customer by name and update loyalty
      const Customer = mongoose.model<ICustomer>('Customer');
      const customer = await Customer.findOne({ 
        firstName: { $regex: new RegExp(saleData.customerName.split(' ')[0], 'i') },
        lastName: { $regex: new RegExp(saleData.customerName.split(' ')[1] || '', 'i') }
      }) as ICustomer | null;
      
      if (customer) {
        await this.updateCustomerLoyalty((customer._id as mongoose.Types.ObjectId).toString(), sale.totalAmount, createdBy);
      }
    }

    return sale;
  }

  public async getSales(user: IUser, filters: any = {}): Promise<ISales[]> {
    if (!this.hasPermission(user.role as UserRole, 'sales', 'read')) {
      throw new Error('Insufficient permissions to view sales');
    }

    const Sales = mongoose.model<ISales>('Sales');
    let query = Sales.find(filters).populate('cashier', 'firstName lastName');

    // Cashiers can only see their own sales
    if (user.role === UserRole.CASHIER) {
      query = query.where('cashier', user._id);
    }

    return await query.exec();
  }

  public async updateSale(saleId: string, updateData: Partial<ISales>, updatedBy: IUser): Promise<ISales> {
    if (!this.hasPermission(updatedBy.role as UserRole, 'sales', 'update')) {
      throw new Error('Insufficient permissions to update sales');
    }

    const Sales = mongoose.model<ISales>('Sales');
    const updatedSale = await Sales.findByIdAndUpdate(saleId, {
      ...updateData,
      updatedBy: updatedBy._id
    }, { new: true, runValidators: true });
    if (!updatedSale) {
      throw new Error('Sale not found');
    }
    return updatedSale;
  }

  public async voidSale(saleId: string, voidReason: string, voidedBy: IUser): Promise<ISales> {
    if (!this.hasPermission(voidedBy.role as UserRole, 'sales', 'void')) {
      throw new Error('Insufficient permissions to void sales');
    }

    const Sales = mongoose.model<ISales>('Sales');
    const voidedSale = await Sales.findByIdAndUpdate(saleId, {
      isVoid: true,
      voidReason,
      voidedBy: voidedBy._id,
      voidedAt: new Date()
    }, { new: true });
    if (!voidedSale) {
      throw new Error('Sale not found');
    }
    return voidedSale;
  }

  // Supplier Management Operations
  public async createSupplier(supplierData: Partial<ISupplier>, createdBy: IUser): Promise<ISupplier> {
    if (!this.hasPermission(createdBy.role as UserRole, 'suppliers', 'create')) {
      throw new Error('Insufficient permissions to create suppliers');
    }

    const Supplier = mongoose.model<ISupplier>('Supplier');
    return await Supplier.create({
      ...supplierData,
      createdBy: createdBy._id
    });
  }

  public async getSuppliers(user: IUser, filters: any = {}): Promise<ISupplier[]> {
    if (!this.hasPermission(user.role as UserRole, 'suppliers', 'read')) {
      throw new Error('Insufficient permissions to view suppliers');
    }

    const Supplier = mongoose.model<ISupplier>('Supplier');
    return await Supplier.find(filters).exec();
  }

  public async updateSupplier(supplierId: string, updateData: Partial<ISupplier>, updatedBy: IUser): Promise<ISupplier> {
    if (!this.hasPermission(updatedBy.role as UserRole, 'suppliers', 'update')) {
      throw new Error('Insufficient permissions to update suppliers');
    }

    const Supplier = mongoose.model<ISupplier>('Supplier');
    const updatedSupplier = await Supplier.findByIdAndUpdate(supplierId, {
      ...updateData,
      updatedBy: updatedBy._id
    }, { new: true, runValidators: true });
    if (!updatedSupplier) {
      throw new Error('Supplier not found');
    }
    return updatedSupplier;
  }

  public async deleteSupplier(supplierId: string, deletedBy: IUser): Promise<void> {
    if (!this.hasPermission(deletedBy.role as UserRole, 'suppliers', 'delete')) {
      throw new Error('Insufficient permissions to delete suppliers');
    }

    const Supplier = mongoose.model<ISupplier>('Supplier');
    await Supplier.findByIdAndDelete(supplierId);
  }

  // Purchase Order Management Operations
  public async createPurchaseOrder(poData: Partial<IPurchaseOrder>, createdBy: IUser): Promise<IPurchaseOrder> {
    if (!this.hasPermission(createdBy.role as UserRole, 'purchase-orders', 'create')) {
      throw new Error('Insufficient permissions to create purchase orders');
    }

    const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder');
    return await PurchaseOrder.create({
      ...poData,
      orderedBy: createdBy._id
    });
  }

  public async getPurchaseOrders(user: IUser, filters: any = {}): Promise<IPurchaseOrder[]> {
    if (!this.hasPermission(user.role as UserRole, 'purchase-orders', 'read')) {
      throw new Error('Insufficient permissions to view purchase orders');
    }

    const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder');
    return await PurchaseOrder.find(filters)
      .populate('supplier', 'name contactPerson')
      .populate('orderedBy', 'firstName lastName')
      .exec();
  }

  public async updatePurchaseOrder(poId: string, updateData: Partial<IPurchaseOrder>, updatedBy: IUser): Promise<IPurchaseOrder> {
    if (!this.hasPermission(updatedBy.role as UserRole, 'purchase-orders', 'update')) {
      throw new Error('Insufficient permissions to update purchase orders');
    }

    const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder');
    const updatedPO = await PurchaseOrder.findByIdAndUpdate(poId, {
      ...updateData,
      updatedBy: updatedBy._id
    }, { new: true, runValidators: true });
    if (!updatedPO) {
      throw new Error('Purchase order not found');
    }
    return updatedPO;
  }

  public async deletePurchaseOrder(poId: string, deletedBy: IUser): Promise<void> {
    if (!this.hasPermission(deletedBy.role as UserRole, 'purchase-orders', 'delete')) {
      throw new Error('Insufficient permissions to delete purchase orders');
    }

    const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder');
    await PurchaseOrder.findByIdAndDelete(poId);
  }

  // Customer Management Operations
  public async createCustomer(customerData: Partial<ICustomer>, createdBy: IUser): Promise<ICustomer> {
    if (!this.hasPermission(createdBy.role as UserRole, 'customers', 'create')) {
      throw new Error('Insufficient permissions to create customers');
    }

    const Customer = mongoose.model<ICustomer>('Customer');
    return await Customer.create({
      ...customerData,
      createdBy: createdBy._id
    });
  }

  public async getCustomers(user: IUser, filters: any = {}): Promise<ICustomer[]> {
    if (!this.hasPermission(user.role as UserRole, 'customers', 'read')) {
      throw new Error('Insufficient permissions to view customers');
    }

    const Customer = mongoose.model<ICustomer>('Customer');
    return await Customer.find(filters).exec();
  }

  public async getCustomerById(customerId: string, user: IUser): Promise<ICustomer | null> {
    if (!this.hasPermission(user.role as UserRole, 'customers', 'read')) {
      throw new Error('Insufficient permissions to view customers');
    }

    const Customer = mongoose.model<ICustomer>('Customer');
    return await Customer.findById(customerId).exec();
  }

  public async updateCustomer(customerId: string, updateData: Partial<ICustomer>, updatedBy: IUser): Promise<ICustomer> {
    if (!this.hasPermission(updatedBy.role as UserRole, 'customers', 'update')) {
      throw new Error('Insufficient permissions to update customers');
    }

    const Customer = mongoose.model<ICustomer>('Customer');
    const updatedCustomer = await Customer.findByIdAndUpdate(customerId, {
      ...updateData,
      updatedBy: updatedBy._id
    }, { new: true, runValidators: true });
    if (!updatedCustomer) {
      throw new Error('Customer not found');
    }
    return updatedCustomer;
  }

  public async deleteCustomer(customerId: string, deletedBy: IUser): Promise<void> {
    if (!this.hasPermission(deletedBy.role as UserRole, 'customers', 'delete')) {
      throw new Error('Insufficient permissions to delete customers');
    }

    const Customer = mongoose.model<ICustomer>('Customer');
    await Customer.findByIdAndDelete(customerId);
  }

  // Loyalty Transaction Operations
  public async createLoyaltyTransaction(transactionData: Partial<ILoyaltyTransaction>, createdBy: IUser): Promise<ILoyaltyTransaction> {
    if (!this.hasPermission(createdBy.role as UserRole, 'loyalty-transactions', 'create')) {
      throw new Error('Insufficient permissions to create loyalty transactions');
    }

    const LoyaltyTransaction = mongoose.model<ILoyaltyTransaction>('LoyaltyTransaction');
    return await LoyaltyTransaction.create({
      ...transactionData,
      createdBy: createdBy._id
    });
  }

  public async getLoyaltyTransactions(user: IUser, filters: any = {}): Promise<ILoyaltyTransaction[]> {
    if (!this.hasPermission(user.role as UserRole, 'loyalty-transactions', 'read')) {
      throw new Error('Insufficient permissions to view loyalty transactions');
    }

    const LoyaltyTransaction = mongoose.model<ILoyaltyTransaction>('LoyaltyTransaction');
    return await LoyaltyTransaction.find(filters)
      .populate('customer', 'firstName lastName customerId')
      .populate('createdBy', 'firstName lastName')
      .exec();
  }

  // Prescription Management Operations
  public async createPrescription(prescriptionData: Partial<IPrescription>, createdBy: IUser): Promise<IPrescription> {
    if (!this.hasPermission(createdBy.role as UserRole, 'prescriptions', 'create')) {
      throw new Error('Insufficient permissions to create prescriptions');
    }

    const Prescription = mongoose.model<IPrescription>('Prescription');
    return await Prescription.create({
      ...prescriptionData,
      pharmacist: createdBy._id
    });
  }

  public async getPrescriptions(user: IUser, filters: any = {}): Promise<IPrescription[]> {
    if (!this.hasPermission(user.role as UserRole, 'prescriptions', 'read')) {
      throw new Error('Insufficient permissions to view prescriptions');
    }

    const Prescription = mongoose.model<IPrescription>('Prescription');
    let query = Prescription.find(filters)
      .populate('customer', 'firstName lastName customerId phone')
      .populate('pharmacist', 'firstName lastName');

    // Cashiers can only see basic prescription info
    if (user.role === UserRole.CASHIER) {
      query = query.select('prescriptionNumber customer prescribedBy status prescriptionDate expiryDate');
    }

    return await query.exec();
  }

  public async updatePrescription(prescriptionId: string, updateData: Partial<IPrescription>, updatedBy: IUser): Promise<IPrescription> {
    if (!this.hasPermission(updatedBy.role as UserRole, 'prescriptions', 'update')) {
      throw new Error('Insufficient permissions to update prescriptions');
    }

    const Prescription = mongoose.model<IPrescription>('Prescription');
    const updatedPrescription = await Prescription.findByIdAndUpdate(prescriptionId, {
      ...updateData,
      updatedBy: updatedBy._id
    }, { new: true, runValidators: true });
    if (!updatedPrescription) {
      throw new Error('Prescription not found');
    }
    return updatedPrescription;
  }

  public async deletePrescription(prescriptionId: string, deletedBy: IUser): Promise<void> {
    if (!this.hasPermission(deletedBy.role as UserRole, 'prescriptions', 'delete')) {
      throw new Error('Insufficient permissions to delete prescriptions');
    }

    const Prescription = mongoose.model<IPrescription>('Prescription');
    await Prescription.findByIdAndDelete(prescriptionId);
  }

  public async dispensePrescription(prescriptionId: string, dispensedBy: IUser): Promise<IPrescription> {
    if (!this.hasPermission(dispensedBy.role as UserRole, 'prescriptions', 'update')) {
      throw new Error('Insufficient permissions to dispense prescriptions');
    }

    const Prescription = mongoose.model<IPrescription>('Prescription');
    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    // Update prescription status and dispensing info
    prescription.status = 'dispensed';
    prescription.dispensedDate = new Date();
    
    // Update items to dispensed
    prescription.items.forEach(item => {
      if (!item.isDispensed) {
        item.isDispensed = true;
        item.dispensedDate = new Date();
        item.dispensedBy = dispensedBy._id as mongoose.Types.ObjectId;
      }
    });

    return await prescription.save();
  }

  // Prescription Refill Operations
  public async createPrescriptionRefill(refillData: Partial<IPrescriptionRefill>, createdBy: IUser): Promise<IPrescriptionRefill> {
    if (!this.hasPermission(createdBy.role as UserRole, 'prescription-refills', 'create')) {
      throw new Error('Insufficient permissions to create prescription refills');
    }

    const PrescriptionRefill = mongoose.model<IPrescriptionRefill>('PrescriptionRefill');
    return await PrescriptionRefill.create({
      ...refillData,
      pharmacist: createdBy._id
    });
  }

  public async getPrescriptionRefills(user: IUser, filters: any = {}): Promise<IPrescriptionRefill[]> {
    if (!this.hasPermission(user.role as UserRole, 'prescription-refills', 'read')) {
      throw new Error('Insufficient permissions to view prescription refills');
    }

    const PrescriptionRefill = mongoose.model<IPrescriptionRefill>('PrescriptionRefill');
    return await PrescriptionRefill.find(filters)
      .populate('originalPrescription', 'prescriptionNumber customer')
      .populate('customer', 'firstName lastName customerId')
      .populate('pharmacist', 'firstName lastName')
      .exec();
  }

  // Reports Operations
  public async generateReport(reportType: string, user: IUser, filters: any = {}): Promise<any> {
    if (!this.hasPermission(user.role as UserRole, 'reports', 'generate')) {
      throw new Error('Insufficient permissions to generate reports');
    }

    switch (reportType) {
      case 'sales':
        return await this.generateSalesReport(user, filters);
      case 'inventory':
        return await this.generateInventoryReport(user, filters);
      case 'users':
        return await this.generateUsersReport(user, filters);
      case 'suppliers':
        return await this.generateSuppliersReport(user, filters);
      case 'customers':
        return await this.generateCustomersReport(user, filters);
      case 'prescriptions':
        return await this.generatePrescriptionsReport(user, filters);
      default:
        throw new Error('Invalid report type');
    }
  }

  // Alerts Operations
  public async createAlert(alertData: any, createdBy: IUser): Promise<any> {
    if (!this.hasPermission(createdBy.role as UserRole, 'alerts', 'create')) {
      throw new Error('Insufficient permissions to create alerts');
    }

    // Implementation for alert creation
    return { message: 'Alert created successfully' };
  }

  public async getAlerts(user: IUser, filters: any = {}): Promise<any[]> {
    if (!this.hasPermission(user.role as UserRole, 'alerts', 'read')) {
      throw new Error('Insufficient permissions to view alerts');
    }

    // Implementation for getting alerts
    return [];
  }

  // Dashboard Statistics
  public async getDashboardStats(user: IUser): Promise<any> {
    const stats: any = {};

    if (this.hasPermission(user.role as UserRole, 'sales', 'read')) {
      stats.sales = await this.getSalesStats(user);
    }

    if (this.hasPermission(user.role as UserRole, 'inventory', 'read')) {
      stats.inventory = await this.getInventoryStats(user);
    }

    if (this.hasPermission(user.role as UserRole, 'alerts', 'read')) {
      stats.alerts = await this.getAlertsStats(user);
    }

    if (this.hasPermission(user.role as UserRole, 'suppliers', 'read')) {
      stats.suppliers = await this.getSuppliersStats(user);
    }

    if (this.hasPermission(user.role as UserRole, 'customers', 'read')) {
      stats.customers = await this.getCustomersStats(user);
    }

    if (this.hasPermission(user.role as UserRole, 'prescriptions', 'read')) {
      stats.prescriptions = await this.getPrescriptionsStats(user);
    }

    return stats;
  }

  // Private helper methods
  private async updateInventoryQuantities(items: any[], user: IUser): Promise<void> {
    const Inventory = mongoose.model<IInventory>('Inventory');
    
    for (const item of items) {
      await Inventory.findByIdAndUpdate(item.drug, {
        $inc: { quantity: -item.quantity, totalSold: item.quantity },
        $set: { lastRestocked: new Date() }
      });
    }
  }

  private async updateCustomerLoyalty(customerId: string, amount: number, user: IUser): Promise<void> {
    const Customer = mongoose.model<ICustomer>('Customer');
    const LoyaltyTransaction = mongoose.model<ILoyaltyTransaction>('LoyaltyTransaction');
    
    const customer = await Customer.findById(customerId);
    if (!customer) return;

    // Calculate points (1 point per GH₵1 spent)
    const pointsEarned = Math.floor(amount);
    
    // Update customer loyalty
    customer.loyaltyProgram.points += pointsEarned;
    customer.loyaltyProgram.totalSpent += amount;
    customer.loyaltyProgram.totalPurchases += 1;
    customer.loyaltyProgram.lastPurchaseDate = new Date();
    customer.calculateLoyaltyTier();
    
    await customer.save();

    // Create loyalty transaction
    await LoyaltyTransaction.create({
      customer: customerId,
      type: 'earned',
      points: pointsEarned,
      description: `Points earned from purchase of GH₵${amount.toFixed(2)}`,
      transactionDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
      createdBy: user._id
    });
  }

  private async generateSalesReport(user: IUser, filters: any): Promise<any> {
    const Sales = mongoose.model<ISales>('Sales');
    let query = Sales.aggregate([
      { $match: { isVoid: false, ...filters } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$totalAmount' }
        }
      }
    ]);

    if (user.role === UserRole.CASHIER) {
      query = Sales.aggregate([
        { $match: { cashier: user._id, isVoid: false, ...filters } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' },
            totalTransactions: { $sum: 1 },
            averageTransaction: { $avg: '$totalAmount' }
          }
        }
      ]);
    }

    return await query.exec();
  }

  private async generateInventoryReport(user: IUser, filters: any): Promise<any> {
    const Inventory = mongoose.model<IInventory>('Inventory');
    return await Inventory.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          lowStockItems: {
            $sum: {
              $cond: [{ $lte: ['$quantity', '$reorderLevel'] }, 1, 0]
            }
          },
          expiringItems: {
            $sum: {
              $cond: [
                { $lte: ['$expiryDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] },
                1, 0
              ]
            }
          }
        }
      }
    ]);
  }

  private async generateUsersReport(user: IUser, filters: any): Promise<any> {
    if (!this.hasPermission(user.role as UserRole, 'users', 'read')) {
      throw new Error('Insufficient permissions to generate users report');
    }

    const User = mongoose.model<IUser>('User');
    return await User.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          inactiveUsers: {
            $sum: { $cond: ['$isActive', 0, 1] }
          }
        }
      }
    ]);
  }

  private async generateSuppliersReport(user: IUser, filters: any): Promise<any> {
    if (!this.hasPermission(user.role as UserRole, 'suppliers', 'read')) {
      throw new Error('Insufficient permissions to generate suppliers report');
    }

    const Supplier = mongoose.model<ISupplier>('Supplier');
    return await Supplier.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalSuppliers: { $sum: 1 },
          activeSuppliers: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);
  }

  private async generateCustomersReport(user: IUser, filters: any): Promise<any> {
    if (!this.hasPermission(user.role as UserRole, 'customers', 'read')) {
      throw new Error('Insufficient permissions to generate customers report');
    }

    const Customer = mongoose.model<ICustomer>('Customer');
    return await Customer.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          totalLoyaltyPoints: { $sum: '$loyaltyProgram.points' },
          averageSpent: { $avg: '$loyaltyProgram.totalSpent' }
        }
      }
    ]);
  }

  private async generatePrescriptionsReport(user: IUser, filters: any): Promise<any> {
    if (!this.hasPermission(user.role as UserRole, 'prescriptions', 'read')) {
      throw new Error('Insufficient permissions to generate prescriptions report');
    }

    const Prescription = mongoose.model<IPrescription>('Prescription');
    return await Prescription.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalPrescriptions: { $sum: 1 },
          activePrescriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          dispensedPrescriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'dispensed'] }, 1, 0] }
          },
          expiredPrescriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
          }
        }
      }
    ]);
  }

  private async getSalesStats(user: IUser): Promise<any> {
    const Sales = mongoose.model<ISales>('Sales');
    let matchStage: any = {
      isVoid: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    };

    if (user.role === UserRole.CASHIER) {
      matchStage.cashier = user._id;
    }

    return await Sales.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalSales: { $sum: 1 }
        }
      }
    ]);
  }

  private async getInventoryStats(user: IUser): Promise<any> {
    const Inventory = mongoose.model<IInventory>('Inventory');
    return await Inventory.aggregate([
      {
        $group: {
          _id: null,
          lowStockItems: {
            $sum: {
              $cond: [{ $lte: ['$quantity', '$reorderLevel'] }, 1, 0]
            }
          },
          expiringItems: {
            $sum: {
              $cond: [
                { $lte: ['$expiryDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] },
                1, 0
              ]
            }
          }
        }
      }
    ]);
  }

  private async getSuppliersStats(user: IUser): Promise<any> {
    const Supplier = mongoose.model<ISupplier>('Supplier');
    return await Supplier.aggregate([
      {
        $group: {
          _id: null,
          totalSuppliers: { $sum: 1 },
          activeSuppliers: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);
  }

  private async getCustomersStats(user: IUser): Promise<any> {
    const Customer = mongoose.model<ICustomer>('Customer');
    return await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          totalLoyaltyPoints: { $sum: '$loyaltyProgram.points' }
        }
      }
    ]);
  }

  private async getPrescriptionsStats(user: IUser): Promise<any> {
    const Prescription = mongoose.model<IPrescription>('Prescription');
    return await Prescription.aggregate([
      {
        $group: {
          _id: null,
          totalPrescriptions: { $sum: 1 },
          activePrescriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          dispensedPrescriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'dispensed'] }, 1, 0] }
          }
        }
      }
    ]);
  }

  private async getAlertsStats(user: IUser): Promise<any> {
    // Implementation for alerts statistics
    return {
      totalAlerts: 0,
      unreadAlerts: 0
    };
  }
}

// Export database utilities
export const dbService = DatabaseService.getInstance();

// Database connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed through app termination');
  process.exit(0);
});

export default connectDB;
