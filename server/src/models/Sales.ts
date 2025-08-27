import mongoose, { Document, Schema } from 'mongoose';

export interface ISalesItem {
  drug: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  prescriptionRequired: boolean;
  prescriptionNumber?: string;
}

export interface ISales extends Document {
  receiptNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: ISalesItem[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'mobile_money' | 'card' | 'bank_transfer';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  cashier: mongoose.Types.ObjectId;
  pharmacist?: mongoose.Types.ObjectId;
  prescriptionNumber?: string;
  notes?: string;
  isVoid: boolean;
  voidReason?: string;
  voidedBy?: mongoose.Types.ObjectId;
  voidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  calculateTotal(): void;
  generateReceiptNumber(): string;
}

const salesItemSchema = new Schema<ISalesItem>({
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
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  prescriptionNumber: {
    type: String,
    trim: true
  }
});

const salesSchema = new Schema<ISales>({
  receiptNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Customer name cannot be more than 100 characters']
  },
  customerPhone: {
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
  customerEmail: {
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
  items: [salesItemSchema],
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
  discount: {
    type: Number,
    required: true,
    min: [0, 'Discount cannot be negative'],
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['cash', 'mobile_money', 'card', 'bank_transfer']
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  cashier: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pharmacist: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  prescriptionNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Prescription number cannot be more than 50 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  isVoid: {
    type: Boolean,
    default: false
  },
  voidReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Void reason cannot be more than 200 characters']
  },
  voidedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  voidedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted total amount
salesSchema.virtual('formattedTotal').get(function(this: ISales) {
  return `GH₵ ${this.totalAmount.toFixed(2)}`;
});

// Virtual for formatted date
salesSchema.virtual('formattedDate').get(function(this: ISales) {
  return this.createdAt.toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for payment method display
salesSchema.virtual('paymentMethodDisplay').get(function(this: ISales) {
  const methods = {
    cash: 'Cash',
    mobile_money: 'Mobile Money',
    card: 'Card',
    bank_transfer: 'Bank Transfer'
  };
  return methods[this.paymentMethod] || this.paymentMethod;
});

// Indexes for better query performance
salesSchema.index({ customerName: 1 });
salesSchema.index({ customerPhone: 1 });
salesSchema.index({ createdAt: -1 });
salesSchema.index({ cashier: 1 });
salesSchema.index({ paymentStatus: 1 });
salesSchema.index({ isVoid: 1 });

// Pre-save middleware to generate receipt number
salesSchema.pre('save', function(this: ISales, next: Function) {
  if (this.isNew) {
    this.receiptNumber = this.generateReceiptNumber();
  }
  next();
});

// Pre-save middleware to calculate totals
salesSchema.pre('save', function(this: ISales, next: Function) {
  this.calculateTotal();
  next();
});

// Methods
salesSchema.methods.calculateTotal = function(this: ISales): void {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculate tax (VAT in Ghana is typically 12.5%)
  this.tax = this.subtotal * 0.125;
  
  // Calculate total after tax and discount
  this.totalAmount = this.subtotal + this.tax - this.discount;
};

salesSchema.methods.generateReceiptNumber = function(this: ISales): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `RCP-${year}${month}${day}-${random}`;
};

// Static method to get daily sales
salesSchema.statics.getDailySales = function(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
    isVoid: false,
    paymentStatus: 'completed'
  });
};

// Static method to get sales summary
salesSchema.statics.getSalesSummary = function(startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        isVoid: false,
        paymentStatus: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$totalAmount' },
        totalTransactions: { $sum: 1 },
        averageTransaction: { $avg: '$totalAmount' }
      }
    }
  ]);
};

export const Sales = mongoose.model<ISales>('Sales', salesSchema);
