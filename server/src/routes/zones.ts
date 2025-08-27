import express, { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { Zone } from '../models/Zone';
import { Warehouse } from '../models/Warehouse';
import { Rack } from '../models/Rack';
import { Shelf } from '../models/Shelf';
import { Inventory } from '../models/Inventory';
import { protect, requireAdmin, requirePharmacist } from '../middleware/auth';
import { AuthRequest } from '../types/auth';

const router = express.Router();

// @desc    Get all zones
// @route   GET /api/zones
// @access  Private (Admin, Pharmacist)
router.get('/', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const zones = await Zone.find({ isActive: true })
    .populate('warehouse', 'name code')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: zones
  });
}));

// @desc    Get zones by warehouse
// @route   GET /api/zones/warehouse/:warehouseId
// @access  Private (Admin, Pharmacist)
router.get('/warehouse/:warehouseId', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const zones = await Zone.find({ 
    warehouse: req.params.warehouseId, 
    isActive: true 
  })
    .populate('warehouse', 'name code')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: zones
  });
}));

// @desc    Get zone by ID
// @route   GET /api/zones/:id
// @access  Private (Admin, Pharmacist)
router.get('/:id', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const zone = await Zone.findById(req.params.id)
    .populate('warehouse', 'name code');
  
  if (!zone) {
    res.status(404);
    throw new Error('Zone not found');
  }

  res.status(200).json({
    success: true,
    data: zone
  });
}));

// @desc    Create new zone
// @route   POST /api/zones
// @access  Private (Admin)
router.post('/', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    name,
    code,
    warehouse,
    zoneType,
    temperatureRange,
    humidityRange,
    capacity,
    securityLevel,
    accessLevel,
    description
  } = req.body;

  // Check if warehouse exists
  const warehouseExists = await Warehouse.findById(warehouse);
  if (!warehouseExists) {
    res.status(400);
    throw new Error('Warehouse not found');
  }

  // Check if zone code already exists in this warehouse
  const existingZone = await Zone.findOne({ warehouse, code });
  if (existingZone) {
    res.status(400);
    throw new Error('Zone code already exists in this warehouse');
  }

  const zone = await Zone.create({
    name,
    code,
    warehouse,
    zoneType,
    temperatureRange,
    humidityRange,
    capacity,
    securityLevel,
    accessLevel,
    description
  });

  const populatedZone = await zone.populate('warehouse', 'name code');

  res.status(201).json({
    success: true,
    data: populatedZone
  });
}));

// @desc    Update zone
// @route   PUT /api/zones/:id
// @access  Private (Admin)
router.put('/:id', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const zone = await Zone.findById(req.params.id);
  
  if (!zone) {
    res.status(404);
    throw new Error('Zone not found');
  }

  // Check if code is being changed and if it already exists in the warehouse
  if (req.body.code && req.body.code !== zone.code) {
    const existingZone = await Zone.findOne({ 
      warehouse: zone.warehouse, 
      code: req.body.code 
    });
    if (existingZone) {
      res.status(400);
      throw new Error('Zone code already exists in this warehouse');
    }
  }

  const updatedZone = await Zone.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('warehouse', 'name code');

  res.status(200).json({
    success: true,
    data: updatedZone
  });
}));

// @desc    Delete zone
// @route   DELETE /api/zones/:id
// @access  Private (Admin)
router.delete('/:id', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const zone = await Zone.findById(req.params.id);
  
  if (!zone) {
    res.status(404);
    throw new Error('Zone not found');
  }

  // Check if zone has any inventory
  const inventoryCount = await Inventory.countDocuments({ 'storageLocation.zone': req.params.id });
  if (inventoryCount > 0) {
    res.status(400);
    throw new Error('Cannot delete zone with existing inventory');
  }

  // Check if zone has any racks
  const racksCount = await Rack.countDocuments({ zone: req.params.id });
  if (racksCount > 0) {
    res.status(400);
    throw new Error('Cannot delete zone with existing racks');
  }

  // Soft delete
  zone.isActive = false;
  await zone.save();

  res.status(200).json({
    success: true,
    message: 'Zone deleted successfully'
  });
}));

// @desc    Get zone analytics
// @route   GET /api/zones/:id/analytics
// @access  Private (Admin, Pharmacist)
router.get('/:id/analytics', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const zone = await Zone.findById(req.params.id)
    .populate('warehouse', 'name code');
  
  if (!zone) {
    res.status(404);
    throw new Error('Zone not found');
  }

  // Get racks count
  const racksCount = await Rack.countDocuments({ zone: req.params.id, isActive: true });
  
  // Get shelves count
  const shelvesCount = await Shelf.countDocuments({ 
    rack: { $in: await Rack.find({ zone: req.params.id }).distinct('_id') },
    isActive: true 
  });
  
  // Get inventory count
  const inventoryCount = await Inventory.countDocuments({ 
    'storageLocation.zone': req.params.id,
    isActive: true 
  });

  // Get racks with their utilization
  const racks = await Rack.find({ zone: req.params.id, isActive: true });
  const racksUtilization = racks.map(rack => ({
    rackId: rack._id,
    rackName: rack.name,
    rackCode: rack.code,
    utilization: rack.utilizationPercentage,
    usedSlots: rack.capacity.usedSlots,
    totalSlots: rack.capacity.totalSlots,
    weightUtilization: rack.weightUtilizationPercentage
  }));

  res.status(200).json({
    success: true,
    data: {
      zone,
      summary: {
        racksCount,
        shelvesCount,
        inventoryCount,
        utilization: zone.utilizationPercentage
      },
      racksUtilization
    }
  });
}));

// @desc    Get zone layout
// @route   GET /api/zones/:id/layout
// @access  Private (Admin, Pharmacist)
router.get('/:id/layout', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const zone = await Zone.findById(req.params.id)
    .populate('warehouse', 'name code');
  
  if (!zone) {
    res.status(404);
    throw new Error('Zone not found');
  }

  // Get racks with their shelves
  const racks = await Rack.find({ zone: req.params.id, isActive: true })
    .populate({
      path: 'shelves',
      match: { isActive: true }
    });

  const layout = racks.map(rack => ({
    rackId: rack._id,
    rackName: rack.name,
    rackCode: rack.code,
    rackType: rack.rackType,
    position: rack.position,
    utilization: rack.utilizationPercentage,
    shelves: rack.shelves || []
  }));

  res.status(200).json({
    success: true,
    data: {
      zone,
      layout
    }
  });
}));

// @desc    Search zones
// @route   GET /api/zones/search/:query
// @access  Private (Admin, Pharmacist)
router.get('/search/:query', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.params.query;
  
  const zones = await Zone.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { code: { $regex: query, $options: 'i' } },
      { zoneType: { $regex: query, $options: 'i' } }
    ]
  })
    .populate('warehouse', 'name code')
    .limit(10);

  res.status(200).json({
    success: true,
    data: zones
  });
}));

// @desc    Get zones by type
// @route   GET /api/zones/type/:zoneType
// @access  Private (Admin, Pharmacist)
router.get('/type/:zoneType', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const zones = await Zone.find({ 
    zoneType: req.params.zoneType, 
    isActive: true 
  })
    .populate('warehouse', 'name code')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: zones
  });
}));

export default router;
