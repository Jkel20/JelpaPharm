import mongoose, { Document, Schema } from 'mongoose';

export interface IPrescription extends Document {
  prescriptionNumber: string;
  customer: mongoose.Types.ObjectId;
  prescribedBy: string; // Doctor's name
  doctorLicense: string;
  doctorPhone?: string;
  prescriptionDate: Date;
  expiryDate: Date;
  status: 'active' | 'dispensed' | 'expired' | 'cancelled';
  items: Array<{
    drug: mongoose.Types.ObjectId;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions: string;
    isDispensed: boolean;
    dispensedDate?: Date;
    dispensedBy?: mongoose.Types.ObjectId;
  }>;
  diagnosis: string;
  allergies: string[];
  specialInstructions: string;
  pharmacist: mongoose.Types.ObjectId;
  dispensedDate?: Date;
  refills: number;
  refillsRemaining: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  generatePrescriptionNumber(): string;
  isExpired(): boolean;
  canRefill(): boolean;
  getTotalItems(): number;
  getDispensedItems(): number;
}

export interface IPrescriptionRefill extends Document {
  originalPrescription: mongoose.Types.ObjectId;
  prescriptionNumber: string;
  customer: mongoose.Types.ObjectId;
  items: Array<{
    drug: mongoose.Types.ObjectId;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions: string;
    isDispensed: boolean;
    dispensedDate?: Date;
    dispensedBy?: mongoose.Types.ObjectId;
  }>;
  refillNumber: number;
  refillDate: Date;
  dispensedDate?: Date;
  pharmacist: mongoose.Types.ObjectId;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const prescriptionSchema = new Schema<IPrescription>({
  prescriptionNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  prescribedBy: {
    type: String,
    required: [true, 'Prescribing doctor name is required'],
    trim: true,
    maxlength: [100, 'Doctor name cannot be more than 100 characters']
  },
  doctorLicense: {
    type: String,
    required: [true, 'Doctor license number is required'],
    trim: true,
    maxlength: [50, 'License number cannot be more than 50 characters']
  },
  doctorPhone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^(\+233|0)[0-9]{9}$/.test(v);
      },
      message: 'Please provide a valid Ghanaian phone number'
    }
  },
  prescriptionDate: {
    type: Date,
    required: [true, 'Prescription date is required'],
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: [true, 'Prescription expiry date is required'],
    validate: {
      validator: function(v: Date) {
        return v > new Date();
      },
      message: 'Expiry date must be in the future'
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'dispensed', 'expired', 'cancelled'],
    default: 'active'
  },
  items: [{
    drug: {
      type: Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
      trim: true,
      maxlength: [100, 'Dosage cannot be more than 100 characters']
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      trim: true,
      maxlength: [100, 'Frequency cannot be more than 100 characters']
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true,
      maxlength: [100, 'Duration cannot be more than 100 characters']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    instructions: {
      type: String,
      required: [true, 'Instructions are required'],
      trim: true,
      maxlength: [500, 'Instructions cannot be more than 500 characters']
    },
    isDispensed: {
      type: Boolean,
      default: false
    },
    dispensedDate: {
      type: Date
    },
    dispensedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required'],
    trim: true,
    maxlength: [500, 'Diagnosis cannot be more than 500 characters']
  },
  allergies: [{
    type: String,
    trim: true
  }],
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [1000, 'Special instructions cannot be more than 1000 characters']
  },
  pharmacist: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dispensedDate: {
    type: Date
  },
  refills: {
    type: Number,
    default: 0,
    min: [0, 'Refills cannot be negative']
  },
  refillsRemaining: {
    type: Number,
    default: 0,
    min: [0, 'Refills remaining cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const prescriptionRefillSchema = new Schema<IPrescriptionRefill>({
  originalPrescription: {
    type: Schema.Types.ObjectId,
    ref: 'Prescription',
    required: true
  },
  prescriptionNumber: {
    type: String,
    required: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [{
    drug: {
      type: Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    dosage: {
      type: String,
      required: true,
      trim: true
    },
    frequency: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    instructions: {
      type: String,
      required: true,
      trim: true
    },
    isDispensed: {
      type: Boolean,
      default: false
    },
    dispensedDate: {
      type: Date
    },
    dispensedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  refillNumber: {
    type: Number,
    required: true,
    min: 1
  },
  refillDate: {
    type: Date,
    default: Date.now
  },
  dispensedDate: {
    type: Date
  },
  pharmacist: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  }
}, {
  timestamps: true
});

// Virtual for formatted prescription number
prescriptionSchema.virtual('formattedNumber').get(function(this: IPrescription) {
  return `RX-${this.prescriptionNumber}`;
});

// Virtual for days until expiry
prescriptionSchema.virtual('daysUntilExpiry').get(function(this: IPrescription) {
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for prescription status
prescriptionSchema.virtual('statusInfo').get(function(this: IPrescription) {
  if (this.isExpired()) {
    return { status: 'expired', color: 'red', message: 'Prescription has expired' };
  } else if (this.status === 'active') {
    return { status: 'active', color: 'green', message: 'Prescription is active' };
  } else if (this.status === 'dispensed') {
    return { status: 'dispensed', color: 'blue', message: 'Prescription has been dispensed' };
  } else {
    return { status: 'cancelled', color: 'gray', message: 'Prescription has been cancelled' };
  }
});

// Generate prescription number
prescriptionSchema.methods.generatePrescriptionNumber = function(this: IPrescription): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${year}${month}${day}-${random}`;
};

// Check if prescription is expired
prescriptionSchema.methods.isExpired = function(this: IPrescription): boolean {
  return new Date() > new Date(this.expiryDate);
};

// Check if prescription can be refilled
prescriptionSchema.methods.canRefill = function(this: IPrescription): boolean {
  return this.refillsRemaining > 0 && !this.isExpired() && this.status === 'active';
};

// Get total number of items
prescriptionSchema.methods.getTotalItems = function(this: IPrescription): number {
  return this.items.length;
};

// Get number of dispensed items
prescriptionSchema.methods.getDispensedItems = function(this: IPrescription): number {
  return this.items.filter(item => item.isDispensed).length;
};

// Pre-save middleware to generate prescription number
prescriptionSchema.pre('save', function(next) {
  if (this.isNew && !this.prescriptionNumber) {
    this.prescriptionNumber = this.generatePrescriptionNumber();
  }
  next();
});

// Indexes for better performance
prescriptionSchema.index({ customer: 1 });
prescriptionSchema.index({ pharmacist: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ prescriptionDate: -1 });
prescriptionSchema.index({ expiryDate: 1 });

prescriptionRefillSchema.index({ originalPrescription: 1 });

prescriptionRefillSchema.index({ customer: 1 });
prescriptionRefillSchema.index({ refillDate: -1 });

export const Prescription = mongoose.model<IPrescription>('Prescription', prescriptionSchema);
export const PrescriptionRefill = mongoose.model<IPrescriptionRefill>('PrescriptionRefill', prescriptionRefillSchema);
