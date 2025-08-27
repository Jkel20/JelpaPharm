import express, { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { Warehouse } from '../models/Warehouse';
import { Zone } from '../models/Zone';
import { Rack } from '../models/Rack';
import { Shelf } from '../models/Shelf';
import { Inventory } from '../models/Inventory';
import { protect, requireAdmin, requirePharmacist } from '../middleware/auth';
import { AuthRequest } from '../types/auth';

const router = express.Router();

// @desc    Get all warehouses
// @route   GET /api/warehouses
// @access  Private (Admin, Pharmacist)
router.get('/', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const warehouses = await Warehouse.find({ isActive: true })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: warehouses
  });
}));

// @desc    Get warehouse by ID
// @route   GET /api/warehouses/:id
// @access  Private (Admin, Pharmacist)
router.get('/:id', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const warehouse = await Warehouse.findById(req.params.id);
  
  if (!warehouse) {
    res.status(404);
    throw new Error('Warehouse not found');
  }

  res.status(200).json({
    success: true,
    data: warehouse
  });
}));

// @desc    Create new warehouse
// @route   POST /api/warehouses
// @access  Private (Admin)
router.post('/', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    name,
    code,
    address,
    city,
    region,
    contactPerson,
    phone,
    email,
    capacity,
    temperatureZones,
    securityLevel,
    description,
    coordinates
  } = req.body;

  // Check if warehouse code already exists
  const existingWarehouse = await Warehouse.findOne({ code });
  if (existingWarehouse) {
    res.status(400);
    throw new Error('Warehouse code already exists');
  }

  const warehouse = await Warehouse.create({
    name,
    code,
    address,
    city,
    region,
    contactPerson,
    phone,
    email,
    capacity,
    temperatureZones,
    securityLevel,
    description,
    coordinates
  });

  res.status(201).json({
    success: true,
    data: warehouse
  });
}));

// @desc    Update warehouse
// @route   PUT /api/warehouses/:id
// @access  Private (Admin)
router.put('/:id', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const warehouse = await Warehouse.findById(req.params.id);
  
  if (!warehouse) {
    res.status(404);
    throw new Error('Warehouse not found');
  }

  // Check if code is being changed and if it already exists
  if (req.body.code && req.body.code !== warehouse.code) {
    const existingWarehouse = await Warehouse.findOne({ code: req.body.code });
    if (existingWarehouse) {
      res.status(400);
      throw new Error('Warehouse code already exists');
    }
  }

  const updatedWarehouse = await Warehouse.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: updatedWarehouse
  });
}));

// @desc    Delete warehouse
// @route   DELETE /api/warehouses/:id
// @access  Private (Admin)
router.delete('/:id', protect, requireAdmin, asyncHandler(async (req: AuthRequest, res: Response) => {
  const warehouse = await Warehouse.findById(req.params.id);
  
  if (!warehouse) {
    res.status(404);
    throw new Error('Warehouse not found');
  }

  // Check if warehouse has any inventory
  const inventoryCount = await Inventory.countDocuments({ 'storageLocation.warehouse': req.params.id });
  if (inventoryCount > 0) {
    res.status(400);
    throw new Error('Cannot delete warehouse with existing inventory');
  }

  // Soft delete
  warehouse.isActive = false;
  await warehouse.save();

  res.status(200).json({
    success: true,
    message: 'Warehouse deleted successfully'
  });
}));

