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
      },
      orgFund: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      election: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      electionPosition: {
        findMany: vi.fn(),
      },
      electionNomination: {
        findUnique: vi.fn(),
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
  });
});
