import express, { Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { Sales } from '../models/Sales';
import { Inventory } from '../models/Inventory';
import { protect, requireCashier } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types/auth';

const router = express.Router();

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private (Cashier, Pharmacist, Admin)
router.get('/', protect, requireCashier, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  query('paymentStatus').optional().isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('Invalid payment status'),
  query('paymentMethod').optional().isIn(['cash', 'mobile_money', 'card', 'bank_transfer']).withMessage('Invalid payment method')
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
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const paymentStatus = req.query.paymentStatus as string;
  const paymentMethod = req.query.paymentMethod as string;

  const skip = (page - 1) * limit;

  // Build query
  const query: any = { isVoid: false };

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  if (paymentMethod) {
    query.paymentMethod = paymentMethod;
  }

  const [sales, total] = await Promise.all([
    Sales.find(query)
      .populate('cashier', 'firstName lastName email')
      .populate('pharmacist', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Sales.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    data: {
      sales,
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

// @desc    Search sales by transaction number, customer, or items
// @route   GET /api/sales/search/:query
// @access  Private (Cashier, Pharmacist, Admin)
router.get('/search/:query', protect, requireCashier, asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.params.query;
  
  const sales = await Sales.find({
    isVoid: false,
    $or: [
      { transactionNumber: { $regex: query, $options: 'i' } },
      { 'customer.firstName': { $regex: query, $options: 'i' } },
      { 'customer.lastName': { $regex: query, $options: 'i' } },
      { 'customer.phone': { $regex: query, $options: 'i' } },
      { 'items.name': { $regex: query, $options: 'i' } }
    ]
  })
    .populate('cashier', 'firstName lastName email')
    .populate('pharmacist', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(10);

  return res.status(200).json({
    success: true,
    data: sales
  });
}));

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private (Cashier, Pharmacist, Admin)
router.get('/:id', protect, requireCashier, asyncHandler(async (req: AuthRequest, res: Response) => {
  const sale = await Sales.findById(req.params.id)
    .populate('cashier', 'firstName lastName email')
    .populate('pharmacist', 'firstName lastName email')
    .populate('voidedBy', 'firstName lastName email');

  if (!sale) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Sale not found'
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: { sale }
  });
}));

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private (Cashier, Pharmacist, Admin)
router.post('/', protect, requireCashier, [
  body('customerName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  
  body('customerPhone')
    .optional()
    .matches(/^(\+233|0)[0-9]{9}$/)
    .withMessage('Please provide a valid Ghanaian phone number'),
  
  body('customerEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  
  body('items.*.drug')
    .isMongoId()
    .withMessage('Invalid drug ID'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('paymentMethod')
    .isIn(['cash', 'mobile_money', 'card', 'bank_transfer'])
    .withMessage('Invalid payment method'),
  
  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a non-negative number'),
  
  body('prescriptionNumber')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Prescription number must be between 1 and 50 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
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

  const { items, customerName, customerPhone, customerEmail, paymentMethod, discount = 0, prescriptionNumber, notes } = req.body;

  // Validate and process items
  const processedItems = [];
  let subtotal = 0;

  for (const item of items) {
    const inventory = await Inventory.findById(item.drug);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Drug with ID ${item.drug} not found`
        }
      });
    }

    if (!inventory.isActive) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Drug ${inventory.name} is not available`
        }
      });
    }

    if (inventory.quantity < item.quantity) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Insufficient stock for ${inventory.name}. Available: ${inventory.quantity}`
        }
      });
    }

    // Check if prescription is required
    if (inventory.isPrescriptionRequired && !prescriptionNumber) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Prescription is required for ${inventory.name}`
        }
      });
    }

    const totalPrice = inventory.sellingPrice * item.quantity;
    subtotal += totalPrice;

    processedItems.push({
      drug: inventory._id,
      name: inventory.name,
      quantity: item.quantity,
      unitPrice: inventory.sellingPrice,
      totalPrice,
      prescriptionRequired: inventory.isPrescriptionRequired,
      prescriptionNumber: inventory.isPrescriptionRequired ? prescriptionNumber : undefined
    });

    // Update inventory
    inventory.quantity -= item.quantity;
    inventory.totalSold += item.quantity;
    inventory.totalRevenue += totalPrice;
    await inventory.save();
  }

  // Create sale
  const sale = await Sales.create({
    customerName,
    customerPhone,
    customerEmail,
    items: processedItems,
    subtotal,
    discount,
    paymentMethod,
    paymentStatus: 'completed',
            cashier: (req.user!._id as any).toString(),
    prescriptionNumber,
    notes
  });

  // Populate sale with user details
  await sale.populate('cashier', 'firstName lastName email');

  logger.info(`New sale created: ${sale.receiptNumber} by user: ${req.user!.email}`);

  return res.status(201).json({
    success: true,
    message: 'Sale completed successfully',
    data: { sale }
  });
}));

