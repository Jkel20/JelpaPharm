import express, { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { Rack } from '../models/Rack';
import { Zone } from '../models/Zone';
import { Shelf } from '../models/Shelf';
import { Inventory } from '../models/Inventory';
import { protect, requireAdmin, requirePharmacist } from '../middleware/auth';
import { AuthRequest } from '../types/auth';

const router = express.Router();

// @desc    Get all racks
// @route   GET /api/racks
// @access  Private (Admin, Pharmacist)
router.get('/', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const racks = await Rack.find({ isActive: true })
    .populate('zone', 'name code')
    .populate({
      path: 'zone',
      populate: {
        path: 'warehouse',
        select: 'name code'
      }
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: racks
  });
}));

// @desc    Get racks by zone
// @route   GET /api/racks/zone/:zoneId
// @access  Private (Admin, Pharmacist)
router.get('/zone/:zoneId', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const racks = await Rack.find({ 
    zone: req.params.zoneId, 
    isActive: true 
  })
    .populate('zone', 'name code')
    .populate({
      path: 'zone',
      populate: {
        path: 'warehouse',
        select: 'name code'
      }
    })
    .sort({ 'position.row': 1, 'position.column': 1, 'position.level': 1 });

  res.status(200).json({
    success: true,
    data: racks
  });
}));

// @desc    Get rack by ID
// @route   GET /api/racks/:id
// @access  Private (Admin, Pharmacist)
router.get('/:id', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const rack = await Rack.findById(req.params.id)
    .populate('zone', 'name code')
    .populate({
      path: 'zone',
      populate: {
        path: 'warehouse',
        select: 'name code'
      }
    });
  
  if (!rack) {
    res.status(404);
    throw new Error('Rack not found');
  }

  res.status(200).json({
    success: true,
    data: rack
  });
}));

// @desc    Create new rack
// @route   POST /api/racks
// @access  Private (Admin)
router.post('/', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    name,
    code,
    zone,
    rackType,
    dimensions,
    capacity,
    position,
    description
  } = req.body;

  // Check if zone exists
  const zoneExists = await Zone.findById(zone);
  if (!zoneExists) {
    res.status(400);
    throw new Error('Zone not found');
  }

  // Check if rack code already exists in this zone
  const existingRack = await Rack.findOne({ zone, code });
  if (existingRack) {
    res.status(400);
    throw new Error('Rack code already exists in this zone');
  }

  // Check if position is already occupied
  const existingPosition = await Rack.findOne({ 
    zone, 
    'position.row': position.row,
    'position.column': position.column,
    'position.level': position.level,
    isActive: true
  });
  if (existingPosition) {
    res.status(400);
    throw new Error('Position is already occupied by another rack');
  }

  const rack = await Rack.create({
    name,
    code,
    zone,
    rackType,
    dimensions,
    capacity,
    position,
    description
  });

  const populatedRack = await rack.populate([
    {
      path: 'zone',
      select: 'name code',
      populate: {
        path: 'warehouse',
        select: 'name code'
      }
    }
  ]);

  res.status(201).json({
    success: true,
    data: populatedRack
  });
}));

// @desc    Update rack
// @route   PUT /api/racks/:id
// @access  Private (Admin)
router.put('/:id', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const rack = await Rack.findById(req.params.id);
  
  if (!rack) {
    res.status(404);
    throw new Error('Rack not found');
  }

  // Check if code is being changed and if it already exists in the zone
  if (req.body.code && req.body.code !== rack.code) {
    const existingRack = await Rack.findOne({ 
      zone: rack.zone, 
      code: req.body.code 
    });
    if (existingRack) {
      res.status(400);
      throw new Error('Rack code already exists in this zone');
    }
  }

  // Check if position is being changed and if it's already occupied
  if (req.body.position && (
    req.body.position.row !== rack.position.row ||
    req.body.position.column !== rack.position.column ||
    req.body.position.level !== rack.position.level
  )) {
    const existingPosition = await Rack.findOne({ 
      zone: rack.zone, 
      'position.row': req.body.position.row,
      'position.column': req.body.position.column,
      'position.level': req.body.position.level,
      isActive: true,
      _id: { $ne: req.params.id }
    });
    if (existingPosition) {
      res.status(400);
      throw new Error('Position is already occupied by another rack');
    }
  }

  const updatedRack = await Rack.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate([
    {
      path: 'zone',
      select: 'name code',
      populate: {
        path: 'warehouse',
        select: 'name code'
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: updatedRack
  });
}));

// @desc    Delete rack
// @route   DELETE /api/racks/:id
// @access  Private (Admin)
router.delete('/:id', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const rack = await Rack.findById(req.params.id);
  
  if (!rack) {
    res.status(404);
    throw new Error('Rack not found');
  }

  // Check if rack has any inventory
  const inventoryCount = await Inventory.countDocuments({ 'storageLocation.rack': req.params.id });
  if (inventoryCount > 0) {
    res.status(400);
    throw new Error('Cannot delete rack with existing inventory');
  }

  // Check if rack has any shelves
  const shelvesCount = await Shelf.countDocuments({ rack: req.params.id });
  if (shelvesCount > 0) {
    res.status(400);
    throw new Error('Cannot delete rack with existing shelves');
  }

  // Soft delete
  rack.isActive = false;
  await rack.save();

  res.status(200).json({
    success: true,
    message: 'Rack deleted successfully'
  });
}));

