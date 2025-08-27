import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  businessLicense: string;
  taxIdentificationNumber: string;
  paymentTerms: string;
  creditLimit: number;
  currentBalance: number;
  isActive: boolean;
  rating: number;
  notes: string;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchaseOrder extends Document {
  orderNumber: string;
  supplier: mongoose.Types.ObjectId;
  items: Array<{
    drug: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  status: 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';
  orderDate: Date;
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  orderedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  receivedBy?: mongoose.Types.ObjectId;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  generateOrderNumber(): string;
  calculateTotal(): void;
}

const supplierSchema = new Schema<ISupplier>({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    maxlength: [200, 'Supplier name cannot be more than 200 characters']
  },
  contactPerson: {
    type: String,
    required: [true, 'Contact person is required'],
    trim: true,
    maxlength: [100, 'Contact person cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
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
  businessLicense: {
    type: String,
    required: [true, 'Business license is required'],
    trim: true,
    maxlength: [50, 'Business license cannot be more than 50 characters']
  },
  taxIdentificationNumber: {
    type: String,
    required: [true, 'Tax identification number is required'],
    trim: true,
    maxlength: [50, 'Tax identification number cannot be more than 50 characters']
  },
  paymentTerms: {
    type: String,
    default: 'Net 30',
    trim: true,
    maxlength: [100, 'Payment terms cannot be more than 100 characters']
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: [0, 'Credit limit cannot be negative']
  },
  currentBalance: {
    type: Number,
    default: 0,
    min: [0, 'Current balance cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 5,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  categories: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const purchaseOrderSchema = new Schema<IPurchaseOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
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
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative']
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative']
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    required: true,
    min: [0, 'Tax cannot be negative'],
    default: 0
  },
  shippingCost: {
    type: Number,
    required: true,
    min: [0, 'Shipping cost cannot be negative'],
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'ordered', 'received', 'cancelled'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date,
    required: [true, 'Expected delivery date is required']
  },
  actualDeliveryDate: {
    type: Date
  },
  orderedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  receivedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted total amount
purchaseOrderSchema.virtual('formattedTotal').get(function(this: IPurchaseOrder) {
  return `GH₵ ${this.totalAmount.toFixed(2)}`;
});

// Generate order number
purchaseOrderSchema.methods.generateOrderNumber = function(this: IPurchaseOrder): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PO-${year}${month}${day}-${random}`;
};

// Calculate total
purchaseOrderSchema.methods.calculateTotal = function(this: IPurchaseOrder): void {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalAmount = this.subtotal + this.tax + this.shippingCost;
};

// Pre-save middleware to generate order number
purchaseOrderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = this.generateOrderNumber();
  }
  this.calculateTotal();
  next();
});

// Indexes for better performance
supplierSchema.index({ name: 1 });
supplierSchema.index({ email: 1 });
supplierSchema.index({ isActive: 1 });

purchaseOrderSchema.index({ supplier: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ orderDate: -1 });

export const Supplier = mongoose.model<ISupplier>('Supplier', supplierSchema);
export const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);
