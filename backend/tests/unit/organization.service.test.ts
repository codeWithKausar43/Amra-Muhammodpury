import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationService } from '../../src/modules/organization/organization.service.js';
import { BadRequestError, ConflictError, ForbiddenError } from '../../src/errors/app-error.js';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      orgMembership: {
        findUnique: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
      },
      orgApplication: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      contributionAgreement: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      orgProject: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      orgNotice: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      orgFund: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        aggregate: vi.fn(),
      },
      fundTransaction: {
        findMany: vi.fn(),
        aggregate: vi.fn(),
        create: vi.fn(),
      },
      election: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      orgDesignation: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      electionPosition: {
        findMany: vi.fn(),
      },
      electionNomination: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      voterParticipation: {
        findUnique: vi.fn(),
        create: vi.fn(),
        count: vi.fn(),
      },
      secretBallot: {
        create: vi.fn(),
        createMany: vi.fn(),
        findMany: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => cb(mockPrisma)),
    };

    service = new OrganizationService(mockPrisma);
    vi.spyOn(service, 'getVotingConfig').mockResolvedValue({
      isVotingEnabled: true,
      updatedAt: new Date().toISOString(),
    });
  });

  describe('applyMembership', () => {
    it('should throw BadRequestError if monthly contribution is less than 50', async () => {
      await expect(
        service.applyMembership('user-1', {
          fullName: 'Md Test',
          phone: '01711111111',
          profession: 'Engineer',
          monthlyContribution: 40,
          agreedToMonthlyFee: true,
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw ConflictError if already an active member', async () => {
      mockPrisma.orgMembership.findUnique.mockResolvedValueOnce({
        id: 'mem-1',
        status: 'ACTIVE',
      });

      await expect(
        service.applyMembership('user-1', {
          fullName: 'Md Test',
          phone: '01711111111',
          profession: 'Engineer',
          monthlyContribution: 100,
          agreedToMonthlyFee: true,
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('should successfully submit application for valid contribution >= 50', async () => {
      mockPrisma.orgMembership.findUnique.mockResolvedValueOnce(null);
      mockPrisma.orgApplication.findFirst.mockResolvedValueOnce(null);
      mockPrisma.orgApplication.create.mockResolvedValueOnce({
        id: 'app-1',
        fullName: 'Md Test',
        monthlyContribution: 100,
        status: 'PENDING',
      });

      const res = await service.applyMembership('user-1', {
        fullName: 'Md Test',
        phone: '01711111111',
        profession: 'Engineer',
        monthlyContribution: 100,
        agreedToMonthlyFee: true,
      });

      expect(res.id).toBe('app-1');
      expect(mockPrisma.orgApplication.create).toHaveBeenCalled();
    });
  });

  describe('Secret Ballot Voting', () => {
    it('should enforce active membership to vote', async () => {
      mockPrisma.orgMembership.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.castVote('user-1', 'election-1', [
          { positionId: 'pos-1', candidateNominationId: 'nom-1' },
        ]),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ConflictError if voter has already participated', async () => {
      mockPrisma.orgMembership.findUnique.mockResolvedValueOnce({
        id: 'mem-1',
        status: 'ACTIVE',
      });
      mockPrisma.election.findUnique.mockResolvedValueOnce({
        id: 'election-1',
        status: 'VOTING_ACTIVE',
        votingStartDate: new Date(Date.now() - 10000),
        votingEndDate: new Date(Date.now() + 10000),
      });
      mockPrisma.voterParticipation.findUnique.mockResolvedValueOnce({
        id: 'vp-1',
      });

      await expect(
        service.castVote('user-1', 'election-1', [
          { positionId: 'pos-1', candidateNominationId: 'nom-1' },
        ]),
      ).rejects.toThrow(ConflictError);
    });

    it('should decouple voter participation and secret ballot creation without storing userId on ballots', async () => {
      mockPrisma.orgMembership.findUnique.mockResolvedValueOnce({
        id: 'mem-1',
        status: 'ACTIVE',
      });
      mockPrisma.election.findUnique.mockResolvedValueOnce({
        id: 'election-1',
        status: 'VOTING_ACTIVE',
        votingStartDate: new Date(Date.now() - 10000),
        votingEndDate: new Date(Date.now() + 10000),
      });
      mockPrisma.voterParticipation.findUnique.mockResolvedValueOnce(null);
      mockPrisma.electionPosition.findMany.mockResolvedValueOnce([
        { id: 'pos-1', designation: { title: 'সভাপতি' } },
      ]);
      mockPrisma.electionNomination.findUnique.mockResolvedValueOnce({
        id: 'nom-1',
        electionPositionId: 'pos-1',
        status: 'APPROVED',
      });

      mockPrisma.voterParticipation.create.mockResolvedValueOnce({
        id: 'vp-1',
        receiptToken: 'RCT-12345',
      });
      mockPrisma.secretBallot.create.mockResolvedValueOnce({ id: 'sb-1' });

      const result = await service.castVote('user-1', 'election-1', [
        { positionId: 'pos-1', candidateNominationId: 'nom-1' },
      ]);

      expect(result.success).toBe(true);
      expect(result.receiptToken).toBeDefined();

      // Ensure voter participation is saved with user ID
      expect(mockPrisma.voterParticipation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          electionId: 'election-1',
          userId: 'user-1',
        }),
      });

      // Ensure secret ballots are saved WITHOUT voter user ID
      const ballotDataPassed = mockPrisma.secretBallot.create.mock.calls[0][0].data;
      expect(ballotDataPassed).not.toHaveProperty('userId');
      expect(ballotDataPassed.candidateNominationId).toBe('nom-1');
      expect(ballotDataPassed.positionId).toBe('pos-1');
      expect(ballotDataPassed.ballotToken).toBeDefined();
    });

    it('should delete a notice when user has proper officer role', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });
      mockPrisma.orgNotice.findUnique.mockResolvedValueOnce({ id: 'notice-1', title: 'Test Notice' });
      mockPrisma.orgNotice.delete.mockResolvedValueOnce({ id: 'notice-1' });

      const result = await service.deleteNotice('admin-user', 'notice-1');
      expect(result).toEqual({ id: 'notice-1' });
      expect(mockPrisma.orgNotice.delete).toHaveBeenCalledWith({ where: { id: 'notice-1' } });
    });

    it('should throw NotFoundError if notice to delete does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });
      mockPrisma.orgNotice.findUnique.mockResolvedValueOnce(null);

      await expect(service.deleteNotice('admin-user', 'non-existing')).rejects.toThrow();
    });

    it('should update a notice when user has proper officer role', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });
      mockPrisma.orgNotice.findUnique.mockResolvedValueOnce({ id: 'notice-1', title: 'Old Title' });
      mockPrisma.orgNotice.update.mockResolvedValueOnce({ id: 'notice-1', title: 'New Title' });

      const result = await service.updateNotice('admin-user', 'notice-1', { title: 'New Title' });
      expect(result).toEqual({ id: 'notice-1', title: 'New Title' });
      expect(mockPrisma.orgNotice.update).toHaveBeenCalledWith({
        where: { id: 'notice-1' },
        data: { title: 'New Title' },
      });
    });

    it('should get and update global voting config', async () => {
      vi.restoreAllMocks();
      service = new OrganizationService(mockPrisma);
      mockPrisma.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });
      const config = await service.updateVotingConfig('admin-user', false);
      expect(config.isVotingEnabled).toBe(false);

      const retrieved = await service.getVotingConfig();
      expect(retrieved.isVotingEnabled).toBe(false);

      // Re-enable
      mockPrisma.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });
      const enabled = await service.updateVotingConfig('admin-user', true);
      expect(enabled.isVotingEnabled).toBe(true);
    });

    it('should create a simple voting poll with candidates', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });
      mockPrisma.orgDesignation.findFirst.mockResolvedValueOnce({ id: 'des-1', name: 'সভাপতি' });
      mockPrisma.election.create.mockResolvedValueOnce({
        id: 'poll-1',
        title: 'সভাপতি নির্বাচন ২০২৬',
        positions: [{ id: 'pos-1', designationId: 'des-1' }],
      });
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'cand-user-1' });
      mockPrisma.electionNomination.create.mockResolvedValue({ id: 'nom-1' });

      const startDate = new Date(Date.now() + 100000).toISOString();
      const endDate = new Date(Date.now() + 200000).toISOString();

      const result = await service.createVotingPoll('admin-user', {
        title: 'সভাপতি নির্বাচন ২০২৬',
        positionName: 'সভাপতি',
        description: 'বার্ষিক নির্বাচন',
        votingStartDate: startDate,
        votingEndDate: endDate,
        isPublished: true,
        candidates: [
          { name: 'প্রার্থী ১', bio: 'ইশতেহার ১' },
          { name: 'প্রার্থী ২', bio: 'ইশতেহার ২' },
        ],
      });

      expect(result.id).toBe('poll-1');
      expect(mockPrisma.election.create).toHaveBeenCalled();
    });

    it('should calculate financial trends dynamically from transactions and funds', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });
      mockPrisma.fundTransaction.findMany.mockResolvedValueOnce([
        {
          id: 'tx-1',
          type: 'INCOME',
          amount: 50000,
          createdAt: new Date(),
        },
        {
          id: 'tx-2',
          type: 'EXPENSE',
          amount: 10000,
          createdAt: new Date(),
        },
      ]);
      mockPrisma.orgFund.findMany.mockResolvedValueOnce([
        { id: 'f-1', name: 'শিক্ষা ও মেধা কল্যাণ তহবিল', code: 'EDUCATION', balance: 80000 },
        { id: 'f-2', name: 'চিকিৎসা ও স্বাস্থ্যসেবা তহবিল', code: 'MEDICAL', balance: 20000 },
      ]);

      const trends = await service.calculateFinancialTrends('admin-user');
      expect(trends.weekly).toBeDefined();
      expect(trends.weekly.points).toHaveLength(7);
      expect(trends.weekly.points[6]?.isToday).toBe(true);
      expect(trends.weekly.points[6]?.label).toBe('আজ');
      expect(trends.weekly.points[6]?.income).toBe(50000);
      expect(trends.weekly.points[6]?.expense).toBe(10000);
      expect(trends.weekly.netSurplus).toBe(40000);

      expect(trends.monthly.points).toHaveLength(4);
      expect(trends.yearly.points).toHaveLength(12);

      expect(trends.fundAllocation.fundCount).toBe(2);
      expect(trends.fundAllocation.funds[0]?.shortName).toBe('শিক্ষা');
      expect(trends.fundAllocation.funds[0]?.percentage).toBe(80);
      expect(trends.fundAllocation.funds[1]?.shortName).toBe('চিকিৎসা');
      expect(trends.fundAllocation.funds[1]?.percentage).toBe(20);
    });
  });
});
