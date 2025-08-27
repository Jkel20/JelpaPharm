import express, { Response } from 'express';
import { protect, requirePharmacist } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Prescription, PrescriptionRefill } from '../models/Prescription';
import { AuthRequest } from '../types/auth';

const router = express.Router();

// @desc    Get all prescriptions
// @route   GET /api/prescriptions
// @access  Private (Pharmacist, Admin)
router.get('/', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prescriptions = await Prescription.find()
    .populate('customer', 'firstName lastName customerId phone')
    .populate('pharmacist', 'firstName lastName')
    .sort({ prescriptionDate: -1 });

  res.status(200).json({
    success: true,
    data: prescriptions
  });
}));

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private (Pharmacist, Admin)
router.get('/:id', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('customer', 'firstName lastName customerId phone')
    .populate('pharmacist', 'firstName lastName');

  if (!prescription) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Prescription not found'
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: prescription
  });
}));

// @desc    Create prescription
// @route   POST /api/prescriptions
// @access  Private (Pharmacist, Admin)
router.post('/', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated'
      }
    });
  }

  const prescription = await Prescription.create({
    ...req.body,
    pharmacist: req.user._id
  });

  return res.status(201).json({
    success: true,
    data: prescription
  });
}));

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private (Pharmacist, Admin)
router.put('/:id', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated'
      }
    });
  }

  const prescription = await Prescription.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      updatedBy: req.user._id
    },
    { new: true, runValidators: true }
  );

  if (!prescription) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Prescription not found'
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: prescription
  });
}));

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
// @access  Private (Pharmacist, Admin)
router.delete('/:id', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prescription = await Prescription.findByIdAndDelete(req.params.id);

  if (!prescription) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Prescription not found'
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: {}
  });
}));

// @desc    Dispense prescription
// @route   PUT /api/prescriptions/:id/dispense
// @access  Private (Pharmacist, Admin)
router.put('/:id/dispense', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prescription = await Prescription.findById(req.params.id);
  
  if (!prescription) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Prescription not found'
      }
    });
  }

  prescription.status = 'dispensed';
  prescription.dispensedDate = new Date();
  
  // Update items to dispensed
  prescription.items.forEach(item => {
    if (!item.isDispensed) {
      item.isDispensed = true;
      item.dispensedDate = new Date();
      if (req.user) {
        item.dispensedBy = req.user._id as any;
      }
    }
  });

  await prescription.save();

  return res.status(200).json({
    success: true,
    data: prescription
  });
}));

// Prescription Refill Routes

// @desc    Get prescription refills
// @route   GET /api/prescriptions/refills
// @access  Private (Pharmacist, Admin)
router.get('/refills', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const refills = await PrescriptionRefill.find()
    .populate('originalPrescription', 'prescriptionNumber customer')
    .populate('customer', 'firstName lastName customerId')
    .populate('pharmacist', 'firstName lastName')
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: refills
  });
}));

// @desc    Create prescription refill
// @route   POST /api/prescriptions/refills
// @access  Private (Pharmacist, Admin)
router.post('/refills', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated'
      }
    });
  }

  const refill = await PrescriptionRefill.create({
    ...req.body,
    pharmacist: req.user._id
  });

  return res.status(201).json({
    success: true,
    data: refill
  });
}));

// @desc    Get prescriptions by customer
// @route   GET /api/prescriptions/customer/:customerId
// @access  Private (Pharmacist, Admin)
router.get('/customer/:customerId', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prescriptions = await Prescription.find({ customer: req.params.customerId })
    .populate('pharmacist', 'firstName lastName')
    .sort({ prescriptionDate: -1 });

  return res.status(200).json({
    success: true,
    data: prescriptions
  });
}));

// @desc    Search prescriptions by prescription number, customer, or prescribed by
// @route   GET /api/prescriptions/search/:query
// @access  Private (Pharmacist, Admin)
router.get('/search/:query', protect, requirePharmacist, asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.params.query;
  
  const prescriptions = await Prescription.find({
    $or: [
      { prescriptionNumber: { $regex: query, $options: 'i' } },
      { prescribedBy: { $regex: query, $options: 'i' } },
      { diagnosis: { $regex: query, $options: 'i' } }
    ]
  })
    .populate('customer', 'firstName lastName customerId')
    .populate('pharmacist', 'firstName lastName')
    .sort({ prescriptionDate: -1 })
    .limit(10);

  return res.status(200).json({
    success: true,
    data: prescriptions
  });
}));

export default router;
