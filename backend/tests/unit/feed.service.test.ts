import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedService } from '../../src/modules/feed/feed.service.js';
import type { PrismaClient } from '../../src/config/database.js';

describe('FeedService (Unit)', () => {
  let mockPrisma: any;
  let service: FeedService;

  beforeEach(() => {
    mockPrisma = {
      post: {
        count: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      postLike: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
      comment: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      story: {
        findMany: vi.fn(),
      },
      notification: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
    };
    service = new FeedService(mockPrisma as unknown as PrismaClient);
  });

  describe('getFeed', () => {
    it('retrieves paginated posts with counts and author details', async () => {
      mockPrisma.post.count.mockResolvedValue(1);
      mockPrisma.post.findMany.mockResolvedValue([
        {
          id: 'post-1',
          content: 'তাজমহল রোডের নতুন ফুটপাত সংস্কার কাজ',
          location: 'তাজমহল রোড',
          category: 'GENERAL',
          blockBadge: 'ব্লক-সি',
          sharesCount: 12,
          isEmergency: false,
          emergencyData: null,
          createdAt: new Date(),
          author: {
            id: 'u-1',
            name: 'ইঞ্জি. সামিউল ইসলাম',
            image: null,
            role: 'USER',
            phone: '01711111111',
          },
          media: [],
          _count: { likes: 155, comments: 32 },
          likes: [],
          comments: [],
        },
      ]);

      const result = await service.getFeed({ page: 1, limit: 10, category: 'ALL' });
      expect(result.total).toBe(1);
      expect(result.posts.length).toBe(1);
      expect(result.posts[0]?.author.name).toBe('ইঞ্জি. সামিউল ইসলাম');
      expect(result.posts[0]?.likesCount).toBe(155);
      expect(result.posts[0]?.hasLiked).toBe(false);
    });
  });

  describe('toggleLike', () => {
    it('creates like when not already liked', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post-1', authorId: 'user-2' });
      mockPrisma.postLike.findUnique.mockResolvedValue(null);
      mockPrisma.postLike.create.mockResolvedValue({ id: 'like-1' });
      mockPrisma.postLike.count.mockResolvedValue(156);
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });

      const result = await service.toggleLike('post-1', 'user-1');
      expect(result.liked).toBe(true);
      expect(result.likesCount).toBe(156);
      expect(mockPrisma.postLike.create).toHaveBeenCalled();
    });

    it('deletes like when already liked', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post-1', authorId: 'user-2' });
      mockPrisma.postLike.findUnique.mockResolvedValue({ id: 'like-1', type: 'LIKE' });
      mockPrisma.postLike.delete.mockResolvedValue({ id: 'like-1' });
      mockPrisma.postLike.count.mockResolvedValue(154);

      const result = await service.toggleLike('post-1', 'user-1');
      expect(result.liked).toBe(false);
      expect(result.likesCount).toBe(154);
      expect(mockPrisma.postLike.delete).toHaveBeenCalled();
    });
  });
});

