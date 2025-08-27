import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { asyncHandler } from './errorHandler';

export interface AuthRequest extends Request {
  user?: IUser;
}

// Type guard to ensure user exists
export const ensureUser = (req: AuthRequest): req is AuthRequest & { user: IUser } => {
  return req.user !== undefined;
};

// Protect routes - require authentication
export const protect = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Not authorized to access this route. Please login.'
      }
    });
    return;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'User not found. Please login again.'
        }
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Account is deactivated. Please contact administrator.'
        }
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token. Please login again.'
      }
    });
  }
});

// Grant access to specific roles
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Not authorized to access this route'
        }
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          message: `User role '${req.user.role}' is not authorized to access this route`
        }
      });
      return;
    }

    next();
  };
};

// Specific role middleware
export const requireAdmin = authorize('admin');
export const requirePharmacist = authorize('pharmacist', 'admin');
export const requireCashier = authorize('cashier', 'pharmacist', 'admin');

// Check if user can access specific resource
export const canAccessResource = (resourceType: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authorized to access this route'
        }
      });
    }

    const userRole = req.user.role;
    const resourceId = req.params.id;

    // Admin can access everything
    if (userRole === 'admin') {
      return next();
    }

    // Pharmacist can access most resources
    if (userRole === 'pharmacist') {
      if (['inventory', 'sales', 'reports', 'alerts'].includes(resourceType)) {
        return next();
      }
    }

    // Cashier has limited access
    if (userRole === 'cashier') {
      if (['sales'].includes(resourceType)) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      error: {
        message: `Access denied for ${resourceType}`
      }
    });
  };
};

// Rate limiting for authentication attempts
export const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again after 15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
};
