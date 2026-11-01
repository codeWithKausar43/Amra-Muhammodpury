import { PrismaClient } from '../../config/database.js';

export class NotificationService {
  constructor(private readonly prisma: PrismaClient) {}

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
      data: { isRead: true },
    });
    return { success: true };
  }

  public async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true, message: 'সব নোটিফিকেশন পড়া হয়েছে হিসেবে চিহ্নিত করা হয়েছে' };
  }
}
