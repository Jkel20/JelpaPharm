import express, { Response } from 'express';
import { protect, requireCashier } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Customer, LoyaltyTransaction } from '../models/Customer';
import { AuthRequest } from '../types/auth';

const router = express.Router();

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private (Cashier, Pharmacist, Admin)
router.get('/', protect, requireCashier, asyncHandler(async (req: AuthRequest, res: Response) => {
  const customers = await Customer.find({ isActive: true })
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: customers
  });
}));

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private (Cashier, Pharmacist, Admin)
router.get('/:id', protect, requireCashier, asyncHandler(async (req: AuthRequest, res: Response) => {
  const customer = await Customer.findById(req.params.id)
    .populate('createdBy', 'firstName lastName');

  if (!customer) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Customer not found'
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: customer
  });
}));

// @desc    Create customer
// @route   POST /api/customers
// @access  Private (Cashier, Pharmacist, Admin)
router.post('/', protect, requireCashier, asyncHandler(async (req: AuthRequest, res: Response) => {
  const customer = await Customer.create({
    ...req.body,
    createdBy: req.user!._id
  });

  return res.status(201).json({
    success: true,
    data: customer
  });
}));

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private (Cashier, Pharmacist, Admin)
router.put('/:id', protect, requireCashier, asyncHandler(async (req: AuthRequest, res: Response) => {
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      updatedBy: req.user!._id
    },
    { new: true, runValidators: true }
  );

  if (!customer) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Customer not found'
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: customer
  });
}));

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private (Cashier, Pharmacist, Admin)
router.delete('/:id', protect, requireCashier, asyncHandler(async (req: AuthRequest, res: Response) => {
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    { isActive: false, updatedBy: req.user!._id },
    { new: true }
  );

  if (!customer) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Customer not found'
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: {}
  });
}));

// Loyalty Transaction Routes

// @desc    Get customer loyalty transactions
// @route   GET /api/customers/:id/loyalty-transactions
// @access  Private (Cashier, Pharmacist, Admin)
router.get('/:id/loyalty-transactions', protect, requireCashier, asyncHandler(async (req: AuthRequest, res: Response) => {
  const transactions = await LoyaltyTransaction.find({ customer: req.params.id })
    .populate('customer', 'firstName lastName customerId')
    .populate('createdBy', 'firstName lastName')
    .sort({ transactionDate: -1 });

  res.status(200).json({
    success: true,
    data: transactions
  });
}));

// @desc    Create loyalty transaction
// @route   POST /api/customers/:id/loyalty-transactions
// @access  Private (Cashier, Pharmacist, Admin)
router.post('/:id/loyalty-transactions', protect, requireCashier, asyncHandler(async (req: AuthRequest, res: Response) => {
  const transaction = await LoyaltyTransaction.create({
    ...req.body,
    customer: req.params.id,
    createdBy: req.user!._id
  });

  // Update customer loyalty points
  const customer = await Customer.findById(req.params.id);
  if (customer) {
    if (req.body.type === 'earned') {
      customer.addPoints(req.body.points);
    } else if (req.body.type === 'redeemed') {
      customer.loyaltyProgram.points -= req.body.points;
    }
    customer.calculateLoyaltyTier();
    await customer.save();
  }

  res.status(201).json({
    success: true,
    data: transaction
  });
}));

// @desc    Search customers by name or phone
// @route   GET /api/customers/search/:query
// @access  Private (Cashier, Pharmacist, Admin)
router.get('/search/:query', protect, requireCashier, asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.params.query;
  
  const customers = await Customer.find({
    isActive: true,
    $or: [
      { firstName: { $regex: query, $options: 'i' } },
      { lastName: { $regex: query, $options: 'i' } },
      { phone: { $regex: query, $options: 'i' } },
      { customerId: { $regex: query, $options: 'i' } }
    ]
  }).limit(10);

  res.status(200).json({
    success: true,
    data: customers
  });
}));

export default router;
