import { Notification, INotification } from '../models/Notification';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { sendPushNotification } from '../utils/pushNotifications';

export interface NotificationData {
  title: string;
  message: string;
  type: 'low_stock' | 'expiry' | 'sale' | 'system' | 'prescription' | 'customer' | 'supplier';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  data?: {
    itemId?: string;
    itemName?: string;
    quantity?: number;
    expiryDate?: Date;
    saleId?: string;
    customerId?: string;
    prescriptionId?: string;
    supplierId?: string;
    itemCount?: number;
    items?: any[];
  };
}

export class NotificationService {
  /**
   * Create and send notification to a single user
   */
  static async sendNotification(
    userId: string,
    notificationData: NotificationData
  ): Promise<INotification> {
    try {
      // Create notification in database
      const notification = new Notification({
        recipient: userId,
        ...notificationData,
        severity: notificationData.severity || 'medium'
      });

      await notification.save();

      // Send push notification
      await this.sendPushNotification(userId, notification);

      logger.info(`Notification sent to user ${userId}: ${notificationData.title}`);
      return notification;
    } catch (error) {
      logger.error(`Error sending notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   */
  static async sendNotificationToUsers(
    userIds: string[],
    notificationData: NotificationData
  ): Promise<INotification[]> {
    try {
      const notifications: INotification[] = [];

      for (const userId of userIds) {
        const notification = await this.sendNotification(userId, notificationData);
        notifications.push(notification);
      }

      logger.info(`Notifications sent to ${userIds.length} users: ${notificationData.title}`);
      return notifications;
    } catch (error) {
      logger.error('Error sending notifications to multiple users:', error);
      throw error;
    }
  }

  /**
   * Send notification to users by role
   */
  static async sendNotificationToRole(
    role: string,
    notificationData: NotificationData
  ): Promise<INotification[]> {
    try {
      const users = await User.find({ role, isActive: true }).select('_id');
      const userIds = users.map(user => (user._id as any).toString());

      return await this.sendNotificationToUsers(userIds, notificationData);
    } catch (error) {
      logger.error(`Error sending notification to role ${role}:`, error);
      throw error;
    }
  }

  /**
   * Send low stock notification
   */
  static async sendLowStockNotification(
    itemName: string,
    currentQuantity: number,
    reorderLevel: number
  ): Promise<void> {
    const notificationData: NotificationData = {
      title: 'Low Stock Alert',
      message: `${itemName} is running low on stock. Current quantity: ${currentQuantity}, Reorder level: ${reorderLevel}`,
      type: 'low_stock',
      severity: currentQuantity === 0 ? 'critical' : 'high',
      data: {
        itemName,
        quantity: currentQuantity
      }
    };

    // Send to admin and pharmacist users
    await this.sendNotificationToRole('admin', notificationData);
    await this.sendNotificationToRole('pharmacist', notificationData);
  }

  /**
   * Send expiry notification
   */
  static async sendExpiryNotification(
    itemName: string,
    expiryDate: Date,
    daysUntilExpiry: number
  ): Promise<void> {
    const severity = daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 30 ? 'high' : 'medium';
    
    const notificationData: NotificationData = {
      title: 'Expiry Warning',
      message: `${itemName} expires in ${daysUntilExpiry} days on ${expiryDate.toLocaleDateString()}`,
      type: 'expiry',
      severity,
      data: {
        itemName,
        expiryDate
      }
    };

    // Send to admin and pharmacist users
    await this.sendNotificationToRole('admin', notificationData);
    await this.sendNotificationToRole('pharmacist', notificationData);
  }

  /**
   * Send new sale notification
   */
  static async sendNewSaleNotification(
    saleId: string,
    totalAmount: number,
    itemsCount: number
  ): Promise<void> {
    const notificationData: NotificationData = {
      title: 'New Sale Completed',
      message: `New sale worth GH₵${totalAmount.toFixed(2)} with ${itemsCount} items`,
      type: 'sale',
      severity: 'low',
      data: {
        saleId
      }
    };

    // Send to admin users
    await this.sendNotificationToRole('admin', notificationData);
  }

  /**
   * Send prescription notification
   */
  static async sendPrescriptionNotification(
    prescriptionId: string,
    customerName: string,
    medicationName: string
  ): Promise<void> {
    const notificationData: NotificationData = {
      title: 'New Prescription',
      message: `New prescription for ${customerName}: ${medicationName}`,
      type: 'prescription',
      severity: 'medium',
      data: {
        prescriptionId,
        customerId: customerName
      }
    };

    // Send to pharmacist users
    await this.sendNotificationToRole('pharmacist', notificationData);
  }

  /**
   * Send customer notification
   */
  static async sendCustomerNotification(
    customerId: string,
    customerName: string,
    action: 'registered' | 'updated' | 'loyalty_points'
  ): Promise<void> {
    let title: string;
    let message: string;

    switch (action) {
      case 'registered':
        title = 'New Customer Registered';
        message = `New customer registered: ${customerName}`;
        break;
      case 'updated':
        title = 'Customer Updated';
        message = `Customer information updated: ${customerName}`;
        break;
      case 'loyalty_points':
        title = 'Loyalty Points Updated';
        message = `Loyalty points updated for customer: ${customerName}`;
        break;
    }

    const notificationData: NotificationData = {
      title,
      message,
      type: 'customer',
      severity: 'low',
      data: {
        customerId
      }
    };

    // Send to cashier and admin users
    await this.sendNotificationToRole('cashier', notificationData);
    await this.sendNotificationToRole('admin', notificationData);
  }

  /**
   * Send supplier notification
   */
  static async sendSupplierNotification(
    supplierId: string,
    supplierName: string,
    action: 'order_placed' | 'order_received' | 'payment_made'
  ): Promise<void> {
    let title: string;
    let message: string;

    switch (action) {
      case 'order_placed':
        title = 'Purchase Order Placed';
        message = `Purchase order placed with supplier: ${supplierName}`;
        break;
      case 'order_received':
        title = 'Order Received';
        message = `Order received from supplier: ${supplierName}`;
        break;
      case 'payment_made':
        title = 'Payment Made';
        message = `Payment made to supplier: ${supplierName}`;
        break;
    }

    const notificationData: NotificationData = {
      title,
      message,
      type: 'supplier',
      severity: 'medium',
      data: {
        supplierId
      }
    };

    // Send to admin users
    await this.sendNotificationToRole('admin', notificationData);
  }

  /**
   * Send system notification
   */
  static async sendSystemNotification(
    title: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    const notificationData: NotificationData = {
      title,
      message,
      type: 'system',
      severity
    };

    // Send to all active users
    const users = await User.find({ isActive: true }).select('_id');
          const userIds = users.map(user => (user._id as any).toString());

    await this.sendNotificationToUsers(userIds, notificationData);
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(
    userId: string,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<INotification[]> {
    try {
      if (unreadOnly) {
        return await Notification.findUnreadByUser(userId);
      }
      return await Notification.findByUser(userId, limit);
    } catch (error) {
      logger.error(`Error getting notifications for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<INotification | null> {
    try {
      return await Notification.markAsRead(notificationId, userId);
    } catch (error) {
      logger.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await Notification.markAllAsRead(userId);
      logger.info(`All notifications marked as read for user ${userId}`);
    } catch (error) {
      logger.error(`Error marking all notifications as read for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await Notification.getUnreadCount(userId);
    } catch (error) {
      logger.error(`Error getting unread count for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete old notifications (cleanup)
   */
  static async deleteOldNotifications(daysOld: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
      });

      logger.info(`Deleted ${result.deletedCount} old notifications`);
    } catch (error) {
      logger.error('Error deleting old notifications:', error);
      throw error;
    }
  }

  /**
   * Delete a specific notification
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const result = await Notification.deleteOne({
        _id: notificationId,
        recipient: userId
      });

      if (result.deletedCount === 0) {
        throw new Error('Notification not found or access denied');
      }

      logger.info(`Deleted notification ${notificationId} for user ${userId}`);
    } catch (error) {
      logger.error(`Error deleting notification ${notificationId}:`, error);
      throw error;
    }
  }

  /**
   * Send push notification
   */
  private static async sendPushNotification(userId: string, notification: INotification): Promise<void> {
    try {
      const user = await User.findById(userId).select('expoPushToken');
      
      if (user?.expoPushToken) {
        await sendPushNotification(user.expoPushToken, {
          title: notification.title,
          body: notification.message,
          data: {
            notificationId: (notification._id as any).toString(),
            type: notification.type,
            ...notification.data
          }
        });

        await notification.markPushSent();
        logger.info(`Push notification sent to user ${userId}`);
      }
    } catch (error) {
      logger.error(`Error sending push notification to user ${userId}:`, error);
      // Don't throw error to avoid breaking the main notification flow
    }
  }
}
