import mongoose, { Document, Schema } from 'mongoose';

export interface IWarehouse extends Document {
  name: string;
  code: string;
  address: string;
  city: string;
  region: string;
  contactPerson: string;
  phone: string;
  email: string;
  capacity: {
    totalSpace: number; // in cubic meters
    usedSpace: number;
    availableSpace: number;
  };
  temperatureZones: {
    refrigerated: boolean;
    controlled: boolean;
    ambient: boolean;
    freezer: boolean;
  };
  securityLevel: 'low' | 'medium' | 'high';
  isActive: boolean;
  description?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  // Virtual properties
  utilizationPercentage: number;
  calculateUtilization(): number;
  updateSpaceUsage(): void;
}

const warehouseSchema = new Schema<IWarehouse>({
  name: {
    type: String,
    required: [true, 'Warehouse name is required'],
    trim: true,
    maxlength: [100, 'Warehouse name cannot be more than 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Warehouse code is required'],
    unique: true,
    index: true,
    trim: true,
    uppercase: true,
    maxlength: [10, 'Warehouse code cannot be more than 10 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot be more than 200 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [50, 'City cannot be more than 50 characters']
  },
  region: {
    type: String,
    required: [true, 'Region is required'],
    trim: true,
    maxlength: [50, 'Region cannot be more than 50 characters']
  },
  contactPerson: {
    type: String,
    required: [true, 'Contact person is required'],
    trim: true,
    maxlength: [100, 'Contact person cannot be more than 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    maxlength: [20, 'Phone number cannot be more than 20 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  capacity: {
    totalSpace: {
      type: Number,
      required: [true, 'Total space is required'],
      min: [0, 'Total space cannot be negative']
    },
    usedSpace: {
      type: Number,
      default: 0,
      min: [0, 'Used space cannot be negative']
    },
    availableSpace: {
      type: Number,
      default: 0,
      min: [0, 'Available space cannot be negative']
    }
  },
  temperatureZones: {
    refrigerated: {
      type: Boolean,
      default: false
    },
    controlled: {
      type: Boolean,
      default: true
    },
    ambient: {
      type: Boolean,
      default: true
    },
    freezer: {
      type: Boolean,
      default: false
    }
  },
  securityLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for utilization percentage
warehouseSchema.virtual('utilizationPercentage').get(function(this: IWarehouse) {
  return this.calculateUtilization();
});

// Methods
warehouseSchema.methods.calculateUtilization = function(this: IWarehouse): number {
  if (this.capacity.totalSpace === 0) return 0;
  return Math.round((this.capacity.usedSpace / this.capacity.totalSpace) * 100);
};

warehouseSchema.methods.updateSpaceUsage = function(this: IWarehouse): void {
  this.capacity.availableSpace = this.capacity.totalSpace - this.capacity.usedSpace;
};

// Pre-save middleware to update available space
warehouseSchema.pre('save', function(this: IWarehouse, next: Function) {
  this.updateSpaceUsage();
  next();
});

// Indexes
warehouseSchema.index({ isActive: 1 });
warehouseSchema.index({ city: 1, region: 1 });

const Warehouse = mongoose.model<IWarehouse>('Warehouse', warehouseSchema);
export { Warehouse };
