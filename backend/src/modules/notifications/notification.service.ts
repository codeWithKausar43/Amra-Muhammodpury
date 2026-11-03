import { PrismaClient } from '../../config/database.js';
import webpush from 'web-push';

export const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BE-OoiaaQI-2U-LS8RTMR-DegENARLVWio2awC-9SYj88EzKU4T-kToh9lcGqLmWfSZ7r61ZPNl8WbDeTK63RGU';

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || 'zfDPp487p1zynzPihxqhwtJJB0qgH-t85Ip7-l1haYg';

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:admin@amramuhammodpury.org';

// Configure Web Push with VAPID keys
try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.warn('VAPID setup warning:', e);
}

export class NotificationService {
  constructor(private readonly prisma: PrismaClient) {}

  public getVapidPublicKey() {
    return VAPID_PUBLIC_KEY;
  }

  public async getNotifications(userId: string, limit: number = 30) {
    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.notification.count({
        where: { recipientId: userId, isRead: false },
      }),
    ]);

    return { notifications, unreadCount };
  }

  public async markAsRead(notificationId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  public async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true, message: 'সব নোটিফিকেশন পড়া হয়েছে হিসেবে চিহ্নিত করা হয়েছে' };
  }

  /**
   * Auto-cleanup viewed contribution reminder notifications after 2 minutes
   * Rule: Deletes ONLY notifications where type === 'CONTRIBUTION_REMINDER', isRead === true,
   * and readAt is at least 2 minutes old.
   * Unread reminders, other notification types, and financial records are NEVER deleted.
   */
  public async cleanupReadReminders(): Promise<number> {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const result = await this.prisma.notification.deleteMany({
      where: {
        type: 'CONTRIBUTION_REMINDER',
        isRead: true,
        readAt: { lte: twoMinutesAgo },
      },
    });
    return result.count;
  }

  /**
   * Save Web Push subscription from browser
   */
  public async subscribePush(
    userId: string,
    subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    },
  ) {
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      throw new Error('অবৈধ পুশ সাবস্ক্রিপশন ডাটা');
    }

    const sub = await this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    return { success: true, subscriptionId: sub.id };
  }

  /**
   * Send Web Push notification to user's devices (wakes up phone even when closed with mobile data)
   */
  public async sendPushToUser(
    userId: string,
    payload: {
      title: string;
      body: string;
      url?: string;
      sound?: string;
      tag?: string;
    },
  ) {
    // 1. Create in-app notification in DB
    try {
      await this.prisma.notification.create({
        data: {
          recipientId: userId,
          title: payload.title,
          content: payload.body,
          type: 'SYSTEM',
          entityType: 'push',
        },
      });
    } catch (e) {
      console.warn('Failed to insert in-app notification:', e);
    }

    // 2. Query all device subscriptions for this user
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return { sentCount: 0, message: 'No registered push devices for user' };
    }

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/organization/member',
      sound: payload.sound || '/sounds/notification.wav',
      tag: payload.tag || 'org-alert-' + Date.now(),
    });

    let sentCount = 0;
    const expiredIds: string[] = [];

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            pushPayload,
          );
          sentCount++;
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            expiredIds.push(sub.id);
          } else {
            console.warn('WebPush delivery error:', err?.message);
          }
        }
      }),
    );

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      await this.prisma.pushSubscription.deleteMany({
        where: { id: { in: expiredIds } },
      });
    }

    return { sentCount, totalDevices: subscriptions.length };
  }

  /**
   * Send push notification to all organization officers and admins
   */
  public async sendPushToOfficers(
    payload: {
      title: string;
      body: string;
      url?: string;
      sound?: string;
    },
    excludeUserId?: string,
  ) {
    // Find all users with admin role or active designation
    const whereCondition: any = {
      OR: [
        { role: 'ADMIN' },
        {
          committeeAssignments: {
            some: {
              designation: {
                code: { in: ['PRESIDENT', 'TREASURER', 'MODERATOR', 'SECRETARY'] },
              },
            },
          },
        },
      ],
    };

    if (excludeUserId) {
      whereCondition.id = { not: excludeUserId };
    }

    const officers = await this.prisma.user.findMany({
      where: whereCondition,
      select: { id: true },
    });

    const uniqueIds = Array.from(new Set(officers.map((o) => o.id)));
    const results = await Promise.allSettled(
      uniqueIds.map((id) => this.sendPushToUser(id, payload)),
    );

    return { officerCount: uniqueIds.length, results };
  }
}
