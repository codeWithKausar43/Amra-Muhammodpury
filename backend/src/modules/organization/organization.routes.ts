import { FastifyPluginAsync } from 'fastify';
import { OrganizationService } from './organization.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import { ContributionSchedulerService } from './contribution-scheduler.service.js';
import {
  ApplyMembershipSchema,
  InitialPaymentSchema,
  PayContributionSchema,
  ChangeContributionSchema,
  ReviewApplicationSchema,
  ReviewPaymentSchema,
  CreateFundSchema,
  FundTransactionSchema,
  CreateCommitteeSchema,
  AssignCommitteeMemberSchema,
  CreateMeetingSchema,
  CreateNoticeSchema,
  UpdateNoticeSchema,
  CreateProjectSchema,
  CreateDocumentSchema,
  CreateElectionSchema,
  CreateVotingPollSchema,
  UpdateVotingScheduleSchema,
  UpdateVotingConfigSchema,
  SubmitNominationSchema,
  ReviewNominationSchema,
  CastVoteSchema,
  MemberDirectoryQuerySchema,
  AdminMembersQuerySchema,
  UpdateMemberStatusSchema,
  AssignMemberDesignationSchema,
  ContributionTrackingQuerySchema,
  SendContributionReminderSchema,
  BulkContributionReminderSchema,
  CreateDesignationSchema,
  UpdateDesignationSchema,
  UpdateOrgPaymentConfigSchema,
  AdminUsersQuerySchema,
  UpdateUserRoleSchema,
  SuspendUserSchema,
} from './organization.schema.js';
import { successResponse } from '../../utils/api-response.js';