// @desc    Get rack analytics
// @route   GET /api/racks/:id/analytics
// @access  Private (Admin, Pharmacist)
router.get('/:id/analytics', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const rack = await Rack.findById(req.params.id)
    .populate('zone', 'name code')
    .populate({
      path: 'zone',
      populate: {
        path: 'warehouse',
        select: 'name code'
      }
    });
  
  if (!rack) {
    res.status(404);
    throw new Error('Rack not found');
  }

  // Get shelves count
  const shelvesCount = await Shelf.countDocuments({ rack: req.params.id, isActive: true });
  
  // Get inventory count
  const inventoryCount = await Inventory.countDocuments({ 
    'storageLocation.rack': req.params.id,
    isActive: true 
  });

  // Get shelves with their utilization
  const shelves = await Shelf.find({ rack: req.params.id, isActive: true });
  const shelvesUtilization = shelves.map(shelf => ({
    shelfId: shelf._id,
    shelfName: shelf.name,
    shelfCode: shelf.code,
    shelfNumber: shelf.shelfNumber,
    utilization: shelf.utilizationPercentage,
    usedSlots: shelf.capacity.usedSlots,
    totalSlots: shelf.capacity.totalSlots,
    weightUtilization: shelf.weightUtilizationPercentage,
    cleaningStatus: shelf.cleaningStatus
  }));

  res.status(200).json({
    success: true,
    data: {
      rack,
      summary: {
        shelvesCount,
        inventoryCount,
        utilization: rack.utilizationPercentage,
        weightUtilization: rack.weightUtilizationPercentage
      },
      shelvesUtilization
    }
  });
}));

// @desc    Get rack layout
// @route   GET /api/racks/:id/layout
// @access  Private (Admin, Pharmacist)
router.get('/:id/layout', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const rack = await Rack.findById(req.params.id)
    .populate('zone', 'name code')
    .populate({
      path: 'zone',
      populate: {
        path: 'warehouse',
        select: 'name code'
      }
    });
  
  if (!rack) {
    res.status(404);
    throw new Error('Rack not found');
  }

  // Get shelves
  const shelves = await Shelf.find({ rack: req.params.id, isActive: true })
    .sort({ shelfNumber: 1 });

  const layout = {
    rack,
    shelves: shelves.map(shelf => ({
      shelfId: shelf._id,
      shelfName: shelf.name,
      shelfCode: shelf.code,
      shelfNumber: shelf.shelfNumber,
      shelfType: shelf.shelfType,
      position: shelf.position,
      utilization: shelf.utilizationPercentage,
      weightUtilization: shelf.weightUtilizationPercentage,
      cleaningStatus: shelf.cleaningStatus,
      storageConditions: shelf.storageConditions
    }))
  };

  res.status(200).json({
    success: true,
    data: layout
  });
}));

// @desc    Search racks
// @route   GET /api/racks/search/:query
// @access  Private (Admin, Pharmacist)
router.get('/search/:query', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.params.query;
  
  const racks = await Rack.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { code: { $regex: query, $options: 'i' } },
      { rackType: { $regex: query, $options: 'i' } }
    ]
  })
    .populate('zone', 'name code')
    .populate({
      path: 'zone',
      populate: {
        path: 'warehouse',
        select: 'name code'
      }
    })
    .limit(10);

  res.status(200).json({
    success: true,
    data: racks
  });
}));

// @desc    Get racks by type
// @route   GET /api/racks/type/:rackType
// @access  Private (Admin, Pharmacist)
router.get('/type/:rackType', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const racks = await Rack.find({ 
    rackType: req.params.rackType, 
    isActive: true 
  })
    .populate('zone', 'name code')
    .populate({
      path: 'zone',
      populate: {
        path: 'warehouse',
        select: 'name code'
      }
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: racks
  });
}));

// @desc    Get rack capacity report
// @route   GET /api/racks/:id/capacity-report
// @access  Private (Admin, Pharmacist)
router.get('/:id/capacity-report', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const rack = await Rack.findById(req.params.id)
    .populate('zone', 'name code')
    .populate({
      path: 'zone',
      populate: {
        path: 'warehouse',
        select: 'name code'
      }
    });
  
  if (!rack) {
    res.status(404);
    throw new Error('Rack not found');
  }

  // Get detailed capacity information
  const shelves = await Shelf.find({ rack: req.params.id, isActive: true });
  
  const capacityReport = {
    rack: {
      id: rack._id,
      name: rack.name,
      code: rack.code,
      rackType: rack.rackType,
      totalSlots: rack.capacity.totalSlots,
      usedSlots: rack.capacity.usedSlots,
      availableSlots: rack.capacity.availableSlots,
      utilization: rack.utilizationPercentage,
      totalWeight: rack.capacity.totalWeight,
      usedWeight: rack.capacity.usedWeight,
      availableWeight: rack.capacity.availableWeight,
      weightUtilization: rack.weightUtilizationPercentage
    },
    shelves: shelves.map(shelf => ({
      shelfId: shelf._id,
      shelfName: shelf.name,
      shelfCode: shelf.code,
      shelfNumber: shelf.shelfNumber,
      shelfType: shelf.shelfType,
      totalSlots: shelf.capacity.totalSlots,
      usedSlots: shelf.capacity.usedSlots,
      availableSlots: shelf.capacity.availableSlots,
      utilization: shelf.utilizationPercentage,
      totalWeight: shelf.capacity.totalWeight,
      usedWeight: shelf.capacity.usedWeight,
      availableWeight: shelf.capacity.availableWeight,
      weightUtilization: shelf.weightUtilizationPercentage,
      cleaningStatus: shelf.cleaningStatus
    }))
  };

  res.status(200).json({
    success: true,
    data: capacityReport
  });
}));

export default router;