// @desc    Void sale
// @route   PUT /api/sales/:id/void
// @access  Private (Cashier, Pharmacist, Admin)
router.put('/:id/void', protect, requireCashier, [
  body('reason')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Void reason must be between 5 and 200 characters')
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

  const { reason } = req.body;

  const sale = await Sales.findById(req.params.id);

  if (!sale) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Sale not found'
      }
    });
  }

  if (sale.isVoid) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Sale is already voided'
      }
    });
  }

  // Restore inventory
  for (const item of sale.items) {
    const inventory = await Inventory.findById(item.drug);
    if (inventory) {
      inventory.quantity += item.quantity;
      inventory.totalSold -= item.quantity;
      inventory.totalRevenue -= item.totalPrice;
      await inventory.save();
    }
  }

  // Void sale
  sale.isVoid = true;
  sale.voidReason = reason;
      sale.voidedBy = (req.user!._id as any).toString();
  sale.voidedAt = new Date();
  await sale.save();

  logger.info(`Sale voided: ${sale.receiptNumber} by user: ${req.user!.email}`);

  return res.status(200).json({
    success: true,
    message: 'Sale voided successfully',
    data: { sale }
  });
}));

// @desc    Get sales summary
// @route   GET /api/sales/summary
// @access  Private (Cashier, Pharmacist, Admin)
router.get('/summary', protect, requireCashier, [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
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

  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().setHours(0, 0, 0, 0));
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

  const summary = await Sales.aggregate([
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
  ]);

  const paymentMethodBreakdown = await Sales.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
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
  ]);

  const dailySales = await Sales.aggregate([
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
  ]);

  return res.status(200).json({
    success: true,
    data: {
      summary: summary[0] || {
        totalSales: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        totalDiscount: 0,
        totalTax: 0
      },
      paymentMethodBreakdown,
      dailySales,
      period: { startDate, endDate }
    }
  });
}));

// @desc    Get receipt
// @route   GET /api/sales/:id/receipt
// @access  Private (Cashier, Pharmacist, Admin)
router.get('/:id/receipt', protect, requireCashier, asyncHandler(async (req: AuthRequest, res: Response) => {
  const sale = await Sales.findById(req.params.id)
    .populate('cashier', 'firstName lastName');

  if (!sale) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Sale not found'
      }
    });
  }

  // Generate receipt data
  const receipt = {
    receiptNumber: sale.receiptNumber,
    date: sale.createdAt,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    items: sale.items,
    subtotal: sale.subtotal,
    tax: sale.tax,
    discount: sale.discount,
    totalAmount: sale.totalAmount,
    paymentMethod: sale.paymentMethod,
    cashier: sale.cashier,
    prescriptionNumber: sale.prescriptionNumber,
    notes: sale.notes
  };

  return res.status(200).json({
    success: true,
    data: { receipt }
  });
}));

export default router;
