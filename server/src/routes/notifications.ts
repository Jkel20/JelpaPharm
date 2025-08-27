import express, { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { NotificationService } from '../services/NotificationService';
import { protect, requireAdmin, AuthRequest, ensureUser } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('unreadOnly').optional().isBoolean().withMessage('unreadOnly must be a boolean')
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

  const limit = parseInt(req.query.limit as string) || 50;
  const unreadOnly = req.query.unreadOnly === 'true';

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated'
      }
    });
  }

  const user = req.user as any; // Type assertion to fix TypeScript issue

  const notifications = await NotificationService.getUserNotifications(
    user._id.toString(),
    limit,
    unreadOnly
  );

  const unreadCount = await NotificationService.getUnreadCount(user._id.toString());

  return res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount,
      total: notifications.length
    }
  });
}));

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated'
      }
    });
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated'
      }
    });
    return;
  }

  const notification = await NotificationService.markAsRead(
    req.params.id,
    (req.user as any)._id.toString()
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Notification not found'
      }
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Notification marked as read'
  });
}));

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated'
      }
    });
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated'
      }
    });
    return;
  }

  await NotificationService.markAllAsRead((req.user as any)._id.toString());

  return res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
}));

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
router.get('/unread-count', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated'
      }
    });
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated'
      }
    });
    return;
  }

  const count = await NotificationService.getUnreadCount((req.user as any)._id.toString());

  return res.status(200).json({
    success: true,
    data: {
      unreadCount: count
    }
  });
}));

// @desc    Send notification to specific user (Admin only)
// @route   POST /api/notifications/send
// @access  Private (Admin)
router.post('/send', protect, requireAdmin, [
  body('recipientId').isMongoId().withMessage('Valid recipient ID is required'),
  body('title').isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('message').isLength({ min: 1, max: 500 }).withMessage('Message must be between 1 and 500 characters'),
  body('type').isIn(['low_stock', 'expiry', 'sale', 'system', 'prescription', 'customer', 'supplier']).withMessage('Invalid notification type'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level')
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

  const { recipientId, title, message, type, severity, data } = req.body;

  const notification = await NotificationService.sendNotification(recipientId, {
    title,
    message,
    type,
    severity,
    data
  });

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated'
      }
    });
  }

  logger.info(`Admin ${req.user.email} sent notification to user ${recipientId}: ${title}`);

  return res.status(201).json({
    success: true,
    message: 'Notification sent successfully',
    data: notification
  });
}));

// @desc    Send notification to role (Admin only)
// @route   POST /api/notifications/send-to-role
// @access  Private (Admin)
router.post('/send-to-role', protect, requireAdmin, [
  body('role').isIn(['admin', 'pharmacist', 'cashier']).withMessage('Valid role is required'),
  body('title').isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('message').isLength({ min: 1, max: 500 }).withMessage('Message must be between 1 and 500 characters'),
  body('type').isIn(['low_stock', 'expiry', 'sale', 'system', 'prescription', 'customer', 'supplier']).withMessage('Invalid notification type'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level')
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

  const { role, title, message, type, severity, data } = req.body;

  const notifications = await NotificationService.sendNotificationToRole(role, {
    title,
    message,
    type,
    severity,
    data
  });

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated'
      }
    });
  }

  logger.info(`Admin ${req.user.email} sent notification to role ${role}: ${title}`);

  return res.status(201).json({
    success: true,
    message: `Notification sent to ${notifications.length} users with role ${role}`,
    data: {
      notifications,
      count: notifications.length
    }
  });
}));

// @desc    Send system notification to all users (Admin only)
// @route   POST /api/notifications/system
// @access  Private (Admin)
router.post('/system', protect, requireAdmin, [
  body('title').isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('message').isLength({ min: 1, max: 500 }).withMessage('Message must be between 1 and 500 characters'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level')
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

  const { title, message, severity } = req.body;

  await NotificationService.sendSystemNotification(title, message, severity);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated'
      }
    });
  }

  logger.info(`Admin ${req.user.email} sent system notification: ${title}`);

  return res.status(201).json({
    success: true,
    message: 'System notification sent to all users'
  });
}));

// @desc    Delete old notifications (Admin only)
// @route   DELETE /api/notifications/cleanup
// @access  Private (Admin)
router.delete('/cleanup', protect, requireAdmin, [
  query('daysOld').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
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

  const daysOld = parseInt(req.query.daysOld as string) || 90;

  await NotificationService.deleteOldNotifications(daysOld);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated'
      }
    });
  }

  logger.info(`Admin ${req.user.email} cleaned up notifications older than ${daysOld} days`);

  return res.status(200).json({
    success: true,
    message: `Old notifications (older than ${daysOld} days) cleaned up successfully`
  });
}));

// @desc    Get notification statistics (Admin only)
// @route   GET /api/notifications/stats
// @access  Private (Admin)
router.get('/stats', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  // This would typically include more detailed statistics
  // For now, we'll return basic stats
  const stats = {
    totalNotifications: 0,
    unreadNotifications: 0,
    notificationsByType: {
      low_stock: 0,
      expiry: 0,
      sale: 0,
      system: 0,
      prescription: 0,
      customer: 0,
      supplier: 0
    },
    notificationsBySeverity: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }
  };

  return res.status(200).json({
    success: true,
    data: stats
  });
}));

export default router;
