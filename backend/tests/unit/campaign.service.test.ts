import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CampaignService } from '../../src/modules/campaign/campaign.service.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../src/errors/app-error.js';

describe('CampaignService', () => {
  let service: CampaignService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      orgMembership: {
        findUnique: vi.fn(),
      },
      campaignCategory: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      campaignPaymentConfig: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn(),
        upsert: vi.fn(),
      },
      campaign: {
        count: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      campaignDonation: {
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        aggregate: vi.fn(),
      },
      campaignExpense: {
        findMany: vi.fn(),
        create: vi.fn(),
        aggregate: vi.fn(),
      },
      $transaction: vi.fn(async (cb: any) => cb(mockPrisma)),
    };

    service = new CampaignService(mockPrisma);
  });

  describe('Public Campaign Listing & Privacy', () => {
    it('should return sanitized campaign summaries and never expose donor private data', async () => {
      mockPrisma.campaign.count.mockResolvedValueOnce(1);
      mockPrisma.campaign.findMany.mockResolvedValueOnce([
        {
          id: 'camp-1',
          title: 'শীতবস্ত্র বিতরণ ২০২৬',
          slug: 'winter-2026',
          coverImage: 'https://example.com/cover.jpg',
          shortDescription: 'শীতার্তদের পাশে দাঁড়ান',
          goalAmount: 100000,
          collectedAmount: 65000,
          startDate: new Date('2026-11-01'),
          endDate: new Date('2026-12-31'),
          location: 'মোহাম্মদপুর',
          status: 'ACTIVE',
          isFeatured: true,
          categoryName: 'শীতবস্ত্র বিতরণ',
          category: { id: 'cat-1', name: 'শীতবস্ত্র বিতরণ', icon: 'Snowflake' },
        },
      ]);

      const res = await service.getPublicCampaigns({ page: 1, limit: 10 });

      expect(res.total).toBe(1);
      expect(res.items.length).toBe(1);
      const camp = res.items[0];
      expect(camp.progressPercent).toBe(65);
      expect(camp.remainingAmount).toBe(35000);
      expect(camp).not.toHaveProperty('donations');
      expect(camp).not.toHaveProperty('donorPhone');
      expect(camp).not.toHaveProperty('donorName');
    });
  });

  describe('Login-Free Donation Submission', () => {
    it('should allow public donation submission and return pending receipt', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValueOnce({
        id: 'camp-1',
        title: 'শীতবস্ত্র বিতরণ ২০২৬',
        status: 'ACTIVE',
      });

      mockPrisma.campaignDonation.create.mockResolvedValueOnce({
        id: 'don-1',
        campaignId: 'camp-1',
        donorName: 'মোসাঃ ফাতেমা',
        donorPhone: '01711223344',
        amount: 1500,
        paymentMethod: 'BKASH',
        receiptNumber: 'AMP-DON-202611-5678',
        status: 'PENDING',
        createdAt: new Date(),
      });

      const res = await service.submitPublicDonation('camp-1', {
        donorName: 'মোসাঃ ফাতেমা',
        donorPhone: '01711223344',
        amount: 1500,
        paymentMethod: 'BKASH',
        trxId: 'TRX12345',
      });

      expect(res.success).toBe(true);
      expect(res.amount).toBe(1500);
      expect(res.receiptNumber).toBe('AMP-DON-202611-5678');
      expect(res.status).toBe('PENDING');
      expect(mockPrisma.campaignDonation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
            amount: 1500,
            donorName: 'মোসাঃ ফাতেমা',
          }),
        }),
      );
    });

    it('should reject donation submission if campaign is not ACTIVE', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValueOnce({
        id: 'camp-paused',
        title: 'স্থগিত ক্যাম্পেইন',
        status: 'PAUSED',
      });

      await expect(
        service.submitPublicDonation('camp-paused', {
          donorName: 'পরীক্ষার্থী',
          donorPhone: '01811223344',
          amount: 500,
          paymentMethod: 'NAGAD',
        }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('Donation Review & Verification', () => {
    it('should verify donation, atomically increment collected amount, and preserve history', async () => {
      // Reviewer is ADMIN
      mockPrisma.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });

      mockPrisma.campaignDonation.findUnique.mockResolvedValueOnce({
        id: 'don-1',
        campaignId: 'camp-1',
        amount: 2000,
        status: 'PENDING',
        campaign: { id: 'camp-1', title: 'চিকিৎসা সহায়তা', collectedAmount: 5000 },
      });

      mockPrisma.campaignDonation.update.mockResolvedValueOnce({
        id: 'don-1',
        status: 'VERIFIED',
      });

      const res = await service.reviewDonation('user-admin', 'don-1', 'VERIFIED', undefined, 'টাকা একাউন্টে জমা হয়েছে');

      expect(mockPrisma.campaignDonation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'don-1' },
          data: expect.objectContaining({
            status: 'VERIFIED',
            verifiedBy: 'user-admin',
          }),
        }),
      );

      // Atomically increment campaign.collectedAmount
      expect(mockPrisma.campaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'camp-1' },
          data: {
            collectedAmount: { increment: 2000 },
          },
        }),
      );
    });

    it('should reject donation without incrementing campaign total', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });

      mockPrisma.campaignDonation.findUnique.mockResolvedValueOnce({
        id: 'don-2',
        campaignId: 'camp-1',
        amount: 2000,
        status: 'PENDING',
        campaign: { id: 'camp-1', title: 'চিকিৎসা সহায়তা', collectedAmount: 5000 },
      });

      mockPrisma.campaignDonation.update.mockResolvedValueOnce({
        id: 'don-2',
        status: 'REJECTED',
      });

      await service.reviewDonation('user-admin', 'don-2', 'REJECTED', 'ভুল TrxID');

      expect(mockPrisma.campaignDonation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'don-2' },
          data: expect.objectContaining({
            status: 'REJECTED',
            rejectionReason: 'ভুল TrxID',
          }),
        }),
      );

      // campaign.collectedAmount should NOT be incremented
      expect(mockPrisma.campaign.update).not.toHaveBeenCalled();
    });

    it('should be idempotent if already verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });

      mockPrisma.campaignDonation.findUnique.mockResolvedValueOnce({
        id: 'don-3',
        campaignId: 'camp-1',
        amount: 1000,
        status: 'VERIFIED',
        campaign: { id: 'camp-1', title: 'চিকিৎসা সহায়তা', collectedAmount: 7000 },
      });

      const res = await service.reviewDonation('user-admin', 'don-3', 'VERIFIED');

      expect(mockPrisma.campaignDonation.update).not.toHaveBeenCalled();
      expect(mockPrisma.campaign.update).not.toHaveBeenCalled();
      expect(res.status).toBe('VERIFIED');
    });
  });

  describe('Financial Separation & Expenses', () => {
    it('should record campaign expense in dedicated ledger without mixing general org funds', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });

      mockPrisma.campaign.findUnique.mockResolvedValueOnce({
        id: 'camp-1',
        title: 'বন্যা ত্রাণ',
      });

      mockPrisma.campaignExpense.create.mockResolvedValueOnce({
        id: 'exp-1',
        campaignId: 'camp-1',
        amount: 12000,
        purpose: '২০০ প্যাকেট শুকনো খাবার ক্রয়',
        performedBy: 'কোষাধ্যক্ষ',
      });

      const exp = await service.recordExpense('user-admin', {
        campaignId: 'camp-1',
        amount: 12000,
        purpose: '২০০ প্যাকেট শুকনো খাবার ক্রয়',
        performedBy: 'কোষাধ্যক্ষ',
      });

      expect(exp.amount).toBe(12000);
      expect(mockPrisma.campaignExpense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            campaignId: 'camp-1',
            amount: 12000,
          }),
        }),
      );
    });
  });
});

