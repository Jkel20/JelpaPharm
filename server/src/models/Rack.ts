import mongoose, { Document, Schema } from 'mongoose';

export interface IRack extends Document {
  name: string;
  code: string;
  zone: mongoose.Types.ObjectId;
  rackType: 'standard' | 'mobile' | 'pallet' | 'mezzanine' | 'cantilever';
  dimensions: {
    width: number; // in meters
    height: number; // in meters
    depth: number; // in meters
  };
  capacity: {
    totalSlots: number;
    usedSlots: number;
    availableSlots: number;
    totalWeight: number; // in kg
    usedWeight: number;
    availableWeight: number;
  };
  position: {
    row: number;
    column: number;
    level: number;
  };
  isActive: boolean;
  description?: string;
  // Virtual properties
  utilizationPercentage: number;
  weightUtilizationPercentage: number;
  shelves?: mongoose.Types.ObjectId[];
  calculateUtilization(): number;
  updateSlotUsage(): void;
  updateWeightUsage(): void;
}

const rackSchema = new Schema<IRack>({
  name: {
    type: String,
    required: [true, 'Rack name is required'],
    trim: true,
    maxlength: [100, 'Rack name cannot be more than 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Rack code is required'],
    trim: true,
    uppercase: true,
    maxlength: [10, 'Rack code cannot be more than 10 characters']
  },
  zone: {
    type: Schema.Types.ObjectId,
    ref: 'Zone',
    required: [true, 'Zone is required']
  },
  rackType: {
    type: String,
    required: [true, 'Rack type is required'],
    enum: ['standard', 'mobile', 'pallet', 'mezzanine', 'cantilever']
  },
  dimensions: {
    width: {
      type: Number,
      required: [true, 'Width is required'],
      min: [0.1, 'Width must be at least 0.1 meters']
    },
    height: {
      type: Number,
      required: [true, 'Height is required'],
      min: [0.1, 'Height must be at least 0.1 meters']
    },
    depth: {
      type: Number,
      required: [true, 'Depth is required'],
      min: [0.1, 'Depth must be at least 0.1 meters']
    }
  },
  capacity: {
    totalSlots: {
      type: Number,
      required: [true, 'Total slots is required'],
      min: [1, 'Total slots must be at least 1']
    },
    usedSlots: {
      type: Number,
      default: 0,
      min: [0, 'Used slots cannot be negative']
    },
    availableSlots: {
      type: Number,
      default: 0,
      min: [0, 'Available slots cannot be negative']
    },
    totalWeight: {
      type: Number,
      required: [true, 'Total weight capacity is required'],
      min: [1, 'Total weight must be at least 1 kg']
    },
    usedWeight: {
      type: Number,
      default: 0,
      min: [0, 'Used weight cannot be negative']
    },
    availableWeight: {
      type: Number,
      default: 0,
      min: [0, 'Available weight cannot be negative']
    }
  },
  position: {
    row: {
      type: Number,
      required: [true, 'Row position is required'],
      min: [1, 'Row must be at least 1']
    },
    column: {
      type: Number,
      required: [true, 'Column position is required'],
      min: [1, 'Column must be at least 1']
    },
    level: {
      type: Number,
      required: [true, 'Level is required'],
      min: [1, 'Level must be at least 1']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for utilization percentage
rackSchema.virtual('utilizationPercentage').get(function(this: IRack) {
  return this.calculateUtilization();
});

// Virtual for weight utilization percentage
rackSchema.virtual('weightUtilizationPercentage').get(function(this: IRack) {
  if (this.capacity.totalWeight === 0) return 0;
  return Math.round((this.capacity.usedWeight / this.capacity.totalWeight) * 100);
});

// Methods
rackSchema.methods.calculateUtilization = function(this: IRack): number {
  if (this.capacity.totalSlots === 0) return 0;
  return Math.round((this.capacity.usedSlots / this.capacity.totalSlots) * 100);
};

rackSchema.methods.updateSlotUsage = function(this: IRack): void {
  this.capacity.availableSlots = this.capacity.totalSlots - this.capacity.usedSlots;
};

rackSchema.methods.updateWeightUsage = function(this: IRack): void {
  this.capacity.availableWeight = this.capacity.totalWeight - this.capacity.usedWeight;
};

// Pre-save middleware to update usage
rackSchema.pre('save', function(this: IRack, next: Function) {
  this.updateSlotUsage();
  this.updateWeightUsage();
  next();
});

// Indexes
rackSchema.index({ zone: 1, code: 1 });
rackSchema.index({ zone: 1, 'position.row': 1, 'position.column': 1, 'position.level': 1 });
rackSchema.index({ isActive: 1 });

const Rack = mongoose.model<IRack>('Rack', rackSchema);
export { Rack };
