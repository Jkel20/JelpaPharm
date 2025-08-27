import express, { Response } from 'express';
import { query, validationResult } from 'express-validator';
import { Inventory } from '../models/Inventory';
import { User } from '../models/User';
import { protect, requirePharmacist } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { sendLowStockAlert, sendExpiryAlert } from '../utils/email';
import { NotificationService } from '../services/NotificationService';
import moment from 'moment';
import { AuthRequest } from '../types/auth';

const router = express.Router();

// @desc    Get all alerts
// @route   GET /api/alerts
// @access  Private (Pharmacist, Admin)
router.get('/', protect, requirePharmacist, [
  query('type').optional().isIn(['low_stock', 'expiry']).withMessage('Type must be low_stock or expiry'),
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }

  const type = req.query.type as string;
  const days = parseInt(req.query.days as string) || 30;

  let lowStockItems: any[] = [];
  let expiringItems: any[] = [];

  if (!type || type === 'low_stock') {
    lowStockItems = await Inventory.findLowStock()
      .select('name brandName quantity reorderLevel category')
      .sort({ quantity: 1 })
      .lean();
  }

  if (!type || type === 'expiry') {
    const expiryDate = moment().add(days, 'days').toDate();
    expiringItems = await Inventory.find({
      expiryDate: { $lte: expiryDate, $gt: new Date() },
      isActive: true
    })
      .select('name brandName expiryDate quantity category')
      .sort({ expiryDate: 1 })
      .lean();
  }

  return res.status(200).json({
    success: true,
    data: {
      lowStockItems,
      expiringItems,
      summary: {
        lowStockCount: lowStockItems.length,
        expiringCount: expiringItems.length,
        totalAlerts: lowStockItems.length + expiringItems.length
      }
    }
  });
}));

// @desc    Send low stock alert email and notifications
// @route   POST /api/alerts/low-stock/email
// @access  Private (Pharmacist, Admin)
router.post('/low-stock/email', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const lowStockItems = await Inventory.findLowStock()
    .select('name brandName quantity reorderLevel')
    .lean();

  if (lowStockItems.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No low stock items to alert about'
    });
  }

  // Get admin users to send alerts to
  const adminUsers = await User.find({ role: 'admin', isActive: true })
    .select('email firstName lastName')
    .lean();

  if (adminUsers.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'No admin users found to send alerts to'
      }
    });
  }

  // Send email to each admin
  const emailPromises = adminUsers.map(user => 
    sendLowStockAlert(user.email, lowStockItems)
  );

  // Send push notifications to admin users
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
            currentStock: item.quantity,
            reorderLevel: item.reorderLevel
          }))
        }
      }
    )
  );

  try {
    await Promise.all([...emailPromises, ...notificationPromises]);
    
    logger.info(`Low stock alert emails and notifications sent to ${adminUsers.length} admin users by ${req.user!.email}`);

    return res.status(200).json({
      success: true,
      message: `Low stock alert emails and notifications sent to ${adminUsers.length} admin users`,
      data: {
        recipients: adminUsers.length,
        itemsCount: lowStockItems.length
      }
    });
  } catch (error) {
    logger.error('Error sending low stock alert emails and notifications:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send alert emails and notifications'
      }
    });
  }
}));

// @desc    Send expiry alert email and notifications
// @route   POST /api/alerts/expiry/email
// @access  Private (Pharmacist, Admin)
router.post('/expiry/email', protect, requirePharmacist, [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }

  const days = parseInt(req.query.days as string) || 30;
  const expiryDate = moment().add(days, 'days').toDate();

  const expiringItems = await Inventory.find({
    expiryDate: { $lte: expiryDate, $gt: new Date() },
    isActive: true
  })
    .select('name brandName expiryDate quantity')
    .sort({ expiryDate: 1 })
    .lean();

  if (expiringItems.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No expiring items to alert about'
    });
  }

  // Get admin and pharmacist users to send alerts to
  const alertUsers = await User.find({ 
    role: { $in: ['admin', 'pharmacist'] }, 
    isActive: true 
  })
    .select('email firstName lastName role')
    .lean();

  if (alertUsers.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'No users found to send alerts to'
      }
    });
  }

  // Send email to each user
  const emailPromises = alertUsers.map(user => 
    sendExpiryAlert(user.email, expiringItems)
  );

  // Send push notifications to users
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
          items: expiringItems.map((item: any) => ({
            id: item._id.toString(),
            name: item.name,
            expiryDate: item.expiryDate,
            quantity: item.quantity
          }))
        }
      }
    )
  );

  try {
    await Promise.all([...emailPromises, ...notificationPromises]);
    
    logger.info(`Expiry alert emails and notifications sent to ${alertUsers.length} users by ${req.user!.email}`);

    return res.status(200).json({
      success: true,
      message: `Expiry alert emails and notifications sent to ${alertUsers.length} users`,
      data: {
        recipients: alertUsers.length,
        itemsCount: expiringItems.length,
        days
      }
    });
  } catch (error) {
    logger.error('Error sending expiry alert emails and notifications:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send alert emails and notifications'
      }
    });
  }
}));

