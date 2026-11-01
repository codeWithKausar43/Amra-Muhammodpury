import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { ConflictError, UnauthorizedError } from '../../src/errors/app-error.js';
import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('AuthService (Unit)', () => {
  let mockPrisma: any;
  let authService: AuthService;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };
    authService = new AuthService(mockPrisma as unknown as PrismaClient);
  });

  describe('register', () => {
    it('throws ConflictError if user with same email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com' });

      await expect(
        authService.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('creates and returns a sanitized user profile on valid registration', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-uuid-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        createdAt: new Date('2026-01-01'),
      });

      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.id).toBe('user-uuid-1');
      expect(result.email).toBe('test@example.com');
      expect((result as any).passwordHash).toBeUndefined();
    });
  });

  describe('login', () => {
    it('throws UnauthorizedError if user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'notfound@example.com',
          password: 'Password123',
        }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws UnauthorizedError if password does not match', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('CorrectPass123', 10),
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
