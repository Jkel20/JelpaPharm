import mongoose, { Document, Schema } from 'mongoose';

export interface IZone extends Document {
  name: string;
  code: string;
  warehouse: mongoose.Types.ObjectId;
  zoneType: 'ambient' | 'refrigerated' | 'freezer' | 'controlled' | 'secure' | 'quarantine';
  temperatureRange: {
    min: number;
    max: number;
    unit: 'celsius' | 'fahrenheit';
  };
  humidityRange?: {
    min: number;
    max: number;
  };
  capacity: {
    totalSpace: number;
    usedSpace: number;
    availableSpace: number;
  };
  securityLevel: 'low' | 'medium' | 'high';
  accessLevel: 'public' | 'restricted' | 'authorized_only';
  description?: string;
  isActive: boolean;
  // Virtual properties
  utilizationPercentage: number;
  racks?: mongoose.Types.ObjectId[];
  calculateUtilization(): number;
  updateSpaceUsage(): void;
}

const zoneSchema = new Schema<IZone>({
  name: {
    type: String,
    required: [true, 'Zone name is required'],
    trim: true,
    maxlength: [100, 'Zone name cannot be more than 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Zone code is required'],
    trim: true,
    uppercase: true,
    maxlength: [10, 'Zone code cannot be more than 10 characters']
  },
  warehouse: {
    type: Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'Warehouse is required']
  },
  zoneType: {
    type: String,
    required: [true, 'Zone type is required'],
    enum: ['ambient', 'refrigerated', 'freezer', 'controlled', 'secure', 'quarantine']
  },
  temperatureRange: {
    min: {
      type: Number,
      required: [true, 'Minimum temperature is required']
    },
    max: {
      type: Number,
      required: [true, 'Maximum temperature is required']
    },
    unit: {
      type: String,
      enum: ['celsius', 'fahrenheit'],
      default: 'celsius'
    }
  },
  humidityRange: {
    min: {
      type: Number,
      min: 0,
      max: 100
    },
    max: {
      type: Number,
      min: 0,
      max: 100
    }
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
  securityLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  accessLevel: {
    type: String,
    enum: ['public', 'restricted', 'authorized_only'],
    default: 'restricted'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for utilization percentage
zoneSchema.virtual('utilizationPercentage').get(function(this: IZone) {
  return this.calculateUtilization();
});

// Methods
zoneSchema.methods.calculateUtilization = function(this: IZone): number {
  if (this.capacity.totalSpace === 0) return 0;
  return Math.round((this.capacity.usedSpace / this.capacity.totalSpace) * 100);
};

zoneSchema.methods.updateSpaceUsage = function(this: IZone): void {
  this.capacity.availableSpace = this.capacity.totalSpace - this.capacity.usedSpace;
};

// Pre-save middleware to update available space
zoneSchema.pre('save', function(this: IZone, next: Function) {
  this.updateSpaceUsage();
  next();
});

// Indexes
zoneSchema.index({ warehouse: 1, code: 1 });
zoneSchema.index({ warehouse: 1, zoneType: 1 });
zoneSchema.index({ isActive: 1 });

const Zone = mongoose.model<IZone>('Zone', zoneSchema);
export { Zone };
