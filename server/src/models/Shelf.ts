import mongoose, { Document, Schema } from 'mongoose';

export interface IShelf extends Document {
  name: string;
  code: string;
  rack: mongoose.Types.ObjectId;
  shelfNumber: number;
  shelfType: 'standard' | 'adjustable' | 'fixed' | 'mobile' | 'specialized';
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
    maxItemsPerSlot: number;
  };
  position: {
    row: number;
    column: number;
    level: number;
    slot: number;
  };
  storageConditions: {
    temperature: {
      min: number;
      max: number;
      unit: 'celsius' | 'fahrenheit';
    };
    humidity?: {
      min: number;
      max: number;
    };
    lightSensitive: boolean;
    refrigerated: boolean;
  };
  isActive: boolean;
  description?: string;
  lastCleaned?: Date;
  nextCleaningDate?: Date;
  // Virtual properties
  utilizationPercentage: number;
  weightUtilizationPercentage: number;
  cleaningStatus: 'clean' | 'needs_cleaning' | 'overdue';
  calculateUtilization(): number;
  updateSlotUsage(): void;
  updateWeightUsage(): void;
  needsCleaning(): boolean;
}

const shelfSchema = new Schema<IShelf>({
  name: {
    type: String,
    required: [true, 'Shelf name is required'],
    trim: true,
    maxlength: [100, 'Shelf name cannot be more than 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Shelf code is required'],
    trim: true,
    uppercase: true,
    maxlength: [15, 'Shelf code cannot be more than 15 characters']
  },
  rack: {
    type: Schema.Types.ObjectId,
    ref: 'Rack',
    required: [true, 'Rack is required']
  },
  shelfNumber: {
    type: Number,
    required: [true, 'Shelf number is required'],
    min: [1, 'Shelf number must be at least 1']
  },
  shelfType: {
    type: String,
    required: [true, 'Shelf type is required'],
    enum: ['standard', 'adjustable', 'fixed', 'mobile', 'specialized']
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
    },
    maxItemsPerSlot: {
      type: Number,
      default: 1,
      min: [1, 'Max items per slot must be at least 1']
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
    },
    slot: {
      type: Number,
      required: [true, 'Slot number is required'],
      min: [1, 'Slot must be at least 1']
    }
  },
  storageConditions: {
    temperature: {
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
    humidity: {
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
    lightSensitive: {
      type: Boolean,
      default: false
    },
    refrigerated: {
      type: Boolean,
      default: false
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
  },
  lastCleaned: {
    type: Date
  },
  nextCleaningDate: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for utilization percentage
shelfSchema.virtual('utilizationPercentage').get(function(this: IShelf) {
  return this.calculateUtilization();
});

// Virtual for weight utilization percentage
shelfSchema.virtual('weightUtilizationPercentage').get(function(this: IShelf) {
  if (this.capacity.totalWeight === 0) return 0;
  return Math.round((this.capacity.usedWeight / this.capacity.totalWeight) * 100);
});

// Virtual for cleaning status
shelfSchema.virtual('cleaningStatus').get(function(this: IShelf) {
  if (!this.nextCleaningDate) return 'No Schedule';
  const today = new Date();
  const cleaningDate = new Date(this.nextCleaningDate);
  const diffTime = cleaningDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Overdue';
  if (diffDays <= 7) return 'Due Soon';
  return 'Scheduled';
});

// Methods
shelfSchema.methods.calculateUtilization = function(this: IShelf): number {
  if (this.capacity.totalSlots === 0) return 0;
  return Math.round((this.capacity.usedSlots / this.capacity.totalSlots) * 100);
};

shelfSchema.methods.updateSlotUsage = function(this: IShelf): void {
  this.capacity.availableSlots = this.capacity.totalSlots - this.capacity.usedSlots;
};

shelfSchema.methods.updateWeightUsage = function(this: IShelf): void {
  this.capacity.availableWeight = this.capacity.totalWeight - this.capacity.usedWeight;
};

shelfSchema.methods.needsCleaning = function(this: IShelf): boolean {
  if (!this.nextCleaningDate) return false;
  const today = new Date();
  const cleaningDate = new Date(this.nextCleaningDate);
  return cleaningDate <= today;
};

// Pre-save middleware to update usage
shelfSchema.pre('save', function(this: IShelf, next: Function) {
  this.updateSlotUsage();
  this.updateWeightUsage();
  next();
});

// Indexes
shelfSchema.index({ rack: 1, code: 1 });
shelfSchema.index({ rack: 1, shelfNumber: 1 });
shelfSchema.index({ 'position.row': 1, 'position.column': 1, 'position.level': 1, 'position.slot': 1 });
shelfSchema.index({ isActive: 1 });
shelfSchema.index({ nextCleaningDate: 1 });

const Shelf = mongoose.model<IShelf>('Shelf', shelfSchema);
export { Shelf };
