import { FastifyPluginAsync } from 'fastify';
import { OrganizationService } from './organization.service.js';
import {
  ApplyMembershipSchema,
  InitialPaymentSchema,
  PayContributionSchema,
  ReviewApplicationSchema,
  CreateFundSchema,
  FundTransactionSchema,
  CreateCommitteeSchema,
  AssignCommitteeMemberSchema,
  CreateMeetingSchema,
  CreateNoticeSchema,
  CreateProjectSchema,
  CreateDocumentSchema,
  CreateElectionSchema,
  SubmitNominationSchema,
  ReviewNominationSchema,
  CastVoteSchema,
} from './organization.schema.js';
import { successResponse } from '../../utils/api-response.js';

export const organizationRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new OrganizationService(fastify.prisma);

  // ==========================================================================
  // Public & General Endpoints
  // ==========================================================================

  // 1. Overview (Public)
  fastify.get('/overview', async (_request, reply) => {
    const overview = await service.getOverview();
    return reply.send(successResponse(overview, 'সাংগঠনিক সারসংক্ষেপ সফলভাবে পাওয়া গেছে'));
  });

  // 2. Public Notices
  fastify.get('/notices', async (request, reply) => {
    let isMember = false;
    try {
      const session = await fastify.authenticate(request, reply);
      const membership = await fastify.prisma.orgMembership.findUnique({
        where: { userId: session.user.id },
      });
      isMember = membership?.status === 'ACTIVE';
    } catch {
      // Guest
    }
    const notices = await service.getNotices(!isMember);
    return reply.send(successResponse(notices, 'বিজ্ঞপ্তিসমূহ সফলভাবে পাওয়া গেছে'));
  });

  // 3. Public / Org Projects
  fastify.get('/projects', async (_request, reply) => {
    const projects = await service.getProjects();
    return reply.send(successResponse(projects, 'প্রকল্পসমূহ সফলভাবে পাওয়া গেছে'));
  });

  // 4. Committees & Designations
  fastify.get('/committees', async (_request, reply) => {
    const committees = await service.getCommittees();
    return reply.send(successResponse(committees, 'কমিটি তালিকা সফলভাবে পাওয়া গেছে'));
  });

  fastify.get('/designations', async (_request, reply) => {
    const designations = await service.getDesignations();
    return reply.send(successResponse(designations, 'পদবি তালিকা সফলভাবে পাওয়া গেছে'));
  });

  // 5. Funds
  fastify.get('/funds', async (_request, reply) => {
    const funds = await service.getFunds();
    return reply.send(successResponse(funds, 'তহবিল তালিকা সফলভাবে পাওয়া গেছে'));
  });

  // ==========================================================================
  // Authenticated Member & Application Endpoints
  // ==========================================================================

  // Check current user's membership and application status
  fastify.get('/membership/status', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const status = await service.getMembershipStatus(session.user.id);
    return reply.send(successResponse(status, 'সদস্যপদ স্ট্যাটাস সফলভাবে পাওয়া গেছে'));
  });

  // Apply for membership
  fastify.post('/membership/apply', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = ApplyMembershipSchema.parse(request.body);
    const application = await service.applyMembership(session.user.id, validatedData);
    return reply.status(201).send(
      successResponse(application, 'সদস্যপদ আবেদন সফলভাবে জমা দেওয়া হয়েছে। পর্যালোচনার পর আপনাকে জানানো হবে।'),
    );
  });

  // Submit initial payment for approved membership
  fastify.post('/membership/initial-payment', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = InitialPaymentSchema.parse(request.body);
    const membership = await service.submitInitialPayment(session.user.id, validatedData);
    return reply.send(
      successResponse(membership, 'অভিনন্দন! আপনার প্রারম্ভিক কিস্তি যাচাই হয়েছে এবং সদস্যপদ সক্রিয় করা হয়েছে।'),
    );
  });

  // Pay regular monthly contribution
  fastify.post('/contributions/pay', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = PayContributionSchema.parse(request.body);
    const payment = await service.payMonthlyContribution(session.user.id, validatedData);
    return reply.send(
      successResponse(payment, 'মাসিক অনুদান সফলভাবে পরিশোধ ও সংরক্ষিত হয়েছে। ধন্যবাদ!'),
    );
  });

  // Member Dashboard (Personal membership, stats, financial ledger)
  fastify.get('/member/dashboard', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const dashboard = await service.getMemberDashboard(session.user.id);
    return reply.send(successResponse(dashboard, 'সদস্য ড্যাশবোর্ড তথ্য সফলভাবে পাওয়া গেছে'));
  });

  // Meetings (Member only)
  fastify.get('/meetings', async (request, reply) => {
    await fastify.authenticate(request, reply);
    const meetings = await service.getMeetings();
    return reply.send(successResponse(meetings, 'মিটিং তালিকা সফলভাবে পাওয়া গেছে'));
  });

  // Documents
  fastify.get('/documents', async (request, reply) => {
    let accessRole: string | null = null;
    try {
      const session = await fastify.authenticate(request, reply);
      const membership = await fastify.prisma.orgMembership.findUnique({
        where: { userId: session.user.id },
      });
      if (membership?.status === 'ACTIVE') {
        accessRole = membership.orgRole;
      }
    } catch {
      // Guest
    }
    const docs = await service.getDocuments(accessRole);
    return reply.send(successResponse(docs, 'নথিপত্র তালিকা সফলভাবে পাওয়া গেছে'));
  });

  // ==========================================================================
  // Digital Election Endpoints
  // ==========================================================================

  // List elections
  fastify.get('/elections', async (_request, reply) => {
    const elections = await service.getElections();
    return reply.send(successResponse(elections, 'নির্বাচন তালিকা সফলভাবে পাওয়া গেছে'));
  });

  // Election details (includes candidates, positions, results if finalized)
  fastify.get('/elections/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    let currentUserId: string | undefined;
    try {
      const session = await fastify.authenticate(request, reply);
      currentUserId = session.user.id;
    } catch {
      // Unauthenticated
    }
    const election = await service.getElectionDetail(id, currentUserId);
    return reply.send(successResponse(election, 'নির্বাচন বিবরণী সফলভাবে পাওয়া গেছে'));
  });

  // Submit nomination
  fastify.post('/elections/:id/nominate', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const validatedData = SubmitNominationSchema.parse(request.body);
    const nomination = await service.submitNomination(session.user.id, id, validatedData);
    return reply.status(201).send(
      successResponse(nomination, 'মনোনয়নপত্র সফলভাবে জমা দেওয়া হয়েছে'),
    );
  });

  // Cast secret ballot vote
  fastify.post('/elections/:id/vote', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const validatedData = CastVoteSchema.parse(request.body);
    const result = await service.castVote(session.user.id, id, validatedData.ballots);
    return reply.send(
      successResponse(result, 'আপনার ভোটটি সফলভাবে এবং সম্পূর্ণ গোপন ব্যালটের মাধ্যমে রেকর্ড হয়েছে।'),
    );
  });

  // Get live turnout
  fastify.get('/elections/:id/turnout', async (request, reply) => {
    const { id } = request.params as { id: string };
    const turnout = await service.getLiveTurnout(id);
    return reply.send(successResponse(turnout, 'লাইভ ভোটার টার্নআউট তথ্য'));
  });

  // ==========================================================================
  // Officer / Admin Endpoints (PRESIDENT, TREASURER, ADMIN)
  // ==========================================================================

  // Admin stats
  fastify.get('/admin/stats', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const stats = await service.getAdminStats(session.user.id);
    return reply.send(successResponse(stats, 'প্রশাসনিক পরিসংখ্যান তথ্য'));
  });

  // Admin applications list
  fastify.get('/admin/applications', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { status } = request.query as { status?: string };
    const apps = await service.getApplications(session.user.id, status);
    return reply.send(successResponse(apps, 'আবেদনের তালিকা'));
  });

  // Review application
  fastify.post('/admin/applications/:id/review', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const validatedData = ReviewApplicationSchema.parse(request.body);
    const result = await service.reviewApplication(
      session.user.id,
      id,
      validatedData.status,
      validatedData.rejectionReason,
    );
    return reply.send(
      successResponse(result, `আবেদন সফলভাবে ${validatedData.status === 'APPROVED' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'} হয়েছে`),
    );
  });

  // Create Fund
  fastify.post('/admin/funds', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = CreateFundSchema.parse(request.body);
    const fund = await service.createFund(session.user.id, validatedData);
    return reply.status(201).send(successResponse(fund, 'নতুন তহবিল তৈরি হয়েছে'));
  });

  // Record Transaction
  fastify.post('/admin/transactions', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = FundTransactionSchema.parse(request.body);
    const trx = await service.recordTransaction(session.user.id, validatedData);
    return reply.status(201).send(successResponse(trx, 'লেনদেন সফলভাবে লেজারে যুক্ত হয়েছে'));
  });

  // Create Committee
  fastify.post('/admin/committees', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = CreateCommitteeSchema.parse(request.body);
    const committee = await service.createCommittee(session.user.id, validatedData);
    return reply.status(201).send(successResponse(committee, 'কমিটি সফলভাবে তৈরি হয়েছে'));
  });

  // Assign Committee Member
  fastify.post('/admin/committees/assign', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = AssignCommitteeMemberSchema.parse(request.body);
    const assigned = await service.assignCommitteeMember(session.user.id, validatedData);
    return reply.status(201).send(successResponse(assigned, 'কমিটিতে সদস্য সফলভাবে অন্তর্ভুক্ত হয়েছে'));
  });

  // Create Meeting
  fastify.post('/admin/meetings', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = CreateMeetingSchema.parse(request.body);
    const meeting = await service.createMeeting(session.user.id, validatedData);
    return reply.status(201).send(successResponse(meeting, 'মিটিং সফলভাবে নির্ধারিত হয়েছে'));
  });

  // Create Notice
  fastify.post('/admin/notices', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = CreateNoticeSchema.parse(request.body);
    const notice = await service.createNotice(session.user.id, validatedData);
    return reply.status(201).send(successResponse(notice, 'বিজ্ঞপ্তি সফলভাবে প্রকাশিত হয়েছে'));
  });

  // Create Project
  fastify.post('/admin/projects', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = CreateProjectSchema.parse(request.body);
    const project = await service.createProject(session.user.id, validatedData);
    return reply.status(201).send(successResponse(project, 'প্রকল্প সফলভাবে তৈরি হয়েছে'));
  });

  // Create Document
  fastify.post('/admin/documents', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = CreateDocumentSchema.parse(request.body);
    const doc = await service.createDocument(session.user.id, validatedData);
    return reply.status(201).send(successResponse(doc, 'নথিপত্র সফলভাবে আপলোড হয়েছে'));
  });

  // Create Election
  fastify.post('/admin/elections', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = CreateElectionSchema.parse(request.body);
    const election = await service.createElection(session.user.id, validatedData);
    return reply.status(201).send(successResponse(election, 'নির্বাচনী তফশিল সফলভাবে ঘোষিত হয়েছে'));
  });

  // Review Nomination
  fastify.post('/admin/elections/nominations/:id/review', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const validatedData = ReviewNominationSchema.parse(request.body);
    const nomination = await service.reviewNomination(
      session.user.id,
      id,
      validatedData.status,
      validatedData.reviewNotes,
    );
    return reply.send(
      successResponse(
        nomination,
        `মনোনয়নপত্র সফলভাবে ${validatedData.status === 'APPROVED' ? 'অনুমোদন' : 'বাতিল'} করা হয়েছে`,
      ),
    );
  });

  // Finalize Election
  fastify.post('/admin/elections/:id/finalize', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const election = await service.finalizeElection(session.user.id, id);
    return reply.send(
      successResponse(election, 'নির্বাচনী ফলাফল চূড়ান্ত হয়েছে এবং দায়িত্বপ্রাপ্ত কর্মকর্তাদের পদবি বরাদ্দ করা হয়েছে'),
    );
  });
};

