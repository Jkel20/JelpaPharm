import express, { Response } from 'express';
import { query, validationResult } from 'express-validator';
import { Sales } from '../models/Sales';
import { Inventory } from '../models/Inventory';
import { User } from '../models/User';
import { protect, requirePharmacist, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import moment from 'moment';

const router = express.Router();

// @desc    Get daily report
// @route   GET /api/reports/daily
// @access  Private (Pharmacist, Admin)
router.get('/daily', protect, requirePharmacist, [
  query('date').optional().isISO8601().withMessage('Date must be a valid date')
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

  const date = req.query.date ? new Date(req.query.date as string) : new Date();
  const startOfDay = moment(date).startOf('day').toDate();
  const endOfDay = moment(date).endOf('day').toDate();

  const [salesSummary, topSellingItems, paymentMethods] = await Promise.all([
    // Sales summary
    Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          isVoid: false,
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$totalAmount' },
          totalDiscount: { $sum: '$discount' },
          totalTax: { $sum: '$tax' }
        }
      }
    ]),

    // Top selling items
    Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          isVoid: false,
          paymentStatus: 'completed'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 10 }
    ]),

    // Payment methods breakdown
    Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          isVoid: false,
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' }
        }
      }
    ])
  ]);

  return res.status(200).json({
    success: true,
    data: {
      date: moment(date).format('YYYY-MM-DD'),
      summary: salesSummary[0] || {
        totalSales: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        totalDiscount: 0,
        totalTax: 0
      },
      topSellingItems,
      paymentMethods
    }
  });
}));

// @desc    Get weekly report
// @route   GET /api/reports/weekly
// @access  Private (Pharmacist, Admin)
router.get('/weekly', protect, requirePharmacist, [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date')
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

  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : moment().startOf('week').toDate();
  const endDate = moment(startDate).endOf('week').toDate();

  const [weeklySummary, dailyBreakdown, categoryBreakdown] = await Promise.all([
    // Weekly summary
    Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isVoid: false,
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$totalAmount' },
          totalDiscount: { $sum: '$discount' },
          totalTax: { $sum: '$tax' }
        }
      }
    ]),

    // Daily breakdown
    Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isVoid: false,
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$totalAmount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Category breakdown
    Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isVoid: false,
          paymentStatus: 'completed'
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'inventories',
          localField: 'items.drug',
          foreignField: '_id',
          as: 'drugInfo'
        }
      },
      { $unwind: '$drugInfo' },
      {
        $group: {
          _id: '$drugInfo.category',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { revenue: -1 } }
    ])
  ]);

  return res.status(200).json({
    success: true,
    data: {
      period: {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD')
      },
      summary: weeklySummary[0] || {
        totalSales: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        totalDiscount: 0,
        totalTax: 0
      },
      dailyBreakdown,
      categoryBreakdown
    }
  });
}));

// @desc    Get monthly report
// @route   GET /api/reports/monthly
// @access  Private (Pharmacist, Admin)
router.get('/monthly', protect, requirePharmacist, [
  query('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030'),
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12')
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

  const year = parseInt(req.query.year as string) || moment().year();
  const month = parseInt(req.query.month as string) || moment().month() + 1;
  
  const startDate = moment(`${year}-${month.toString().padStart(2, '0')}-01`).startOf('month').toDate();
  const endDate = moment(startDate).endOf('month').toDate();

  const [monthlySummary, weeklyBreakdown, topProducts, staffPerformance] = await Promise.all([
    // Monthly summary
    Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isVoid: false,
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$totalAmount' },
          totalDiscount: { $sum: '$discount' },
          totalTax: { $sum: '$tax' }
        }
      }
    ]),

    // Weekly breakdown
    Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isVoid: false,
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: { $week: '$createdAt' },
          sales: { $sum: '$totalAmount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Top products
    Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isVoid: false,
          paymentStatus: 'completed'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 20 }
    ]),

    // Staff performance
    Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isVoid: false,
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: '$cashier',
          sales: { $sum: '$totalAmount' },
          transactions: { $sum: 1 },
          averageTransaction: { $avg: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          name: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
          sales: 1,
          transactions: 1,
          averageTransaction: 1
        }
      },
      { $sort: { sales: -1 } }
    ])
  ]);

  return res.status(200).json({
    success: true,
    data: {
      period: {
        year,
        month,
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD')
      },
      summary: monthlySummary[0] || {
        totalSales: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        totalDiscount: 0,
        totalTax: 0
      },
      weeklyBreakdown,
      topProducts,
      staffPerformance
    }
  });
}));

// @desc    Get annual report
// @route   GET /api/reports/annual
// @access  Private (Pharmacist, Admin)
router.get('/annual', protect, requirePharmacist, [
  query('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030')
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

  const year = parseInt(req.query.year as string) || moment().year();
  const startDate = moment(`${year}-01-01`).startOf('year').toDate();
  const endDate = moment(startDate).endOf('year').toDate();

  const [annualSummary, monthlyBreakdown, yearlyComparison, inventoryValue] = await Promise.all([
    // Annual summary
    Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isVoid: false,
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$totalAmount' },
          totalDiscount: { $sum: '$discount' },
          totalTax: { $sum: '$tax' }
        }
      }
    ]),

    // Monthly breakdown
    Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isVoid: false,
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          sales: { $sum: '$totalAmount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Year over year comparison
    Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: moment(startDate).subtract(1, 'year').toDate(), $lte: endDate },
          isVoid: false,
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: { $year: '$createdAt' },
          totalSales: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Current inventory value
    Inventory.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } },
          totalItems: { $sum: 1 }
        }
      }
    ])
  ]);

  return res.status(200).json({
    success: true,
    data: {
      year,
      period: {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD')
      },
      summary: annualSummary[0] || {
        totalSales: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        totalDiscount: 0,
        totalTax: 0
      },
      monthlyBreakdown,
      yearlyComparison,
      inventoryValue: inventoryValue[0] || { totalValue: 0, totalItems: 0 }
    }
  });
}));

// @desc    Get inventory report
// @route   GET /api/reports/inventory
// @access  Private (Pharmacist, Admin)
router.get('/inventory', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const [inventoryStats, categoryBreakdown, lowStockItems, expiringItems] = await Promise.all([
    // Inventory statistics
    Inventory.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } },
          totalQuantity: { $sum: '$quantity' },
          averagePrice: { $avg: '$sellingPrice' }
        }
      }
    ]),

    // Category breakdown
    Inventory.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      { $sort: { totalValue: -1 } }
    ]),

    // Low stock items
    Inventory.find({ $expr: { $lte: ['$quantity', '$reorderLevel'] }, isActive: true })
      .select('name brandName quantity reorderLevel')
      .sort({ quantity: 1 })
      .limit(10)
      .lean(),

    // Expiring items
    Inventory.find({
      expiryDate: { $lte: moment().add(30, 'days').toDate(), $gt: new Date() },
      isActive: true
    })
      .select('name brandName expiryDate quantity')
      .sort({ expiryDate: 1 })
      .limit(10)
      .lean()
  ]);

  return res.status(200).json({
    success: true,
    data: {
      stats: inventoryStats[0] || {
        totalItems: 0,
        totalValue: 0,
        totalQuantity: 0,
        averagePrice: 0
      },
      categoryBreakdown,
      lowStockItems,
      expiringItems
    }
  });
}));

export default router;
