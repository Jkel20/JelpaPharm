import express, { Response } from 'express';
import { protect, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Supplier, PurchaseOrder } from '../models/Supplier';
import { AuthRequest } from '../types/auth';

const router = express.Router();

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private (Admin, Pharmacist)
router.get('/', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const suppliers = await Supplier.find({ isActive: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: suppliers
  });
}));

// @desc    Search suppliers by name, contact person, or email
// @route   GET /api/suppliers/search/:query
// @access  Private (Admin, Pharmacist)
router.get('/search/:query', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.params.query;
  
  const suppliers = await Supplier.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { contactPerson: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { phone: { $regex: query, $options: 'i' } }
    ]
  })
    .populate('createdBy', 'firstName lastName')
    .limit(10);

  res.status(200).json({
    success: true,
    data: suppliers
  });
}));

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private (Admin, Pharmacist)
router.get('/:id', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supplier = await Supplier.findById(req.params.id)
    .populate('createdBy', 'firstName lastName');

  if (!supplier) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Supplier not found'
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: supplier
  });
}));

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private (Admin only)
router.post('/', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated'
      }
    });
  }

  const supplier = await Supplier.create({
    ...req.body,
    createdBy: req.user._id
  });

  return res.status(201).json({
    success: true,
    data: supplier
  });
}));

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Admin only)
router.put('/:id', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated'
      }
    });
  }

  const supplier = await Supplier.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      updatedBy: req.user._id
    },
    { new: true, runValidators: true }
  );

  if (!supplier) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Supplier not found'
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: supplier
  });
}));

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin only)
router.delete('/:id', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated'
      }
    });
  }

  const supplier = await Supplier.findByIdAndUpdate(
    req.params.id,
    { isActive: false, updatedBy: req.user._id },
    { new: true }
  );

  if (!supplier) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Supplier not found'
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: {}
  });
}));

// Purchase Order Routes

// @desc    Get all purchase orders
// @route   GET /api/suppliers/purchase-orders
// @access  Private (Admin, Pharmacist)
router.get('/purchase-orders', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const purchaseOrders = await PurchaseOrder.find()
    .populate('supplier', 'name contactPerson')
    .populate('orderedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: purchaseOrders
  });
}));

// @desc    Search purchase orders by order number or supplier
// @route   GET /api/suppliers/purchase-orders/search/:query
// @access  Private (Admin, Pharmacist)
router.get('/purchase-orders/search/:query', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.params.query;
  
  const purchaseOrders = await PurchaseOrder.find({
    $or: [
      { orderNumber: { $regex: query, $options: 'i' } },
      { 'supplier.name': { $regex: query, $options: 'i' } }
    ]
  })
    .populate('supplier', 'name contactPerson')
    .populate('orderedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

  return res.status(200).json({
    success: true,
    data: purchaseOrders
  });
}));

// @desc    Get single purchase order
// @route   GET /api/suppliers/purchase-orders/:id
// @access  Private (Admin, Pharmacist)
router.get('/purchase-orders/:id', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const purchaseOrder = await PurchaseOrder.findById(req.params.id)
    .populate('supplier', 'name contactPerson')
    .populate('orderedBy', 'firstName lastName');

  if (!purchaseOrder) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Purchase order not found'
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: purchaseOrder
  });
}));

// @desc    Create purchase order
// @route   POST /api/suppliers/purchase-orders
// @access  Private (Admin only)
router.post('/purchase-orders', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const purchaseOrder = await PurchaseOrder.create({
    ...req.body,
    orderedBy: req.user!._id
  });

  return res.status(201).json({
    success: true,
    data: purchaseOrder
  });
}));

// @desc    Update purchase order
// @route   PUT /api/suppliers/purchase-orders/:id
// @access  Private (Admin only)
router.put('/purchase-orders/:id', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      updatedBy: req.user!._id
    },
    { new: true, runValidators: true }
  );

  if (!purchaseOrder) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Purchase order not found'
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: purchaseOrder
  });
}));

// @desc    Delete purchase order
// @route   DELETE /api/suppliers/purchase-orders/:id
// @access  Private (Admin only)
router.delete('/purchase-orders/:id', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const purchaseOrder = await PurchaseOrder.findByIdAndDelete(req.params.id);

  if (!purchaseOrder) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Purchase order not found'
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: {}
  });
}));

export default router;
