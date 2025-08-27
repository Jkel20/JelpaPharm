import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { logger } from './logger';

// Initialize Expo SDK
const expo = new Expo();

// Simple function to validate Expo push tokens
function isValidExpoPushToken(token: string): boolean {
  // Expo push tokens are typically 41 characters long and start with ExponentPushToken
  return typeof token === 'string' && 
         token.length === 41 && 
         token.startsWith('ExponentPushToken[') && 
         token.endsWith(']');
}

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  categoryId?: string;
  mutableContent?: boolean;
  priority?: 'default' | 'normal' | 'high';
  subtitle?: string;
  ttl?: number;
}

/**
 * Send push notification to a single device
 */
export async function sendPushNotification(
  pushToken: string,
  notificationData: PushNotificationData
): Promise<void> {
  try {
    // Check if the push token is valid
    if (!isValidExpoPushToken(pushToken)) {
      logger.warn(`Invalid Expo push token: ${pushToken}`);
      return;
    }

    // Create the push message
    const message: ExpoPushMessage = {
      to: pushToken,
      title: notificationData.title,
      body: notificationData.body,
      data: notificationData.data || {},
      sound: notificationData.sound || 'default',
      badge: notificationData.badge,
      channelId: notificationData.channelId || 'default',
      categoryId: notificationData.categoryId,
      mutableContent: notificationData.mutableContent,
      priority: notificationData.priority || 'high',
      subtitle: notificationData.subtitle,
      ttl: notificationData.ttl || 24 * 60 * 60, // 24 hours default
    };

    // Send the message
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        logger.error('Error sending push notification chunk:', error);
      }
    }

    // Log the results
    logger.info(`Push notification sent to ${pushToken}: ${notificationData.title}`);
    
    // Check for errors in tickets
    tickets.forEach((ticket, index) => {
      if (ticket.status === 'error') {
        logger.error(`Push notification error for ticket ${index}:`, ticket.message);
      }
    });

  } catch (error) {
    logger.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Send push notifications to multiple devices
 */
export async function sendPushNotificationsToMultiple(
  pushTokens: string[],
  notificationData: PushNotificationData
): Promise<void> {
  try {
    // Filter out invalid tokens
    const validTokens = pushTokens.filter(token => isValidExpoPushToken(token));
    
    if (validTokens.length === 0) {
      logger.warn('No valid push tokens provided');
      return;
    }

    // Create messages for all valid tokens
    const messages: ExpoPushMessage[] = validTokens.map(token => ({
      to: token,
      title: notificationData.title,
      body: notificationData.body,
      data: notificationData.data || {},
      sound: notificationData.sound || 'default',
      badge: notificationData.badge,
      channelId: notificationData.channelId || 'default',
      categoryId: notificationData.categoryId,
      mutableContent: notificationData.mutableContent,
      priority: notificationData.priority || 'high',
      subtitle: notificationData.subtitle,
      ttl: notificationData.ttl || 24 * 60 * 60, // 24 hours default
    }));

    // Send messages in chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        logger.error('Error sending push notification chunk:', error);
      }
    }

    logger.info(`Push notifications sent to ${validTokens.length} devices: ${notificationData.title}`);

    // Check for errors in tickets
    tickets.forEach((ticket, index) => {
      if (ticket.status === 'error') {
        logger.error(`Push notification error for ticket ${index}:`, ticket.message);
      }
    });

  } catch (error) {
    logger.error('Error sending push notifications to multiple devices:', error);
    throw error;
  }
}

/**
 * Check push notification receipts
 */
export async function checkPushNotificationReceipts(
  receiptIds: string[]
): Promise<void> {
  try {
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    
    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        
        for (const receiptId of Object.keys(receipts)) {
          const receipt = receipts[receiptId];
          
          if (receipt.status === 'ok') {
            logger.info(`Push notification delivered successfully: ${receiptId}`);
          } else if (receipt.status === 'error') {
            logger.error(`Push notification delivery failed: ${receiptId}`, receipt.message);
            
            // Handle specific error types
            if (receipt.details && receipt.details.error) {
              switch (receipt.details.error) {
                case 'DeviceNotRegistered':
                  logger.warn(`Device not registered, token should be removed: ${receiptId}`);
                  break;
                case 'InvalidCredentials':
                  logger.error('Invalid credentials for push notification service');
                  break;
                case 'MessageTooBig':
                  logger.warn('Push notification message too big');
                  break;
                case 'MessageRateExceeded':
                  logger.warn('Push notification rate exceeded');
                  break;
                default:
                  logger.error(`Unknown push notification error: ${receipt.details.error}`);
              }
            }
          }
        }
      } catch (error) {
        logger.error('Error checking push notification receipts:', error);
      }
    }
  } catch (error) {
    logger.error('Error checking push notification receipts:', error);
    throw error;
  }
}

/**
 * Create notification channel for Android
 */
export function createNotificationChannel(): void {
  // This would be used for Android notification channels
  // In a real implementation, you might want to store channel configurations
  const channels = [
    {
      id: 'default',
      name: 'Default Notifications',
      description: 'General system notifications',
      sound: 'default',
      priority: 'high',
      vibrate: true,
    },
    {
      id: 'low_stock',
      name: 'Low Stock Alerts',
      description: 'Notifications for low stock items',
      sound: 'default',
      priority: 'high',
      vibrate: true,
    },
    {
      id: 'expiry',
      name: 'Expiry Warnings',
      description: 'Notifications for expiring medications',
      sound: 'default',
      priority: 'high',
      vibrate: true,
    },
    {
      id: 'sales',
      name: 'Sales Notifications',
      description: 'Notifications for new sales',
      sound: 'default',
      priority: 'normal',
      vibrate: false,
    },
    {
      id: 'system',
      name: 'System Notifications',
      description: 'System maintenance and updates',
      sound: 'default',
      priority: 'normal',
      vibrate: false,
    }
  ];

  logger.info('Notification channels configured:', channels);
}
