import express, { Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { Inventory } from '../models/Inventory';
import { protect, requirePharmacist, requireCashier, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private (Pharmacist, Admin)
router.get('/', protect, requirePharmacist, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('sortBy').optional().isIn(['name', 'quantity', 'expiryDate', 'createdAt']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
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
  const search = req.query.search as string;
  const category = req.query.category as string;
  const sortBy = req.query.sortBy as string || 'createdAt';
  const sortOrder = req.query.sortOrder as string || 'desc';

  const skip = (page - 1) * limit;

  // Build query
  const query: any = { isActive: true };

  if (search) {
    query.$text = { $search: search };
  }

  if (category) {
    query.category = category;
  }

  // Build sort object
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [inventory, total] = await Promise.all([
    Inventory.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Inventory.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    data: {
      inventory,
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

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private (Pharmacist, Admin)
router.get('/:id', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Inventory item not found'
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: { inventory }
  });
}));

// @desc    Create new inventory item
// @route   POST /api/inventory
// @access  Private (Pharmacist, Admin)
router.post('/', protect, requirePharmacist, [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Drug name must be between 2 and 200 characters'),
  
  body('brandName')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Brand name must be between 2 and 200 characters'),
  
  body('category')
    .isIn([
      'Analgesics', 'Antibiotics', 'Antihypertensives', 'Antidiabetics',
      'Antimalarials', 'Vitamins', 'Supplements', 'First Aid',
      'Personal Care', 'Medical Devices', 'Other'
    ])
    .withMessage('Invalid category'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('strength')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Strength must be between 1 and 50 characters'),
  
  body('dosageForm')
    .isIn([
      'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream',
      'Ointment', 'Drops', 'Inhaler', 'Suppository', 'Other'
    ])
    .withMessage('Invalid dosage form'),
  
  body('manufacturer')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Manufacturer must be between 2 and 200 characters'),
  
  body('supplier')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Supplier must be between 2 and 200 characters'),
  
  body('batchNumber')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Batch number must be between 1 and 50 characters'),
  
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  body('unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a non-negative number'),
  
  body('sellingPrice')
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a non-negative number'),
  
  body('reorderLevel')
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer'),
  
  body('expiryDate')
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),
  
  body('storageLocation')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Storage location must be between 2 and 100 characters'),
  
  body('barcode')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Barcode must be between 1 and 50 characters')
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

  // Check if barcode already exists
  if (req.body.barcode) {
    const existingItem = await Inventory.findOne({ barcode: req.body.barcode });
    if (existingItem) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Item with this barcode already exists'
        }
      });
    }
  }

  const inventory = await Inventory.create(req.body);

  logger.info(`New inventory item created: ${inventory.name} by user: ${req.user!.email}`);

  return res.status(201).json({
    success: true,
    message: 'Inventory item created successfully',
    data: { inventory }
  });
}));

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private (Pharmacist, Admin)
router.put('/:id', protect, requirePharmacist, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Drug name must be between 2 and 200 characters'),
  
  body('brandName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Brand name must be between 2 and 200 characters'),
  
  body('category')
    .optional()
    .isIn([
      'Analgesics', 'Antibiotics', 'Antihypertensives', 'Antidiabetics',
      'Antimalarials', 'Vitamins', 'Supplements', 'First Aid',
      'Personal Care', 'Medical Devices', 'Other'
    ])
    .withMessage('Invalid category'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('strength')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Strength must be between 1 and 50 characters'),
  
  body('dosageForm')
    .optional()
    .isIn([
      'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream',
      'Ointment', 'Drops', 'Inhaler', 'Suppository', 'Other'
    ])
    .withMessage('Invalid dosage form'),
  
  body('manufacturer')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Manufacturer must be between 2 and 200 characters'),
  
  body('supplier')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Supplier must be between 2 and 200 characters'),
  
  body('batchNumber')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Batch number must be between 1 and 50 characters'),
  
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  body('unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a non-negative number'),
  
  body('sellingPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a non-negative number'),
  
  body('reorderLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer'),
  
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),
  
  body('storageLocation')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Storage location must be between 2 and 100 characters'),
  
  body('barcode')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Barcode must be between 1 and 50 characters')
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

  let inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Inventory item not found'
      }
    });
  }

  // Check if barcode already exists (if being updated)
  if (req.body.barcode && req.body.barcode !== inventory.barcode) {
    const existingItem = await Inventory.findOne({ barcode: req.body.barcode });
    if (existingItem) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Item with this barcode already exists'
        }
      });
    }
  }

  inventory = await Inventory.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  logger.info(`Inventory item updated: ${inventory!.name} by user: ${req.user!.email}`);

  return res.status(200).json({
    success: true,
    data: inventory
  });
}));

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private (Pharmacist, Admin)
router.delete('/:id', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Inventory item not found'
      }
    });
  }

  // Soft delete - set isActive to false
  inventory.isActive = false;
  await inventory.save();

  logger.info(`Inventory item deleted: ${inventory!.name} by user: ${req.user!.email}`);

  return res.status(200).json({
    success: true,
    data: {}
  });
}));

