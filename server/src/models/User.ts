import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: 'admin' | 'pharmacist' | 'cashier';
  isActive: boolean;
  lastLogin?: Date;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  profileImage?: string;
  expoPushToken?: string;
  address?: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  fullName: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
  createPasswordResetToken(): string;
  toJSON(): any;
}

const userSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters'],
    validate: {
      validator: function(v: string) {
        return /^[a-zA-Z\s]+$/.test(v);
      },
      message: 'First name can only contain letters and spaces'
    }
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters'],
    validate: {
      validator: function(v: string) {
        return /^[a-zA-Z\s]+$/.test(v);
      },
      message: 'Last name can only contain letters and spaces'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
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
        // Ghanaian phone number format: +233XXXXXXXXX or 0XXXXXXXXX
        return /^(\+233|0)[0-9]{9}$/.test(v);
      },
      message: 'Please provide a valid Ghanaian phone number'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // Don't include password in queries by default
    validate: {
      validator: function(v: string) {
        // At least one uppercase, one lowercase, one number, one special character
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },
  role: {
    type: String,
    enum: ['admin', 'pharmacist', 'cashier'],
    default: 'cashier',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },
  profileImage: {
    type: String
  },
  expoPushToken: {
    type: String,
    trim: true
  },
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [100, 'Street address cannot be more than 100 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City cannot be more than 50 characters']
    },
    region: {
      type: String,
      trim: true,
      maxlength: [50, 'Region cannot be more than 50 characters']
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: [10, 'Postal code cannot be more than 10 characters']
    }
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Emergency contact name cannot be more than 100 characters']
    },
    phone: {
      type: String,
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
      trim: true,
      maxlength: [50, 'Relationship cannot be more than 50 characters']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function(this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// Index for better query performance
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Encrypt password using bcrypt
userSchema.pre('save', async function(this: IUser, next: Function) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS || '12'));
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update passwordChangedAt when password is modified
userSchema.pre('save', function(this: IUser, next: Function) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }

  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function(this: IUser): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  const expiresIn = process.env.JWT_EXPIRE || '30d';
  return jwt.sign(
    { id: this._id },
    secret,
    { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
  );
};

// Match user entered password to hashed password in database
userSchema.methods.comparePassword = async function(this: IUser, candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate and hash password token
userSchema.methods.createPasswordResetToken = function(this: IUser): string {
  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return resetToken;
};

// Remove password from output
userSchema.methods.toJSON = function(this: IUser) {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export const User = mongoose.model<IUser>('User', userSchema);
