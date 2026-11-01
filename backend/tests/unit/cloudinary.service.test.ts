import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudinaryService } from '../../src/integrations/cloudinary/cloudinary.service.js';
import { BadRequestError, NotFoundError } from '../../src/errors/app-error.js';
import type { PrismaClient } from '@prisma/client';

describe('CloudinaryService (Unit)', () => {
  let mockPrisma: any;
  let service: CloudinaryService;

  beforeEach(() => {
    mockPrisma = {
      media: {
        upsert: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        update: vi.fn(),
      },
    };
    service = new CloudinaryService(mockPrisma as unknown as PrismaClient);
  });

  describe('generateUploadSignature', () => {
    it('generates a valid signature containing folder, apiKey, and timestamp', () => {
      const result = service.generateUploadSignature({
        folder: 'profiles',
        resourceType: 'image',
        isRegistration: true,
      });

      expect(result.signature).toBeDefined();
      expect(result.apiKey).toBe('545392829589828');
      expect(result.cloudName).toBe('rim6yblt');
      expect(result.folder).toContain('profiles');
      expect(result.timestamp).toBeGreaterThan(0);
    });
  });

  describe('confirmUpload', () => {
    it('throws BadRequestError if publicId does not start with amra-muhammadpuri', async () => {
      await expect(
        service.confirmUpload({
          publicId: 'malicious-prefix/image123',
          secureUrl: 'https://res.cloudinary.com/rim6yblt/image/upload/sample.jpg',
          resourceType: 'image',
          format: 'jpg',
          bytes: 12345,
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it('upserts media record with metadata when publicId is valid', async () => {
      mockPrisma.media.upsert.mockResolvedValue({
        id: 'media-1',
        publicId: 'amra-muhammadpuri/profiles/avatar-123',
        secureUrl: 'https://res.cloudinary.com/rim6yblt/image/upload/sample.jpg',
        resourceType: 'image',
        format: 'jpg',
        bytes: 12345,
        createdAt: new Date(),
      });

      const result = await service.confirmUpload({
        publicId: 'amra-muhammadpuri/profiles/avatar-123',
        secureUrl: 'https://res.cloudinary.com/rim6yblt/image/upload/sample.jpg',
        resourceType: 'image',
        format: 'jpg',
        bytes: 12345,
      });

      expect(result.id).toBe('media-1');
      expect(mockPrisma.media.upsert).toHaveBeenCalled();
    });
  });

  describe('claimTempUpload', () => {
    it('throws NotFoundError if tempToken does not match any record', async () => {
      mockPrisma.media.findFirst.mockResolvedValue(null);

      await expect(service.claimTempUpload('nonexistent-token', 'user-1')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('associates media and user profile picture when valid', async () => {
      mockPrisma.media.findFirst.mockResolvedValue({
        id: 'media-1',
        publicId: 'amra-muhammadpuri/profiles/avatar-123',
        secureUrl: 'https://res.cloudinary.com/sample.jpg',
        resourceType: 'image',
      });
      mockPrisma.media.update.mockResolvedValue({
        id: 'media-1',
        ownerId: 'user-1',
        secureUrl: 'https://res.cloudinary.com/sample.jpg',
        resourceType: 'image',
      });

      const result = await service.claimTempUpload('valid-temp-token', 'user-1');
      expect(result.id).toBe('media-1');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { image: 'https://res.cloudinary.com/sample.jpg' },
      });
    });
  });
});