export const organizationRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new OrganizationService(fastify.prisma);
  const notificationService = new NotificationService(fastify.prisma);
  const scheduler = new ContributionSchedulerService(fastify.prisma, notificationService);
  scheduler.start();

  fastify.addHook('onClose', async () => {
    scheduler.stop();
  });

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
  fastify.get('/projects', async (request, reply) => {
    const query = request.query as { category?: string };
    const projects = await service.getProjects(query?.category);
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
      successResponse(payment, 'মাসিক অনুদানের তথ্য সফলভাবে জমা দেওয়া হয়েছে। অ্যাডমিন যাচাইয়ের পর এটি অনুমোদিত হবে।'),
    );
  });

  // Update monthly contribution amount (Effective next month, requires confirmation)
  fastify.patch('/membership/monthly-contribution', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = ChangeContributionSchema.parse(request.body);
    const result = await service.updateMonthlyContributionAmount(session.user.id, validatedData);
    return reply.send(
      successResponse(result, 'আপনার মাসিক অনুদানের পরিমাণ সফলভাবে আপডেট করা হয়েছে। এটি পরবর্তী মাস থেকে কার্যকর হবে।'),
    );
  });

  // View member's contribution agreement & change request history
  fastify.get('/membership/contribution-history', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const history = await service.getContributionAgreementsHistory(session.user.id);
    return reply.send(successResponse(history, 'চাঁদা পরিবর্তনের ইতিহাস সফলভাবে লোড হয়েছে'));
  });

  // Member Dashboard (Personal membership, stats, financial ledger)
  fastify.get('/member/dashboard', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const dashboard = await service.getMemberDashboard(session.user.id);
    return reply.send(successResponse(dashboard, 'সদস্য ড্যাশবোর্ড তথ্য সফলভাবে পাওয়া গেছে'));
  });

  // Member Directory (Active Members Only - STRICT PRIVACY: Zero Contribution Amounts)
  fastify.get('/member/directory', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedQuery = MemberDirectoryQuerySchema.parse(request.query);
    const directory = await service.getMemberDirectory(session.user.id, validatedQuery);
    return reply.send(successResponse(directory, 'সদস্য তালিকা সফলভাবে লোড হয়েছে'));
  });

  // Organization Financial Transparency & Complete Accounts Ledger (Public & Members)
  fastify.get('/transparency', async (request, reply) => {
    let currentUserId: string | undefined;
    try {
      const session = await fastify.authenticate(request, reply);
      currentUserId = session.user.id;
    } catch {
      // Unauthenticated visitor
    }
    const data = await service.getTransparencyOverview(currentUserId);
    return reply.send(successResponse(data, 'সংগঠনের পূর্ণাঙ্গ আর্থিক স্বচ্ছতা ও হিসাব-নিকাশ তথ্য'));
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
  // Digital Election & Voting Endpoints
  // ==========================================================================

  // Global Voting Config
  fastify.get('/voting/config', async (_request, reply) => {
    const config = await service.getVotingConfig();
    return reply.send(successResponse(config, 'ভোট সেটিংস লোড হয়েছে'));
  });

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

  // Admin financial trends
  fastify.get('/admin/financial/trends', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const trends = await service.calculateFinancialTrends(session.user.id);
    return reply.send(successResponse(trends, 'আর্থিক অ্যানালিটিক্স ও ট্রেন্ড তথ্য'));
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

  // Review member contribution payment
  fastify.post('/admin/payments/:id/review', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const validatedData = ReviewPaymentSchema.parse(request.body);
    const result = await service.reviewContributionPayment(
      session.user.id,
      id,
      validatedData.status,
      validatedData.notes,
    );
    return reply.send(
      successResponse(
        result,
        validatedData.status === 'VERIFIED'
          ? 'সদস্যের চাঁদা সফলভাবে অনুমোদন ও তহবিল হালনাগাদ করা হয়েছে!'
          : 'সদস্যের চাঁদা বাতিল করা হয়েছে।',
      ),
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

  // Update Notice
  fastify.put('/admin/notices/:id', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const validatedData = UpdateNoticeSchema.parse(request.body);
    const updated = await service.updateNotice(session.user.id, id, validatedData);
    return reply.send(successResponse(updated, 'বিজ্ঞপ্তি সফলভাবে হালনাগাদ করা হয়েছে'));
  });

  // Delete Notice
  fastify.delete('/admin/notices/:id', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    await service.deleteNotice(session.user.id, id);
    return reply.send(successResponse(null, 'বিজ্ঞপ্তি সফলভাবে মুছে ফেলা হয়েছে'));
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

  // Update Global Voting Config (ON/OFF)
  fastify.put('/admin/voting/config', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = UpdateVotingConfigSchema.parse(request.body);
    const updated = await service.updateVotingConfig(session.user.id, validatedData.isVotingEnabled);
    return reply.send(successResponse(updated, 'ভোট সিস্টেম কনফিগারেশন সফলভাবে আপডেট হয়েছে'));
  });

  // Create Simple Voting Poll
  fastify.post('/admin/voting/polls', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = CreateVotingPollSchema.parse(request.body);
    const poll = await service.createVotingPoll(session.user.id, validatedData);
    return reply.status(201).send(successResponse(poll, 'ভোট সফলভাবে তৈরি ও প্রকাশিত হয়েছে'));
  });

  // Update Voting Schedule
  fastify.put('/admin/elections/:id/schedule', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const validatedData = UpdateVotingScheduleSchema.parse(request.body);
    const updated = await service.updateVotingSchedule(session.user.id, id, validatedData);
    return reply.send(successResponse(updated, 'ভোটের সময়সূচি সফলভাবে পরিবর্তন করা হয়েছে'));
  });

  // Superadmin Poll Monitoring (Live Turnout & Candidate Votes)
  fastify.get('/admin/elections/:id/monitoring', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const monitoring = await service.getVotingPollMonitoring(session.user.id, id);
    return reply.send(successResponse(monitoring, 'ভোট মনিটরিং ডাটা সফলভাবে পাওয়া গেছে'));
  });

  // Update election status
  fastify.patch('/admin/elections/:id/status', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };
    const updated = await service.updateElectionStatus(session.user.id, id, status);
    return reply.send(successResponse(updated, 'নির্বাচনী স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে'));
  });

  // Delete election
  fastify.delete('/admin/elections/:id', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    await service.deleteElection(session.user.id, id);
    return reply.send(successResponse(null, 'নির্বাচন সফলভাবে মুছে ফেলা হয়েছে'));
  });

  // ==========================================================================
  // Registered Website Users (General Registered Users Directory)
  // ==========================================================================

  // Admin General Users Directory & Filter
  fastify.get('/admin/users', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedQuery = AdminUsersQuerySchema.parse(request.query);
    const result = await service.getAdminUsers(session.user.id, validatedQuery);
    return reply.send(successResponse(result, 'ওয়েবসাইট ব্যবহারকারী তালিকা সফলভাবে লোড হয়েছে'));
  });

  // Admin Toggle User System Role (USER <-> ADMIN)
  fastify.patch('/admin/users/:id/role', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const validatedData = UpdateUserRoleSchema.parse(request.body);
    const updated = await service.toggleUserSystemRole(session.user.id, id, validatedData.role);
    return reply.send(successResponse(updated, 'ইউজার রোল সফলভাবে আপডেট হয়েছে'));
  });

  // System Admin: Suspend / Unsuspend User
  fastify.patch('/admin/users/:id/suspend', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const validatedData = SuspendUserSchema.parse(request.body);
    const updated = await service.suspendUser(session.user.id, id, validatedData.isSuspended, validatedData.reason);
    return reply.send(
      successResponse(
        updated,
        validatedData.isSuspended ? 'ব্যবহারকারীকে সাময়িকভাবে স্থগিত করা হয়েছে' : 'ব্যবহারকারীর স্থগিতাদেশ প্রত্যাহার করা হয়েছে',
      ),
    );
  });

  // System Admin: Permanently Delete User
  fastify.delete('/admin/users/:id', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const result = await service.deleteUser(session.user.id, id);
    return reply.send(successResponse(result, 'ব্যবহারকারী অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে'));
  });

  // System Admin: Appoint Organization President (সভাপতি)
  fastify.post('/admin/users/:id/appoint-president', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const result = await service.appointPresident(session.user.id, id);
    return reply.send(successResponse(result, 'সফলভাবে সংগঠনের সভাপতি হিসেবে নিযুক্ত করা হয়েছে'));
  });

  // ==========================================================================
  // Organization Member Management, Tracking, Reminders & Designation Routes
  // ==========================================================================

  // Admin Member Directory & Filter
  fastify.get('/admin/members', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedQuery = AdminMembersQuerySchema.parse(request.query);
    const result = await service.getAdminMembers(session.user.id, validatedQuery);
    return reply.send(successResponse(result, 'সদস্য তালিকা সফলভাবে লোড হয়েছে'));
  });

  // Admin Member Details
  fastify.get('/admin/members/:id', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const member = await service.getAdminMemberDetails(session.user.id, id);
    return reply.send(successResponse(member, 'সদস্যের বিস্তারিত বিবরণ লোড হয়েছে'));
  });

  // Admin Update Member Status
  fastify.patch('/admin/members/:id/status', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const validatedData = UpdateMemberStatusSchema.parse(request.body);
    const updated = await service.updateMemberStatus(session.user.id, id, validatedData.status, validatedData.notes);
    return reply.send(successResponse(updated, 'সদস্যের স্ট্যাটাস সফলভাবে আপডেট হয়েছে'));
  });

  // Admin Assign Member Designation
  fastify.patch('/admin/members/:id/designation', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const validatedData = AssignMemberDesignationSchema.parse(request.body);
    const updated = await service.assignMemberDesignation(session.user.id, id, validatedData);
    return reply.send(successResponse(updated, 'সদস্যের পদবি সফলভাবে নির্ধারিত হয়েছে'));
  });

  // Admin Contribution Tracking (Paid, Unpaid, Pending, Overdue)
  fastify.get('/admin/contributions/tracking', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedQuery = ContributionTrackingQuerySchema.parse(request.query);
    const result = await service.getContributionTracking(session.user.id, validatedQuery.year, validatedQuery.month);
    return reply.send(successResponse(result, 'মাসিক চাঁদা ট্র্যাকিং তথ্য লোড হয়েছে'));
  });

  // Admin Send Manual Reminder to Individual
  fastify.post('/admin/contributions/remind', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = SendContributionReminderSchema.parse(request.body);
    const result = await service.sendManualContributionReminder(session.user.id, validatedData);
    return reply.send(successResponse(result, 'চাঁদা পরিশোধের তাগিদ পাঠানো হয়েছে'));
  });

  // Admin Send Bulk Reminders
  fastify.post('/admin/contributions/bulk-remind', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = BulkContributionReminderSchema.parse(request.body);
    const result = await service.sendBulkContributionReminders(session.user.id, validatedData);
    return reply.send(successResponse(result, 'একসাথে সকল বকেয়া তাগিদ পাঠানো সম্পন্ন হয়েছে'));
  });

  // Admin Designations List
  fastify.get('/admin/designations', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const result = await service.getAdminDesignations(session.user.id);
    return reply.send(successResponse(result, 'পদবি তালিকা লোড হয়েছে'));
  });

  // Admin Create Designation
  fastify.post('/admin/designations', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = CreateDesignationSchema.parse(request.body);
    const result = await service.createDesignation(session.user.id, validatedData);
    return reply.status(201).send(successResponse(result, 'নতুন পদবি সফলভাবে তৈরি হয়েছে'));
  });

  // Admin Update Designation
  fastify.put('/admin/designations/:id', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const validatedData = UpdateDesignationSchema.parse(request.body);
    const result = await service.updateDesignation(session.user.id, id, validatedData);
    return reply.send(successResponse(result, 'পদবি সফলভাবে আপডেট করা হয়েছে'));
  });

  // --------------------------------------------------------------------------
  // Monthly Contribution Payment Configs (Public & Admin)
  // --------------------------------------------------------------------------
  fastify.get('/payment-configs', async (_request, reply) => {
    const configs = await service.getPublicOrgPaymentConfigs();
    return reply.send(successResponse(configs, 'মাসিক চাঁদা পেমেন্ট কনফিগারেশন তালিকা পাওয়া গেছে'));
  });

  fastify.get('/admin/payment-configs', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const configs = await service.getAdminOrgPaymentConfigs(session.user.id);
    return reply.send(successResponse(configs, 'অ্যাডমিন মাসিক চাঁদা কনফিগারেশন তালিকা পাওয়া গেছে'));
  });

  fastify.put('/admin/payment-configs', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const validatedData = UpdateOrgPaymentConfigSchema.parse(request.body);
    const result = await service.updateOrgPaymentConfig(session.user.id, validatedData);
    return reply.send(successResponse(result, 'মাসিক চাঁদা পেমেন্ট তথ্য সফলভাবে হালনাগাদ হয়েছে'));
  });

};
