import express, { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Shelf } from '../models/Shelf';
import { Rack } from '../models/Rack';
import { Zone } from '../models/Zone';
import { Inventory } from '../models/Inventory';
import { protect, requireAdmin, requirePharmacist } from '../middleware/auth';
import { AuthRequest } from '../types/auth';

const router = express.Router();

// @desc    Get all shelves
// @route   GET /api/shelves
// @access  Private (Admin, Pharmacist)
router.get('/', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const shelves = await Shelf.find({ isActive: true })
    .populate('rack', 'name code')
    .populate({
      path: 'rack',
      populate: {
        path: 'zone',
        select: 'name code',
        populate: {
          path: 'warehouse',
          select: 'name code'
        }
      }
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: shelves
  });
}));

// @desc    Get shelves by rack
// @route   GET /api/shelves/rack/:rackId
// @access  Private (Admin, Pharmacist)
router.get('/rack/:rackId', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const shelves = await Shelf.find({ 
    rack: req.params.rackId, 
    isActive: true 
  })
    .populate('rack', 'name code')
    .populate({
      path: 'rack',
      populate: {
        path: 'zone',
        select: 'name code',
        populate: {
          path: 'warehouse',
          select: 'name code'
        }
      }
    })
    .sort({ shelfNumber: 1 });

  res.status(200).json({
    success: true,
    data: shelves
  });
}));

// @desc    Get shelf by ID
// @route   GET /api/shelves/:id
// @access  Private (Admin, Pharmacist)
router.get('/:id', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const shelf = await Shelf.findById(req.params.id)
    .populate('rack', 'name code')
    .populate({
      path: 'rack',
      populate: {
        path: 'zone',
        select: 'name code',
        populate: {
          path: 'warehouse',
          select: 'name code'
        }
      }
    });
  
  if (!shelf) {
    res.status(404);
    throw new Error('Shelf not found');
  }

  res.status(200).json({
    success: true,
    data: shelf
  });
}));

// @desc    Create new shelf
// @route   POST /api/shelves
// @access  Private (Admin)
router.post('/', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    name,
    code,
    rack,
    shelfNumber,
    shelfType,
    dimensions,
    capacity,
    position,
    storageConditions,
    description
  } = req.body;

  // Check if rack exists
  const rackExists = await Rack.findById(rack);
  if (!rackExists) {
    res.status(400);
    throw new Error('Rack not found');
  }

  // Check if shelf code already exists in this rack
  const existingShelf = await Shelf.findOne({ rack, code });
  if (existingShelf) {
    res.status(400);
    throw new Error('Shelf code already exists in this rack');
  }

  // Check if shelf number already exists in this rack
  const existingShelfNumber = await Shelf.findOne({ rack, shelfNumber });
  if (existingShelfNumber) {
    res.status(400);
    throw new Error('Shelf number already exists in this rack');
  }

  // Check if position is already occupied
  const existingPosition = await Shelf.findOne({ 
    rack, 
    'position.row': position.row,
    'position.column': position.column,
    'position.level': position.level,
    'position.slot': position.slot,
    isActive: true
  });
  if (existingPosition) {
    res.status(400);
    throw new Error('Position is already occupied by another shelf');
  }

  const shelf = await Shelf.create({
    name,
    code,
    rack,
    shelfNumber,
    shelfType,
    dimensions,
    capacity,
    position,
    storageConditions,
    description
  });

  const populatedShelf = await shelf.populate([
    {
      path: 'rack',
      select: 'name code',
      populate: {
        path: 'zone',
        select: 'name code',
        populate: {
          path: 'warehouse',
          select: 'name code'
        }
      }
    }
  ]);

  res.status(201).json({
    success: true,
    data: populatedShelf
  });
}));

