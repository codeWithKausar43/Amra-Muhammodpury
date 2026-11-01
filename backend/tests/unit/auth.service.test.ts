import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { ConflictError, NotFoundError } from '../../src/errors/app-error.js';
import type { PrismaClient } from '@prisma/client';

describe('AuthService (Unit)', () => {
  let mockPrisma: any;
  let authService: AuthService;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
    };
    authService = new AuthService(mockPrisma as unknown as PrismaClient);
  });

  describe('checkAvailability', () => {
    it('throws ConflictError if user with same email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com' });

      await expect(authService.checkAvailability('test@example.com')).rejects.toThrow(
        ConflictError,
      );
    });

    it('throws ConflictError if user with same phone exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue({ id: '1', phone: '01712345678' });

      await expect(authService.checkAvailability(undefined, '01712345678')).rejects.toThrow(
        ConflictError,
      );
    });

    it('returns available: true if neither exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await authService.checkAvailability('new@example.com', '01712345678');
      expect(result.available).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('throws NotFoundError if user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.getCurrentUser('nonexistent-id')).rejects.toThrow(NotFoundError);
    });

    it('returns sanitized user profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Ahmed',
        email: 'ahmed@example.com',
        emailVerified: true,
        image: null,
        phone: '01700000000',
        role: 'USER',
        createdAt: new Date('2026-01-01'),
      });

      const user = await authService.getCurrentUser('user-1');
      expect(user.id).toBe('user-1');
      expect(user.name).toBe('Ahmed');
      expect(user.email).toBe('ahmed@example.com');
    });
  });
});
