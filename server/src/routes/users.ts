import express, { Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { User } from '../models/User';
import { protect, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth';

const router = express.Router();

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
router.get('/', protect, requireAdmin, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['admin', 'pharmacist', 'cashier']).withMessage('Invalid role'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
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

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const role = req.query.role as string;
  const isActive = req.query.isActive as string;

  const skip = (page - 1) * limit;

  // Build query
  const query: any = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  });
}));

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin)
router.get('/:id', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'User not found'
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: { user }
  });
}));

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
router.put('/:id', protect, requireAdmin, [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('phone')
    .optional()
    .matches(/^(\+233|0)[0-9]{9}$/)
    .withMessage('Please provide a valid Ghanaian phone number'),
  
  body('role')
    .optional()
    .isIn(['admin', 'pharmacist', 'cashier'])
    .withMessage('Invalid role'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
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

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'User not found'
      }
    });
  }

  // Check if user is trying to update their own account
  if ((user._id as any).toString() === (req.user!._id as any).toString()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Cannot update your own account through this endpoint'
      }
    });
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).select('-password');

  return res.status(200).json({
    success: true,
    data: { user: updatedUser }
  });
}));

// @desc    Update user's push token
// @route   PUT /api/users/:id/push-token
// @access  Private
router.put('/:id/push-token', protect, [
  body('expoPushToken').isString().withMessage('Push token is required')
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

  // Users can only update their own push token
  if (req.params.id !== (req.user!._id as any).toString()) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'You can only update your own push token'
      }
    });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { expoPushToken: req.body.expoPushToken },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'User not found'
      }
    });
  }

  logger.info(`Push token updated for user: ${user.email}`);

  return res.status(200).json({
    success: true,
    message: 'Push token updated successfully',
    data: { user }
  });
}));

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
router.delete('/:id', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'User not found'
      }
    });
  }

  // Check if user is trying to delete their own account
  if ((user._id as any).toString() === (req.user!._id as any).toString()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Cannot delete your own account'
      }
    });
  }

  await User.findByIdAndDelete(req.params.id);

  return res.status(200).json({
    success: true,
    data: {}
  });
}));

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin)
router.get('/stats', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const [totalUsers, activeUsers, inactiveUsers, roleStats] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: false }),
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const roleBreakdown = roleStats.reduce((acc: any, stat: any) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});

  return res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleBreakdown
    }
  });
}));

export default router;