// @desc    Get warehouse analytics
// @route   GET /api/warehouses/:id/analytics
// @access  Private (Admin, Pharmacist)
router.get('/:id/analytics', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const warehouse = await Warehouse.findById(req.params.id);
  
  if (!warehouse) {
    res.status(404);
    throw new Error('Warehouse not found');
  }

  // Get zones count
  const zonesCount = await Zone.countDocuments({ warehouse: req.params.id, isActive: true });
  
  // Get racks count
  const racksCount = await Rack.countDocuments({ 
    zone: { $in: await Zone.find({ warehouse: req.params.id }).distinct('_id') },
    isActive: true 
  });
  
  // Get shelves count
  const shelvesCount = await Shelf.countDocuments({ 
    rack: { $in: await Rack.find({ 
      zone: { $in: await Zone.find({ warehouse: req.params.id }).distinct('_id') } 
    }).distinct('_id') },
    isActive: true 
  });
  
  // Get inventory count
  const inventoryCount = await Inventory.countDocuments({ 
    'storageLocation.warehouse': req.params.id,
    isActive: true 
  });

  // Get utilization by zone
  const zones = await Zone.find({ warehouse: req.params.id, isActive: true });
  const zoneUtilization = zones.map(zone => ({
    zoneId: zone._id,
    zoneName: zone.name,
    utilization: zone.utilizationPercentage,
    usedSpace: zone.capacity.usedSpace,
    totalSpace: zone.capacity.totalSpace
  }));

  res.status(200).json({
    success: true,
    data: {
      warehouse,
      summary: {
        zonesCount,
        racksCount,
        shelvesCount,
        inventoryCount,
        utilization: warehouse.utilizationPercentage
      },
      zoneUtilization
    }
  });
}));

// @desc    Get warehouse layout
// @route   GET /api/warehouses/:id/layout
// @access  Private (Admin, Pharmacist)
router.get('/:id/layout', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const warehouse = await Warehouse.findById(req.params.id);
  
  if (!warehouse) {
    res.status(404);
    throw new Error('Warehouse not found');
  }

  // Get zones with their racks and shelves
  const zones = await Zone.find({ warehouse: req.params.id, isActive: true })
    .populate({
      path: 'racks',
      match: { isActive: true },
      populate: {
        path: 'shelves',
        match: { isActive: true }
      }
    });

  const layout = zones.map(zone => ({
    zoneId: zone._id,
    zoneName: zone.name,
    zoneType: zone.zoneType,
    utilization: zone.utilizationPercentage,
    racks: zone.racks || []
  }));

  res.status(200).json({
    success: true,
    data: layout
  });
}));

// @desc    Search warehouses
// @route   GET /api/warehouses/search/:query
// @access  Private (Admin, Pharmacist)
router.get('/search/:query', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.params.query;
  
  const warehouses = await Warehouse.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { code: { $regex: query, $options: 'i' } },
      { city: { $regex: query, $options: 'i' } },
      { region: { $regex: query, $options: 'i' } },
      { contactPerson: { $regex: query, $options: 'i' } }
    ]
  }).limit(10);

  res.status(200).json({
    success: true,
    data: warehouses
  });
}));

// @desc    Get warehouse capacity report
// @route   GET /api/warehouses/:id/capacity-report
// @access  Private (Admin, Pharmacist)
router.get('/:id/capacity-report', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const warehouse = await Warehouse.findById(req.params.id);
  
  if (!warehouse) {
    res.status(404);
    throw new Error('Warehouse not found');
  }

  // Get detailed capacity information
  const zones = await Zone.find({ warehouse: req.params.id, isActive: true });
  
  const capacityReport = {
    warehouse: {
      id: warehouse._id,
      name: warehouse.name,
      code: warehouse.code,
      totalSpace: warehouse.capacity.totalSpace,
      usedSpace: warehouse.capacity.usedSpace,
      availableSpace: warehouse.capacity.availableSpace,
      utilization: warehouse.utilizationPercentage
    },
    zones: await Promise.all(zones.map(async (zone) => {
      const racks = await Rack.find({ zone: zone._id, isActive: true });
      const shelves = await Shelf.find({ 
        rack: { $in: racks.map(r => r._id) }, 
        isActive: true 
      });
      
      return {
        zoneId: zone._id,
        zoneName: zone.name,
        zoneType: zone.zoneType,
        totalSpace: zone.capacity.totalSpace,
        usedSpace: zone.capacity.usedSpace,
        availableSpace: zone.capacity.availableSpace,
        utilization: zone.utilizationPercentage,
        racksCount: racks.length,
        shelvesCount: shelves.length,
        racks: racks.map(rack => ({
          rackId: rack._id,
          rackName: rack.name,
          rackCode: rack.code,
          totalSlots: rack.capacity.totalSlots,
          usedSlots: rack.capacity.usedSlots,
          availableSlots: rack.capacity.availableSlots,
          utilization: rack.utilizationPercentage
        }))
      };
    }))
  };

  res.status(200).json({
    success: true,
    data: capacityReport
  });
}));

export default router;
