import { Inventory } from '../models/Inventory';
import { User } from '../models/User';
import { NotificationService } from './NotificationService';
import { logger } from '../utils/logger';
import moment from 'moment';

export class AlertMonitoringService {

  /**
   * Check for low stock items and create notifications
   */
  async checkLowStockAlerts(): Promise<void> {
    try {
      const lowStockItems = await Inventory.findLowStock()
        .select('name brandName quantity reorderLevel category')
        .lean();

      if (lowStockItems.length === 0) {
        return;
      }

      // Get admin users to notify
      const adminUsers = await User.find({ 
        role: 'admin', 
        isActive: true 
      }).select('_id').lean();

      if (adminUsers.length === 0) {
        return;
      }

      // Create notifications for each admin user
      const notificationPromises = adminUsers.map(user => 
        NotificationService.sendNotification(
          user._id.toString(),
          {
            title: 'Low Stock Alert',
            message: `${lowStockItems.length} items are running low on stock`,
            type: 'low_stock',
            severity: 'medium',
            data: {
              itemCount: lowStockItems.length,
              items: lowStockItems.map((item: any) => ({
                id: item._id.toString(),
                name: item.name,
                quantity: item.quantity,
                reorderLevel: item.reorderLevel
              }))
            }
          }
        )
      );

      await Promise.all(notificationPromises);

      logger.info(`Low stock notifications sent to ${adminUsers.length} admin users for ${lowStockItems.length} items`);
    } catch (error) {
      logger.error('Error checking low stock alerts:', error);
    }
  }

  /**
   * Check for expiring items and create notifications
   */
  async checkExpiryAlerts(): Promise<void> {
    try {
      const expiryDate = moment().add(30, 'days').toDate();
      
      const expiringItems = await Inventory.find({
        expiryDate: { $lte: expiryDate, $gt: new Date() },
        isActive: true
      })
        .select('name brandName expiryDate quantity category')
        .sort({ expiryDate: 1 })
        .lean();

      if (expiringItems.length === 0) {
        return;
      }

      // Get admin and pharmacist users to notify
      const alertUsers = await User.find({ 
        role: { $in: ['admin', 'pharmacist'] }, 
        isActive: true 
      }).select('_id').lean();

      if (alertUsers.length === 0) {
        return;
      }

      // Create notifications for each user
      const notificationPromises = alertUsers.map(user => 
        NotificationService.sendNotification(
          user._id.toString(),
          {
            title: 'Expiry Warning',
            message: `${expiringItems.length} items are expiring soon`,
            type: 'expiry',
            severity: 'high',
            data: {
              itemCount: expiringItems.length,
              items: expiringItems.map(item => ({
                id: item._id.toString(),
                name: item.name,
                expiryDate: item.expiryDate,
                quantity: item.quantity
              }))
            }
          }
        )
      );

      await Promise.all(notificationPromises);

      logger.info(`Expiry notifications sent to ${alertUsers.length} users for ${expiringItems.length} items`);
    } catch (error) {
      logger.error('Error checking expiry alerts:', error);
    }
  }

  /**
   * Check for out of stock items and create critical notifications
   */
  async checkOutOfStockAlerts(): Promise<void> {
    try {
      const outOfStockItems = await Inventory.find({ 
        quantity: 0, 
        isActive: true 
      })
        .select('name brandName category lastRestocked')
        .lean();

      if (outOfStockItems.length === 0) {
        return;
      }

      // Get admin users to notify
      const adminUsers = await User.find({ 
        role: 'admin', 
        isActive: true 
      }).select('_id').lean();

      if (adminUsers.length === 0) {
        return;
      }

      // Create critical notifications for each admin user
      const notificationPromises = adminUsers.map(user => 
        NotificationService.sendNotification(
          user._id.toString(),
          {
            title: 'Critical: Out of Stock Items',
            message: `${outOfStockItems.length} items are completely out of stock and need immediate attention.`,
            type: 'low_stock',
            severity: 'critical',
            data: {
              itemCount: outOfStockItems.length,
              items: outOfStockItems.map(item => ({
                id: item._id.toString(),
                name: item.name,
                category: item.category
              }))
            }
          }
        )
      );

      await Promise.all(notificationPromises);

      logger.info(`Out of stock notifications sent to ${adminUsers.length} admin users for ${outOfStockItems.length} items`);
    } catch (error) {
      logger.error('Error checking out of stock alerts:', error);
    }
  }

  /**
   * Run all alert checks
   */
  async runAllChecks(): Promise<void> {
    await Promise.all([
      this.checkLowStockAlerts(),
      this.checkExpiryAlerts(),
      this.checkOutOfStockAlerts()
    ]);
  }

  /**
   * Start periodic monitoring (to be called from a cron job or scheduler)
   */
  async startMonitoring(): Promise<void> {
    logger.info('Starting alert monitoring service...');
    
    // Run initial check
    await this.runAllChecks();
    
    // Set up periodic checks (every 6 hours)
    setInterval(async () => {
      await this.runAllChecks();
    }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds
  }
}
