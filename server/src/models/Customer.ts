import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  gender: 'male' | 'female' | 'other';
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory: {
    allergies: string[];
    chronicConditions: string[];
    currentMedications: string[];
    notes: string;
  };
  loyaltyProgram: {
    memberSince: Date;
    points: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    totalSpent: number;
    totalPurchases: number;
    lastPurchaseDate?: Date;
  };
  preferences: {
    preferredPaymentMethod: 'cash' | 'mobile_money' | 'card' | 'bank_transfer';
    marketingConsent: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
  };
  isActive: boolean;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  generateCustomerId(): string;
  calculateLoyaltyTier(): void;
  addPoints(points: number): void;
  getFullName(): string;
}

export interface ILoyaltyTransaction extends Document {
  customer: mongoose.Types.ObjectId;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus';
  points: number;
  description: string;
  transactionDate: Date;
  expiryDate?: Date;
  relatedSale?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
}

const customerSchema = new Schema<ICustomer>({
  customerId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^(\+233|0)[0-9]{9}$/.test(v);
      },
      message: 'Please provide a valid Ghanaian phone number'
    }
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(v: Date) {
        if (!v) return true; // Optional field
        return v < new Date();
      },
      message: 'Date of birth must be in the past'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [200, 'Street address cannot be more than 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot be more than 100 characters']
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
      trim: true,
      maxlength: [100, 'Region cannot be more than 100 characters']
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Postal code cannot be more than 20 characters']
    },
    country: {
      type: String,
      default: 'Ghana',
      trim: true
    }
  },
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required'],
      trim: true,
      maxlength: [100, 'Emergency contact name cannot be more than 100 characters']
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required'],
      trim: true,
      validate: {
        validator: function(v: string) {
          return /^(\+233|0)[0-9]{9}$/.test(v);
        },
        message: 'Please provide a valid Ghanaian phone number'
      }
    },
    relationship: {
      type: String,
      required: [true, 'Emergency contact relationship is required'],
      trim: true,
      maxlength: [50, 'Relationship cannot be more than 50 characters']
    }
  },
  medicalHistory: {
    allergies: [{
      type: String,
      trim: true
    }],
    chronicConditions: [{
      type: String,
      trim: true
    }],
    currentMedications: [{
      type: String,
      trim: true
    }],
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Medical notes cannot be more than 1000 characters']
    }
  },
  loyaltyProgram: {
    memberSince: {
      type: Date,
      default: Date.now
    },
    points: {
      type: Number,
      default: 0,
      min: [0, 'Points cannot be negative']
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze'
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: [0, 'Total spent cannot be negative']
    },
    totalPurchases: {
      type: Number,
      default: 0,
      min: [0, 'Total purchases cannot be negative']
    },
    lastPurchaseDate: {
      type: Date
    }
  },
  preferences: {
    preferredPaymentMethod: {
      type: String,
      enum: ['cash', 'mobile_money', 'card', 'bank_transfer'],
      default: 'cash'
    },
    marketingConsent: {
      type: Boolean,
      default: false
    },
    smsNotifications: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
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

const loyaltyTransactionSchema = new Schema<ILoyaltyTransaction>({
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['earned', 'redeemed', 'expired', 'bonus']
  },
  points: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  relatedSale: {
    type: Schema.Types.ObjectId,
    ref: 'Sales'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for full name
customerSchema.virtual('fullName').get(function(this: ICustomer) {
  return this.getFullName();
});

// Virtual for loyalty tier benefits
customerSchema.virtual('loyaltyBenefits').get(function(this: ICustomer) {
  const benefits = {
    bronze: { discount: 0, pointsMultiplier: 1 },
    silver: { discount: 5, pointsMultiplier: 1.2 },
    gold: { discount: 10, pointsMultiplier: 1.5 },
    platinum: { discount: 15, pointsMultiplier: 2 }
  };
  return benefits[this.loyaltyProgram.tier];
});

// Generate customer ID
customerSchema.methods.generateCustomerId = function(this: ICustomer): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CUST-${year}${month}-${random}`;
};

// Calculate loyalty tier based on total spent
customerSchema.methods.calculateLoyaltyTier = function(this: ICustomer): void {
  const totalSpent = this.loyaltyProgram.totalSpent;
  
  if (totalSpent >= 10000) {
    this.loyaltyProgram.tier = 'platinum';
  } else if (totalSpent >= 5000) {
    this.loyaltyProgram.tier = 'gold';
  } else if (totalSpent >= 2000) {
    this.loyaltyProgram.tier = 'silver';
  } else {
    this.loyaltyProgram.tier = 'bronze';
  }
};

// Add points to customer
customerSchema.methods.addPoints = function(this: ICustomer, points: number): void {
  this.loyaltyProgram.points += points;
  this.calculateLoyaltyTier();
};

// Get full name
customerSchema.methods.getFullName = function(this: ICustomer): string {
  return `${this.firstName} ${this.lastName}`;
};

// Pre-save middleware to generate customer ID
customerSchema.pre('save', function(next) {
  if (this.isNew && !this.customerId) {
    this.customerId = this.generateCustomerId();
  }
  this.calculateLoyaltyTier();
  next();
});

// Indexes for better performance
customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ 'loyaltyProgram.tier': 1 });
customerSchema.index({ isActive: 1 });

loyaltyTransactionSchema.index({ customer: 1 });
loyaltyTransactionSchema.index({ type: 1 });
loyaltyTransactionSchema.index({ transactionDate: -1 });
loyaltyTransactionSchema.index({ expiryDate: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
export const LoyaltyTransaction = mongoose.model<ILoyaltyTransaction>('LoyaltyTransaction', loyaltyTransactionSchema);
