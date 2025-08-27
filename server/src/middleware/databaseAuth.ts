import { Request, Response, NextFunction } from 'express';
import { dbService, UserRole } from '../config/database';
import { IUser } from '../models/User';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Middleware to check user permissions
export const checkPermission = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const hasPermission = dbService.hasPermission(
        req.user.role as UserRole,
        resource,
        action
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: `Insufficient permissions to ${action} ${resource}`
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }
  };
};

// Middleware to check if user is admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  if (req.user.role !== UserRole.ADMIN) {
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
    return;
  }

  next();
};

// Middleware to check if user is pharmacist or admin
export const requirePharmacistOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  if (![UserRole.PHARMACIST, UserRole.ADMIN].includes(req.user.role as UserRole)) {
    res.status(403).json({
      success: false,
      message: 'Pharmacist or admin access required'
    });
    return;
  }

  next();
};

// Middleware to check if user is cashier or higher
export const requireCashierOrHigher = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  if (![UserRole.CASHIER, UserRole.PHARMACIST, UserRole.ADMIN].includes(req.user.role as UserRole)) {
    res.status(403).json({
      success: false,
      message: 'Cashier or higher access required'
    });
    return;
  }

  next();
};

// Middleware to filter data based on user role
export const filterDataByRole = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Add role-based filters to request
    req.roleFilters = {};

    // Cashiers can only see their own data
    if (req.user.role === UserRole.CASHIER) {
      req.roleFilters.cashier = req.user._id;
    }

    // Add user role to request for use in controllers
    req.userRole = req.user.role as UserRole;

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Role filtering failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

// Middleware to validate user ownership for updates/deletes
export const validateOwnership = (resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const resourceId = req.params.id;
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID required'
        });
      }

      // Admins can modify any resource
      if (req.user.role === UserRole.ADMIN) {
        return next();
      }

      // Check ownership based on resource type
      switch (resource) {
        case 'sales':
          const Sales = require('../models/Sales').default;
          const sale = await Sales.findById(resourceId);
          if (!sale) {
            return res.status(404).json({
              success: false,
              message: 'Sale not found'
            });
          }
          if (sale.cashier.toString() !== (req.user._id as string).toString()) {
            return res.status(403).json({
              success: false,
              message: 'You can only modify your own sales'
            });
          }
          break;

        case 'inventory':
          // Pharmacists and admins can modify inventory
          if ([UserRole.PHARMACIST, UserRole.ADMIN].includes(req.user.role as UserRole)) {
            return next();
          }
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions to modify inventory'
          });

        case 'users':
          // Only admins can modify users
          if ((req.user.role as UserRole) !== UserRole.ADMIN) {
            return res.status(403).json({
              success: false,
              message: 'Only admins can modify users'
            });
          }
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid resource type'
          });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Ownership validation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
};

// Middleware to log database operations
export const logDatabaseOperation = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const logData = {
      timestamp: new Date(),
      user: req.user?._id,
      userRole: req.user?.role,
      operation,
      resource: req.params.id || req.body,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };

    // Log the operation (you can implement your own logging here)
    console.log('Database Operation:', logData);

    next();
  };
};

// Middleware to handle database errors
export const handleDatabaseError = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Database Error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(error.errors).map((err: any) => err.message)
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value'
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Database operation failed',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
};

// Export all middleware
export default {
  checkPermission,
  requireAdmin,
  requirePharmacistOrAdmin,
  requireCashierOrHigher,
  filterDataByRole,
  validateOwnership,
  logDatabaseOperation,
  handleDatabaseError
};
