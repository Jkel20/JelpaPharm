import { Request, Response } from 'express';
import { dbService } from '../config/database';
import { IUser } from '../models/User';
import { IInventory } from '../models/Inventory';
import { ISales } from '../models/Sales';

// Extend Request interface for role-based filtering
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      roleFilters?: any;
      userRole?: string;
    }
  }
}

export class DatabaseController {
  // User Management Controllers
  static async createUser(req: Request, res: Response) {
    try {
      const userData = req.body;
      const createdBy = req.user!;

      const newUser = await dbService.createUser(userData, createdBy);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          isActive: newUser.isActive
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create user'
      });
    }
  }

  static async getUsers(req: Request, res: Response) {
    try {
      const user = req.user!;
      const filters = { ...req.query, ...req.roleFilters };

      const users = await dbService.getUsers(user, filters);

      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch users'
      });
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const updateData = req.body;
      const updatedBy = req.user!;

      const updatedUser = await dbService.updateUser(userId, updateData, updatedBy);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update user'
      });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const deletedBy = req.user!;

      await dbService.deleteUser(userId, deletedBy);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete user'
      });
    }
  }

  // Inventory Management Controllers
  static async createInventoryItem(req: Request, res: Response) {
    try {
      const itemData = req.body;
      const createdBy = req.user!;

      const newItem = await dbService.createInventoryItem(itemData, createdBy);

      res.status(201).json({
        success: true,
        message: 'Inventory item created successfully',
        data: newItem
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create inventory item'
      });
    }
  }

  static async getInventoryItems(req: Request, res: Response) {
    try {
      const user = req.user!;
      const filters = { ...req.query, ...req.roleFilters };

      const items = await dbService.getInventoryItems(user, filters);

      res.status(200).json({
        success: true,
        count: items.length,
        data: items
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch inventory items'
      });
    }
  }

  static async updateInventoryItem(req: Request, res: Response) {
    try {
      const itemId = req.params.id;
      const updateData = req.body;
      const updatedBy = req.user!;

      const updatedItem = await dbService.updateInventoryItem(itemId, updateData, updatedBy);

      res.status(200).json({
        success: true,
        message: 'Inventory item updated successfully',
        data: updatedItem
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update inventory item'
      });
    }
  }

  static async deleteInventoryItem(req: Request, res: Response) {
    try {
      const itemId = req.params.id;
      const deletedBy = req.user!;

      await dbService.deleteInventoryItem(itemId, deletedBy);

      res.status(200).json({
        success: true,
        message: 'Inventory item deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete inventory item'
      });
    }
  }

  // Sales Management Controllers
  static async createSale(req: Request, res: Response) {
    try {
      const saleData = req.body;
      const createdBy = req.user!;

      const newSale = await dbService.createSale(saleData, createdBy);

      res.status(201).json({
        success: true,
        message: 'Sale created successfully',
        data: newSale
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create sale'
      });
    }
  }

  static async getSales(req: Request, res: Response) {
    try {
      const user = req.user!;
      const filters = { ...req.query, ...req.roleFilters };

      const sales = await dbService.getSales(user, filters);

      res.status(200).json({
        success: true,
        count: sales.length,
        data: sales
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch sales'
      });
    }
  }

  static async updateSale(req: Request, res: Response) {
    try {
      const saleId = req.params.id;
      const updateData = req.body;
      const updatedBy = req.user!;

      const updatedSale = await dbService.updateSale(saleId, updateData, updatedBy);

      res.status(200).json({
        success: true,
        message: 'Sale updated successfully',
        data: updatedSale
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update sale'
      });
    }
  }

  static async voidSale(req: Request, res: Response) {
    try {
      const saleId = req.params.id;
      const { voidReason } = req.body;
      const voidedBy = req.user!;

      const voidedSale = await dbService.voidSale(saleId, voidReason, voidedBy);

      res.status(200).json({
        success: true,
        message: 'Sale voided successfully',
        data: voidedSale
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to void sale'
      });
    }
  }

  // Reports Controllers
  static async generateReport(req: Request, res: Response) {
    try {
      const { reportType } = req.params;
      const user = req.user!;
      const filters = req.query;

      const reportData = await dbService.generateReport(reportType, user, filters);

      res.status(200).json({
        success: true,
        message: `${reportType} report generated successfully`,
        data: reportData
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate report'
      });
    }
  }

  // Dashboard Controllers
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const user = req.user!;

      const stats = await dbService.getDashboardStats(user);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch dashboard stats'
      });
    }
  }

  // Alerts Controllers
  static async createAlert(req: Request, res: Response) {
    try {
      const alertData = req.body;
      const createdBy = req.user!;

      const newAlert = await dbService.createAlert(alertData, createdBy);

      res.status(201).json({
        success: true,
        message: 'Alert created successfully',
        data: newAlert
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create alert'
      });
    }
  }

  static async getAlerts(req: Request, res: Response) {
    try {
      const user = req.user!;
      const filters = { ...req.query, ...req.roleFilters };

      const alerts = await dbService.getAlerts(user, filters);

      res.status(200).json({
        success: true,
        count: alerts.length,
        data: alerts
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch alerts'
      });
    }
  }

  // Search and Filter Controllers
  static async searchInventory(req: Request, res: Response) {
    try {
      const user = req.user!;
      const { query, category, inStock } = req.query;

      const filters: any = { ...req.roleFilters };

      if (query) {
        filters.$or = [
          { name: { $regex: query, $options: 'i' } },
          { brandName: { $regex: query, $options: 'i' } },
          { genericName: { $regex: query, $options: 'i' } }
        ];
      }

      if (category) {
        filters.category = category;
      }

      if (inStock === 'true') {
        filters.quantity = { $gt: 0 };
      }

      const items = await dbService.getInventoryItems(user, filters);

      res.status(200).json({
        success: true,
        count: items.length,
        data: items
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to search inventory'
      });
    }
  }

  static async getLowStockItems(req: Request, res: Response) {
    try {
      const user = req.user!;
      const filters = { ...req.roleFilters };

      const items = await dbService.getInventoryItems(user, {
        ...filters,
        $expr: { $lte: ['$quantity', '$reorderLevel'] }
      });

      res.status(200).json({
        success: true,
        count: items.length,
        data: items
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch low stock items'
      });
    }
  }

  static async getExpiringItems(req: Request, res: Response) {
    try {
      const user = req.user!;
      const { days = 30 } = req.query;
      const filters = { ...req.roleFilters };

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + Number(days));

      const items = await dbService.getInventoryItems(user, {
        ...filters,
        expiryDate: { $lte: expiryDate, $gte: new Date() }
      });

      res.status(200).json({
        success: true,
        count: items.length,
        data: items
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch expiring items'
      });
    }
  }

  // Bulk Operations Controllers
  static async bulkUpdateInventory(req: Request, res: Response) {
    try {
      const user = req.user!;
      const { items } = req.body;

      if (!Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: 'Items must be an array'
        });
      }

      const results = [];
      for (const item of items) {
        try {
          const updatedItem = await dbService.updateInventoryItem(
            item.id,
            item.updateData,
            user
          );
          results.push({ id: item.id, success: true, data: updatedItem });
        } catch (error) {
          results.push({
            id: item.id,
            success: false,
            error: error instanceof Error ? error.message : 'Update failed'
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Bulk update completed',
        data: results
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to perform bulk update'
      });
    }
  }

  // System Health Check
  static async healthCheck(req: Request, res: Response) {
    try {
      const user = req.user!;
      
      // Test database connectivity
      const stats = await dbService.getDashboardStats(user);

      res.status(200).json({
        success: true,
        message: 'System is healthy',
        data: {
          timestamp: new Date(),
          user: {
            id: user._id,
            role: user.role,
            isActive: user.isActive
          },
          database: 'connected',
          permissions: {
            canManageUsers: dbService.hasPermission(user.role as any, 'users', 'create'),
            canManageInventory: dbService.hasPermission(user.role as any, 'inventory', 'create'),
            canManageSales: dbService.hasPermission(user.role as any, 'sales', 'create'),
            canGenerateReports: dbService.hasPermission(user.role as any, 'reports', 'generate')
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'System health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default DatabaseController;