// @desc    Get alert statistics
// @route   GET /api/alerts/stats
// @access  Private (Pharmacist, Admin)
router.get('/stats', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const [lowStockCount, expiringCount, outOfStockCount] = await Promise.all([
    Inventory.countDocuments({ $expr: { $lte: ['$quantity', '$reorderLevel'] }, isActive: true }),
    Inventory.countDocuments({ 
      expiryDate: { $lte: moment().add(30, 'days').toDate(), $gt: new Date() },
      isActive: true 
    }),
    Inventory.countDocuments({ quantity: 0, isActive: true })
  ]);

  return res.status(200).json({
    success: true,
    data: {
      lowStockCount,
      expiringCount,
      outOfStockCount,
      totalAlerts: lowStockCount + expiringCount + outOfStockCount
    }
  });
}));

// @desc    Get critical alerts (out of stock items)
// @route   GET /api/alerts/critical
// @access  Private (Pharmacist, Admin)
router.get('/critical', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const outOfStockItems = await Inventory.find({ quantity: 0, isActive: true })
    .select('name brandName category lastRestocked')
    .sort({ lastRestocked: -1 })
    .lean();

  return res.status(200).json({
    success: true,
    data: {
      outOfStockItems,
      count: outOfStockItems.length
    }
  });
}));

// @desc    Get alerts as notifications (integrated view)
// @route   GET /api/alerts/list
// @access  Private (Pharmacist, Admin)
router.get('/list', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, filter = 'all' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  // Get user's notifications
  const notifications = await NotificationService.getUserNotifications(
    (req.user!._id as any).toString(),
    parseInt(limit as string),
    false // unreadOnly parameter
  );

  // Get dynamic alerts data
  const [lowStockItems, expiringItems, outOfStockItems] = await Promise.all([
    Inventory.findLowStock().select('name brandName quantity reorderLevel category').lean(),
    Inventory.find({
      expiryDate: { $lte: moment().add(30, 'days').toDate(), $gt: new Date() },
      isActive: true
    }).select('name brandName expiryDate quantity category').lean(),
    Inventory.find({ quantity: 0, isActive: true }).select('name brandName category lastRestocked').lean()
  ]);

  // Convert dynamic alerts to notification format for display
  const dynamicAlerts = [
    ...lowStockItems.map((item: any) => ({
      _id: `low_stock_${item._id}`,
      type: 'low_stock' as const,
      title: 'Low Stock Alert',
      message: `${item.name} is running low (${item.quantity} units remaining)`,
      severity: item.quantity === 0 ? 'critical' as const : 'medium' as const,
      isRead: false,
      createdAt: new Date().toISOString(),
      relatedItem: {
        id: item._id.toString(),
        name: item.name,
        type: 'inventory' as const
      },
      isDynamic: true
    })),
    ...expiringItems.map((item: any) => ({
      _id: `expiry_${item._id}`,
      type: 'expiry' as const,
      title: 'Expiry Warning',
      message: `${item.name} expires in ${moment(item.expiryDate).diff(moment(), 'days')} days`,
      severity: moment(item.expiryDate).diff(moment(), 'days') <= 7 ? 'high' as const : 'medium' as const,
      isRead: false,
      createdAt: new Date().toISOString(),
      relatedItem: {
        id: item._id.toString(),
        name: item.name,
        type: 'inventory' as const
      },
      isDynamic: true
    }))
  ];

  // Combine notifications and dynamic alerts
  const allAlerts = [...notifications, ...dynamicAlerts];
  
  // Sort by creation date (newest first)
  allAlerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.status(200).json({
    success: true,
    data: allAlerts,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: allAlerts.length
    }
  });
}));

// @desc    Mark alert as read
// @route   PUT /api/alerts/:id/read
// @access  Private (Pharmacist, Admin)
router.put('/:id/read', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  // Check if it's a dynamic alert (starts with low_stock_ or expiry_)
  if (id.startsWith('low_stock_') || id.startsWith('expiry_')) {
    // For dynamic alerts, we don't mark as read since they're generated on-the-fly
    return res.status(200).json({
      success: true,
      message: 'Dynamic alert acknowledged'
    });
  }

  // For regular notifications, mark as read
  await NotificationService.markAsRead(id, (req.user!._id as any).toString());

  return res.status(200).json({
    success: true,
    message: 'Alert marked as read'
  });
}));

// @desc    Delete alert
// @route   DELETE /api/alerts/:id
// @access  Private (Pharmacist, Admin)
router.delete('/:id', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  // Check if it's a dynamic alert
  if (id.startsWith('low_stock_') || id.startsWith('expiry_')) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Cannot delete dynamic alerts'
      }
    });
  }

  // For regular notifications, delete
  await NotificationService.deleteNotification(id, (req.user!._id as any).toString());

  return res.status(200).json({
    success: true,
    message: 'Alert deleted successfully'
  });
}));

export default router;
