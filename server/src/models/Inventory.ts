import mongoose, { Document, Schema } from 'mongoose';

export interface IInventory extends Document {
  name: string;
  genericName?: string;
  brandName: string;
  category: string;
  description: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  supplier: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  expiryDate: Date;
  isPrescriptionRequired: boolean;
  isControlled: boolean;
  storageLocation: string;
  barcode?: string;
  image?: string;
  isActive: boolean;
  lastRestocked?: Date;
  totalSold: number;
  totalRevenue: number;
  calculateProfit(): number;
  isExpiringSoon(): boolean;
  isLowStock(): boolean;
  needsReorder(): boolean;
}

export interface IInventoryModel extends mongoose.Model<IInventory> {
  findExpiringSoon(days?: number): Promise<IInventory[]>;
  findLowStock(): mongoose.Query<IInventory[], IInventory>;
}

const inventorySchema = new Schema<IInventory>({
  name: {
    type: String,
    required: [true, 'Drug name is required'],
    trim: true,
    maxlength: [200, 'Drug name cannot be more than 200 characters']
  },
  genericName: {
    type: String,
    trim: true,
    maxlength: [200, 'Generic name cannot be more than 200 characters']
  },
  brandName: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true,
    maxlength: [200, 'Brand name cannot be more than 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Analgesics',
      'Antibiotics',
      'Antihypertensives',
      'Antidiabetics',
      'Antimalarials',
      'Vitamins',
      'Supplements',
      'First Aid',
      'Personal Care',
      'Medical Devices',
      'Other'
    ]
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  strength: {
    type: String,
    required: [true, 'Strength is required'],
    trim: true,
    maxlength: [50, 'Strength cannot be more than 50 characters']
  },
  dosageForm: {
    type: String,
    required: [true, 'Dosage form is required'],
    enum: [
      'Tablet',
      'Capsule',
      'Syrup',
      'Injection',
      'Cream',
      'Ointment',
      'Drops',
      'Inhaler',
      'Suppository',
      'Other'
    ]
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true,
    maxlength: [200, 'Manufacturer cannot be more than 200 characters']
  },
  supplier: {
    type: String,
    required: [true, 'Supplier is required'],
    trim: true,
    maxlength: [200, 'Supplier cannot be more than 200 characters']
  },
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true,
    maxlength: [50, 'Batch number cannot be more than 50 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  reorderLevel: {
    type: Number,
    required: [true, 'Reorder level is required'],
    min: [0, 'Reorder level cannot be negative'],
    default: 10
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    validate: {
      validator: function(v: Date) {
        return v > new Date();
      },
      message: 'Expiry date must be in the future'
    }
  },
  isPrescriptionRequired: {
    type: Boolean,
    default: false
  },
  isControlled: {
    type: Boolean,
    default: false
  },
  storageLocation: {
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse is required']
    },
    zone: {
      type: Schema.Types.ObjectId,
      ref: 'Zone'
    },
    rack: {
      type: Schema.Types.ObjectId,
      ref: 'Rack'
    },
    shelf: {
      type: Schema.Types.ObjectId,
      ref: 'Shelf'
    },
    slot: {
      type: Number,
      min: [1, 'Slot number must be at least 1']
    },
    customLocation: {
      type: String,
      trim: true,
      maxlength: [100, 'Custom location cannot be more than 100 characters']
    }
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: [50, 'Barcode cannot be more than 50 characters']
  },
  image: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastRestocked: {
    type: Date
  },
  totalSold: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for profit calculation
inventorySchema.virtual('profit').get(function(this: IInventory) {
  return this.calculateProfit();
});

// Virtual for days until expiry
inventorySchema.virtual('daysUntilExpiry').get(function(this: IInventory) {
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function(this: IInventory) {
  if (this.quantity === 0) return 'Out of Stock';
  if (this.isLowStock()) return 'Low Stock';
  if (this.isExpiringSoon()) return 'Expiring Soon';
  return 'In Stock';
});

// Indexes for better query performance
inventorySchema.index({ name: 'text', genericName: 'text', brandName: 'text' });
inventorySchema.index({ category: 1 });
inventorySchema.index({ expiryDate: 1 });
inventorySchema.index({ quantity: 1 });
inventorySchema.index({ isActive: 1 });

// Methods
inventorySchema.methods.calculateProfit = function(this: IInventory): number {
  return (this.sellingPrice - this.unitPrice) * this.totalSold;
};

inventorySchema.methods.isExpiringSoon = function(this: IInventory): boolean {
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30 && diffDays > 0; // Expiring within 30 days
};

inventorySchema.methods.isLowStock = function(this: IInventory): boolean {
  return this.quantity <= this.reorderLevel;
};

inventorySchema.methods.needsReorder = function(this: IInventory): boolean {
  return this.quantity <= this.reorderLevel && this.isActive;
};

// Pre-save middleware to update lastRestocked
inventorySchema.pre('save', function(this: IInventory, next: Function) {
  if (this.isModified('quantity') && this.quantity > 0) {
    this.lastRestocked = new Date();
  }
  next();
});

// Static method to find expiring drugs
inventorySchema.statics.findExpiringSoon = function(days = 30) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  return this.find({
    expiryDate: { $lte: expiryDate, $gt: new Date() },
    isActive: true
  }).exec();
};

// Static method to find low stock items
inventorySchema.statics.findLowStock = function() {
  return this.find({
    $expr: { $lte: ['$quantity', '$reorderLevel'] },
    isActive: true
  });
};

const Inventory = mongoose.model<IInventory, IInventoryModel>('Inventory', inventorySchema);
export { Inventory };