// @desc    Update shelf
// @route   PUT /api/shelves/:id
// @access  Private (Admin)
router.put('/:id', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const shelf = await Shelf.findById(req.params.id);
  
  if (!shelf) {
    res.status(404);
    throw new Error('Shelf not found');
  }

  // Check if code is being changed and if it already exists in the rack
  if (req.body.code && req.body.code !== shelf.code) {
    const existingShelf = await Shelf.findOne({ 
      rack: shelf.rack, 
      code: req.body.code 
    });
    if (existingShelf) {
      res.status(400);
      throw new Error('Shelf code already exists in this rack');
    }
  }

  // Check if shelf number is being changed and if it already exists in the rack
  if (req.body.shelfNumber && req.body.shelfNumber !== shelf.shelfNumber) {
    const existingShelfNumber = await Shelf.findOne({ 
      rack: shelf.rack, 
      shelfNumber: req.body.shelfNumber 
    });
    if (existingShelfNumber) {
      res.status(400);
      throw new Error('Shelf number already exists in this rack');
    }
  }

  // Check if position is being changed and if it's already occupied
  if (req.body.position && (
    req.body.position.row !== shelf.position.row ||
    req.body.position.column !== shelf.position.column ||
    req.body.position.level !== shelf.position.level ||
    req.body.position.slot !== shelf.position.slot
  )) {
    const existingPosition = await Shelf.findOne({ 
      rack: shelf.rack, 
      'position.row': req.body.position.row,
      'position.column': req.body.position.column,
      'position.level': req.body.position.level,
      'position.slot': req.body.position.slot,
      isActive: true,
      _id: { $ne: req.params.id }
    });
    if (existingPosition) {
      res.status(400);
      throw new Error('Position is already occupied by another shelf');
    }
  }

  const updatedShelf = await Shelf.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate([
    {
      path: 'rack',
      select: 'name code',
      populate: {
        path: 'zone',
        select: 'name code',
        populate: {
          path: 'warehouse',
          select: 'name code'
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: updatedShelf
  });
}));

// @desc    Delete shelf
// @route   DELETE /api/shelves/:id
// @access  Private (Admin)
router.delete('/:id', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const shelf = await Shelf.findById(req.params.id);
  
  if (!shelf) {
    res.status(404);
    throw new Error('Shelf not found');
  }

  // Check if shelf has any inventory
  const inventoryCount = await Inventory.countDocuments({ 'storageLocation.shelf': req.params.id });
  if (inventoryCount > 0) {
    res.status(400);
    throw new Error('Cannot delete shelf with existing inventory');
  }

  // Soft delete
  shelf.isActive = false;
  await shelf.save();

  res.status(200).json({
    success: true,
    message: 'Shelf deleted successfully'
  });
}));

// @desc    Get shelf analytics
// @route   GET /api/shelves/:id/analytics
// @access  Private (Admin, Pharmacist)
router.get('/:id/analytics', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const shelf = await Shelf.findById(req.params.id)
    .populate('rack', 'name code')
    .populate({
      path: 'rack',
      populate: {
        path: 'zone',
        select: 'name code',
        populate: {
          path: 'warehouse',
          select: 'name code'
        }
      }
    });
  
  if (!shelf) {
    res.status(404);
    throw new Error('Shelf not found');
  }

  // Get inventory count
  const inventoryCount = await Inventory.countDocuments({ 
    'storageLocation.shelf': req.params.id,
    isActive: true 
  });

  // Get inventory items
  const inventoryItems = await Inventory.find({ 
    'storageLocation.shelf': req.params.id,
    isActive: true 
  }).select('name brandName quantity expiryDate');

  res.status(200).json({
    success: true,
    data: {
      shelf,
      summary: {
        inventoryCount,
        utilization: shelf.utilizationPercentage,
        weightUtilization: shelf.weightUtilizationPercentage,
        cleaningStatus: shelf.cleaningStatus
      },
      inventoryItems
    }
  });
}));

