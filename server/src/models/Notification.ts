import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'low_stock' | 'expiry' | 'sale' | 'system' | 'prescription' | 'customer' | 'supplier';
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  isPushSent: boolean;
  data?: {
    itemId?: string;
    itemName?: string;
    quantity?: number;
    expiryDate?: Date;
    saleId?: string;
    customerId?: string;
    prescriptionId?: string;
    supplierId?: string;
  };
  createdAt: Date;
  readAt?: Date;
  pushSentAt?: Date;
  markAsRead(): Promise<INotification>;
  markPushSent(): Promise<INotification>;
}

export interface INotificationModel extends mongoose.Model<INotification> {
  findUnreadByUser(userId: string): Promise<INotification[]>;
  findByUser(userId: string, limit?: number): Promise<INotification[]>;
  markAsRead(notificationId: string, userId: string): Promise<INotification | null>;
  markAllAsRead(userId: string): Promise<any>;
  getUnreadCount(userId: string): Promise<number>;
}

const notificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['low_stock', 'expiry', 'sale', 'system', 'prescription', 'customer', 'supplier'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isPushSent: {
    type: Boolean,
    default: false
  },
  data: {
    itemId: String,
    itemName: String,
    quantity: Number,
    expiryDate: Date,
    saleId: String,
    customerId: String,
    prescriptionId: String,
    supplierId: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  readAt: Date,
  pushSentAt: Date
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1, severity: 1 });
notificationSchema.index({ isPushSent: 1 });

// Static methods
notificationSchema.statics.findUnreadByUser = function(userId: string) {
  return this.find({ recipient: userId, isRead: false }).sort({ createdAt: -1 });
};

notificationSchema.statics.findByUser = function(userId: string, limit = 50) {
  return this.find({ recipient: userId }).sort({ createdAt: -1 }).limit(limit);
};

notificationSchema.statics.markAsRead = function(notificationId: string, userId: string) {
  return this.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

notificationSchema.statics.markAllAsRead = function(userId: string) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

notificationSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markPushSent = function() {
  this.isPushSent = true;
  this.pushSentAt = new Date();
  return this.save();
};

export const Notification = mongoose.model<INotification, INotificationModel>('Notification', notificationSchema);