// @desc    Get low stock items
// @route   GET /api/inventory/low-stock
// @access  Private (Pharmacist, Admin)
router.get('/low-stock', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const lowStockItems = await Inventory.findLowStock();

  res.status(200).json({
    success: true,
    data: {
      lowStockItems,
      count: lowStockItems.length
    }
  });
}));

// @desc    Get expiring items
// @route   GET /api/inventory/expiring
// @access  Private (Pharmacist, Admin)
router.get('/expiring', protect, requirePharmacist, [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
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
  const expiringItems = await Inventory.findExpiringSoon(days);

  return res.status(200).json({
    success: true,
    data: {
      expiringItems,
      count: expiringItems.length,
      days
    }
  });
}));

// @desc    Restock inventory item
// @route   POST /api/inventory/:id/restock
// @access  Private (Pharmacist, Admin)
router.post('/:id/restock', protect, requirePharmacist, [
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a non-negative number'),
  
  body('batchNumber')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Batch number must be between 1 and 50 characters'),
  
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    })
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

  const { quantity, unitPrice, batchNumber, expiryDate } = req.body;

  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Inventory item not found'
      }
    });
  }

  // Update inventory
  inventory.quantity += quantity;
  
  if (unitPrice) {
    inventory.unitPrice = unitPrice;
  }
  
  if (batchNumber) {
    inventory.batchNumber = batchNumber;
  }
  
  if (expiryDate) {
    inventory.expiryDate = new Date(expiryDate);
  }

  await inventory.save();

  logger.info(`Inventory restocked: ${inventory!.name} - Added ${quantity} units by user: ${req.user!.email}`);

  return res.status(200).json({
    success: true,
    data: inventory
  });
}));

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats
// @access  Private (Pharmacist, Admin)
router.get('/stats', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const [
    totalItems,
    lowStockCount,
    expiringCount,
    outOfStockCount,
    totalValue
  ] = await Promise.all([
    Inventory.countDocuments({ isActive: true }),
    Inventory.countDocuments({ $expr: { $lte: ['$quantity', '$reorderLevel'] }, isActive: true }),
    Inventory.countDocuments({ 
      expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), $gt: new Date() },
      isActive: true 
    }),
    Inventory.countDocuments({ quantity: 0, isActive: true }),
    Inventory.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$unitPrice'] } } } }
    ])
  ]);

  return res.status(200).json({
    success: true,
    data: {
      totalItems,
      lowStockCount,
      expiringCount,
      outOfStockCount,
      totalValue: totalValue[0]?.total || 0
    }
  });
}));

// @desc    Search inventory by barcode
// @route   GET /api/inventory/barcode/:barcode
// @access  Private (Cashier, Pharmacist, Admin)
router.get('/barcode/:barcode', protect, requireCashier, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { barcode } = req.params;

  const inventory = await Inventory.findOne({ 
    barcode: barcode,
    isActive: true 
  });

  if (!inventory) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Item with this barcode not found'
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      _id: inventory._id,
      name: inventory.name,
      brandName: inventory.brandName,
      quantity: inventory.quantity,
      sellingPrice: inventory.sellingPrice,
      isActive: inventory.isActive,
      isLowStock: inventory.quantity <= inventory.reorderLevel
    }
  });
}));

export default router;
