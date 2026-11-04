import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FriendService } from '../../src/modules/friends/friend.service.js';
import { GroupService } from '../../src/modules/groups/group.service.js';
import { NotificationService } from '../../src/modules/notifications/notification.service.js';
import { MessageService } from '../../src/modules/messages/message.service.js';
import { SavedPostService } from '../../src/modules/saved/saved.service.js';
import type { PrismaClient } from '../../src/config/database.js';

describe('Social Services (Unit Tests)', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      friendship: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
        deleteMany: vi.fn(),
      },
      friendRequest: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      group: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      groupMember: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      groupJoinRequest: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      notification: {
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      conversation: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      message: {
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      savedPost: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      post: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((callbacks) => {
        if (typeof callbacks === 'function') {
          return callbacks(mockPrisma);
        }
        return Promise.all(callbacks);
      }),
    };
  });

  describe('FriendService', () => {
    it('sends friend request and triggers notification', async () => {
      const service = new FriendService(mockPrisma as unknown as PrismaClient);
      mockPrisma.friendship.findUnique.mockResolvedValue(null);
      mockPrisma.friendRequest.findFirst.mockResolvedValue(null);
      mockPrisma.friendRequest.create.mockResolvedValue({
        id: 'req-1',
        senderId: 'u1',
        receiverId: 'u2',
        sender: { name: 'User 1' },
      });

      const res = await service.sendRequest('u1', 'u2');
      expect(res.id).toBe('req-1');
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    it('rejects self friend request', async () => {
      const service = new FriendService(mockPrisma as unknown as PrismaClient);
      await expect(service.sendRequest('u1', 'u1')).rejects.toThrow();
    });
  });

  describe('NotificationService', () => {
    it('retrieves notifications and unread count', async () => {
      const service = new NotificationService(mockPrisma as unknown as PrismaClient);
      mockPrisma.notification.findMany.mockResolvedValue([{ id: 'notif-1', isRead: false }]);
      mockPrisma.notification.count.mockResolvedValue(1);

      const res = await service.getNotifications('u1');
      expect(res.notifications.length).toBe(1);
      expect(res.unreadCount).toBe(1);
    });

    it('marks all as read', async () => {
      const service = new NotificationService(mockPrisma as unknown as PrismaClient);
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const res = await service.markAllAsRead('u1');
      expect(res.success).toBe(true);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { recipientId: 'u1', isRead: false },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });
  });

  describe('SavedPostService', () => {
    it('toggles post save state', async () => {
      const service = new SavedPostService(mockPrisma as unknown as PrismaClient);
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'p1', isDeleted: false });
      mockPrisma.savedPost.findUnique.mockResolvedValue(null);
      mockPrisma.savedPost.create.mockResolvedValue({ id: 's1' });

      const res = await service.toggleSave('u1', 'p1');
      expect(res.isSaved).toBe(true);
    });
  });
});