// @desc    Update shelf cleaning schedule
// @route   PUT /api/shelves/:id/cleaning
// @access  Private (Admin, Pharmacist)
router.put('/:id/cleaning', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { lastCleaned, nextCleaningDate } = req.body;

  const shelf = await Shelf.findById(req.params.id);
  
  if (!shelf) {
    res.status(404);
    throw new Error('Shelf not found');
  }

  shelf.lastCleaned = lastCleaned;
  shelf.nextCleaningDate = nextCleaningDate;
  await shelf.save();

  const populatedShelf = await shelf.populate([
    {
      path: 'rack',
      select: 'name code',
      populate: {
        path: 'zone',
        select: 'name code',
        populate: {
          path: 'warehouse',
          select: 'name code'
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: populatedShelf
  });
}));

// @desc    Get shelves needing cleaning
// @route   GET /api/shelves/cleaning/overdue
// @access  Private (Admin, Pharmacist)
router.get('/cleaning/overdue', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const today = new Date();
  
  const overdueShelves = await Shelf.find({
    isActive: true,
    nextCleaningDate: { $lte: today }
  })
    .populate('rack', 'name code')
    .populate({
      path: 'rack',
      populate: {
        path: 'zone',
        select: 'name code',
        populate: {
          path: 'warehouse',
          select: 'name code'
        }
      }
    })
    .sort({ nextCleaningDate: 1 });

  res.status(200).json({
    success: true,
    data: overdueShelves
  });
}));

// @desc    Get shelves due for cleaning soon
// @route   GET /api/shelves/cleaning/upcoming
// @access  Private (Admin, Pharmacist)
router.get('/cleaning/upcoming', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  const upcomingShelves = await Shelf.find({
    isActive: true,
    nextCleaningDate: { 
      $gt: today, 
      $lte: nextWeek 
    }
  })
    .populate('rack', 'name code')
    .populate({
      path: 'rack',
      populate: {
        path: 'zone',
        select: 'name code',
        populate: {
          path: 'warehouse',
          select: 'name code'
        }
      }
    })
    .sort({ nextCleaningDate: 1 });

  res.status(200).json({
    success: true,
    data: upcomingShelves
  });
}));

// @desc    Search shelves
// @route   GET /api/shelves/search/:query
// @access  Private (Admin, Pharmacist)
router.get('/search/:query', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.params.query;
  
  const shelves = await Shelf.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { code: { $regex: query, $options: 'i' } },
      { shelfType: { $regex: query, $options: 'i' } }
    ]
  })
    .populate('rack', 'name code')
    .populate({
      path: 'rack',
      populate: {
        path: 'zone',
        select: 'name code',
        populate: {
          path: 'warehouse',
          select: 'name code'
        }
      }
    })
    .limit(10);

  res.status(200).json({
    success: true,
    data: shelves
  });
}));

// @desc    Get shelves by type
// @route   GET /api/shelves/type/:shelfType
// @access  Private (Admin, Pharmacist)
router.get('/type/:shelfType', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const shelves = await Shelf.find({ 
    shelfType: req.params.shelfType, 
    isActive: true 
  })
    .populate('rack', 'name code')
    .populate({
      path: 'rack',
      populate: {
        path: 'zone',
        select: 'name code',
        populate: {
          path: 'warehouse',
          select: 'name code'
        }
      }
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: shelves
  });
}));

// @desc    Get shelf capacity report
// @route   GET /api/shelves/:id/capacity-report
// @access  Private (Admin, Pharmacist)
router.get('/:id/capacity-report', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const shelf = await Shelf.findById(req.params.id)
    .populate('rack', 'name code')
    .populate({
      path: 'rack',
      populate: {
        path: 'zone',
        select: 'name code',
        populate: {
          path: 'warehouse',
          select: 'name code'
        }
      }
    });
  
  if (!shelf) {
    res.status(404);
    throw new Error('Shelf not found');
  }

  // Get inventory items with details
  const inventoryItems = await Inventory.find({ 
    'storageLocation.shelf': req.params.id,
    isActive: true 
  }).select('name brandName quantity unitPrice sellingPrice expiryDate');

  const capacityReport = {
    shelf: {
      id: shelf._id,
      name: shelf.name,
      code: shelf.code,
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
      cleaningStatus: shelf.cleaningStatus,
      lastCleaned: shelf.lastCleaned,
      nextCleaningDate: shelf.nextCleaningDate,
      storageConditions: shelf.storageConditions
    },
    inventoryItems
  };

  res.status(200).json({
    success: true,
    data: capacityReport
  });
}));

export default router;
