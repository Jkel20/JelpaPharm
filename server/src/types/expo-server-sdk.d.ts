declare module 'expo-server-sdk' {
  export interface ExpoPushMessage {
    to: string | string[];
    sound?: 'default' | null;
    badge?: number;
    title?: string;
    body?: string;
    data?: any;
    ttl?: number;
    expiration?: number;
    priority?: 'default' | 'normal' | 'high';
    subtitle?: string;
    channelId?: string;
    categoryId?: string;
    mutableContent?: boolean;
  }

  export class Expo {
    constructor();
    isExpoPushToken(token: string): boolean;
    chunkPushNotifications(messages: ExpoPushMessage[]): ExpoPushMessage[][];
    sendPushNotificationsAsync(messages: ExpoPushMessage[]): Promise<any[]>;
    chunkPushNotificationReceiptIds(receiptIds: string[]): string[][];
    getPushNotificationReceiptsAsync(receiptIds: string[]): Promise<any>;
  }
}
