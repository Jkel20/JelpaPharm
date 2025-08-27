# Alert & Notification System Integration

## Overview

This document explains how the existing **Alert System** and the new **Notification System** have been integrated to provide a unified real-time alerting experience.

## What Was Integrated

### Original Alert System
- **Dynamic Reports**: Real-time queries to inventory data for low stock and expiring items
- **Email Alerts**: Sending email notifications to users
- **No Persistent Storage**: Alerts were generated on-demand, not stored in database
- **Manual Triggers**: Required manual API calls to send alerts

### New Notification System
- **Persistent Storage**: Database records for each notification
- **Push Notifications**: Real-time mobile/web notifications via Expo
- **In-App Display**: UI for viewing and managing notifications
- **Role-Based Targeting**: Send notifications to specific user roles

## Integration Architecture

### 1. Unified API Endpoints

The `/api/alerts/list` endpoint now combines both systems:

```typescript
// Returns both persistent notifications AND dynamic alerts
GET /api/alerts/list
```

**Response includes:**
- **Persistent Notifications**: Stored in database, can be marked as read/deleted
- **Dynamic Alerts**: Generated from real-time inventory data, cannot be deleted

### 2. Backend Integration

#### Alert Routes (`server/src/routes/alerts.ts`)
- **Enhanced Email Routes**: Now send both emails AND push notifications
- **New List Endpoint**: Combines notifications and dynamic alerts
- **Smart Actions**: Different behavior for persistent vs dynamic alerts

#### Alert Monitoring Service (`server/src/services/AlertMonitoringService.ts`)
- **Automatic Monitoring**: Runs every 6 hours to check for alert conditions
- **Proactive Notifications**: Creates notifications when thresholds are met
- **Multiple Alert Types**: Low stock, expiry, and out-of-stock alerts

### 3. Frontend Integration

#### AlertsScreen (`client/src/screens/AlertsScreen.tsx`)
- **Unified Display**: Shows both persistent notifications and dynamic alerts
- **Smart Actions**: Different UI for dynamic vs persistent alerts
- **Real-time Updates**: Pull-to-refresh fetches latest data

#### Visual Indicators
- **Dynamic Alerts**: Show "Dynamic Alert" button (disabled)
- **Persistent Alerts**: Show "Mark as Read" and "Delete" buttons
- **Severity Colors**: Consistent color coding across both systems

## How It Works

### 1. Automatic Alert Detection

```typescript
// Runs every 6 hours automatically
const alertMonitoringService = new AlertMonitoringService();
await alertMonitoringService.startMonitoring();
```

**Triggers:**
- **Low Stock**: Items below reorder level
- **Expiry**: Items expiring within 30 days
- **Out of Stock**: Items with zero quantity

### 2. Notification Creation

When alert conditions are detected:

1. **Query Inventory**: Find items meeting alert criteria
2. **Find Target Users**: Get users with appropriate roles
3. **Create Notifications**: Store in database
4. **Send Push Notifications**: Via Expo push service
5. **Send Emails**: Traditional email alerts (optional)

### 3. Unified Display

The AlertsScreen shows:

```typescript
// Combined data structure
interface AlertItem {
  _id: string;
  type: 'low_stock' | 'expiry' | 'system' | 'custom';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: string;
  relatedItem?: {
    id: string;
    name: string;
    type: 'inventory' | 'sale' | 'user';
  };
  isDynamic?: boolean; // NEW: Distinguishes dynamic from persistent
}
```

## Key Features

### 1. Real-Time Integration
- **Dynamic Alerts**: Always show current inventory status
- **Persistent Notifications**: Store historical alert records
- **Push Notifications**: Immediate delivery to devices

### 2. Smart Actions
- **Dynamic Alerts**: Cannot be deleted (regenerated on each load)
- **Persistent Alerts**: Can be marked as read and deleted
- **Email Integration**: Still sends emails for critical alerts

### 3. Role-Based Targeting
- **Low Stock**: Sent to admin users
- **Expiry**: Sent to admin and pharmacist users
- **Out of Stock**: Sent to admin users with critical severity

### 4. Automatic Monitoring
- **Background Service**: Runs every 6 hours
- **No Manual Intervention**: Completely automated
- **Configurable Thresholds**: Easy to adjust alert criteria

## API Endpoints

### Integrated Alert Endpoints

```typescript
// Get combined alerts and notifications
GET /api/alerts/list

// Mark alert as read (only for persistent notifications)
PUT /api/alerts/:id/read

// Delete alert (only for persistent notifications)
DELETE /api/alerts/:id

// Send email + push notifications for low stock
POST /api/alerts/low-stock/email

// Send email + push notifications for expiry
POST /api/alerts/expiry/email
```

### Notification Endpoints (Separate)

```typescript
// Get user notifications only
GET /api/notifications

// Send custom notifications
POST /api/notifications/send

// Send to specific role
POST /api/notifications/send-to-role
```

## Benefits of Integration

### 1. **Unified Experience**
- Single screen shows all alerts and notifications
- Consistent UI and interaction patterns
- No need to check multiple places

### 2. **Real-Time Awareness**
- Dynamic alerts always show current status
- Push notifications for immediate awareness
- Email backup for critical alerts

### 3. **Automated Management**
- No manual alert checking required
- Automatic notification creation
- Background monitoring service

### 4. **Flexible Actions**
- Persistent notifications can be managed
- Dynamic alerts provide current status
- Both systems work together seamlessly

## Configuration

### Alert Thresholds

```typescript
// Low stock threshold
Inventory.findLowStock() // Uses reorderLevel field

// Expiry threshold (30 days)
moment().add(30, 'days').toDate()

// Out of stock threshold
quantity: 0
```

### Monitoring Frequency

```typescript
// Check every 6 hours
setInterval(async () => {
  await this.runAllChecks();
}, 6 * 60 * 60 * 1000);
```

### Target Users

```typescript
// Low stock and out of stock: Admin users
role: 'admin'

// Expiry: Admin and pharmacist users
role: { $in: ['admin', 'pharmacist'] }
```

## Future Enhancements

### 1. **Custom Alert Rules**
- User-defined thresholds
- Custom alert conditions
- Personalized alert preferences

### 2. **Advanced Filtering**
- Filter by alert type
- Filter by severity
- Filter by date range

### 3. **Alert Acknowledgment**
- Track who acknowledged alerts
- Escalation for unacknowledged alerts
- Alert history and audit trail

### 4. **Integration with Other Systems**
- Supplier notifications
- Customer alerts
- Prescription reminders

## Conclusion

The integration successfully combines the best of both systems:

- **Dynamic Alerts**: Provide real-time inventory status
- **Persistent Notifications**: Store and manage alert history
- **Push Notifications**: Deliver immediate awareness
- **Email Integration**: Maintain traditional alerting
- **Automated Monitoring**: Reduce manual intervention

This creates a comprehensive, real-time alerting system that keeps users informed about critical inventory conditions while maintaining the flexibility to manage and track alert history.
