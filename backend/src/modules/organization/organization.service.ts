import { PrismaClient } from '../../config/database.js';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '../../errors/app-error.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { NotificationService } from '../notifications/notification.service.js';
import { realtimeService } from '../realtime/realtime.service.js';

function cleanImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.includes('google.') && trimmed.includes('/imgres')) {
      const parsed = new URL(trimmed);
      const directImg = parsed.searchParams.get('imgurl');
      if (directImg) {
        return decodeURIComponent(directImg);
      }
    }
    if (trimmed.includes('unsplash.com')) {
      const parsed = new URL(trimmed);
      if (parsed.searchParams.get('fit') === 'crop' && !parsed.searchParams.has('crop')) {
        parsed.searchParams.set('crop', 'faces');
        return parsed.toString();
      }
    }
  } catch {
    // Return original if parsing fails
  }
  return trimmed;
}

const MONTH_NAMES_BN = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export const ORG_OFFICIAL_START_YEAR = 2026;
export const ORG_OFFICIAL_START_MONTH = 11; // November 2026

function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

export function isMonthEligibleForContribution(
  year: number,
  month: number,
  joinedAt?: Date | string | null,
  createdAt?: Date | string | null,
): boolean {
  // 1. Organization officially started in November 2026. No contributions prior to November 2026.
  if (year < ORG_OFFICIAL_START_YEAR || (year === ORG_OFFICIAL_START_YEAR && month < ORG_OFFICIAL_START_MONTH)) {
    return false;
  }
  // 2. Member must have joined on or before this period.
  const joinedDate = joinedAt ? new Date(joinedAt) : (createdAt ? new Date(createdAt) : null);
  if (joinedDate) {
    const joinedYear = joinedDate.getFullYear();
    const joinedMonth = joinedDate.getMonth() + 1;
    if (year < joinedYear || (year === joinedYear && month < joinedMonth)) {
      return false;
    }
  }
  return true;
}

export const INITIAL_ORG_PAYMENT_CONFIGS = [
  {
    method: 'BKASH',
    title: 'bKash (বিকাশ)',
    accountNumber: '০১৭৫০০০০০০০',
    accountType: 'মার্চেন্ট / সেন্ড মানি',
    instructions: 'বিকাশ অ্যাপ থেকে "Send Money" অথবা "Payment" করুন। রেফারেন্স হিসেবে আপনার মোবাইল নম্বর লিখুন।',
    isActive: true,
  },
  {
    method: 'NAGAD',
    title: 'Nagad (নগদ)',
    accountNumber: '০১৮৫০০০০০০০',
    accountType: 'মার্চেন্ট একাউন্ট',
    instructions: 'নগদ অ্যাপে গিয়ে উল্লেখিত নম্বরে সেন্ড মানি করুন।',
    isActive: true,
  },
  {
    method: 'ROCKET',
    title: 'Rocket (রকেট)',
    accountNumber: '০১835234869-9',
    accountType: 'ব্যক্তিগত একাউন্ট',
    instructions: 'রকেট অ্যাকাউন্টে উল্লেখিত নম্বরে পে করুন।',
    isActive: true,
  },
  {
    method: 'BANK',
    title: 'ব্যাংক ট্রান্সফার',
    accountNumber: '১২৩.১০১.৪৫৬৭৮ (Meghna ব্যাংক)',
    accountType: 'কর্পোরেট একাউন্ট',
    instructions: 'অ্যাকাউন্টের নাম: "মোহাম্মদপুর কমিউনিটি নাগরিক উন্নয়ন সংস্থা"। জমার স্লিপ সংরক্ষণ করুন।',
    isActive: true,
  },
  {
    method: 'CASH',
    title: 'সরাসরি নগদ (ক্যাশ)',
    accountNumber: 'সংগঠনের কার্যালয়, তাজমহল রোড',
    accountType: 'কোষাধ্যক্ষ দপ্তর',
    instructions: 'দাপ্তরিক সময়ে কোষাধ্যক্ষের নিকট সরাসরি নগদ চাঁদা জমা দিয়ে রসিদ গ্রহণ করুন।',
    isActive: true,
  },
];

export class OrganizationService {
  private notificationService: NotificationService;

  constructor(private readonly prisma: PrismaClient) {
    this.notificationService = new NotificationService(prisma);
    this.seedOrgPaymentConfigsIfNeeded().catch(() => {});
  }

  // --------------------------------------------------------------------------
  // Global Voting System Setting
  // --------------------------------------------------------------------------
  private votingConfigPath = path.resolve(process.cwd(), 'data', 'voting-config.json');
  private inMemoryVotingConfig = {
    isVotingEnabled: true,
    updatedAt: new Date().toISOString(),
  };

  public async getVotingConfig(): Promise<{ isVotingEnabled: boolean; updatedAt: string }> {
    try {
      if (fs.existsSync(this.votingConfigPath)) {
        const raw = fs.readFileSync(this.votingConfigPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (typeof parsed.isVotingEnabled === 'boolean') {
          this.inMemoryVotingConfig = parsed;
        }
      }
    } catch {
      // Fallback to in-memory
    }
    return this.inMemoryVotingConfig;
  }

  public async updateVotingConfig(
    userId: string,
    isVotingEnabled: boolean,
  ): Promise<{ isVotingEnabled: boolean; updatedAt: string }> {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    this.inMemoryVotingConfig = {
      isVotingEnabled,
      updatedAt: new Date().toISOString(),
    };

    try {
      const dir = path.dirname(this.votingConfigPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.votingConfigPath,
        JSON.stringify(this.inMemoryVotingConfig, null, 2),
        'utf-8',
      );
    } catch {
      // Ignore filesystem write error
    }

    return this.inMemoryVotingConfig;
  }

  // --------------------------------------------------------------------------
  // Helper: Verify User Officer Role & System Admin Privileges
  // --------------------------------------------------------------------------
  public async isSystemAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });
    return user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.email === 'itskausarprodhan@gmail.com';
  }

  private async getOfficerRole(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });
    if (
      user?.role === 'SUPER_ADMIN' ||
      user?.email === 'itskausarprodhan@gmail.com' ||
      user?.email === 'itskausarprod@gmail.com'
    ) {
      return 'SUPER_ADMIN';
    }
    if (user?.role === 'ADMIN') return 'PRESIDENT'; // System ADMIN has President privileges

    const membership = await this.prisma.orgMembership.findUnique({
      where: { userId },
      include: { designation: true },
    });
    if (membership) {
      const officerRoles = [
        'SUPER_ADMIN',
        'PRESIDENT',
        'VICE_PRESIDENT',
        'GENERAL_SECRETARY',
        'TREASURER',
        'MODERATOR',
        'ADMIN',
      ];
      if (officerRoles.includes(membership.orgRole)) {
        // Auto-heal membership status to ACTIVE for officers if previously pending
        if (membership.status !== 'ACTIVE') {
          await this.prisma.orgMembership
            .update({
              where: { id: membership.id },
              data: { status: 'ACTIVE' },
            })
            .catch(() => {});
        }
        if (membership.orgRole === 'SUPER_ADMIN') return 'PRESIDENT';
        return membership.orgRole;
      }
      const desigCode = membership.designation?.code?.toUpperCase();
      if (desigCode === 'PRESIDENT' || desigCode === 'CONVENER') {
        if (membership.status !== 'ACTIVE') {
          await this.prisma.orgMembership
            .update({
              where: { id: membership.id },
              data: { status: 'ACTIVE', orgRole: 'PRESIDENT' },
            })
            .catch(() => {});
        }
        return 'PRESIDENT';
      }
      if (desigCode && officerRoles.includes(desigCode)) {
        if (membership.status !== 'ACTIVE') {
          await this.prisma.orgMembership
            .update({
              where: { id: membership.id },
              data: { status: 'ACTIVE' },
            })
            .catch(() => {});
        }
        return desigCode;
      }
      if (
        membership.designation?.name &&
        /সভাপতি/i.test(membership.designation.name) &&
        !/সহ[- ]?সভাপতি/i.test(membership.designation.name)
      ) {
        if (membership.status !== 'ACTIVE') {
          await this.prisma.orgMembership
            .update({
              where: { id: membership.id },
              data: { status: 'ACTIVE', orgRole: 'PRESIDENT' },
            })
            .catch(() => {});
        }
        return 'PRESIDENT';
      }
    }

    // Check active committee assignments
    const committeeAssignment = await this.prisma.orgCommitteeMember.findFirst({
      where: { userId, isCurrent: true },
      include: { designation: true },
    });
    if (committeeAssignment) {
      const codeUpper = committeeAssignment.designation?.code?.toUpperCase();
      if (codeUpper === 'PRESIDENT' || codeUpper === 'CONVENER') return 'PRESIDENT';
      if (
        codeUpper &&
        ['VICE_PRESIDENT', 'GENERAL_SECRETARY', 'TREASURER', 'MODERATOR'].includes(codeUpper)
      ) {
        return codeUpper;
      }
      if (
        committeeAssignment.customTitle &&
        /সভাপতি/i.test(committeeAssignment.customTitle) &&
        !/সহ[- ]?সভাপতি/i.test(committeeAssignment.customTitle)
      ) {
        return 'PRESIDENT';
      }
    }

    return null;
  }

  private requireOfficer(role: string | null, allowed: string[] = ['PRESIDENT', 'TREASURER', 'ADMIN']) {
    if (role === 'SUPER_ADMIN' || role === 'PRESIDENT') return; // President and Super Admin have all officer privileges
    if (!role || !allowed.includes(role)) {
      throw new ForbiddenError('এই কার্যক্রমটি সম্পাদনের জন্য আপনার সাংগঠনিক অনুমতি নেই');
    }
  }

  // --------------------------------------------------------------------------
  // 1. Organization Overview (Public)
  // --------------------------------------------------------------------------
  public async getOverview() {
    const [
      activeMembersCount,
      projectsCount,
      publicNotices,
      publicProjects,
      funds,
    ] = await Promise.all([
      this.prisma.orgMembership.count({ where: { status: 'ACTIVE' } }),
      this.prisma.orgProject.count({ where: { isPublic: true } }),
      this.prisma.orgNotice.findMany({
        where: { isPublic: true },
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
        take: 5,
      }),
      this.prisma.orgProject.findMany({
        where: { isPublic: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      this.prisma.orgFund.findMany({
        select: { id: true, name: true, code: true, description: true },
      }),
    ]);

    return {
      organizationName: 'মোহাম্মদপুর কমিউনিটি নাগরিক উন্নয়ন ও সামাজিক সংগঠন',
      tagline: 'মোহাম্মদপুরের উন্নয়ন, নিরাপত্তা ও সামাজিক ঐক্যের মঞ্চ',
      established: 2026,
      stats: {
        activeMembers: activeMembersCount,
        activeProjects: projectsCount,
        totalFundsCount: funds.length,
      },
      publicNotices,
      publicProjects,
      funds,
    };
  }

  // --------------------------------------------------------------------------
  // 2. Membership Status & Application
  // --------------------------------------------------------------------------
  public async getMembershipStatus(userId: string) {
    const membership = await this.prisma.orgMembership.findUnique({
      where: { userId },
      include: {
        designation: true,
        user: {
          select: { id: true, name: true, email: true, phone: true, image: true, role: true },
        },
      },
    });

    const committeeMember = await this.prisma.orgCommitteeMember.findFirst({
      where: { userId, isCurrent: true },
      include: {
        designation: true,
        committee: true,
      },
    });

    const application = await this.prisma.orgApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const agreement = await this.prisma.contributionAgreement.findFirst({
      where: { userId, isCurrent: true },
    });

    const pendingInitialPayment = await this.prisma.contributionPayment.findFirst({
      where: { userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        receiptNumber: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      hasMembership: Boolean(membership),
      membership,
      committeeMember,
      latestApplication: application,
      currentAgreement: agreement,
      pendingInitialPayment,
    };
  }

  public async applyMembership(
    userId: string,
    data: {
      fullName: string;
      phone: string;
      profession: string;
      monthlyContribution: number;
      agreedToMonthlyFee: boolean;
    },
  ) {
    if (data.monthlyContribution < 50) {
      throw new BadRequestError('মাসিক অনুদান সর্বনিম্ন ৫০ টাকা হতে হবে');
    }

    // Check existing membership
    const existingMembership = await this.prisma.orgMembership.findUnique({
      where: { userId },
    });

    if (existingMembership?.status === 'ACTIVE') {
      throw new ConflictError('আপনি ইতিমধ্যেই সংগঠনের একজন সক্রিয় সদস্য');
    }

    // Check existing pending application
    const existingPending = await this.prisma.orgApplication.findFirst({
      where: { userId, status: 'PENDING' },
    });

    if (existingPending) {
      throw new ConflictError('আপনার একটি সদস্যপদ আবেদন ইতিমধ্যেই পর্যালোচনায় রয়েছে');
    }

    return this.prisma.$transaction(async (tx) => {
      const application = await tx.orgApplication.create({
        data: {
          userId,
          fullName: data.fullName.trim(),
          phone: data.phone.trim(),
          profession: data.profession.trim(),
          monthlyContribution: data.monthlyContribution,
          agreedToMonthlyFee: data.agreedToMonthlyFee,
          status: 'PENDING',
        },
      });

      if (existingMembership) {
        await tx.orgMembership.update({
          where: { userId },
          data: {
            status: 'PENDING',
            profession: data.profession.trim(),
            monthlyContribution: data.monthlyContribution,
          },
        });
      } else {
        await tx.orgMembership.create({
          data: {
            userId,
            status: 'PENDING',
            profession: data.profession.trim(),
            monthlyContribution: data.monthlyContribution,
            orgRole: 'MEMBER',
          },
        });
      }

      return application;
    });
  }

  // --------------------------------------------------------------------------
  // 3. Application Review (President / Admin)
  // --------------------------------------------------------------------------
  public async reviewApplication(
    reviewerId: string,
    applicationId: string,
    status: 'APPROVED' | 'REJECTED',
    rejectionReason?: string,
  ) {
    const role = await this.getOfficerRole(reviewerId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    const application = await this.prisma.orgApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundError('আবেদনটি পাওয়া যায়নি');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedApp = await tx.orgApplication.update({
        where: { id: applicationId },
        data: {
          status,
          reviewedBy: reviewerId,
          rejectionReason: status === 'REJECTED' ? rejectionReason : null,
          reviewedAt: new Date(),
        },
      });

      if (status === 'APPROVED') {
        // upsert: membership may not exist if application was submitted by a re-applying user
        await tx.orgMembership.upsert({
          where: { userId: application.userId },
          update: {
            status: 'APPROVED_PAYMENT_PENDING',
            monthlyContribution: application.monthlyContribution,
            profession: application.profession,
          },
          create: {
            userId: application.userId,
            status: 'APPROVED_PAYMENT_PENDING',
            monthlyContribution: application.monthlyContribution,
            profession: application.profession,
            orgRole: 'MEMBER',
          },
        });

        // Set agreement
        await tx.contributionAgreement.updateMany({
          where: { userId: application.userId },
          data: { isCurrent: false },
        });

        await tx.contributionAgreement.create({
          data: {
            userId: application.userId,
            monthlyAmount: application.monthlyContribution,
            effectiveFrom: new Date(),
            isCurrent: true,
            reason: 'সদস্যপদ অনুমোদনের সাথে প্রাথমিক চাঁদা চুক্তি',
          },
        });
      } else {
        // For REJECTED: update if exists, skip if not (membership may not exist for edge cases)
        const existingMembership = await tx.orgMembership.findUnique({
          where: { userId: application.userId },
          select: { userId: true },
        });
        if (existingMembership) {
          await tx.orgMembership.update({
            where: { userId: application.userId },
            data: { status: 'REJECTED' },
          });
        }
      }

      return updatedApp;
    });
  }

  // --------------------------------------------------------------------------
  // 4. Initial & Monthly Contribution Payment
  // --------------------------------------------------------------------------
  public async submitInitialPayment(
    userId: string,
    data: {
      paymentMethod: string;
      trxId?: string;
      senderNumber?: string;
      notes?: string;
    },
  ) {
    const membership = await this.prisma.orgMembership.findUnique({
      where: { userId },
    });

    if (!membership || membership.status !== 'APPROVED_PAYMENT_PENDING') {
      throw new BadRequestError('আপনার সদস্যপদ প্রাথমিক পেমেন্টের জন্য প্রস্তুত নয়');
    }

    const amount = membership.monthlyContribution;
    const now = new Date();
    const periodMonth = now.getMonth() + 1;
    const periodYear = now.getFullYear();

    const receiptNumber = `AMP-REC-${periodYear}${String(periodMonth).padStart(2, '0')}-${crypto.randomInt(1000, 9999)}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Record payment as PENDING (strictly awaiting admin verification)
      const payment = await tx.contributionPayment.create({
        data: {
          userId,
          amount,
          periodMonth,
          periodYear,
          paymentMethod: data.paymentMethod,
          trxId: data.trxId?.trim() || null,
          senderNumber: data.senderNumber?.trim() || null,
          receiptNumber,
          status: 'PENDING',
          notes: data.notes || 'সদস্যপদ সক্রিয়করণ ও প্রারম্ভিক কিস্তি',
        },
      });

      // 2. Notify officers & admins
      this.prisma.user?.findUnique?.({ where: { id: userId }, select: { name: true } })?.then((user) => {
        this.notificationService.sendPushToOfficers({
          title: 'নতুন প্রারম্ভিক চাঁদা জমা 🔔',
          body: `${user?.name || 'একজন আবেদনকারী'} সদস্যপদ সক্রিয় করতে ৳${amount} প্রারম্ভিক চাঁদা জমা দিয়েছেন। যাচাই ও অনুমোদন প্রয়োজন।`,
          url: '/organization/admin',
          sound: '/sounds/notification.wav',
        }, userId).catch(() => { });

        this.notificationService.sendPushToUser(userId, {
          title: 'প্রারম্ভিক চাঁদা জমা গৃহীত হয়েছে ⏳',
          body: `আপনার ৳${amount} প্রারম্ভিক চাঁদার তথ্য জমা হয়েছে। এটি অ্যাডমিন যাচাই ও অনুমোদন করার পর আপনার সদস্যপদ সক্রিয় হবে।`,
          url: '/organization',
        })?.catch?.(() => { });
      })?.catch?.(() => { });

      return {
        payment,
        membership,
        status: 'PENDING',
        message: 'আপনার প্রারম্ভিক কিস্তির তথ্য সফলভাবে জমা দেওয়া হয়েছে। অ্যাডমিন যাচাই ও অনুমোদন করার পর সদস্যপদ সক্রিয় হবে।',
      };
    });
  }

  public async payMonthlyContribution(
    userId: string,
    data: {
      periodMonth?: number;
      months?: number[];
      periodYear: number;
      amount: number;
      paymentMethod: string;
      trxId?: string;
      senderNumber?: string;
      notes?: string;
    },
  ) {
    const membership = await this.prisma.orgMembership.findUnique({
      where: { userId },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenError('কেবলমাত্র সক্রিয় সদস্যগণ মাসিক চাঁদা প্রদান করতে পারবেন');
    }

    const rawMonths =
      data.months && data.months.length > 0
        ? data.months
        : data.periodMonth !== undefined
          ? [data.periodMonth]
          : [];

    if (rawMonths.length === 0) {
      throw new BadRequestError('কমপক্ষে একটি মাস নির্বাচন করতে হবে');
    }

    // Sort unique months ascending
    const targetMonths = Array.from(new Set(rawMonths)).sort((a, b) => a - b);

    // Required minimum amount = targetMonths.length * monthlyContribution
    const requiredMin = targetMonths.length * membership.monthlyContribution;
    if (data.amount < requiredMin) {
      throw new BadRequestError(
        `অনুদান আপনার নির্ধারিত মাসিক অনুদান (${targetMonths.length} মাসের জন্য ৳${requiredMin}) এর কম হতে পারবে না`,
      );
    }

    // Check duplicate payment for these periods
    const existingPayments = await this.prisma.contributionPayment.findMany({
      where: {
        userId,
        periodYear: data.periodYear,
        status: { in: ['VERIFIED', 'PENDING'] },
      },
      select: { periodMonth: true },
    });

    const paidMonthSet = new Set(existingPayments.map((p) => p.periodMonth));

    for (const m of targetMonths) {
      if (paidMonthSet.has(m)) {
        throw new ConflictError(
          `${data.periodYear} সালের ${MONTH_NAMES_BN[m - 1] || `${m} তম`} মাসের চাঁদা ইতিমধ্যেই পরিশোধিত বা প্রক্রিয়াদিন`,
        );
      }
    }

    // Enforce Strict Due-First Sequential Rule:
    // 1. Continuous block check: targetMonths must be contiguous (e.g. 1, 2, 3)
    const firstSelectedMonth = targetMonths[0]!;
    for (let i = 0; i < targetMonths.length - 1; i++) {
      const curr = targetMonths[i]!;
      const next = targetMonths[i + 1]!;
      if (next !== curr + 1) {
        throw new BadRequestError(
          'একসাথে একাধিক মাস পরিশোধ করতে হলে ধারাবাহিক মাস নির্বাচন করতে হবে (কোনো মাস বাদ দেওয়া যাবে না)',
        );
      }
    }

    // Disallow paying for months before official organization start (November 2026)
    if (
      data.periodYear < ORG_OFFICIAL_START_YEAR ||
      (data.periodYear === ORG_OFFICIAL_START_YEAR && targetMonths.some((m) => m < ORG_OFFICIAL_START_MONTH))
    ) {
      throw new BadRequestError('সংগঠনের কার্যক্রম নভেম্বর ২০২৬ থেকে শুরু হওয়ায় এর পূর্ববর্তী মাসের চাঁদা প্রযোজ্য নয়');
    }

    // 2. Due-first check: no unpaid month earlier than targetMonths[0] in the applicable period
    const joinedDate = membership.joinedAt ? new Date(membership.joinedAt) : new Date(membership.createdAt);
    const joinedYear = joinedDate.getFullYear();
    const joinedMonth = joinedDate.getMonth() + 1;
    const startMonth = data.periodYear === ORG_OFFICIAL_START_YEAR
      ? Math.max(ORG_OFFICIAL_START_MONTH, joinedMonth)
      : (data.periodYear === joinedYear ? joinedMonth : 1);

    // Disallow paying for months before membership effective month
    if (data.periodYear < joinedYear || (data.periodYear === joinedYear && targetMonths.some((m) => m < joinedMonth))) {
      throw new BadRequestError('সংগঠনে যোগদানের পূর্ববর্তী মাসের চাঁদা পরিশোধ প্রযোজ্য নয়');
    }

    for (let m = startMonth; m < firstSelectedMonth; m++) {
      if (!isMonthEligibleForContribution(data.periodYear, m, membership.joinedAt, membership.createdAt)) continue;
      if (!paidMonthSet.has(m)) {
        const monthName = MONTH_NAMES_BN[m - 1] || `${m} তম মাস`;
        throw new BadRequestError(
          `পূর্বের বকেয়া কিস্তি (${monthName}) পরিশোধ না করে পরবর্তী মাসের কিস্তি পরিশোধ করা যাবে না। দয়া করে পূর্বের বকেয়া মাস আগে নির্বাচন করুন।`,
        );
      }
    }

    const perMonthAmount = Math.round(data.amount / targetMonths.length);

    return this.prisma.$transaction(async (tx) => {
      const createdPayments = [];
      const receiptNumbers: string[] = [];

      for (const m of targetMonths) {
        const receiptNumber = `AMP-REC-${data.periodYear}${String(m).padStart(2, '0')}-${crypto.randomInt(1000, 9999)}`;
        receiptNumbers.push(receiptNumber);

        const payment = await tx.contributionPayment.create({
          data: {
            userId,
            amount: perMonthAmount,
            periodMonth: m,
            periodYear: data.periodYear,
            paymentMethod: data.paymentMethod,
            trxId: data.trxId?.trim() || null,
            senderNumber: data.senderNumber?.trim() || null,
            receiptNumber,
            status: 'PENDING',
            notes: data.notes || null,
          },
        });
        createdPayments.push(payment);
      }

      // Trigger push notification to officers and admins (excluding paying user)
      this.prisma.user?.findUnique?.({ where: { id: userId }, select: { name: true } })?.then((user) => {
        const monthNames = targetMonths.map((m) => MONTH_NAMES_BN[m - 1] || `${m} তম`).join(', ');
        this.notificationService.sendPushToOfficers({
          title: 'নতুন মাসিক চাঁদা জমা 🔔',
          body: `${user?.name || 'একজন সদস্য'} ${monthNames} (${data.periodYear}) এর ৳${data.amount} চাঁদা জমা দিয়েছেন। যাচাই ও অনুমোদন প্রয়োজন।`,
          url: '/organization/admin',
          sound: '/sounds/notification.wav',
        }, userId).catch(() => { });

        // Inform member that payment info was received and is PENDING admin verification
        this.notificationService.sendPushToUser(userId, {
          title: 'চাঁদা জমা গৃহীত হয়েছে ⏳',
          body: `আপনার ${monthNames} (${data.periodYear}) এর ৳${data.amount} চাঁদা জমার তথ্য পাওয়া গেছে। এটি অ্যাডমিনের যাচাই ও অনুমোদনের অপেক্ষায় রয়েছে।`,
          url: '/organization/member',
        })?.catch?.(() => { });
      })?.catch?.(() => { });

      return {
        ...createdPayments[0],
        count: createdPayments.length,
        payments: createdPayments,
      };
    });
  }

  // --------------------------------------------------------------------------
  // Update Member Monthly Contribution Amount (Effective from Next Month)
  // --------------------------------------------------------------------------
  public async updateMonthlyContributionAmount(
    userId: string,
    data: { newAmount: number; reason?: string },
  ) {
    if (data.newAmount < 50) {
      throw new BadRequestError('মাসিক অনুদান সর্বনিম্ন ৫০ টাকা হতে হবে');
    }

    const membership = await this.prisma.orgMembership.findUnique({
      where: { userId },
      include: { user: { select: { name: true } } },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenError('কেবলমাত্র সক্রিয় সদস্যগণ মাসিক অনুদানের পরিমাণ পরিবর্তন করতে পারবেন');
    }

    const currentAmount = membership.monthlyContribution;
    if (Math.round(currentAmount) === Math.round(data.newAmount)) {
      throw new BadRequestError('নতুন অনুদানের পরিমাণ বর্তমান পরিমাণের চেয়ে ভিন্ন হতে হবে');
    }

    // Effective from 1st of next month in Asia/Dhaka time
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const effectiveFrom = new Date(Date.UTC(nextYear, nextMonth - 1, 1, 0, 0, 0));

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark existing agreements as isCurrent: false
      await tx.contributionAgreement.updateMany({
        where: { userId },
        data: { isCurrent: false },
      });

      // 2. Create new agreement effective from next month
      const newAgreement = await tx.contributionAgreement.create({
        data: {
          userId,
          monthlyAmount: data.newAmount,
          effectiveFrom,
          isCurrent: true,
          reason: data.reason?.trim() || 'সদস্য কর্তৃক মাসিক অনুদানের পরিমাণ পরিবর্তন',
        },
      });

      // 3. Record change in ContributionChangeRequest for audit & history
      const changeRequest = await tx.contributionChangeRequest.create({
        data: {
          userId,
          previousAmount: currentAmount,
          newAmount: data.newAmount,
          reason: data.reason?.trim() || null,
          status: 'APPROVED',
          reviewedBy: userId,
          reviewedAt: now,
        },
      });

      // 4. Update membership monthlyContribution (for current live display & admin view)
      await tx.orgMembership.update({
        where: { userId },
        data: {
          monthlyContribution: data.newAmount,
        },
      });

      // 5. In-app confirmation notification for member
      const nextMonthName = MONTH_NAMES_BN[nextMonth - 1] || `${nextMonth} তম মাস`;
      await tx.notification.create({
        data: {
          recipientId: userId,
          type: 'SYSTEM_ANNOUNCEMENT',
          title: 'মাসিক অনুদানের পরিমাণ হালনাগাদ সম্পন্ন ✅',
          content: `আপনার মাসিক অনুদানের পরিমাণ সফলভাবে ৳${toBengaliNumber(currentAmount)} থেকে ৳${toBengaliNumber(data.newAmount)}-এ পরিবর্তন করা হয়েছে। এটি আগামী ${nextMonthName} (${toBengaliNumber(nextYear)}) থেকে কার্যকর হবে। পূর্ববর্তী কোনো মাসের হিসাব পরিবর্তিত হয়নি।`,
        },
      });

      return {
        previousAmount: currentAmount,
        newAmount: data.newAmount,
        effectiveFrom,
        effectivePeriod: `${nextMonthName} ${nextYear}`,
        agreement: newAgreement,
        changeRequest,
      };
    });
  }

  public async getContributionAgreementsHistory(userId: string) {
    const [agreements, changeRequests] = await Promise.all([
      this.prisma.contributionAgreement.findMany({
        where: { userId },
        orderBy: { effectiveFrom: 'desc' },
      }),
      this.prisma.contributionChangeRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      agreements,
      changeRequests,
    };
  }

  // --------------------------------------------------------------------------
  // Review Member Contribution Payment (Admin / Officer Approval)
  // --------------------------------------------------------------------------
  public async reviewContributionPayment(
    reviewerId: string,
    paymentId: string,
    status: 'VERIFIED' | 'REJECTED',
    notes?: string,
  ) {
    const role = await this.getOfficerRole(reviewerId);
    this.requireOfficer(role, ['PRESIDENT', 'TREASURER', 'MODERATOR', 'ADMIN']);

    const payment = await this.prisma.contributionPayment.findUnique({
      where: { id: paymentId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!payment) {
      throw new NotFoundError('পেমেন্ট রেকর্ড পাওয়া যায়নি');
    }

    if (payment.status !== 'PENDING') {
      throw new BadRequestError(`এই পেমেন্টটি ইতিমধ্যে ${payment.status === 'VERIFIED' ? 'অনুমোদিত' : 'বাতিলকৃত'}`);
    }

    // Find all sibling pending payments in the same batch (same userId + trxId, or within 60s window)
    let siblingPayments: (typeof payment)[] = [payment];
    if (payment.trxId && payment.trxId.trim()) {
      const found = await this.prisma.contributionPayment.findMany({
        where: {
          userId: payment.userId,
          trxId: payment.trxId.trim(),
          status: 'PENDING',
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      if (found.length > 0) siblingPayments = found;
    } else {
      // Group by 60-second creation window
      const windowStart = new Date(new Date(payment.createdAt).getTime() - 60000);
      const windowEnd = new Date(new Date(payment.createdAt).getTime() + 60000);
      const found = await this.prisma.contributionPayment.findMany({
        where: {
          userId: payment.userId,
          status: 'PENDING',
          paymentMethod: payment.paymentMethod,
          createdAt: { gte: windowStart, lte: windowEnd },
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      if (found.length > 0) siblingPayments = found;
    }

    const siblingIds = siblingPayments.map((p) => p.id);
    const totalAmount = siblingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Build combined period label for notifications
    const sortedSiblings = [...siblingPayments].sort((a, b) =>
      a.periodYear !== b.periodYear ? a.periodYear - b.periodYear : a.periodMonth - b.periodMonth,
    );
    const firstSibling = sortedSiblings[0]!;
    const lastSibling = sortedSiblings[sortedSiblings.length - 1]!;
    let batchPeriodLabel: string;
    if (sortedSiblings.length === 1) {
      const mn = MONTH_NAMES_BN[firstSibling.periodMonth - 1] || `${firstSibling.periodMonth} তম`;
      batchPeriodLabel = `${mn} ${firstSibling.periodYear}`;
    } else {
      const firstMn = MONTH_NAMES_BN[firstSibling.periodMonth - 1] || `${firstSibling.periodMonth} তম`;
      const lastMn = MONTH_NAMES_BN[lastSibling.periodMonth - 1] || `${lastSibling.periodMonth} তম`;
      if (firstSibling.periodYear === lastSibling.periodYear) {
        batchPeriodLabel = `${firstMn} - ${lastMn} ${firstSibling.periodYear} (${sortedSiblings.length} মাস)`;
      } else {
        batchPeriodLabel = `${firstMn} ${firstSibling.periodYear} - ${lastMn} ${lastSibling.periodYear} (${sortedSiblings.length} মাস)`;
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Update ALL sibling payments in one go
      await tx.contributionPayment.updateMany({
        where: { id: { in: siblingIds } },
        data: {
          status,
          verifiedBy: reviewerId,
          notes: notes ? (payment.notes ? `${payment.notes} | ${notes}` : notes) : payment.notes,
        },
      });

      // Return the first updated payment for API response
      const updatedPayment = await tx.contributionPayment.findUnique({ where: { id: paymentId } });

      if (status === 'VERIFIED') {
        // Update member's last payment date
        await tx.orgMembership.updateMany({
          where: { userId: payment.userId },
          data: { lastPaymentDate: new Date() },
        });

        // If member was waiting for initial payment verification, activate membership now!
        const existingMember = await tx.orgMembership.findUnique({
          where: { userId: payment.userId },
        });
        if (existingMember && (existingMember.status === 'APPROVED_PAYMENT_PENDING' || !existingMember.memberNumber)) {
          const now = new Date();
          const periodYear = payment.periodYear || now.getFullYear();
          const newMemberNumber =
            existingMember.memberNumber || `AMP-${periodYear}-${crypto.randomInt(1000, 9999)}`;
          await tx.orgMembership.update({
            where: { id: existingMember.id },
            data: {
              status: 'ACTIVE',
              memberNumber: newMemberNumber,
              joinedAt: existingMember.joinedAt || now,
              lastPaymentDate: now,
            },
          });
        }

        // Credit general fund with TOTAL amount of the batch
        let generalFund = await tx.orgFund.findUnique({ where: { code: 'GENERAL' } });
        if (!generalFund) {
          generalFund = await tx.orgFund.findFirst({
            where: {
              OR: [
                { code: { in: ['GENERAL', 'MAIN', 'DEFAULT'] } },
                { name: { contains: 'সাধারণ' } },
              ],
            },
          });
        }
        if (!generalFund) {
          generalFund = await tx.orgFund.findFirst({ orderBy: { createdAt: 'asc' } });
        }
        if (generalFund) {
          await tx.orgFund.update({
            where: { id: generalFund.id },
            data: { balance: { increment: totalAmount } },
          });

          // Single fund transaction for the entire batch
          const receiptSummary = sortedSiblings.map((p) => p.receiptNumber).join(', ');
          await tx.fundTransaction.create({
            data: {
              fundId: generalFund.id,
              type: 'CONTRIBUTION',
              amount: totalAmount,
              title: `মাসিক চাঁদা অনুমোদন (${batchPeriodLabel}) - ${payment.user?.name || 'সদস্য'}`,
              description: `রশিদ: ${receiptSummary}${payment.trxId ? `, TrxID: ${payment.trxId}` : ''}`,
              category: 'সদস্য চাঁদা',
              referenceId: payment.id,
              performedBy: reviewerId,
            },
          });
        }
      }

      // Single push notification for the entire batch
      if (status === 'VERIFIED') {
        this.notificationService.sendPushToUser(payment.userId, {
          title: 'মাসিক চাঁদা অনুমোদিত! ✅',
          body: `আপনার ${batchPeriodLabel} এর ৳${totalAmount} মাসিক চাঁদা সফলভাবে অনুমোদিত হয়েছে। ধন্যবাদ!`,
          url: '/organization/member',
          sound: '/sounds/notification.wav',
        })?.catch?.(() => { });
      } else {
        this.notificationService.sendPushToUser(payment.userId, {
          title: 'মাসিক চাঁদা আবেদন বাতিল ⚠️',
          body: `আপনার ${batchPeriodLabel} এর চাঁদা আবেদনটি বাতিল করা হয়েছে${notes ? `: ${notes}` : ''}।`,
          url: '/organization/member',
          sound: '/sounds/notification.wav',
        })?.catch?.(() => { });
      }

      return updatedPayment;
    });

    // Real-Time notification to admin and member
    realtimeService.publishToAdmins('ORG_PAYMENT_VERIFIED', { paymentId, status, batchPeriodLabel });
    realtimeService.publishToUser(payment.userId, 'ORG_PAYMENT_VERIFIED', { paymentId, status, batchPeriodLabel });

    return result;
  }

  // --------------------------------------------------------------------------
  // 5. Member Dashboard Data
  // --------------------------------------------------------------------------
  public async getMemberDashboard(userId: string) {
    const membership = await this.prisma.orgMembership.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, email: true, phone: true, image: true } },
      },
    });

    const isSysAdmin = await this.isSystemAdmin(userId);
    const role = await this.getOfficerRole(userId);
    const isOfficer = Boolean(
      role &&
        [
          'SUPER_ADMIN',
          'PRESIDENT',
          'VICE_PRESIDENT',
          'GENERAL_SECRETARY',
          'TREASURER',
          'MODERATOR',
          'ADMIN',
        ].includes(role),
    );
    if (!membership || (membership.status !== 'ACTIVE' && !isSysAdmin && !isOfficer)) {
      throw new ForbiddenError('কেবলমাত্র সক্রিয় সদস্যগণ মেম্বার ড্যাশবোর্ড দেখতে পারবেন');
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const [allVerifiedPayments, pendingPayments, recentPayments, notices, meetings, upcomingElections, agreements] = await Promise.all([
      this.prisma.contributionPayment.findMany({
        where: { userId, status: 'VERIFIED' },
      }),
      this.prisma.contributionPayment.findMany({
        where: { userId, status: 'PENDING' },
      }),
      this.prisma.contributionPayment.findMany({
        where: { userId },
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { paidAt: 'desc' }],
        take: 100,
      }),
      this.prisma.orgNotice.findMany({
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
        take: 5,
      }),
      this.prisma.orgMeeting.findMany({
        where: { date: { gte: now } },
        orderBy: { date: 'asc' },
        take: 3,
      }),
      this.prisma.election.findMany({
        where: {
          status: { in: ['NOMINATION_OPEN', 'CANDIDATES_PUBLISHED', 'VOTING_ACTIVE'] },
        },
        include: {
          positions: { include: { designation: true } },
        },
        take: 2,
      }),
      this.prisma.contributionAgreement.findMany({
        where: { userId },
        orderBy: { effectiveFrom: 'desc' },
      }),
    ]);

    // Helper: Resolve pledged contribution amount for a specific period (year, month)
    const getPledgedAmountForPeriod = (year: number, month: number): number => {
      const endOfPeriod = new Date(Date.UTC(year, month, 0, 23, 59, 59));
      const agr = agreements.find((a) => new Date(a.effectiveFrom) <= endOfPeriod);
      return agr ? agr.monthlyAmount : membership.monthlyContribution;
    };

    // Calculate total contributed by member (only verified amounts)
    const totalContributed = allVerifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Filter payments for current year
    const paymentsThisYear = allVerifiedPayments.filter((p) => p.periodYear === currentYear);
    const paidMonthSet = new Set(paymentsThisYear.map((p) => p.periodMonth));
    const paidMonthsThisYear = Array.from(paidMonthSet);

    const pendingThisYear = pendingPayments.filter((p) => p.periodYear === currentYear);

    // Membership effective date
    const joinedDate = membership.joinedAt ? new Date(membership.joinedAt) : new Date(membership.createdAt);
    const joinedYear = joinedDate.getFullYear();
    const joinedMonth = joinedDate.getMonth() + 1;

    // Build 12-month calendar for current year
    const calendar = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const verifiedPayment = paymentsThisYear.find((p) => p.periodMonth === month);
      const pendingPayment = pendingThisYear.find((p) => p.periodMonth === month);
      const isPaid = Boolean(verifiedPayment);
      const isPending = Boolean(pendingPayment);

      // Eligibility: Only months on or after November 2026 AND on/after joining month are eligible
      const isEligible = isMonthEligibleForContribution(currentYear, month, membership.joinedAt, membership.createdAt);

      let status: 'VERIFIED' | 'PENDING' | 'DUE' | 'NOT_APPLICABLE' = 'DUE';
      if (isPaid) {
        status = 'VERIFIED';
      } else if (isPending) {
        status = 'PENDING';
      } else if (!isEligible) {
        status = 'NOT_APPLICABLE';
      } else {
        status = 'DUE';
      }

      const pledgedAmount = getPledgedAmountForPeriod(currentYear, month);
      const amount = verifiedPayment?.amount || pendingPayment?.amount || (isEligible ? pledgedAmount : 0);

      return {
        month,
        year: currentYear,
        isPaid,
        isPending,
        isEligible,
        status,
        amount,
        paidAt: (verifiedPayment || pendingPayment)?.paidAt ? (verifiedPayment || pendingPayment)!.paidAt.toISOString() : undefined,
      };
    });

    // Calculate pending dues up to the current month across eligible periods (ONLY verified payments count as cleared)
    // Strictly starting from November 2026 onwards (zero prior dues)
    const dueBreakdown: Array<{
      year: number;
      month: number;
      monthName: string;
      amount: number;
      status: 'DUE' | 'PENDING';
    }> = [];

    let pendingDueCount = 0;
    const evalStartYear = Math.max(ORG_OFFICIAL_START_YEAR, joinedYear);
    for (let y = evalStartYear; y <= currentYear; y++) {
      const startM = y === ORG_OFFICIAL_START_YEAR
        ? Math.max(ORG_OFFICIAL_START_MONTH, joinedMonth)
        : (y === joinedYear ? joinedMonth : 1);
      const endM = y === currentYear ? currentMonth : 12;
      for (let m = startM; m <= endM; m++) {
        if (!isMonthEligibleForContribution(y, m, membership.joinedAt, membership.createdAt)) continue;

        const isVerified = allVerifiedPayments.some((p) => p.periodYear === y && p.periodMonth === m);
        if (!isVerified) {
          pendingDueCount++;
          const pendingPay = pendingPayments.find((p) => p.periodYear === y && p.periodMonth === m);
          const monthAmount = getPledgedAmountForPeriod(y, m);
          dueBreakdown.push({
            year: y,
            month: m,
            monthName: MONTH_NAMES_BN[m - 1] || `${m} তম মাস`,
            amount: monthAmount,
            status: pendingPay ? 'PENDING' : 'DUE',
          });
        }
      }
    }

    const totalDueAmount = dueBreakdown.reduce((sum, d) => sum + d.amount, 0);

    const currentAgreement = agreements.find((a) => a.isCurrent) || agreements[0];
    const nextAgreement = agreements.find(
      (a) => new Date(a.effectiveFrom) > now && a.monthlyAmount !== (currentAgreement?.monthlyAmount ?? membership.monthlyContribution)
    );

    const agreement = {
      id: currentAgreement ? currentAgreement.id : `agr-${membership.id}`,
      userId,
      agreedAmount: currentAgreement ? currentAgreement.monthlyAmount : membership.monthlyContribution,
      effectiveFrom: currentAgreement ? currentAgreement.effectiveFrom.toISOString() : (membership.joinedAt ? membership.joinedAt.toISOString() : now.toISOString()),
      isCurrent: true,
      nextEffectiveAmount: nextAgreement ? nextAgreement.monthlyAmount : null,
      nextEffectiveDate: nextAgreement ? nextAgreement.effectiveFrom.toISOString() : null,
    };

    return {
      membership,
      agreement,
      agreementsHistory: agreements,
      totalContributed,
      pendingDueCount,
      totalDueAmount,
      dueBreakdown,
      pendingReviewCount: pendingThisYear.length,
      calendar,
      currentYear,
      paidMonthsThisYear,
      payments: recentPayments,
      notices,
      upcomingMeetings: meetings,
      latestNotices: notices,
      activeElectionsCount: upcomingElections.length,
      upcomingElections,
    };
  }

  // --------------------------------------------------------------------------
  // 6. Organization Admin Dashboard & Stats
  // --------------------------------------------------------------------------
  public async getAdminStats(userId: string) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'TREASURER', 'MODERATOR', 'ADMIN']);

    const [
      totalMembers,
      activeMembers,
      pendingApps,
      approvedPaymentPending,
      _totalFunds,
      recentTransactions,
      recentPayments,
      fundsList,
      contributionsAgg,
      incomeAgg,
      campaignDonationsAgg,
      expenseAgg,
      campaignExpenseAgg,
      activeElectionsCount,
      totalUsersCount,
    ] = await Promise.all([
      this.prisma.orgMembership.count(),
      this.prisma.orgMembership.count({ where: { status: 'ACTIVE' } }),
      this.prisma.orgApplication.count({ where: { status: 'PENDING' } }),
      this.prisma.orgMembership.count({ where: { status: 'APPROVED_PAYMENT_PENDING' } }),
      this.prisma.orgFund.aggregate({ _sum: { balance: true } }),
      this.prisma.fundTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          fund: { select: { id: true, name: true, code: true } },
          items: { orderBy: { createdAt: 'asc' } },
          project: true,
        },
      }),
      this.prisma.contributionPayment.findMany({
        orderBy: { paidAt: 'desc' },
        take: 50,
        include: { user: { select: { id: true, name: true, email: true, image: true, phone: true } } },
      }),
      this.prisma.orgFund.findMany({ orderBy: { balance: 'desc' } }),
      this.prisma.contributionPayment.aggregate({
        where: { status: 'VERIFIED' },
        _sum: { amount: true },
      }),
      this.prisma.fundTransaction.aggregate({
        where: { type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.campaignDonation.aggregate({
        where: { status: 'VERIFIED' },
        _sum: { amount: true },
      }),
      this.prisma.fundTransaction.aggregate({
        where: { type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      this.prisma.campaignExpense.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.election.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.user.count(),
    ]);

    const totalContributions = contributionsAgg._sum.amount ? Number(contributionsAgg._sum.amount) : 0;
    const totalGeneralIncome = incomeAgg._sum.amount ? Number(incomeAgg._sum.amount) : 0;
    const totalCampaignDonations = campaignDonationsAgg._sum.amount ? Number(campaignDonationsAgg._sum.amount) : 0;
    const totalIncome = totalContributions + totalGeneralIncome + totalCampaignDonations;

    const totalFundExpenses = expenseAgg._sum.amount ? Number(expenseAgg._sum.amount) : 0;
    const totalCampaignExpenses = campaignExpenseAgg._sum.amount ? Number(campaignExpenseAgg._sum.amount) : 0;
    const totalExpense = totalFundExpenses + totalCampaignExpenses;
    const netBalance = totalIncome - totalExpense;

    const financialTrends = await this.calculateFinancialTrends();

    return {
      memberCounts: {
        total: totalMembers,
        active: activeMembers,
        pendingPayment: approvedPaymentPending,
        pendingApplications: pendingApps,
      },
      funds: {
        totalBalance: netBalance,
        fundList: fundsList.map((f: any) => ({
          id: f.id,
          name: f.name,
          code: f.code,
          currentBalance: Number(f.balance),
          isDefault: f.code === 'GENERAL',
        })),
      },
      financialSummary: {
        totalIncome,
        totalExpense,
        netBalance,
        totalContributions,
        totalCampaignDonations,
        totalFundExpenses,
        totalCampaignExpenses,
      },
      financialTrends,
      elections: {
        activeElections: activeElectionsCount,
      },
      userCounts: {
        total: totalUsersCount,
      },
      stats: {
        totalMembers,
        activeMembers,
        pendingApplications: pendingApps,
        approvedPaymentPending,
        totalBalance: netBalance,
      },
      recentTransactions,
      recentPayments,
    };
  }

  public async calculateFinancialTrends(userId?: string) {
    if (userId) {
      const role = await this.getOfficerRole(userId);
      this.requireOfficer(role, ['PRESIDENT', 'TREASURER', 'MODERATOR', 'ADMIN']);
    }
    const [allTransactions, funds] = await Promise.all([
      this.prisma.fundTransaction.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          type: true,
          amount: true,
          createdAt: true,
        },
      }),
      this.prisma.orgFund.findMany({
        orderBy: { balance: 'desc' },
      }),
    ]);

    const now = new Date();
    const bengaliWeekdays = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
    const bengaliMonths = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
    ];
    const bengaliShortMonths = [
      'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে',
    ];
    const toBengaliDigits = (num: number | string): string => {
      const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return String(num).replace(/[0-9]/g, (d) => bnDigits[+d] || d);
    };

    // 1. Weekly: 7 days ending with today ('আজ')
    const weeklyPoints = [];
    let weeklyTotalIncome = 0;
    let weeklyTotalExpense = 0;

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59, 999);

      const dayTxs = allTransactions.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        return txDate >= dayStart && txDate <= dayEnd;
      });

      let income = 0;
      let expense = 0;
      for (const tx of dayTxs) {
        if (tx.type === 'INCOME' || tx.type === 'CONTRIBUTION') {
          income += Number(tx.amount);
        } else if (tx.type === 'EXPENSE') {
          expense += Number(tx.amount);
        }
      }

      weeklyTotalIncome += income;
      weeklyTotalExpense += expense;

      const isToday = i === 0;
      const label = isToday ? 'আজ' : bengaliWeekdays[dayStart.getDay()];
      const fullDate = `${toBengaliDigits(dayStart.getDate())} ${bengaliMonths[dayStart.getMonth()]}${isToday ? ' (আজ)' : ''}`;

      weeklyPoints.push({
        label,
        fullDate,
        dateStr: dayStart.toISOString().split('T')[0],
        income,
        expense,
        net: income - expense,
        isToday,
      });
    }

    // 2. Monthly: 4 weekly segments of current month
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthlySlices = [
      { label: '১ম সপ্তাহ', startDay: 1, endDay: 7 },
      { label: '২য় সপ্তাহ', startDay: 8, endDay: 14 },
      { label: '৩য় সপ্তাহ', startDay: 15, endDay: 21 },
      { label: '৪র্থ সপ্তাহ', startDay: 22, endDay: daysInMonth },
    ];

    const monthlyPoints = [];
    let monthlyTotalIncome = 0;
    let monthlyTotalExpense = 0;

    for (const slice of monthlySlices) {
      const sliceStart = new Date(year, month, slice.startDay, 0, 0, 0, 0);
      const sliceEnd = new Date(year, month, slice.endDay, 23, 59, 59, 999);

      const sliceTxs = allTransactions.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        return txDate >= sliceStart && txDate <= sliceEnd;
      });

      let income = 0;
      let expense = 0;
      for (const tx of sliceTxs) {
        if (tx.type === 'INCOME' || tx.type === 'CONTRIBUTION') {
          income += Number(tx.amount);
        } else if (tx.type === 'EXPENSE') {
          expense += Number(tx.amount);
        }
      }

      monthlyTotalIncome += income;
      monthlyTotalExpense += expense;

      monthlyPoints.push({
        label: slice.label,
        fullDate: `${toBengaliDigits(slice.startDay)}-${toBengaliDigits(slice.endDay)} ${bengaliMonths[month]}`,
        income,
        expense,
        net: income - expense,
        isCurrent: now.getDate() >= slice.startDay && now.getDate() <= slice.endDay,
      });
    }

    // 3. Yearly: 12 months of current year
    const yearlyPoints = [];
    let yearlyTotalIncome = 0;
    let yearlyTotalExpense = 0;

    for (let m = 0; m < 12; m++) {
      const mStart = new Date(year, m, 1, 0, 0, 0, 0);
      const mEnd = new Date(year, m + 1, 0, 23, 59, 59, 999);

      const mTxs = allTransactions.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        return txDate >= mStart && txDate <= mEnd;
      });

      let income = 0;
      let expense = 0;
      for (const tx of mTxs) {
        if (tx.type === 'INCOME' || tx.type === 'CONTRIBUTION') {
          income += Number(tx.amount);
        } else if (tx.type === 'EXPENSE') {
          expense += Number(tx.amount);
        }
      }

      yearlyTotalIncome += income;
      yearlyTotalExpense += expense;

      yearlyPoints.push({
        label: bengaliShortMonths[m],
        fullDate: `${bengaliMonths[m]} ${toBengaliDigits(year)}`,
        income,
        expense,
        net: income - expense,
        isCurrent: m === now.getMonth(),
      });
    }

    // 4. Welfare Fund Allocation Ratio
    const totalBalance = funds.reduce((sum, f) => sum + Math.max(0, Number(f.balance)), 0);

    const shortNameMap: Record<string, string> = {
      MEDICAL: 'চিকিৎসা',
      EDUCATION: 'শিক্ষা',
      EMERGENCY: 'ত্রাণ',
      GENERAL: 'সাধারণ',
    };

    const colorPalette = ['#10B981', '#06B6D4', '#F59E0B', '#8B5CF6', '#EC4899', '#3B82F6'];

    const fundAllocations = funds.map((f, idx) => {
      const bal = Math.max(0, Number(f.balance));
      const percentage = totalBalance > 0 ? Number(((bal / totalBalance) * 100).toFixed(1)) : 0;
      return {
        id: f.id,
        name: f.name,
        code: f.code,
        shortName: shortNameMap[f.code] || f.name.split(' ')[0] || f.code,
        balance: bal,
        percentage,
        color: colorPalette[idx % colorPalette.length],
      };
    });

    return {
      weekly: {
        subtitle: '৭ দিনের জমা বনাম খরচ লেনদেন চিত্র',
        points: weeklyPoints,
        totalIncome: weeklyTotalIncome,
        totalExpense: weeklyTotalExpense,
        netSurplus: weeklyTotalIncome - weeklyTotalExpense,
      },
      monthly: {
        subtitle: 'মাসভিত্তিক জমা বনাম খরচ লেনদেন চিত্র',
        points: monthlyPoints,
        totalIncome: monthlyTotalIncome,
        totalExpense: monthlyTotalExpense,
        netSurplus: monthlyTotalIncome - monthlyTotalExpense,
      },
      yearly: {
        subtitle: '১২ মাসের আয়-ব্যয় লেনদেন ট্রেন্ড',
        points: yearlyPoints,
        totalIncome: yearlyTotalIncome,
        totalExpense: yearlyTotalExpense,
        netSurplus: yearlyTotalIncome - yearlyTotalExpense,
      },
      fundAllocation: {
        fundCount: funds.length,
        isAudited: true,
        totalBalance,
        funds: fundAllocations,
      },
    };
  }

  public async getApplications(userId: string, status?: string) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    return this.prisma.orgApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, image: true } },
      },
    });
  }

  // --------------------------------------------------------------------------
  // 7. Multi-Fund Ledger & Transactions
  // --------------------------------------------------------------------------
  public async getFunds() {
    return this.prisma.orgFund.findMany({
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { balance: 'desc' },
    });
  }

  public async createFund(
    userId: string,
    data: { name: string; code: string; description?: string; openingBalance?: number },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'TREASURER', 'ADMIN']);

    return this.prisma.orgFund.create({
      data: {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description?.trim(),
        balance: data.openingBalance || 0,
      },
    });
  }

  public async recordTransaction(
    userId: string,
    data: {
      fundId: string;
      type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'CONTRIBUTION';
      amount: number;
      title: string;
      description?: string;
      category?: string;
      receiptUrl?: string;
      toFundId?: string;
      projectId?: string;
      campaignId?: string;
      items?: Array<{
        itemName: string;
        amount: number;
        category?: string;
        description?: string;
        expenseDate?: string;
        responsiblePerson?: string;
        receiptUrl?: string;
      }>;
    },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'TREASURER', 'ADMIN']);

    const fund = await this.prisma.orgFund.findUnique({ where: { id: data.fundId } });
    if (!fund) throw new NotFoundError('তহবিল পাওয়া যায়নি');

    if (data.type === 'TRANSFER' && fund.balance < data.amount) {
      throw new BadRequestError('তহবিলে পর্যাপ্ত ব্যালেন্স নেই');
    }

    return this.prisma.$transaction(async (tx) => {
      let balanceChange = 0;
      if (data.type === 'INCOME' || data.type === 'CONTRIBUTION') {
        balanceChange = data.amount;
      } else if (data.type === 'EXPENSE') {
        balanceChange = -data.amount;
      } else if (data.type === 'TRANSFER') {
        if (!data.toFundId) throw new BadRequestError('স্থানান্তরের জন্য গন্তব্য তহবিল উল্লেখ করুন');
        const destFund = await tx.orgFund.findUnique({ where: { id: data.toFundId } });
        if (!destFund) throw new NotFoundError('গন্তব্য তহবিল পাওয়া যায়নি');
        if (fund.balance < data.amount) throw new BadRequestError('তহবিলে পর্যাপ্ত ব্যালেন্স নেই');

        // Source fund deduct
        await tx.orgFund.update({
          where: { id: data.fundId },
          data: { balance: { decrement: data.amount } },
        });

        // Destination fund increment
        await tx.orgFund.update({
          where: { id: data.toFundId },
          data: { balance: { increment: data.amount } },
        });

        // Log transaction for dest
        await tx.fundTransaction.create({
          data: {
            fundId: data.toFundId,
            type: 'TRANSFER',
            amount: data.amount,
            title: `তহবিল স্থানান্তর প্রাপ্তি: ${data.title}`,
            description: `${fund.name} হতে স্থানান্তর করা হয়েছে।`,
            performedBy: userId,
          },
        });

        balanceChange = 0; // handled above
      }

      if (balanceChange !== 0) {
        await tx.orgFund.update({
          where: { id: data.fundId },
          data: { balance: { increment: balanceChange } },
        });
      }

      const trx = await tx.fundTransaction.create({
        data: {
          fundId: data.fundId,
          type: data.type,
          amount: data.amount,
          title: data.title.trim(),
          description: data.description?.trim(),
          category: data.category?.trim(),
          receiptUrl: data.receiptUrl,
          performedBy: userId,
          projectId: data.projectId || null,
          campaignId: data.campaignId || null,
        },
      });

      if (data.items && data.items.length > 0) {
        await tx.expenseItem.createMany({
          data: data.items.map((it) => ({
            transactionId: trx.id,
            projectId: data.projectId || null,
            itemName: it.itemName.trim(),
            amount: it.amount,
            category: it.category?.trim() || data.category?.trim() || null,
            description: it.description?.trim() || null,
            expenseDate: it.expenseDate ? new Date(it.expenseDate) : new Date(),
            responsiblePerson: it.responsiblePerson?.trim() || null,
            receiptUrl: it.receiptUrl || data.receiptUrl || null,
          })),
        });
      }

      if (data.projectId && data.type === 'EXPENSE') {
        await tx.orgProject.update({
          where: { id: data.projectId },
          data: { spent: { increment: data.amount } },
        });
      }

      if (typeof tx.fundTransaction?.findUnique === 'function') {
        const fullTrx = await tx.fundTransaction.findUnique({
          where: { id: trx.id },
          include: {
            items: true,
            fund: { select: { id: true, name: true, code: true } },
            project: { select: { id: true, title: true } },
            campaign: { select: { id: true, title: true } },
          },
        });
        if (fullTrx) return fullTrx;
      }

      return trx;
    });
  }

  public async updateTransaction(
    userId: string,
    id: string,
    data: {
      fundId?: string;
      amount?: number;
      title?: string;
      description?: string;
      category?: string;
      receiptUrl?: string | null;
      beneficiaryName?: string | null;
      assistanceType?: string | null;
      childName?: string | null;
      fatherName?: string | null;
      birthPlace?: string | null;
      treesPlanted?: string | null;
      plantationDate?: string | null;
      items?: Array<{
        itemName: string;
        amount: number;
        category?: string;
        description?: string;
        expenseDate?: string;
        responsiblePerson?: string;
        receiptUrl?: string;
      }>;
    },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'TREASURER', 'ADMIN']);

    return this.prisma.$transaction(async (tx) => {
      const existingTrx = await tx.fundTransaction.findUnique({
        where: { id },
        include: { items: true, project: true },
      });
      if (!existingTrx) throw new NotFoundError('লেনদেন পাওয়া যায়নি');

      const oldAmount = existingTrx.amount;
      const itemsTotal = (data.items && data.items.length > 0)
        ? data.items.reduce((s, it) => s + it.amount, 0)
        : 0;
      const newAmount = itemsTotal > 0
        ? itemsTotal
        : (typeof data.amount === 'number' && data.amount > 0 ? data.amount : oldAmount);

      const oldFundId = existingTrx.fundId;
      const targetFundId = data.fundId || oldFundId;

      if (data.fundId && data.fundId !== oldFundId) {
        const destFund = await tx.orgFund.findUnique({ where: { id: data.fundId } });
        if (!destFund) throw new NotFoundError('নতুন তহবিল পাওয়া যায়নি');
      }

      // 1. Balance adjustments on OrgFund
      if (existingTrx.type === 'EXPENSE') {
        if (oldFundId === targetFundId) {
          const diff = oldAmount - newAmount;
          if (diff !== 0) {
            await tx.orgFund.update({
              where: { id: targetFundId },
              data: { balance: { increment: diff } },
            });
          }
        } else {
          await tx.orgFund.update({
            where: { id: oldFundId },
            data: { balance: { increment: oldAmount } },
          });
          await tx.orgFund.update({
            where: { id: targetFundId },
            data: { balance: { decrement: newAmount } },
          });
        }
      } else if (existingTrx.type === 'INCOME' || existingTrx.type === 'CONTRIBUTION') {
        if (oldFundId === targetFundId) {
          const diff = newAmount - oldAmount;
          if (diff !== 0) {
            await tx.orgFund.update({
              where: { id: targetFundId },
              data: { balance: { increment: diff } },
            });
          }
        } else {
          await tx.orgFund.update({
            where: { id: oldFundId },
            data: { balance: { decrement: oldAmount } },
          });
          await tx.orgFund.update({
            where: { id: targetFundId },
            data: { balance: { increment: newAmount } },
          });
        }
      }

      // 2. Adjust linked OrgProject if this transaction was tied to a project (e.g. Humanitarian / Tree Plantation)
      if (existingTrx.projectId && existingTrx.type === 'EXPENSE') {
        const spentDiff = newAmount - oldAmount;
        const projectUpdateData: any = {};
        if (spentDiff !== 0) {
          projectUpdateData.spent = { increment: spentDiff };
        }
        if (data.title && data.title.trim()) {
          projectUpdateData.title = data.title.trim();
        }
        if (data.description !== undefined) {
          projectUpdateData.description = data.description ? data.description.trim() : '';
        }
        if (data.receiptUrl !== undefined) {
          projectUpdateData.images = data.receiptUrl ? [data.receiptUrl] : [];
        }
        if (targetFundId !== oldFundId) {
          projectUpdateData.fundId = targetFundId;
        }
        if (data.beneficiaryName !== undefined) {
          projectUpdateData.beneficiaryName = data.beneficiaryName ? data.beneficiaryName.trim() : null;
        }
        if (data.assistanceType !== undefined) {
          projectUpdateData.assistanceType = data.assistanceType ? data.assistanceType.trim() : null;
        }
        if (data.childName !== undefined) {
          projectUpdateData.childName = data.childName ? data.childName.trim() : null;
        }
        if (data.fatherName !== undefined) {
          projectUpdateData.fatherName = data.fatherName ? data.fatherName.trim() : null;
        }
        if (data.birthPlace !== undefined) {
          projectUpdateData.birthPlace = data.birthPlace ? data.birthPlace.trim() : null;
          projectUpdateData.plantationLocation = data.birthPlace ? data.birthPlace.trim() : null;
        }
        if (data.treesPlanted !== undefined) {
          projectUpdateData.treesPlanted = data.treesPlanted ? data.treesPlanted.trim() : null;
        }
        if (data.plantationDate !== undefined) {
          projectUpdateData.plantationDate = data.plantationDate ? new Date(data.plantationDate) : null;
        }
        if (Object.keys(projectUpdateData).length > 0) {
          await tx.orgProject.update({
            where: { id: existingTrx.projectId },
            data: projectUpdateData,
          });
        }
      }

      // 3. Update Itemized Breakdown
      if (data.items !== undefined) {
        await tx.expenseItem.deleteMany({
          where: { transactionId: id },
        });

        if (data.items && data.items.length > 0) {
          await tx.expenseItem.createMany({
            data: data.items.map((it) => ({
              transactionId: id,
              projectId: existingTrx.projectId || null,
              itemName: it.itemName.trim(),
              amount: it.amount,
              category: it.category?.trim() || data.category?.trim() || existingTrx.category || null,
              description: it.description?.trim() || null,
              expenseDate: it.expenseDate ? new Date(it.expenseDate) : new Date(),
              responsiblePerson: it.responsiblePerson?.trim() || null,
              receiptUrl: it.receiptUrl || data.receiptUrl || existingTrx.receiptUrl || null,
            })),
          });
        }
      }

      // 4. Update the FundTransaction record
      const updatedTrx = await tx.fundTransaction.update({
        where: { id },
        data: {
          fundId: targetFundId,
          amount: newAmount,
          title: data.title !== undefined ? data.title.trim() : existingTrx.title,
          description: data.description !== undefined ? data.description?.trim() : existingTrx.description,
          category: data.category !== undefined ? data.category?.trim() : existingTrx.category,
          receiptUrl: data.receiptUrl !== undefined ? data.receiptUrl : existingTrx.receiptUrl,
        },
        include: {
          items: { orderBy: { createdAt: 'asc' } },
          fund: { select: { id: true, name: true, code: true } },
          project: { select: { id: true, title: true } },
          campaign: { select: { id: true, title: true } },
        },
      });

      return updatedTrx;
    });
  }

  // --------------------------------------------------------------------------
  // 8. Committees & Designations
  // --------------------------------------------------------------------------
  public async getCommittees() {
    return this.prisma.orgCommittee.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, image: true, email: true, phone: true } },
            designation: true,
          },
          orderBy: { designation: { rank: 'asc' } },
        },
      },
    });
  }

  public async getDesignations() {
    return this.prisma.orgDesignation.findMany({
      orderBy: { rank: 'asc' },
    });
  }

  public async createCommittee(
    userId: string,
    data: { name: string; description?: string; startDate: string; endDate?: string },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    return this.prisma.orgCommittee.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim(),
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }

  public async assignCommitteeMember(
    userId: string,
    data: { committeeId: string; userId: string; designationId: string; customTitle?: string },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    return this.prisma.orgCommitteeMember.create({
      data: {
        committeeId: data.committeeId,
        userId: data.userId,
        designationId: data.designationId,
        customTitle: data.customTitle?.trim(),
      },
      include: { designation: true },
    });
  }

  // --------------------------------------------------------------------------
  // 9. Meetings, Notices, Projects, Documents
  // --------------------------------------------------------------------------
  public async getMeetings() {
    return this.prisma.orgMeeting.findMany({
      orderBy: { date: 'desc' },
      include: {
        _count: { select: { attendances: true } },
      },
    });
  }

  public async createMeeting(
    userId: string,
    data: { title: string; description?: string; date: string; location: string; agenda?: string },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN', 'MODERATOR']);

    return this.prisma.orgMeeting.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim(),
        date: new Date(data.date),
        location: data.location.trim(),
        agenda: data.agenda?.trim(),
      },
    });
  }

  public async getNotices(isPublicOnly = false) {
    return this.prisma.orgNotice.findMany({
      where: isPublicOnly ? { isPublic: true } : undefined,
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    });
  }

  public async createNotice(
    userId: string,
    data: { title: string; content: string; priority: 'URGENT' | 'NORMAL' | 'LOW'; isPinned: boolean; isPublic: boolean; expiresAt?: string },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN', 'MODERATOR']);

    return this.prisma.orgNotice.create({
      data: {
        title: data.title.trim(),
        content: data.content.trim(),
        priority: data.priority,
        isPinned: data.isPinned,
        isPublic: data.isPublic,
        publishedBy: userId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
  }

  public async updateNotice(
    userId: string,
    noticeId: string,
    data: {
      title?: string;
      content?: string;
      priority?: 'URGENT' | 'NORMAL' | 'LOW';
      isPinned?: boolean;
      isPublic?: boolean;
      expiresAt?: string | null;
    },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN', 'MODERATOR']);

    const notice = await this.prisma.orgNotice.findUnique({
      where: { id: noticeId },
    });
    if (!notice) {
      throw new NotFoundError('বিজ্ঞপ্তি পাওয়া যায়নি');
    }

    return this.prisma.orgNotice.update({
      where: { id: noticeId },
      data: {
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        ...(data.content !== undefined ? { content: data.content.trim() } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.isPinned !== undefined ? { isPinned: data.isPinned } : {}),
        ...(data.isPublic !== undefined ? { isPublic: data.isPublic } : {}),
        ...(data.expiresAt !== undefined
          ? { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }
          : {}),
      },
    });
  }

  public async deleteNotice(userId: string, noticeId: string) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN', 'MODERATOR']);

    const notice = await this.prisma.orgNotice.findUnique({
      where: { id: noticeId },
    });
    if (!notice) {
      throw new NotFoundError('বিজ্ঞপ্তি পাওয়া যায়নি');
    }

    return this.prisma.orgNotice.delete({
      where: { id: noticeId },
    });
  }

  public async getProjects(category?: string) {
    return this.prisma.orgProject.findMany({
      where: category ? { category } : undefined,
      include: {
        fund: { select: { id: true, name: true, code: true } },
        items: { orderBy: { createdAt: 'asc' } },
        transactions: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async createProject(
    userId: string,
    data: {
      title: string;
      description: string;
      budget?: number;
      spent?: number;
      progress?: number;
      status?: string;
      isPublic?: boolean;
      images?: string[];
      category?: string;
      beneficiaryName?: string;
      beneficiaryPhone?: string;
      beneficiaryAddress?: string;
      assistanceType?: string;
      consentGiven?: boolean;
      childName?: string;
      fatherName?: string;
      motherName?: string;
      birthDate?: string;
      birthPlace?: string;
      treesPlanted?: string;
      plantationLocation?: string;
      plantationDate?: string;
      fundId?: string;
      items?: Array<{
        itemName: string;
        amount: number;
        category?: string;
        description?: string;
        expenseDate?: string;
        responsiblePerson?: string;
        receiptUrl?: string;
      }>;
    },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN', 'TREASURER']);

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.orgProject.create({
        data: {
          title: data.title.trim(),
          description: data.description.trim(),
          budget: data.budget || 0,
          spent: data.spent || 0,
          progress: data.progress || 0,
          status: data.status || 'ACTIVE',
          isPublic: data.isPublic !== undefined ? data.isPublic : true,
          images: data.images || [],
          category: data.category || 'GENERAL',
          beneficiaryName: data.beneficiaryName?.trim() || null,
          beneficiaryPhone: data.beneficiaryPhone?.trim() || null,
          beneficiaryAddress: data.beneficiaryAddress?.trim() || null,
          assistanceType: data.assistanceType?.trim() || null,
          consentGiven: data.consentGiven !== undefined ? data.consentGiven : true,
          childName: data.childName?.trim() || null,
          fatherName: data.fatherName?.trim() || null,
          motherName: data.motherName?.trim() || null,
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          birthPlace: data.birthPlace?.trim() || null,
          treesPlanted: data.treesPlanted?.trim() || null,
          plantationLocation: data.plantationLocation?.trim() || null,
          plantationDate: data.plantationDate ? new Date(data.plantationDate) : null,
          fundId: data.fundId || null,
        },
      });

      const itemsTotal = (data.items && data.items.length > 0)
        ? data.items.reduce((sum, it) => sum + it.amount, 0)
        : 0;
      const finalSpent = itemsTotal > 0 ? itemsTotal : (data.spent || data.budget || 0);

      if (data.items && data.items.length > 0) {
        await tx.expenseItem.createMany({
          data: data.items.map((it) => ({
            projectId: project.id,
            itemName: it.itemName.trim(),
            amount: it.amount,
            category: it.category?.trim() || null,
            description: it.description?.trim() || null,
            expenseDate: it.expenseDate ? new Date(it.expenseDate) : new Date(),
            responsiblePerson: it.responsiblePerson?.trim() || null,
            receiptUrl: it.receiptUrl || null,
          })),
        });

        if (project.spent === 0 && itemsTotal > 0) {
          await tx.orgProject.update({
            where: { id: project.id },
            data: { spent: itemsTotal },
          });
        }
      }

      // Automatically record fund expense transaction & decrement fund balance
      if (finalSpent > 0) {
        let fund = null;
        if (data.fundId) {
          fund = await tx.orgFund.findUnique({ where: { id: data.fundId } });
        }
        if (!fund) {
          fund =
            (await tx.orgFund.findFirst({ where: { code: 'GENERAL' } })) ||
            (await tx.orgFund.findFirst());
        }

        if (fund) {
          // 1. Decrement fund balance
          await tx.orgFund.update({
            where: { id: fund.id },
            data: { balance: { decrement: finalSpent } },
          });

          // 2. Create fund expense transaction linked to this project
          const trx = await tx.fundTransaction.create({
            data: {
              fundId: fund.id,
              type: 'EXPENSE',
              amount: finalSpent,
              title: data.title.trim(),
              description: data.description?.trim() || null,
              category:
                data.category === 'TREE_PLANTATION'
                  ? 'বৃক্ষরোপণ'
                  : data.category === 'HUMANITARIAN'
                  ? 'মানবিক সহায়তা'
                  : 'সাধারণ ব্যয়',
              receiptUrl: (data.images && data.images[0]) || null,
              performedBy: userId,
              projectId: project.id,
            },
          });

          // 3. Link created expense items to this transaction
          if (data.items && data.items.length > 0) {
            await tx.expenseItem.updateMany({
              where: { projectId: project.id },
              data: { transactionId: trx.id },
            });
          }
        }
      }

      return tx.orgProject.findUnique({
        where: { id: project.id },
        include: {
          items: true,
          fund: { select: { id: true, name: true, code: true } },
        },
      });
    });
  }

  // --------------------------------------------------------------------------
  // Financial Transparency & Member Accounts Ledger
  // --------------------------------------------------------------------------
  public async getTransparencyOverview(_userId?: string) {
    // Production Launch: strictly authentic database records only (no sample auto-generation)

    const [
      funds,
      verifiedContributions,
      fundTransactions,
      campaigns,
      campaignExpenses,
      verifiedDonations,
      projects,
    ] = await Promise.all([
      this.prisma.orgFund.findMany({
        include: {
          transactions: {
            include: {
              items: { orderBy: { createdAt: 'asc' } },
              project: { select: { id: true, title: true, category: true } },
              campaign: { select: { id: true, title: true, slug: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { code: 'asc' },
      }),
      this.prisma.contributionPayment.findMany({
        where: { status: 'VERIFIED' },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { paidAt: 'desc' }],
      }),
      this.prisma.fundTransaction.findMany({
        include: {
          fund: { select: { id: true, name: true, code: true } },
          project: { select: { id: true, title: true, category: true } },
          campaign: { select: { id: true, title: true, slug: true } },
          items: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.campaign.findMany({
        include: {
          expenses: {
            include: { items: { orderBy: { createdAt: 'asc' } } },
            orderBy: { expenseDate: 'desc' },
          },
          donations: {
            where: { status: 'VERIFIED' },
            select: { id: true, amount: true, paymentMethod: true, receiptNumber: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.campaignExpense.findMany({
        include: {
          campaign: { select: { id: true, title: true, slug: true } },
          items: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { expenseDate: 'desc' },
      }),
      this.prisma.campaignDonation.findMany({
        where: { status: 'VERIFIED' },
        include: {
          campaign: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.orgProject.findMany({
        include: {
          fund: { select: { id: true, name: true, code: true } },
          items: { orderBy: { createdAt: 'asc' } },
          transactions: {
            include: { items: true },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Financial calculations
    const totalContributions = verifiedContributions.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalCampaignDonations = verifiedDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const nonContributionFundIncome = fundTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalIncome = totalContributions + nonContributionFundIncome + totalCampaignDonations;

    const totalFundExpenses = fundTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalCampaignExpenses = campaignExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const totalExpense = totalFundExpenses + totalCampaignExpenses;
    const netBalance = totalIncome - totalExpense;

    // Filter project categories
    const humanitarianActivities = projects.filter((p) => p.category === 'HUMANITARIAN');
    const treePlantations = projects.filter((p) => p.category === 'TREE_PLANTATION');
    const completedCampaignsCount = campaigns.filter((c) => c.status === 'COMPLETED').length;

    // Fund-wise summary
    const fundSummaries = funds.map((f) => {
      const fundIncomes = f.transactions
        .filter((t) => t.type === 'INCOME' || t.type === 'CONTRIBUTION')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const fundExpenses = f.transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      return {
        id: f.id,
        name: f.name,
        code: f.code,
        description: f.description,
        currentBalance: f.balance,
        totalIncome: fundIncomes,
        totalExpense: fundExpenses,
        transactionCount: f.transactions.length,
        transactions: f.transactions,
      };
    });

    // Campaigns summary with financial breakdown
    const campaignSummaries = campaigns.map((c) => {
      const verifiedCollected = c.collectedAmount || 0;
      const totalCampExpense = c.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const remainingBalance = Math.max(0, verifiedCollected - totalCampExpense);

      return {
        id: c.id,
        title: c.title,
        slug: c.slug,
        coverImage: c.coverImage,
        goalAmount: c.goalAmount,
        collectedAmount: verifiedCollected,
        totalExpenses: totalCampExpense,
        remainingBalance,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
        shortDescription: c.shortDescription,
        description: c.description,
        expenses: c.expenses,
        donationsCount: c.donations.length,
      };
    });

    return {
      summary: {
        totalIncome,
        totalExpense,
        netBalance,
        totalContributions,
        totalCampaignDonations,
        totalGeneralIncome: nonContributionFundIncome,
        totalFundExpenses,
        totalCampaignExpenses,
        totalFundsBalance: funds.reduce((sum, f) => sum + (f.balance || 0), 0),
        humanitarianCount: humanitarianActivities.length,
        treePlantationCount: treePlantations.length,
        completedCampaignsCount,
      },
      funds: fundSummaries,
      humanitarianActivities: humanitarianActivities.map((h) => ({
        ...h,
        beneficiaryDisplayName: h.consentGiven ? h.beneficiaryName : (h.beneficiaryName ? 'গোপনীয় (সম্মতি সাপেক্ষে সংরক্ষিত)' : null),
        beneficiaryDisplayPhone: h.consentGiven ? h.beneficiaryPhone : null,
      })),
      treePlantations,
      campaigns: campaignSummaries,
      recentIncomes: [
        ...verifiedContributions.map((c) => ({
          id: c.id,
          date: c.paidAt || c.createdAt,
          amount: c.amount,
          source: 'MEMBERSHIP_CONTRIBUTION' as const,
          sourceLabel: 'মাসিক চাঁদা',
          title: `${c.user?.name || 'সদস্য'} - ${c.periodMonth}/${c.periodYear} চাঁদা`,
          receiptNumber: c.receiptNumber,
          paymentMethod: c.paymentMethod,
        })),
        ...verifiedDonations.map((d) => ({
          id: d.id,
          date: d.createdAt,
          amount: d.amount,
          source: 'CAMPAIGN_DONATION' as const,
          sourceLabel: 'ক্যাম্পেইন অনুদান',
          title: `${d.campaign?.title || 'ক্যাম্পেইন'} (${d.donorName || 'শুভাকাঙ্ক্ষী'})`,
          receiptNumber: d.receiptNumber,
          paymentMethod: d.paymentMethod,
        })),
        ...fundTransactions
          .filter((t) => t.type === 'INCOME')
          .map((t) => ({
            id: t.id,
            date: t.createdAt,
            amount: t.amount,
            source: 'GENERAL_FUND_INCOME' as const,
            sourceLabel: `${t.fund.name} অনুদান/জমা`,
            title: t.title,
            receiptNumber: t.referenceId || null,
            paymentMethod: 'FUND_DEPOSIT',
          })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      recentExpenses: [
        ...fundTransactions
          .filter((t) => t.type === 'EXPENSE')
          .map((t) => ({
            id: t.id,
            date: t.createdAt,
            amount: t.amount,
            type: 'FUND_EXPENSE' as const,
            title: t.title,
            description: t.description,
            category: t.category || 'সাধারণ ব্যয়',
            fundName: t.fund.name,
            fundCode: t.fund.code,
            campaignTitle: t.campaign?.title || null,
            projectTitle: t.project?.title || null,
            receiptUrl: t.receiptUrl,
            items: t.items,
          })),
        ...campaignExpenses.map((e) => ({
          id: e.id,
          date: e.expenseDate,
          amount: e.amount,
          type: 'CAMPAIGN_EXPENSE' as const,
          title: e.purpose,
          description: e.description,
          category: 'ক্যাম্পেইন ব্যয়',
          fundName: 'ক্যাম্পেইন পৃথক খতিয়ান',
          fundCode: 'CAMPAIGN',
          campaignTitle: e.campaign?.title || null,
          projectTitle: null,
          receiptUrl: e.voucherUrl,
          items: e.items,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }

  public async getDocuments(accessRole: string | null) {
    const whereClause: { accessLevel?: { in: string[] } } = {};
    if (!accessRole) {
      whereClause.accessLevel = { in: ['PUBLIC'] };
    } else if (accessRole === 'MEMBER') {
      whereClause.accessLevel = { in: ['PUBLIC', 'MEMBERS_ONLY'] };
    }
    // Officers can access all

    return this.prisma.orgDocument.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  public async createDocument(
    userId: string,
    data: { title: string; description?: string; fileUrl: string; fileType?: string; fileSize?: number; category: string; accessLevel: string },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN', 'TREASURER', 'MODERATOR']);

    return this.prisma.orgDocument.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim(),
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileSize: data.fileSize,
        category: data.category,
        accessLevel: data.accessLevel,
        uploadedBy: userId,
      },
    });
  }

  // --------------------------------------------------------------------------
  // 10. DIGITAL ELECTION & SECURE SECRET VOTING
  // --------------------------------------------------------------------------
  public evaluateElectionSchedule(election: {
    status: string;
    votingStartDate: Date;
    votingEndDate: Date;
  }): string {
    if (['DRAFT', 'CANCELLED', 'FINALIZED'].includes(election.status)) {
      return election.status;
    }

    const now = new Date();
    const start = new Date(election.votingStartDate);
    const end = new Date(election.votingEndDate);

    if (now < start) {
      return 'UPCOMING';
    } else if (now >= start && now <= end) {
      return 'VOTING_ACTIVE';
    } else {
      return 'COMPLETED';
    }
  }

  public async getElections() {
    const elections = await this.prisma.election.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        positions: {
          include: { designation: true },
        },
        _count: {
          select: { nominations: true, participations: true },
        },
      },
    });

    // Auto-sync status based on real server time
    const updated = await Promise.all(
      elections.map(async (el) => {
        const calculatedStatus = this.evaluateElectionSchedule(el);
        if (
          el.status !== calculatedStatus &&
          !['DRAFT', 'CANCELLED', 'FINALIZED'].includes(el.status)
        ) {
          try {
            await this.prisma.election.update({
              where: { id: el.id },
              data: { status: calculatedStatus },
            });
            el.status = calculatedStatus;
          } catch {
            // Ignore DB sync error during read
          }
        }
        return el;
      }),
    );

    return updated;
  }

  public async getElectionDetail(electionId: string, currentUserId?: string) {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
      include: {
        positions: {
          include: {
            designation: true,
            nominations: {
              where: { status: 'APPROVED' },
              select: {
                id: true,
                candidateName: true,
                candidatePhoto: true,
                experience: true,
                manifesto: true,
                userId: true,
                status: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
        results: {
          include: { position: { include: { designation: true } } },
        },
      },
    });

    if (!election) throw new NotFoundError('নির্বাচন পাওয়া যায়নি');

    // Auto-sync status based on time
    const calculatedStatus = this.evaluateElectionSchedule(election);
    if (
      election.status !== calculatedStatus &&
      !['DRAFT', 'CANCELLED', 'FINALIZED'].includes(election.status)
    ) {
      try {
        await this.prisma.election.update({
          where: { id: electionId },
          data: { status: calculatedStatus },
        });
        election.status = calculatedStatus;
      } catch {
        // Ignore
      }
    }

    let hasVoted = false;
    let userVoterToken: string | null = null;
    let isEligible = false;
    let isOfficer = false;

    if (currentUserId) {
      const role = await this.getOfficerRole(currentUserId);
      isOfficer = Boolean(role && ['PRESIDENT', 'ADMIN', 'MODERATOR'].includes(role));

      const membership = await this.prisma.orgMembership.findUnique({
        where: { userId: currentUserId },
      });
      isEligible = membership?.status === 'ACTIVE';

      const participation = await this.prisma.voterParticipation.findUnique({
        where: {
          electionId_userId: {
            electionId,
            userId: currentUserId,
          },
        },
      });

      if (participation) {
        hasVoted = true;
        userVoterToken = participation.receiptToken;
      }
    }

    // Dynamic Announcements
    const posName = election.positions?.[0]?.designation?.name || 'কার্যনির্বাহী';
    const announcements = {
      start: `আসসালামু আলাইকুম!\n\nআমাদের সংগঠনের ${posName} পদে ভোটগ্রহণ কার্যক্রম শুরু হয়েছে।\n\nআপনার পছন্দের প্রার্থীকে ভোট দিয়ে নির্বাচনী কার্যক্রমে অংশগ্রহণ করুন।\n\nআপনার মূল্যবান ভোট আমাদের সংগঠনের ভবিষ্যৎ নির্ধারণে গুরুত্বপূর্ণ ভূমিকা রাখবে।\n\nধন্যবাদ।`,
      end: `আসসালামু আলাইকুম।\n\n${posName} পদের ভোটগ্রহণ সফলভাবে সম্পন্ন হয়েছে।\n\nভোট প্রদানের মাধ্যমে অংশগ্রহণ করার জন্য সকল সদস্যকে আন্তরিক ধন্যবাদ।\n\nচূড়ান্ত ফলাফল এখন প্রকাশিত হয়েছে।`,
    };

    // Sanitize candidate photos on positions
    if (election.positions) {
      for (const pos of election.positions) {
        if (pos.nominations) {
          for (const nom of pos.nominations) {
            nom.candidatePhoto =
              cleanImageUrl(nom.candidatePhoto) ||
              nom.candidatePhoto ||
              (nom as any).user?.image ||
              null;
          }
        }
      }
    }

    // Global Config
    const votingConfig = await this.getVotingConfig();

    // STRICT RESULT VISIBILITY RULE:
    // If voting is LIVE or UPCOMING, ordinary members MUST NOT see candidate-wise results.
    let dynamicResults: any[] = [];
    const isCompleted = ['COMPLETED', 'FINALIZED'].includes(election.status);

    if (isCompleted || isOfficer) {
      // Calculate or retrieve results
      const totalVotes = await this.prisma.secretBallot.count({ where: { electionId } });
      const pos = election.positions[0];
      if (pos && pos.nominations) {
        for (const nom of pos.nominations) {
          const voteCount = await this.prisma.secretBallot.count({
            where: { electionId, candidateNominationId: nom.id },
          });
          const pct = totalVotes > 0 ? Number(((voteCount / totalVotes) * 100).toFixed(1)) : 0;
          dynamicResults.push({
            id: nom.id,
            candidateName: nom.candidateName,
            candidatePhoto: cleanImageUrl(nom.candidatePhoto) || nom.candidatePhoto,
            votesCount: voteCount,
            votePercentage: pct,
          });
        }
        dynamicResults.sort((a, b) => b.votesCount - a.votesCount);
        if (dynamicResults.length > 0 && dynamicResults[0].votesCount > 0) {
          dynamicResults[0].isWinner = true;
        }
      }
    }

    // Strip results for non-officers if not completed
    const finalResults = isCompleted ? dynamicResults : isOfficer ? dynamicResults : [];

    return {
      ...election,
      election: {
        ...election,
        results: finalResults,
      },
      hasVoted,
      userVoterToken,
      isEligible,
      isVotingEnabled: votingConfig.isVotingEnabled,
      announcements,
      results: finalResults,
    };
  }

  public async createVotingPoll(
    userId: string,
    data: {
      title: string;
      positionName: string;
      description?: string;
      votingStartDate: string;
      votingEndDate: string;
      isPublished?: boolean;
      candidates: Array<{ name: string; photo?: string; image?: string; bio?: string; userId?: string }>;
    },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    const start = new Date(data.votingStartDate);
    const end = new Date(data.votingEndDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError('ভোট শুরুর ও শেষের সঠিক তারিখ ও সময় প্রদান করুন');
    }

    if (end <= start) {
      throw new BadRequestError('ভোট শেষের সময় অবশ্যই শুরুর সময়ের পরবর্তী হতে হবে');
    }

    if (!data.candidates || data.candidates.length < 2) {
      throw new BadRequestError('ভোট তৈরি করতে কমপক্ষে ২ জন প্রার্থী আবশ্যক');
    }

    // 1. Ensure Designation exists
    let designation = await this.prisma.orgDesignation.findFirst({
      where: { name: data.positionName.trim() },
    });
    if (!designation) {
      const code = `POS_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      designation = await this.prisma.orgDesignation.create({
        data: {
          name: data.positionName.trim(),
          code,
          rank: 10,
        },
      });
    }

    // 2. Initial status based on publish flag & schedule
    const now = new Date();
    let initialStatus = 'DRAFT';
    if (data.isPublished !== false) {
      initialStatus = now < start ? 'UPCOMING' : 'VOTING_ACTIVE';
    }

    return this.prisma.$transaction(async (tx) => {
      // Create election
      const election = await tx.election.create({
        data: {
          title: data.title.trim(),
          description: data.description?.trim(),
          votingStartDate: start,
          votingEndDate: end,
          nominationStartDate: start,
          nominationEndDate: start,
          status: initialStatus,
          positions: {
            create: {
              designationId: designation.id,
              maxWinners: 1,
            },
          },
        },
        include: {
          positions: true,
        },
      });

      const pos = election.positions?.[0];
      if (!pos) throw new BadRequestError('পদের তথ্য তৈরি করা যায়নি');
      const positionId = pos.id;

      // Create Candidates (ElectionNomination)
      for (const cand of data.candidates) {
        let candUserId = cand.userId;
        if (!candUserId) {
          // Check if user with candidate name already exists
          const rawPhoto = cand.photo || cand.image;
          const cleanedPhoto = cleanImageUrl(rawPhoto) || rawPhoto || null;
          const existingUser = await tx.user.findFirst({
            where: { name: cand.name.trim() },
          });
          if (existingUser) {
            candUserId = existingUser.id;
          } else {
            const newUser = await tx.user.create({
              data: {
                name: cand.name.trim(),
                email: `cand-${crypto.randomBytes(4).toString('hex')}@amra-muhammadpuri.org`,
                image: cleanedPhoto,
                role: 'USER',
              },
            });
            candUserId = newUser.id;
          }
        }

        const rawPhoto = cand.photo || cand.image;
        const cleanedPhoto = cleanImageUrl(rawPhoto) || rawPhoto || null;
        await tx.electionNomination.create({
          data: {
            electionId: election.id,
            positionId,
            userId: candUserId,
            candidateName: cand.name.trim(),
            candidatePhoto: cleanedPhoto,
            experience: 'মনোনীত প্রার্থী',
            manifesto: cand.bio?.trim() || 'সংগঠনের সার্বিক উন্নয়নে কাজ করার অঙ্গীকার।',
            status: 'APPROVED',
          },
        });
      }

      return election;
    });
  }

  public async updateVotingSchedule(
    userId: string,
    electionId: string,
    data: { votingStartDate: string; votingEndDate: string },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    const start = new Date(data.votingStartDate);
    const end = new Date(data.votingEndDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError('ভোটের সঠিক তারিখ ও সময় দিন');
    }
    if (end <= start) {
      throw new BadRequestError('ভোট শেষের সময় অবশ্যই শুরুর সময়ের পরবর্তী হতে হবে');
    }

    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election) throw new NotFoundError('ভোট পাওয়া যায়নি');

    const calculatedStatus = this.evaluateElectionSchedule({
      status: election.status,
      votingStartDate: start,
      votingEndDate: end,
    });

    return this.prisma.election.update({
      where: { id: electionId },
      data: {
        votingStartDate: start,
        votingEndDate: end,
        status: calculatedStatus,
      },
    });
  }

  public async getVotingPollMonitoring(userId: string, electionId: string) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN', 'MODERATOR']);

    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
      include: {
        positions: {
          include: {
            designation: true,
            nominations: { where: { status: 'APPROVED' } },
          },
        },
      },
    });

    if (!election) throw new NotFoundError('ভোট পাওয়া যায়নি');

    // Auto-update status if needed
    const calculatedStatus = this.evaluateElectionSchedule(election);
    if (
      election.status !== calculatedStatus &&
      !['DRAFT', 'CANCELLED', 'FINALIZED'].includes(election.status)
    ) {
      await this.prisma.election.update({
        where: { id: electionId },
        data: { status: calculatedStatus },
      });
      election.status = calculatedStatus;
    }

    const totalEligible = await this.prisma.orgMembership.count({
      where: { status: 'ACTIVE' },
    });
    const totalVotesSubmitted = await this.prisma.voterParticipation.count({
      where: { electionId },
    });

    // Candidate-wise results (Superadmin can monitor candidate counts & percentages)
    const position = election.positions[0];
    const candidateResults = [];
    if (position && position.nominations) {
      for (const nom of position.nominations) {
        const count = await this.prisma.secretBallot.count({
          where: { electionId, candidateNominationId: nom.id },
        });
        const pct = totalVotesSubmitted > 0 ? ((count / totalVotesSubmitted) * 100).toFixed(1) : '0';
        candidateResults.push({
          id: nom.id,
          candidateName: nom.candidateName,
          candidatePhoto: cleanImageUrl(nom.candidatePhoto) || nom.candidatePhoto,
          manifesto: nom.manifesto,
          votesCount: count,
          votePercentage: Number(pct),
        });
      }
    }

    // Sort descending by vote count
    candidateResults.sort((a, b) => b.votesCount - a.votesCount);

    // Voter Participation List: Who has voted and who has not voted
    // (NO candidate choice is linked!)
    const participations = await this.prisma.voterParticipation.findMany({
      where: { electionId },
      include: {
        user: { select: { id: true, name: true, phone: true, image: true } },
      },
      orderBy: { participatedAt: 'desc' },
    });

    const activeMembers = await this.prisma.orgMembership.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: { select: { id: true, name: true, phone: true, image: true } },
      },
    });

    const votedUserIds = new Set(participations.map((p) => p.userId));
    const nonVotedMembers = activeMembers
      .filter((m) => !votedUserIds.has(m.userId))
      .map((m) => ({
        id: m.user.id,
        name: m.user.name,
        phone: m.user.phone,
        memberId: m.memberNumber,
      }));

    const votedMembers = participations.map((p) => ({
      id: p.user.id,
      name: p.user.name,
      phone: p.user.phone,
      image: p.user.image,
      receiptToken: p.receiptToken,
      participatedAt: p.participatedAt,
    }));

    const turnoutPct = totalEligible > 0 ? ((totalVotesSubmitted / totalEligible) * 100).toFixed(1) : '0';

    const formattedCandidates = candidateResults.map((c) => ({
      id: c.id,
      candidateName: c.candidateName,
      candidatePhoto: c.candidatePhoto,
      manifesto: c.manifesto,
      voteCount: c.votesCount,
      votesCount: c.votesCount,
      votePercentage: c.votePercentage,
    }));

    const formattedVoters = votedMembers.map((v) => ({
      userId: v.id,
      name: v.name,
      phone: v.phone,
      image: v.image,
      memberNumber: null,
      votedAt: v.participatedAt,
      participatedAt: v.participatedAt,
    }));

    return {
      electionId: election.id,
      title: election.title,
      status: election.status,
      positionName: position?.designation?.name || 'কার্যনির্বাহী',
      totalVotersCount: totalEligible,
      votesCastCount: totalVotesSubmitted,
      turnoutPercentage: Number(turnoutPct),
      notVotedCount: Math.max(0, totalEligible - totalVotesSubmitted),
      candidates: formattedCandidates,
      voters: formattedVoters,
      election,
      stats: {
        totalEligibleVoters: totalEligible,
        totalVotesSubmitted,
        remainingVoters: Math.max(0, totalEligible - totalVotesSubmitted),
        participationPercentage: Number(turnoutPct),
      },
      candidateResults: formattedCandidates,
      votedMembers: formattedVoters,
      nonVotedMembers,
    };
  }

  public async createElection(
    userId: string,
    data: {
      title: string;
      description?: string;
      nominationStartDate: string;
      nominationEndDate: string;
      votingStartDate: string;
      votingEndDate: string;
      rules?: string;
      positions: Array<{ designationId: string; maxWinners: number }>;
    },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    return this.prisma.election.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim(),
        nominationStartDate: new Date(data.nominationStartDate),
        nominationEndDate: new Date(data.nominationEndDate),
        votingStartDate: new Date(data.votingStartDate),
        votingEndDate: new Date(data.votingEndDate),
        rules: data.rules?.trim(),
        status: 'NOMINATION_OPEN',
        positions: {
          create: data.positions.map((p) => ({
            designationId: p.designationId,
            maxWinners: p.maxWinners || 1,
          })),
        },
      },
      include: {
        positions: { include: { designation: true } },
      },
    });
  }

  public async submitNomination(
    userId: string,
    electionId: string,
    data: {
      positionId: string;
      candidateName: string;
      candidatePhoto?: string;
      experience?: string;
      manifesto: string;
    },
  ) {
    const membership = await this.prisma.orgMembership.findUnique({
      where: { userId },
    });

    const isSysAdmin = await this.isSystemAdmin(userId);
    const role = await this.getOfficerRole(userId);
    const isOfficer = Boolean(
      role &&
        [
          'SUPER_ADMIN',
          'PRESIDENT',
          'VICE_PRESIDENT',
          'GENERAL_SECRETARY',
          'TREASURER',
          'MODERATOR',
          'ADMIN',
        ].includes(role),
    );
    if (!isSysAdmin && !isOfficer && (!membership || membership.status !== 'ACTIVE')) {
      throw new ForbiddenError('কেবলমাত্র সক্রিয় সদস্যগণ নির্বাচনে প্রার্থী হতে পারেন');
    }

    const election = await this.prisma.election.findUnique({ where: { id: electionId } });
    if (!election) throw new NotFoundError('নির্বাচন পাওয়া যায়নি');

    if (election.status !== 'NOMINATION_OPEN') {
      throw new BadRequestError('মনোনয়নপত্র জমা দেওয়ার নির্ধারিত সময়সীমা সমাপ্ত হয়েছে');
    }

    const existingNomination = await this.prisma.electionNomination.findFirst({
      where: { electionId, positionId: data.positionId, userId },
    });

    if (existingNomination) {
      throw new ConflictError('আপনি ইতিমধ্যেই এই পদের জন্য মনোনয়নপত্র দাখিল করেছেন');
    }

    return this.prisma.electionNomination.create({
      data: {
        electionId,
        positionId: data.positionId,
        userId,
        candidateName: data.candidateName.trim(),
        candidatePhoto: cleanImageUrl(data.candidatePhoto) || data.candidatePhoto,
        experience: data.experience?.trim(),
        manifesto: data.manifesto.trim(),
        status: 'PENDING',
      },
    });
  }

  public async reviewNomination(
    reviewerId: string,
    nominationId: string,
    status: 'APPROVED' | 'REJECTED',
    reviewNotes?: string,
  ) {
    const role = await this.getOfficerRole(reviewerId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    return this.prisma.electionNomination.update({
      where: { id: nominationId },
      data: {
        status,
        reviewNotes: reviewNotes?.trim(),
      },
    });
  }

  // --------------------------------------------------------------------------
  // SECRET BALLOT VOTING (Voter Identity Cryptographically Separated from Ballot)
  // --------------------------------------------------------------------------
  public async castVote(
    userId: string,
    electionId: string,
    ballots: Array<{ positionId: string; candidateNominationId: string }>,
  ) {
    // 0. Check Global Voting ON/OFF
    const config = await this.getVotingConfig();
    if (!config.isVotingEnabled) {
      throw new BadRequestError('সংগঠনের ভোটগ্রহণ কার্যক্রম বর্তমানে সাময়িকভাবে বন্ধ রাখা হয়েছে।');
    }

    const membership = await this.prisma.orgMembership.findUnique({
      where: { userId },
    });

    const isSysAdmin = await this.isSystemAdmin(userId);
    const role = await this.getOfficerRole(userId);
    const isOfficer = Boolean(
      role &&
        [
          'SUPER_ADMIN',
          'PRESIDENT',
          'VICE_PRESIDENT',
          'GENERAL_SECRETARY',
          'TREASURER',
          'MODERATOR',
          'ADMIN',
        ].includes(role),
    );
    if (!isSysAdmin && !isOfficer && (!membership || membership.status !== 'ACTIVE')) {
      throw new ForbiddenError('কেবলমাত্র অনুমোদিত সক্রিয় সদস্যগণ ভোট দিতে পারেন');
    }

    const election = await this.prisma.election.findUnique({ where: { id: electionId } });
    if (!election) throw new NotFoundError('নির্বাচন পাওয়া যায়নি');

    // Time schedule and status validation
    const calculatedStatus = this.evaluateElectionSchedule(election);
    if (calculatedStatus !== 'VOTING_ACTIVE') {
      if (calculatedStatus === 'UPCOMING') {
        throw new BadRequestError('ভোটগ্রহণ এখনো শুরু হয়নি। নির্ধারিত শুরুর সময়ে ভোট দিন।');
      } else {
        throw new BadRequestError('ভোটগ্রহণ বর্তমানে সক্রিয় নেই বা সময়সীমা সমাপ্ত হয়েছে।');
      }
    }

    if (
      election.status !== calculatedStatus &&
      !['DRAFT', 'CANCELLED', 'FINALIZED'].includes(election.status)
    ) {
      try {
        await this.prisma.election.update({
          where: { id: electionId },
          data: { status: calculatedStatus },
        });
        election.status = calculatedStatus;
      } catch {
        // Ignore
      }
    }

    // 1. Check if voter has already participated
    const alreadyVoted = await this.prisma.voterParticipation.findUnique({
      where: {
        electionId_userId: {
          electionId,
          userId,
        },
      },
    });

    if (alreadyVoted) {
      throw new ConflictError('আপনি ইতিমধ্যেই এই নির্বাচনে আপনার ভোট প্রদান করেছেন');
    }

    // Generate cryptographic receipt token for the voter
    const receiptToken = `VOTE-${electionId.slice(0, 4)}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    // Execute atomic transaction:
    // A) Record voter participation (User voted, proof token issued)
    // B) Record secret ballots with NO USER IDENTIFIER to guarantee ballot secrecy!
    await this.prisma.$transaction(async (tx) => {
      // Step A: Participation tracking
      await tx.voterParticipation.create({
        data: {
          electionId,
          userId,
          receiptToken,
        },
      });

      // Step B: Secret Ballots (Completely Anonymous)
      for (const ballot of ballots) {
        const anonymousBallotToken = crypto.randomBytes(16).toString('hex');
        await tx.secretBallot.create({
          data: {
            electionId,
            positionId: ballot.positionId,
            candidateNominationId: ballot.candidateNominationId,
            ballotToken: anonymousBallotToken,
          },
        });
      }
    });

    return {
      success: true,
      message: 'আপনার গোপন ভোট সফলভাবে গৃহীত হয়েছে।',
      receiptToken,
    };
  }

  // --------------------------------------------------------------------------
  // Live Turnout & Finalize Election Results
  // --------------------------------------------------------------------------
  public async getLiveTurnout(electionId: string) {
    const [totalEligible, totalVoted] = await Promise.all([
      this.prisma.orgMembership.count({ where: { status: 'ACTIVE' } }),
      this.prisma.voterParticipation.count({ where: { electionId } }),
    ]);

    const turnoutPercentage = totalEligible > 0 ? ((totalVoted / totalEligible) * 100).toFixed(1) : '0';

    return {
      totalEligibleVoters: totalEligible,
      totalVotesCast: totalVoted,
      turnoutPercentage: `${turnoutPercentage}%`,
    };
  }

  public async finalizeElection(reviewerId: string, electionId: string) {
    const role = await this.getOfficerRole(reviewerId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
      include: {
        positions: {
          include: {
            designation: true,
            nominations: { where: { status: 'APPROVED' } },
          },
        },
      },
    });

    if (!election) throw new NotFoundError('নির্বাচন পাওয়া যায়নি');

    return this.prisma.$transaction(async (tx) => {
      // Count votes for each nomination
      for (const pos of election.positions) {
        let maxVotes = -1;
        let winnerNominationId: string | null = null;

        for (const nom of pos.nominations) {
          const voteCount = await tx.secretBallot.count({
            where: {
              electionId,
              positionId: pos.id,
              candidateNominationId: nom.id,
            },
          });

          if (voteCount > maxVotes) {
            maxVotes = voteCount;
            winnerNominationId = nom.id;
          }
        }

        // Save election result
        await tx.electionResult.create({
          data: {
            electionId,
            positionId: pos.id,
            winnerNominationId,
            votesCount: Math.max(0, maxVotes),
            isWinner: true,
            finalizedAt: new Date(),
          },
        });

        // Automatically assign winning candidate the organizational designation!
        if (winnerNominationId) {
          const winnerNom = pos.nominations.find((n) => n.id === winnerNominationId);
          if (winnerNom) {
            // Find active committee or create election term assignment
            const activeCommittee = await tx.orgCommittee.findFirst({
              where: { isActive: true },
            });

            if (activeCommittee) {
              await tx.orgCommitteeMember.create({
                data: {
                  committeeId: activeCommittee.id,
                  userId: winnerNom.userId,
                  designationId: pos.designationId,
                  customTitle: `${pos.designation.name} (নির্বাচিত)`,
                },
              });
            }
          }
        }
      }

      return tx.election.update({
        where: { id: electionId },
        data: { status: 'FINALIZED' },
      });
    });
  }

  public async updateElectionStatus(
    userId: string,
    electionId: string,
    status: string,
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    const election = await this.prisma.election.findUnique({ where: { id: electionId } });
    if (!election) throw new NotFoundError('নির্বাচন পাওয়া যায়নি');

    return this.prisma.election.update({
      where: { id: electionId },
      data: { status: status as any },
    });
  }

  public async deleteElection(userId: string, electionId: string) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    const election = await this.prisma.election.findUnique({ where: { id: electionId } });
    if (!election) throw new NotFoundError('নির্বাচন পাওয়া যায়নি');

    return this.prisma.$transaction(async (tx) => {
      await tx.secretBallot.deleteMany({ where: { electionId } });
      await tx.voterParticipation.deleteMany({ where: { electionId } });
      await tx.electionNomination.deleteMany({ where: { electionId } });
      await tx.electionPosition.deleteMany({ where: { electionId } });
      return tx.election.delete({ where: { id: electionId } });
    });
  }

  // =========================================================================
  // Member Directory (Active Members Only - STRICT PRIVACY: Zero Contribution Amounts)
  // =========================================================================

  public async getMemberDirectory(
    userId: string,
    query: {
      search?: string;
      role?: string;
      page?: number;
      limit?: number;
    },
  ) {
    // 1. Authorization: Only ACTIVE members can access directory
    const requester = await this.prisma.orgMembership.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });

    const isSysAdmin = await this.isSystemAdmin(userId);
    const role = await this.getOfficerRole(userId);
    const isOfficer = Boolean(
      role &&
        [
          'SUPER_ADMIN',
          'PRESIDENT',
          'VICE_PRESIDENT',
          'GENERAL_SECRETARY',
          'TREASURER',
          'MODERATOR',
          'ADMIN',
        ].includes(role),
    );
    if (!isSysAdmin && !isOfficer && (!requester || requester.status !== 'ACTIVE')) {
      throw new ForbiddenError('শুধুমাত্র সংগঠনের সক্রিয় সদস্যরা সদস্য ডিরেক্টরি দেখতে পারবেন');
    }

    // Auto-heal super admins in OrgMembership
    await this.prisma.orgMembership.updateMany({
      where: {
        OR: [
          { user: { role: 'SUPER_ADMIN' } },
          { user: { email: { in: ['itskausarprodhan@gmail.com', 'itskausarprod@gmail.com'] } } },
        ],
        orgRole: { not: 'SUPER_ADMIN' },
      },
      data: {
        orgRole: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    }).catch(() => {});

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 50));
    const skip = (page - 1) * limit;

    // 2. Build where filter: ONLY active members
    const where: any = {
      status: 'ACTIVE',
    };

    if (query.role && query.role !== 'ALL') {
      if (query.role === 'OFFICER') {
        where.orgRole = {
          in: [
            'SUPER_ADMIN',
            'ADMIN',
            'PRESIDENT',
            'VICE_PRESIDENT',
            'GENERAL_SECRETARY',
            'TREASURER',
            'MODERATOR',
          ],
        };
      } else if (query.role === 'MEMBER') {
        where.orgRole = 'MEMBER';
        where.user = {
          role: { notIn: ['SUPER_ADMIN', 'ADMIN'] },
          email: { notIn: ['itskausarprodhan@gmail.com', 'itskausarprod@gmail.com'] },
        };
      } else {
        where.orgRole = query.role;
      }
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { phone: { contains: q, mode: 'insensitive' } } },
        { profession: { contains: q, mode: 'insensitive' } },
        { memberNumber: { contains: q, mode: 'insensitive' } },
        { designation: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // 3. Execute query with strict field whitelist (NO financial / contribution data whatsoever!)
    const [total, members] = await Promise.all([
      this.prisma.orgMembership.count({ where }),
      this.prisma.orgMembership.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { joinedAt: 'asc' },
          { createdAt: 'asc' },
        ],
        select: {
          id: true,
          userId: true,
          memberNumber: true,
          profession: true,
          orgRole: true,
          joinedAt: true,
          createdAt: true,
          designation: {
            select: {
              id: true,
              name: true,
              code: true,
              rank: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              phone: true,
              email: true,
              bio: true,
              role: true,
            },
          },
        },
      }),
    ]);

    // Format clean image URL and ensure correct effective orgRole
    const cleanedMembers = members.map((m) => {
      const isSuperAdmin =
        m.orgRole === 'SUPER_ADMIN' ||
        m.user?.role === 'SUPER_ADMIN' ||
        m.user?.email === 'itskausarprodhan@gmail.com' ||
        m.user?.email === 'itskausarprod@gmail.com';
      const isAdmin = m.orgRole === 'ADMIN' || m.user?.role === 'ADMIN';

      let effectiveOrgRole = m.orgRole;
      if (isSuperAdmin) {
        effectiveOrgRole = 'SUPER_ADMIN';
      } else if (isAdmin && (!m.orgRole || m.orgRole === 'MEMBER')) {
        effectiveOrgRole = 'ADMIN';
      }

      return {
        ...m,
        orgRole: effectiveOrgRole,
        user: {
          ...m.user,
          role: isSuperAdmin ? 'SUPER_ADMIN' : m.user?.role,
          image: cleanImageUrl(m.user?.image),
        },
      };
    });

    return {
      members: cleanedMembers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // =========================================================================
  // Registered Website Users Directory (Admin - General Users vs Members)
  // =========================================================================

  public async getAdminUsers(
    reviewerId: string,
    query: {
      search?: string;
      type?: 'ALL' | 'GENERAL_USER' | 'MEMBER';
      provider?: 'ALL' | 'google' | 'credential';
      role?: 'ALL' | 'USER' | 'ADMIN' | 'SUPER_ADMIN';
      page?: number;
      limit?: number;
    },
  ) {
    const role = await this.getOfficerRole(reviewerId);
    this.requireOfficer(role, ['PRESIDENT', 'TREASURER', 'MODERATOR', 'ADMIN']);

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
      ];
    }

    if (query.role && query.role !== 'ALL') {
      where.role = query.role;
    }

    if (query.provider && query.provider !== 'ALL') {
      where.accounts = {
        some: { providerId: query.provider },
      };
    }

    if (query.type === 'MEMBER') {
      where.orgMemberships = {
        some: { status: 'ACTIVE' },
      };
    } else if (query.type === 'GENERAL_USER') {
      where.orgMemberships = {
        none: { status: 'ACTIVE' },
      };
    }

    const [total, users, totalAllUsers, totalGoogleUsers, totalGeneralUsers, totalMembers] =
      await Promise.all([
        this.prisma.user.count({ where }),
        this.prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            image: true,
            phone: true,
            role: true,
            isSuspended: true,
            suspendedAt: true,
            suspendedReason: true,
            createdAt: true,
            updatedAt: true,
            accounts: {
              select: {
                providerId: true,
                createdAt: true,
              },
            },
            sessions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                createdAt: true,
                expiresAt: true,
              },
            },
            orgMemberships: {
              where: { status: 'ACTIVE' },
              take: 1,
              select: {
                id: true,
                status: true,
                memberNumber: true,
                orgRole: true,
                joinedAt: true,
                designation: {
                  select: {
                    id: true,
                    name: true,
                    rank: true,
                  },
                },
              },
            },
            orgApplications: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                status: true,
                createdAt: true,
              },
            },
          },
        }),
        this.prisma.user.count(),
        this.prisma.account.count({ where: { providerId: 'google' } }),
        this.prisma.user.count({ where: { orgMemberships: { none: { status: 'ACTIVE' } } } }),
        this.prisma.user.count({ where: { orgMemberships: { some: { status: 'ACTIVE' } } } }),
      ]);

    const formattedUsers = users.map((u) => {
      const activeMembership = u.orgMemberships[0] || null;
      const latestApp = u.orgApplications[0] || null;
      const providers = u.accounts.map((a) => a.providerId);
      const isGoogle = providers.includes('google');
      const isPassword = providers.includes('credential') || providers.includes('email');
      const lastSession = u.sessions[0] || null;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: u.emailVerified,
        image: u.image,
        phone: u.phone,
        role: u.role,
        isSuspended: Boolean(u.isSuspended),
        suspendedAt: u.suspendedAt,
        suspendedReason: u.suspendedReason,
        createdAt: u.createdAt,
        lastLoginAt: lastSession?.createdAt || u.updatedAt,
        providers,
        isGoogle,
        isPassword,
        isMember: Boolean(activeMembership),
        membership: activeMembership
          ? {
              id: activeMembership.id,
              memberNumber: activeMembership.memberNumber,
              orgRole:
                u.role === 'SUPER_ADMIN' ||
                u.email === 'itskausarprodhan@gmail.com' ||
                u.email === 'itskausarprod@gmail.com'
                  ? 'SUPER_ADMIN'
                  : activeMembership.orgRole,
              joinedAt: activeMembership.joinedAt,
              designation: activeMembership.designation?.name || null,
              rank: activeMembership.designation?.rank || null,
            }
          : null,
        applicationStatus: !activeMembership && latestApp ? latestApp.status : null,
      };
    });

    return {
      users: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary: {
        totalUsers: totalAllUsers,
        generalUsers: totalGeneralUsers,
        members: totalMembers,
        googleUsers: totalGoogleUsers,
      },
    };
  }

  public async toggleUserSystemRole(adminId: string, targetUserId: string, newRole: 'USER' | 'ADMIN' | 'SUPER_ADMIN') {
    const isSysAdmin = await this.isSystemAdmin(adminId);
    const role = await this.getOfficerRole(adminId);
    const isPresident = role === 'PRESIDENT' || role === 'SUPER_ADMIN';
    if (!isSysAdmin && !isPresident) {
      throw new ForbiddenError('ইউজার রোল পরিবর্তন করার অনুমতি শুধুমাত্র প্রধান সিস্টেম অ্যাডমিন ও সভাপতির রয়েছে');
    }

    if (newRole === 'SUPER_ADMIN' && !isSysAdmin) {
      throw new ForbiddenError('সিস্টেম অ্যাডমিন রোল প্রদানের ক্ষমতা কেবলমাত্র প্রধান সিস্টেম অ্যাডমিনের রয়েছে');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { email: true, role: true },
    });

    if (targetUser?.email === 'itskausarprodhan@gmail.com' || targetUser?.role === 'SUPER_ADMIN') {
      throw new ForbiddenError('প্রধান সিস্টেম অ্যাডমিনের রোল পরিবর্তন করা সম্ভব নয়');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: { id: true, name: true, role: true },
    });
    return updated;
  }

  public async suspendUser(adminId: string, targetUserId: string, isSuspended: boolean, reason?: string) {
    const isSysAdmin = await this.isSystemAdmin(adminId);
    const role = await this.getOfficerRole(adminId);
    const isPresident = role === 'PRESIDENT' || role === 'SUPER_ADMIN';
    if (!isSysAdmin && !isPresident) {
      throw new ForbiddenError('ব্যবহারকারী স্থগিত (Suspend) করার ক্ষমতা কেবলমাত্র প্রধান সিস্টেম অ্যাডমিন ও সভাপতির রয়েছে');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!targetUser) throw new NotFoundError('ব্যবহারকারী পাওয়া যায়নি');

    if (targetUser.id === adminId || targetUser.email === 'itskausarprodhan@gmail.com' || targetUser.role === 'SUPER_ADMIN') {
      throw new ForbiddenError('প্রধান সিস্টেম অ্যাডমিনকে স্থগিত করা সম্ভব নয়');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // If suspending, revoke all active sessions immediately
      if (isSuspended) {
        await tx.session.deleteMany({
          where: { userId: targetUserId },
        });
      }

      return tx.user.update({
        where: { id: targetUserId },
        data: {
          isSuspended,
          suspendedAt: isSuspended ? new Date() : null,
          suspendedReason: isSuspended ? (reason || 'প্রশাসনিক সিদ্ধান্তের প্রেক্ষিতে সাময়িকভাবে অ্যাকাউন্ট স্থগিত') : null,
        },
        select: { id: true, name: true, email: true, isSuspended: true, suspendedAt: true, suspendedReason: true },
      });
    });

    return updated;
  }

  public async deleteUser(adminId: string, targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true, email: true },
    });
    const isSuperAdmin =
      user?.role === 'SUPER_ADMIN' ||
      user?.email === 'itskausarprodhan@gmail.com' ||
      user?.email === 'itskausarprod@gmail.com';
    if (!isSuperAdmin) {
      throw new ForbiddenError('ব্যবহারকারী মুছে ফেলার ক্ষমতা কেবলমাত্র প্রধান সিস্টেম অ্যাডমিনের রয়েছে');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!targetUser) throw new NotFoundError('ব্যবহারকারী পাওয়া যায়নি');

    if (targetUser.id === adminId || targetUser.email === 'itskausarprodhan@gmail.com' || targetUser.role === 'SUPER_ADMIN') {
      throw new ForbiddenError('প্রধান সিস্টেম অ্যাডমিনের অ্যাকাউন্ট মুছে ফেলা সম্ভব নয়');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Invalidate sessions and accounts
      await tx.session.deleteMany({ where: { userId: targetUserId } }).catch(() => {});
      await tx.account.deleteMany({ where: { userId: targetUserId } }).catch(() => {});

      // 2. Organization items
      await tx.orgMeetingAttendance.deleteMany({ where: { userId: targetUserId } }).catch(() => {});
      await tx.orgCommitteeMember.deleteMany({ where: { userId: targetUserId } }).catch(() => {});
      await tx.contributionPayment.deleteMany({ where: { userId: targetUserId } }).catch(() => {});
      await tx.contributionReminder.deleteMany({ where: { userId: targetUserId } }).catch(() => {});
      await tx.contributionAgreement.deleteMany({ where: { userId: targetUserId } }).catch(() => {});
      await tx.orgApplication.deleteMany({ where: { userId: targetUserId } }).catch(() => {});
      await tx.orgMembership.deleteMany({ where: { userId: targetUserId } }).catch(() => {});
      await tx.electionNomination.deleteMany({ where: { userId: targetUserId } }).catch(() => {});
      await tx.voterParticipation.deleteMany({ where: { userId: targetUserId } }).catch(() => {});

      // 3. Social / Feed relations
      await tx.postLike.deleteMany({ where: { userId: targetUserId } }).catch(() => {});
      await tx.comment.deleteMany({ where: { authorId: targetUserId } }).catch(() => {});
      await tx.savedPost.deleteMany({ where: { userId: targetUserId } }).catch(() => {});
      await tx.story.deleteMany({ where: { authorId: targetUserId } }).catch(() => {});
      await tx.post.deleteMany({ where: { authorId: targetUserId } }).catch(() => {});
      await tx.groupMember.deleteMany({ where: { userId: targetUserId } }).catch(() => {});
      await tx.groupJoinRequest.deleteMany({ where: { userId: targetUserId } }).catch(() => {});
      await tx.friendRequest.deleteMany({
        where: { OR: [{ senderId: targetUserId }, { receiverId: targetUserId }] },
      }).catch(() => {});
      await tx.friendship.deleteMany({
        where: { OR: [{ userId: targetUserId }, { friendId: targetUserId }] },
      }).catch(() => {});
      await tx.message.deleteMany({
        where: { OR: [{ senderId: targetUserId }, { recipientId: targetUserId }] },
      }).catch(() => {});
      await tx.notification.deleteMany({ where: { recipientId: targetUserId } }).catch(() => {});
      await tx.blockedUser.deleteMany({
        where: { OR: [{ blockerId: targetUserId }, { blockedId: targetUserId }] },
      }).catch(() => {});
      await tx.report.deleteMany({ where: { reporterId: targetUserId } }).catch(() => {});
      await tx.pushSubscription.deleteMany({ where: { userId: targetUserId } }).catch(() => {});

      // 4. Finally delete user from database
      await tx.user.delete({
        where: { id: targetUserId },
      });
    });

    return { success: true, message: 'ব্যবহারকারী স্থায়ীভাবে মুছে ফেলা হয়েছে' };
  }

  public async appointPresident(adminId: string, targetUserId: string) {
    const isSysAdmin = await this.isSystemAdmin(adminId);
    if (!isSysAdmin) {
      throw new ForbiddenError('সংগঠনের সভাপতি নির্ধারণের ক্ষমতা কেবলমাত্র প্রধান সিস্টেম অ্যাডমিনের রয়েছে');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { orgMemberships: true },
    });

    if (!targetUser) throw new NotFoundError('ব্যবহারকারী পাওয়া যায়নি');

    const presidentDesig = await this.prisma.orgDesignation.findFirst({
      where: { code: 'PRESIDENT' },
    });

    if (!presidentDesig) throw new NotFoundError('সভাপতি পদবি ডাটাবেজে পাওয়া যায়নি');

    return this.prisma.$transaction(async (tx) => {
      // 1. Ensure user has role ADMIN if not SUPER_ADMIN
      if (targetUser.role !== 'SUPER_ADMIN') {
        await tx.user.update({
          where: { id: targetUserId },
          data: { role: 'ADMIN' },
        });
      }

      // 2. Demote existing President who is not System Admin and not the target
      const existingPresidents = await tx.orgMembership.findMany({
        where: {
          orgRole: 'PRESIDENT',
          userId: { notIn: [targetUserId, adminId] },
          status: 'ACTIVE',
        },
      });

      const memberDesig = await tx.orgDesignation.findFirst({
        where: { code: 'EXECUTIVE_MEMBER' },
      });

      for (const p of existingPresidents) {
        await tx.orgMembership.update({
          where: { id: p.id },
          data: {
            orgRole: 'MEMBER',
            designationId: memberDesig?.id || null,
          },
        });
      }

      // 3. Update target user's OrgMembership to ACTIVE PRESIDENT
      const targetMembership = await tx.orgMembership.upsert({
        where: { userId: targetUserId },
        update: {
          status: 'ACTIVE',
          orgRole: 'PRESIDENT',
          designationId: presidentDesig.id,
          joinedAt: targetUser.orgMemberships[0]?.joinedAt || new Date(),
        },
        create: {
          userId: targetUserId,
          status: 'ACTIVE',
          orgRole: 'PRESIDENT',
          designationId: presidentDesig.id,
          memberNumber: `AMP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          monthlyContribution: 500,
          joinedAt: new Date(),
        },
      });

      // 4. Update Central Executive Committee
      const activeCommittee = await tx.orgCommittee.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      if (activeCommittee) {
        // Demote previous committee presidents except System Admin
        await tx.orgCommitteeMember.updateMany({
          where: {
            committeeId: activeCommittee.id,
            designationId: presidentDesig.id,
            userId: { notIn: [targetUserId, adminId] },
          },
          data: {
            isCurrent: false,
            endDate: new Date(),
          },
        });

        // Assign target to committee as PRESIDENT
        const existingAssignment = await tx.orgCommitteeMember.findFirst({
          where: {
            committeeId: activeCommittee.id,
            userId: targetUserId,
          },
        });

        if (existingAssignment) {
          await tx.orgCommitteeMember.update({
            where: { id: existingAssignment.id },
            data: {
              designationId: presidentDesig.id,
              customTitle: 'সভাপতি',
              isCurrent: true,
              endDate: null,
            },
          });
        } else {
          await tx.orgCommitteeMember.create({
            data: {
              committeeId: activeCommittee.id,
              userId: targetUserId,
              designationId: presidentDesig.id,
              customTitle: 'সভাপতি',
              isCurrent: true,
            },
          });
        }
      }

      return targetMembership;
    });
  }

  // =========================================================================
  // Organization Member Management Dashboard (Admin)
  // =========================================================================

  public async getAdminMembers(
    reviewerId: string,
    query: {
      search?: string;
      status?: string;
      designationId?: string;
      committeeId?: string;
      paymentStatus?: string;
      year?: number;
      month?: number;
      page?: number;
      limit?: number;
    },
  ) {
    const role = await this.getOfficerRole(reviewerId);
    this.requireOfficer(role, ['PRESIDENT', 'TREASURER', 'MODERATOR', 'ADMIN']);

    const now = new Date();
    const targetYear = query.year || now.getFullYear();
    const targetMonth = query.month || now.getMonth() + 1;
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    // 1. Compute Top-Level Summary Counts (Always accurate from DB)
    const [
      totalRegistered,
      totalActive,
      pendingApps,
      approvedPaymentPending,
      suspendedCount,
      archivedCount,
    ] = await Promise.all([
      this.prisma.orgMembership.count(),
      this.prisma.orgMembership.count({ where: { status: 'ACTIVE' } }),
      this.prisma.orgApplication.count({ where: { status: 'PENDING' } }),
      this.prisma.orgMembership.count({ where: { status: 'APPROVED_PAYMENT_PENDING' } }),
      this.prisma.orgMembership.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.orgMembership.count({ where: { status: 'ARCHIVED' } }),
    ]);

    // Active members payment status for current/target month
    const activeMembers = await this.prisma.orgMembership.findMany({
      where: { status: 'ACTIVE' },
      select: { userId: true, joinedAt: true, createdAt: true },
    });
    const activeUserIds = activeMembers.map((m) => m.userId);

    // Only active members whose joining month is on or before target period are eligible
    const eligibleTargetMembers = activeMembers.filter((m) => {
      const jDate = m.joinedAt ? new Date(m.joinedAt) : new Date(m.createdAt);
      const jYear = jDate.getFullYear();
      const jMonth = jDate.getMonth() + 1;
      return jYear < targetYear || (jYear === targetYear && jMonth <= targetMonth);
    });
    const eligibleTargetUserIds = eligibleTargetMembers.map((m) => m.userId);

    const verifiedPaymentsTargetMonth = await this.prisma.contributionPayment.findMany({
      where: {
        userId: { in: eligibleTargetUserIds },
        periodYear: targetYear,
        periodMonth: targetMonth,
        status: 'VERIFIED',
      },
      select: { userId: true },
    });
    const paidUserIdSet = new Set(verifiedPaymentsTargetMonth.map((p) => p.userId));
    const paidThisMonthCount = paidUserIdSet.size;
    const unpaidThisMonthCount = Math.max(0, eligibleTargetUserIds.length - paidThisMonthCount);

    // Overdue count: active members who have multiple months overdue (consistent with getContributionTracking)
    let overdueCount = 0;
    const overdueUserIds: string[] = [];
    const allVerifiedPayments = await this.prisma.contributionPayment.findMany({
      where: {
        userId: { in: activeUserIds },
        status: 'VERIFIED',
      },
      select: { userId: true, periodYear: true, periodMonth: true },
    });
    const memberVerifiedMap = new Map<string, Set<string>>();
    for (const p of allVerifiedPayments) {
      if (!memberVerifiedMap.has(p.userId)) memberVerifiedMap.set(p.userId, new Set());
      memberVerifiedMap.get(p.userId)!.add(`${p.periodYear}-${p.periodMonth}`);
    }

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    for (const m of activeMembers) {
      const jDate = m.joinedAt ? new Date(m.joinedAt) : new Date(m.createdAt);
      const jYear = jDate.getFullYear();
      const jMonth = jDate.getMonth() + 1;
      const vSet = memberVerifiedMap.get(m.userId) || new Set();

      const evalStartYear = Math.max(ORG_OFFICIAL_START_YEAR, jYear);
      let overdueMonthsCount = 0;

      for (let y = evalStartYear; y <= currentYear; y++) {
        const startM = y === ORG_OFFICIAL_START_YEAR
          ? Math.max(ORG_OFFICIAL_START_MONTH, jMonth)
          : (y === jYear ? jMonth : 1);
        const endM = y === currentYear ? currentMonth : 12;

        for (let mIdx = startM; mIdx <= endM; mIdx++) {
          if (!isMonthEligibleForContribution(y, mIdx, m.joinedAt, m.createdAt)) continue;
          if (!vSet.has(`${y}-${mIdx}`)) {
            overdueMonthsCount++;
          }
        }
      }

      if (overdueMonthsCount > 1) {
        overdueCount++;
        overdueUserIds.push(m.userId);
      }
    }

    // 2. Build Prisma Filter Condition for Member Query
    const whereCondition: any = {};

    if (query.status && query.status !== 'ALL') {
      whereCondition.status = query.status;
    }

    if (query.designationId) {
      whereCondition.OR = [
        { designationId: query.designationId },
        { user: { committeeAssignments: { some: { designationId: query.designationId } } } },
      ];
    }

    if (query.committeeId) {
      whereCondition.user = {
        ...(whereCondition.user || {}),
        committeeAssignments: {
          some: { committeeId: query.committeeId },
        },
      };
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      whereCondition.OR = [
        { memberNumber: { contains: q, mode: 'insensitive' } },
        { profession: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { phone: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // Payment status filter (PAID, UNPAID, PENDING, OVERDUE)
    if (query.paymentStatus && query.paymentStatus !== 'ALL') {
      if (query.paymentStatus === 'PAID') {
        whereCondition.userId = { in: Array.from(paidUserIdSet) };
      } else if (query.paymentStatus === 'UNPAID') {
        const unpaidEligibleUserIds = eligibleTargetUserIds.filter((id) => !paidUserIdSet.has(id));
        whereCondition.userId = { in: unpaidEligibleUserIds };
        whereCondition.status = 'ACTIVE';
      } else if (query.paymentStatus === 'OVERDUE') {
        whereCondition.userId = { in: overdueUserIds };
        whereCondition.status = 'ACTIVE';
      } else if (query.paymentStatus === 'PENDING') {
        const pendingPayments = await this.prisma.contributionPayment.findMany({
          where: {
            periodYear: targetYear,
            periodMonth: targetMonth,
            status: 'PENDING',
          },
          select: { userId: true },
        });
        whereCondition.userId = { in: pendingPayments.map((p) => p.userId) };
      }
    }

    const [totalMatching, memberships] = await Promise.all([
      this.prisma.orgMembership.count({ where: whereCondition }),
      this.prisma.orgMembership.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: [{ joinedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              phone: true,
              email: true,
              role: true,
              committeeAssignments: {
                where: { isCurrent: true },
                include: {
                  committee: { select: { id: true, name: true } },
                  designation: { select: { id: true, name: true, code: true, rank: true } },
                },
              },
            },
          },
          designation: { select: { id: true, name: true, code: true, rank: true } },
        },
      }),
    ]);

    // Attach target month payment info for each returned member
    const memberUserIds = memberships.map((m) => m.userId);
    const targetPayments = await this.prisma.contributionPayment.findMany({
      where: {
        userId: { in: memberUserIds },
        periodYear: targetYear,
        periodMonth: targetMonth,
      },
      select: {
        userId: true,
        amount: true,
        status: true,
        paidAt: true,
        paymentMethod: true,
        receiptNumber: true,
      },
    });
    const paymentMap = new Map<string, any>();
    for (const p of targetPayments) {
      paymentMap.set(p.userId, p);
    }

    const members = memberships.map((m) => {
      const payment = paymentMap.get(m.userId);
      const jDate = m.joinedAt ? new Date(m.joinedAt) : new Date(m.createdAt);
      const jYear = jDate.getFullYear();
      const jMonth = jDate.getMonth() + 1;
      const isEligibleForTarget = jYear < targetYear || (jYear === targetYear && jMonth <= targetMonth);

      const isSuperAdminUser =
        m.user?.role === 'SUPER_ADMIN' ||
        m.user?.email === 'itskausarprodhan@gmail.com' ||
        m.user?.email === 'itskausarprod@gmail.com';

      let monthStatus = 'UNPAID';
      if (m.status !== 'ACTIVE') {
        monthStatus = m.status === 'APPROVED_PAYMENT_PENDING' ? 'FEE_PENDING' : 'NOT_APPLICABLE';
      } else if (!isEligibleForTarget) {
        monthStatus = 'NOT_APPLICABLE';
      } else if (payment) {
        if (payment.status === 'VERIFIED') monthStatus = 'PAID';
        else if (payment.status === 'PENDING') monthStatus = 'PENDING';
        else if (payment.status === 'REJECTED') monthStatus = 'REJECTED';
      } else if (targetYear < currentYear || (targetYear === currentYear && targetMonth < currentMonth)) {
        monthStatus = 'OVERDUE';
      }

      // Check if reminder was sent recently (cooldown: 1 hour)
      const lastReminder = m.lastReminderSentAt;
      const canSendReminder = !lastReminder || (Date.now() - new Date(lastReminder).getTime() > 60 * 60 * 1000);

      return {
        id: m.id,
        userId: m.userId,
        name: m.user?.name || 'অজ্ঞাত সদস্য',
        image: m.user?.image || null,
        phone: m.user?.phone || null,
        email: m.user?.email || null,
        systemRole: isSuperAdminUser ? 'SUPER_ADMIN' : m.user?.role || 'USER',
        memberNumber: m.memberNumber || 'AMP-NEW',
        status: m.status,
        profession: m.profession || null,
        monthlyContribution: m.monthlyContribution,
        orgRole: isSuperAdminUser
          ? 'SUPER_ADMIN'
          : m.user?.role === 'ADMIN' && (!m.orgRole || m.orgRole === 'MEMBER')
          ? 'ADMIN'
          : m.orgRole,
        joinedAt: m.joinedAt,
        lastPaymentDate: m.lastPaymentDate,
        lastReminderSentAt: m.lastReminderSentAt,
        canSendReminder,
        user: {
          id: m.user?.id || m.userId,
          name: m.user?.name || 'অজ্ঞাত',
          phone: m.user?.phone || null,
          image: m.user?.image || null,
          profession: m.profession || null,
          email: m.user?.email || null,
          role: isSuperAdminUser ? 'SUPER_ADMIN' : m.user?.role || 'USER',
        },
        designationId: m.designationId,
        designation: m.designation || null,
        primaryDesignation: m.designation || null,
        committees: m.user?.committeeAssignments || [],
        targetMonthPayment: payment || null,
        paymentStatus: monthStatus,
        currentMonthStatus: monthStatus,
      };
    });

    const [allDesignations, allCommittees] = await Promise.all([
      this.prisma.orgDesignation.findMany({ where: { isActive: true }, orderBy: { rank: 'asc' } }),
      this.prisma.orgCommittee.findMany({ where: { isActive: true } }),
    ]);

    return {
      members,
      pagination: {
        page,
        limit,
        total: totalMatching,
        totalPages: Math.ceil(totalMatching / limit) || 1,
      },
      summary: {
        totalRegistered,
        totalActive,
        pendingApps,
        approvedPaymentPending,
        suspendedCount,
        archivedCount,
        paidThisMonth: paidThisMonthCount,
        unpaidThisMonth: unpaidThisMonthCount,
        overdueCount,
      },
      summaryCounts: {
        totalRegistered,
        totalActive,
        pendingApplications: pendingApps,
        approvedPaymentPending,
        suspended: suspendedCount,
        archived: archivedCount,
        paidThisMonth: paidThisMonthCount,
        unpaidThisMonth: unpaidThisMonthCount,
        overdueMembers: overdueCount,
      },
      designations: allDesignations,
      committees: allCommittees,
      targetPeriod: {
        year: targetYear,
        month: targetMonth,
        monthName: MONTH_NAMES_BN[targetMonth - 1] || `${targetMonth} তম`,
      },
    };
  }

  public async getAdminMemberDetails(reviewerId: string, memberId: string) {
    const role = await this.getOfficerRole(reviewerId);
    this.requireOfficer(role, ['PRESIDENT', 'TREASURER', 'MODERATOR', 'ADMIN']);

    const membership = await this.prisma.orgMembership.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            role: true,
            isSuspended: true,
            suspendedAt: true,
            suspendedReason: true,
            createdAt: true,
          },
        },
        designation: true,
      },
    });

    if (!membership) {
      throw new NotFoundError('সদস্য রেকর্ড খুঁজে পাওয়া যায়নি');
    }

    const [payments, committeeHistory, reminderHistory] = await Promise.all([
      this.prisma.contributionPayment.findMany({
        where: { userId: membership.userId },
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { paidAt: 'desc' }],
        take: 100,
      }),
      this.prisma.orgCommitteeMember.findMany({
        where: { userId: membership.userId },
        orderBy: [{ isCurrent: 'desc' }, { assignedAt: 'desc' }],
        include: {
          committee: { select: { id: true, name: true } },
          designation: { select: { id: true, name: true, code: true, rank: true } },
        },
      }),
      this.prisma.contributionReminder.findMany({
        where: { userId: membership.userId },
        orderBy: { sentAt: 'desc' },
        take: 30,
      }),
    ]);

    const totalVerifiedContributions = payments
      .filter((p) => p.status === 'VERIFIED')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const joinedDate = membership.joinedAt ? new Date(membership.joinedAt) : new Date(membership.createdAt);
    const joinedYear = joinedDate.getFullYear();
    const joinedMonth = joinedDate.getMonth() + 1;

    const paidMap = new Map<string, string>();
    for (const p of payments) {
      paidMap.set(`${p.periodYear}-${p.periodMonth}`, p.status);
    }

    const overdueMonths: Array<{
      year: number;
      month: number;
      monthName: string;
      amount: number;
      status: 'OVERDUE' | 'PENDING';
      formattedPeriod: string;
    }> = [];

    const evalStartYear = Math.max(joinedYear, currentYear - 1);
    for (let y = evalStartYear; y <= currentYear; y++) {
      const startM = y === joinedYear ? joinedMonth : 1;
      const endM = y === currentYear ? currentMonth : 12;
      for (let m = startM; m <= endM; m++) {
        const key = `${y}-${m}`;
        const pStatus = paidMap.get(key);
        if (pStatus === 'VERIFIED') continue;
        const monthName = MONTH_NAMES_BN[m - 1] || `${m} তম মাস`;
        overdueMonths.push({
          year: y,
          month: m,
          monthName,
          amount: membership.monthlyContribution,
          status: pStatus === 'PENDING' ? 'PENDING' : 'OVERDUE',
          formattedPeriod: `${monthName} ${y}`,
        });
      }
    }
    overdueMonths.sort((a, b) => (b.year !== a.year ? b.year - a.year : b.month - a.month));
    const totalOverdueAmount = overdueMonths.reduce((sum, item) => sum + item.amount, 0);

    return {
      membership,
      user: membership.user,
      totalVerifiedContributions,
      overdueMonths,
      overdueMonthsCount: overdueMonths.length,
      totalOverdueAmount,
      payments,
      recentPayments: payments,
      committeeHistory,
      committees: committeeHistory,
      reminderHistory,
      reminders: reminderHistory,
    };
  }

  public async updateMemberStatus(
    reviewerId: string,
    memberId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED' | 'APPROVED_PAYMENT_PENDING',
    notes?: string,
  ) {
    const role = await this.getOfficerRole(reviewerId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    const membership = await this.prisma.orgMembership.findUnique({
      where: { id: memberId },
      include: { user: { select: { name: true } } },
    });

    if (!membership) {
      throw new NotFoundError('সদস্য রেকর্ড খুঁজে পাওয়া যায়নি');
    }

    const updated = await this.prisma.orgMembership.update({
      where: { id: memberId },
      data: {
        status,
        joinedAt: status === 'ACTIVE' && !membership.joinedAt ? new Date() : membership.joinedAt,
        notes: notes
          ? membership.notes
            ? `${membership.notes}\n[${new Date().toISOString()}] ${notes}`
            : notes
          : membership.notes,
      },
    });

    return updated;
  }

  public async assignMemberDesignation(
    reviewerId: string,
    memberId: string,
    data: {
      designationId?: string | null;
      committeeId?: string | null;
      customTitle?: string;
      startDate?: string;
      endDate?: string;
      notes?: string;
    },
  ) {
    const role = await this.getOfficerRole(reviewerId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);
    const isSysAdmin = await this.isSystemAdmin(reviewerId);

    const membership = await this.prisma.orgMembership.findUnique({
      where: { id: memberId },
      select: { id: true, userId: true, user: { select: { email: true, role: true } } },
    });

    if (!membership) {
      throw new NotFoundError('সদস্য রেকর্ড খুঁজে পাওয়া যায়নি');
    }

    // Protection rule: No one can change or demote the System Admin
    if (membership.user?.role === 'SUPER_ADMIN' || membership.user?.email === 'itskausarprodhan@gmail.com') {
      if (!isSysAdmin) {
        throw new ForbiddenError('প্রধান সিস্টেম অ্যাডমিনের পদবি বা রোল পরিবর্তন করার অনুমতি কারো নেই');
      }
    }

    const targetDesignationId = data.designationId === '' ? null : data.designationId;
    const targetCommitteeId = data.committeeId === '' ? null : data.committeeId;

    return this.prisma.$transaction(async (tx) => {
      // Resolve orgRole based on assigned designation
      let resolvedOrgRole: string | undefined = undefined;
      if (targetDesignationId) {
        const designation = await tx.orgDesignation.findUnique({
          where: { id: targetDesignationId },
          select: { code: true },
        });
        if (designation) {
          const codeUpper = designation.code.toUpperCase();
          if (['PRESIDENT', 'CONVENER'].includes(codeUpper)) {
            if (!isSysAdmin) {
              throw new ForbiddenError('সংগঠনের সভাপতি নির্ধারণের ক্ষমতা কেবলমাত্র প্রধান সিস্টেম অ্যাডমিনের রয়েছে');
            }
            resolvedOrgRole = 'PRESIDENT';
          } else if (['GENERAL_SECRETARY', 'VICE_PRESIDENT', 'JOINT_SECRETARY', 'ORGANIZING_SECRETARY', 'PUBLICITY_SECRETARY'].includes(codeUpper)) {
            resolvedOrgRole = codeUpper;
          } else if (codeUpper === 'TREASURER') {
            resolvedOrgRole = 'TREASURER';
          } else if (codeUpper === 'MODERATOR') {
            resolvedOrgRole = 'MODERATOR';
          } else {
            resolvedOrgRole = 'MEMBER';
          }
        }
      } else if (targetDesignationId === null) {
        resolvedOrgRole = 'MEMBER';
      }

      if (resolvedOrgRole === 'PRESIDENT') {
        if (!isSysAdmin) {
          throw new ForbiddenError('সংগঠনের সভাপতি নির্ধারণের ক্ষমতা কেবলমাত্র প্রধান সিস্টেম অ্যাডমিনের রয়েছে');
        }
        await tx.user.update({
          where: { id: membership.userId },
          data: { role: 'ADMIN' },
        });
      }

      // 1. Update primary designation & orgRole in OrgMembership (auto-activate officer status)
      const updatedMembership = await tx.orgMembership.update({
        where: { id: memberId },
        data: {
          designationId: targetDesignationId !== undefined ? targetDesignationId : undefined,
          ...(resolvedOrgRole ? { orgRole: resolvedOrgRole } : {}),
          ...(resolvedOrgRole && resolvedOrgRole !== 'MEMBER'
            ? { status: 'ACTIVE' }
            : {}),
        },
        include: { designation: true },
      });

      // 2. If committeeId is specified, assign / update committee position history
      if (targetCommitteeId && targetDesignationId) {
        await tx.orgCommitteeMember.updateMany({
          where: { committeeId: targetCommitteeId, userId: membership.userId, isCurrent: true },
          data: { isCurrent: false, endDate: new Date() },
        });

        await tx.orgCommitteeMember.create({
          data: {
            committeeId: targetCommitteeId,
            userId: membership.userId,
            designationId: targetDesignationId,
            customTitle: data.customTitle || null,
            startDate: data.startDate ? new Date(data.startDate) : new Date(),
            endDate: data.endDate ? new Date(data.endDate) : null,
            isCurrent: true,
            notes: data.notes || null,
          },
        });
      }

      return updatedMembership;
    });
  }

  // =========================================================================
  // Monthly Contribution Tracking & Reminders (Admin)
  // =========================================================================

  public async getContributionTracking(
    reviewerId: string,
    year?: number,
    month?: number,
  ) {
    const role = await this.getOfficerRole(reviewerId);
    this.requireOfficer(role, ['PRESIDENT', 'TREASURER', 'MODERATOR', 'ADMIN']);

    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 1. Fetch active members
    const activeMembers = await this.prisma.orgMembership.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: { select: { id: true, name: true, phone: true, image: true, email: true } },
        designation: { select: { name: true } },
      },
      orderBy: [{ joinedAt: 'asc' }],
    });

    // 2. Fetch all payments for this target period + historical payments + all pending payments
    const [paymentsThisPeriod, allMemberPayments, allPendingPayments] = await Promise.all([
      this.prisma.contributionPayment.findMany({
        where: {
          periodYear: targetYear,
          periodMonth: targetMonth,
        },
        include: {
          user: { select: { id: true, name: true, phone: true, image: true } },
        },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.contributionPayment.findMany({
        where: {
          userId: { in: activeMembers.map((m) => m.userId) },
          status: { in: ['VERIFIED', 'PENDING'] },
        },
        select: {
          id: true,
          userId: true,
          periodYear: true,
          periodMonth: true,
          status: true,
          amount: true,
        },
      }),
      this.prisma.contributionPayment.findMany({
        where: {
          status: 'PENDING',
        },
        include: {
          user: { select: { id: true, name: true, phone: true, image: true } },
        },
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    const userPaymentStatusMap = new Map<string, Map<string, string>>();
    for (const p of allMemberPayments) {
      if (!userPaymentStatusMap.has(p.userId)) {
        userPaymentStatusMap.set(p.userId, new Map());
      }
      const existingStatus = userPaymentStatusMap.get(p.userId)!.get(`${p.periodYear}-${p.periodMonth}`);
      if (existingStatus !== 'VERIFIED') {
        userPaymentStatusMap.get(p.userId)!.set(`${p.periodYear}-${p.periodMonth}`, p.status);
      }
    }

    const verifiedPaymentMap = new Map<string, any>();
    const pendingPaymentMap = new Map<string, any>();

    for (const p of paymentsThisPeriod) {
      if (p.status === 'VERIFIED' && !verifiedPaymentMap.has(p.userId)) {
        verifiedPaymentMap.set(p.userId, p);
      } else if (p.status === 'PENDING' && !pendingPaymentMap.has(p.userId)) {
        pendingPaymentMap.set(p.userId, p);
      }
    }

    const paidMembers: any[] = [];
    const unpaidMembers: any[] = [];
    const pendingMembers: any[] = [];
    const overdueMembers: any[] = [];

    const isTargetMonthEligible = isMonthEligibleForContribution(targetYear, targetMonth);
    const isMonthOverdue =
      isTargetMonthEligible &&
      (targetYear < currentYear || (targetYear === currentYear && targetMonth <= currentMonth));

    for (const member of activeMembers) {
      const verified = verifiedPaymentMap.get(member.userId);
      const pending = pendingPaymentMap.get(member.userId);

      const lastReminder = member.lastReminderSentAt;
      const canSendReminder =
        !lastReminder || Date.now() - new Date(lastReminder).getTime() > 60 * 60 * 1000;

      const memberPaymentsMap = userPaymentStatusMap.get(member.userId) || new Map();
      const joinedDate = member.joinedAt ? new Date(member.joinedAt) : new Date(member.createdAt);
      const joinedYear = joinedDate.getFullYear();
      const joinedMonth = joinedDate.getMonth() + 1;
      const isEligibleForTargetMonth = isMonthEligibleForContribution(
        targetYear,
        targetMonth,
        member.joinedAt,
        member.createdAt,
      );

      const overdueMonths: Array<{
        year: number;
        month: number;
        monthName: string;
        amount: number;
        status: 'OVERDUE' | 'PENDING';
        formattedPeriod: string;
      }> = [];

      const evalStartYear = Math.max(ORG_OFFICIAL_START_YEAR, joinedYear);
      for (let y = evalStartYear; y <= currentYear; y++) {
        const startM = y === ORG_OFFICIAL_START_YEAR
          ? Math.max(ORG_OFFICIAL_START_MONTH, joinedMonth)
          : (y === joinedYear ? joinedMonth : 1);
        const endM = y === currentYear ? currentMonth : 12;
        for (let m = startM; m <= endM; m++) {
          if (!isMonthEligibleForContribution(y, m, member.joinedAt, member.createdAt)) continue;

          const key = `${y}-${m}`;
          const pStatus = memberPaymentsMap.get(key);
          if (pStatus === 'VERIFIED') continue;
          const monthName = MONTH_NAMES_BN[m - 1] || `${m} তম মাস`;
          overdueMonths.push({
            year: y,
            month: m,
            monthName,
            amount: member.monthlyContribution,
            status: pStatus === 'PENDING' ? 'PENDING' : 'OVERDUE',
            formattedPeriod: `${monthName} ${y}`,
          });
        }
      }

      if (isMonthOverdue && isEligibleForTargetMonth && !overdueMonths.some((om) => om.year === targetYear && om.month === targetMonth) && !verified) {
        const monthName = MONTH_NAMES_BN[targetMonth - 1] || `${targetMonth} তম মাস`;
        overdueMonths.push({
          year: targetYear,
          month: targetMonth,
          monthName,
          amount: member.monthlyContribution,
          status: pending ? 'PENDING' : 'OVERDUE',
          formattedPeriod: `${monthName} ${targetYear}`,
        });
      }

      overdueMonths.sort((a, b) => (b.year !== a.year ? b.year - a.year : b.month - a.month));
      const totalOverdueAmount = overdueMonths.reduce((sum, item) => sum + item.amount, 0);
      const overdueMonthsCount = overdueMonths.length;

      const memberItem = {
        memberId: member.id,
        userId: member.userId,
        name: member.user?.name || 'সদস্য',
        phone: member.user?.phone || '—',
        image: member.user?.image || null,
        memberNumber: member.memberNumber || 'AMP-MEMBER',
        agreedAmount: member.monthlyContribution,
        designation: member.designation?.name || member.orgRole,
        lastReminderSentAt: member.lastReminderSentAt,
        canSendReminder,
        overdueMonths,
        overdueMonthsCount,
        totalOverdueAmount,
      };

      if (verified) {
        paidMembers.push({
          ...memberItem,
          paymentId: verified.id,
          paidAmount: verified.amount,
          paidAt: verified.paidAt,
          paymentMethod: verified.paymentMethod,
          trxId: verified.trxId,
          receiptNumber: verified.receiptNumber,
          periodMonth: verified.periodMonth || targetMonth,
          periodYear: verified.periodYear || targetYear,
          status: 'VERIFIED',
        });
      } else if (pending) {
        const monthName = MONTH_NAMES_BN[pending.periodMonth - 1] || `${pending.periodMonth} তম মাস`;
        pendingMembers.push({
          ...memberItem,
          paymentId: pending.id,
          paidAmount: pending.amount,
          submittedAmount: pending.amount,
          submittedAt: pending.paidAt,
          paymentDate: pending.paidAt,
          paymentMethod: pending.paymentMethod,
          trxId: pending.trxId,
          senderNumber: pending.senderNumber,
          receiptNumber: pending.receiptNumber,
          periodMonth: pending.periodMonth,
          periodYear: pending.periodYear,
          periodLabel: `${monthName} ${pending.periodYear}`,
          status: 'PENDING',
        });
      } else if (isEligibleForTargetMonth) {
        const isMultipleMonthsOverdue = overdueMonthsCount > 1;

        if (isMultipleMonthsOverdue) {
          overdueMembers.push({
            ...memberItem,
            dueMonth: targetMonth,
            dueYear: targetYear,
            status: 'OVERDUE',
          });
        } else {
          unpaidMembers.push({
            ...memberItem,
            dueMonth: targetMonth,
            dueYear: targetYear,
            status: isMonthOverdue ? 'OVERDUE' : 'UPCOMING',
          });
        }
      }
    }

    // Merge any other pending payments across all periods so admin can verify all pending submissions in one place
    // Group by batch key (userId + trxId, or userId + 60-second time window) so multi-month submissions appear as ONE entry
    const pendingToMerge = Array.isArray(allPendingPayments) ? allPendingPayments : [];

    // Clear pendingMembers and rebuild entirely from allPendingPayments grouped by batch
    // This ensures even the target-period pending payments are grouped correctly
    pendingMembers.length = 0;

    // Build batch groups from ALL pending payments
    const batchMap = new Map<string, typeof allPendingPayments>();
    for (const p of pendingToMerge) {
      let batchKey: string;
      if (p.trxId && p.trxId.trim()) {
        // Same user + same trxId → same batch
        batchKey = `${p.userId}_trx_${p.trxId.trim()}`;
      } else {
        // Same user, no trxId → group by 60-second submission window
        batchKey = `${p.userId}_time_${Math.floor(new Date(p.createdAt).getTime() / 60000)}`;
      }
      if (!batchMap.has(batchKey)) batchMap.set(batchKey, []);
      batchMap.get(batchKey)!.push(p);
    }

    for (const [, batchPayments] of batchMap) {
      // Sort by periodYear asc, periodMonth asc for label building
      batchPayments.sort((a, b) =>
        a.periodYear !== b.periodYear ? a.periodYear - b.periodYear : a.periodMonth - b.periodMonth,
      );

      const first = batchPayments[0]!;
      const last = batchPayments[batchPayments.length - 1]!;
      const member = activeMembers.find((m) => m.userId === first.userId);
      const count = batchPayments.length;
      const totalAmount = batchPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Build human-readable period label
      let periodLabel: string;
      if (count === 1) {
        const mn = MONTH_NAMES_BN[first.periodMonth - 1] || `${first.periodMonth} তম মাস`;
        periodLabel = `${mn} ${first.periodYear}`;
      } else {
        const firstMn = MONTH_NAMES_BN[first.periodMonth - 1] || `${first.periodMonth} তম`;
        const lastMn = MONTH_NAMES_BN[last.periodMonth - 1] || `${last.periodMonth} তম`;
        // If same year, show "এপ্রিল - জুন ২০২৬ (৩ মাস)", else include both years
        if (first.periodYear === last.periodYear) {
          periodLabel = `${firstMn} - ${lastMn} ${first.periodYear} (${count} মাস)`;
        } else {
          periodLabel = `${firstMn} ${first.periodYear} - ${lastMn} ${last.periodYear} (${count} মাস)`;
        }
      }

      const lastReminder = member?.lastReminderSentAt;
      const canSendReminder =
        !lastReminder || Date.now() - new Date(lastReminder).getTime() > 60 * 60 * 1000;

      pendingMembers.push({
        memberId: member?.id || first.userId,
        userId: first.userId,
        name: first.user?.name || member?.user?.name || 'সদস্য',
        phone: first.user?.phone || member?.user?.phone || '—',
        image: first.user?.image || member?.user?.image || null,
        memberNumber: member?.memberNumber || 'AMP-MEMBER',
        agreedAmount: member?.monthlyContribution || first.amount,
        designation: member?.designation?.name || (member?.orgRole as string) || 'MEMBER',
        canSendReminder,
        // For batch approval, paymentId = first record's id; allPaymentIds has them all
        paymentId: first.id,
        allPaymentIds: batchPayments.map((p) => p.id),
        monthsCount: count,
        paidAmount: totalAmount,
        submittedAmount: totalAmount,
        submittedAt: first.paidAt || first.createdAt,
        paymentDate: first.paidAt || first.createdAt,
        paymentMethod: first.paymentMethod || 'মোবাইল ব্যাংকিং',
        trxId: first.trxId,
        senderNumber: first.senderNumber,
        receiptNumber: first.receiptNumber,
        periodMonth: first.periodMonth,
        periodYear: first.periodYear,
        periodLabel,
        status: 'PENDING',
      });
    }

    return {
      period: {
        year: targetYear,
        month: targetMonth,
        monthName: MONTH_NAMES_BN[targetMonth - 1] || `${targetMonth} তম`,
        totalActiveMembers: activeMembers.length,
      },
      targetPeriod: {
        year: targetYear,
        month: targetMonth,
        monthName: MONTH_NAMES_BN[targetMonth - 1] || `${targetMonth} তম`,
      },
      counts: {
        paid: paidMembers.length,
        unpaid: unpaidMembers.length,
        pending: pendingMembers.length,
        overdue: overdueMembers.length,
      },
      categoryCounts: {
        totalActive: activeMembers.length,
        paid: paidMembers.length,
        unpaid: unpaidMembers.length,
        pendingVerification: pendingMembers.length,
        overdue: overdueMembers.length,
      },
      paid: paidMembers,
      unpaid: unpaidMembers,
      pending: pendingMembers,
      overdue: overdueMembers,
      paidMembers,
      unpaidMembers,
      pendingMembers,
      overdueMembers,
    };
  }

  public async sendManualContributionReminder(
    reviewerId: string,
    data: {
      userId?: string;
      memberId?: string;
      periodYear?: number;
      year?: number;
      periodMonth?: number;
      month?: number;
      channel?: string;
      customNote?: string;
    },
  ) {
    const role = await this.getOfficerRole(reviewerId);
    this.requireOfficer(role, ['PRESIDENT', 'TREASURER', 'MODERATOR', 'ADMIN']);

    const targetUserId = data.userId;
    const targetMemberId = data.memberId;
    const periodYear = Number(data.periodYear || data.year || new Date().getFullYear());
    const periodMonth = Number(data.periodMonth || data.month || new Date().getMonth() + 1);

    if (!targetUserId && !targetMemberId) {
      throw new BadRequestError('সদস্য বা ইউজার আইডি প্রদান আবশ্যক');
    }

    const membership = await this.prisma.orgMembership.findFirst({
      where: targetMemberId ? { id: targetMemberId } : { userId: targetUserId },
      include: { user: { select: { id: true, name: true, phone: true } } },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new BadRequestError('কেবলমাত্র সক্রিয় সদস্যকে চাঁদার তাগিদ পাঠানো সম্ভব');
    }

    const actualUserId = membership.userId;

    // Check joining date & organization start date eligibility
    if (!isMonthEligibleForContribution(periodYear, periodMonth, membership.joinedAt, membership.createdAt)) {
      throw new BadRequestError('সংগঠন কার্যক্রম শুরু হওয়ার পূর্ববর্তী মাসের জন্য চাঁদার তাগিদ পাঠানো প্রযোজ্য নয়');
    }

    // Check if already paid
    const existingVerified = await this.prisma.contributionPayment.findFirst({
      where: {
        userId: actualUserId,
        periodYear,
        periodMonth,
        status: 'VERIFIED',
      },
    });

    if (existingVerified) {
      throw new BadRequestError('এই সদস্য ইতিমধ্যে এই মাসের চাঁদা সফলভাবে পরিশোধ করেছেন');
    }

    // Check cooldown (1 hour)
    if (membership.lastReminderSentAt) {
      const diffMs = Date.now() - new Date(membership.lastReminderSentAt).getTime();
      if (diffMs < 60 * 60 * 1000) {
        const remainingMinutes = Math.ceil((60 * 60 * 1000 - diffMs) / 60000);
        throw new BadRequestError(`এই সদস্যকে সম্প্রতি তাগিদ পাঠানো হয়েছে। অনুগ্রহ করে আরও ${remainingMinutes} মিনিট পর চেষ্টা করুন।`);
      }
    }

    const monthName = MONTH_NAMES_BN[periodMonth - 1] || `${periodMonth} তম`;
    const title = 'মাসিক চাঁদার তাগিদ 🔔';
    const noteText = data.customNote ? `\n\nবিশেষ দ্রষ্টব্য: ${data.customNote}` : '';
    const content = `প্রিয় ${membership.user.name}, আপনার ${monthName} (${periodYear}) মাসের সংগঠনের নির্ধারিত চাঁদা ৳${membership.monthlyContribution} এখনো পরিশোধ করা হয়নি। অনুগ্রহ করে সময়মতো চাঁদা পরিশোধ করুন।${noteText}`;

    const now = new Date();
    const slot = `MANUAL_${periodYear}_${periodMonth}_${now.getTime()}`;

    await this.prisma.$transaction(async (tx) => {
      // 1. In-app notification
      await tx.notification.create({
        data: {
          recipientId: actualUserId,
          type: 'CONTRIBUTION_REMINDER',
          title,
          content,
          entityType: 'ORG_CONTRIBUTION',
          entityId: membership.id,
          isRead: false,
        },
      });

      // 2. Reminder record
      await tx.contributionReminder.create({
        data: {
          userId: actualUserId,
          periodYear,
          periodMonth,
          slot,
          channel: data.channel || 'IN_APP',
          sentAt: now,
        },
      });

      // 3. Update member timestamp
      await tx.orgMembership.update({
        where: { id: membership.id },
        data: { lastReminderSentAt: now },
      });
    });

    // 4. Trigger WebPush with sound
    this.notificationService.sendPushToUser(actualUserId, {
      title,
      body: content,
      url: '/organization/member',
      sound: '/sounds/notification.wav',
    }).catch(() => { });

    return {
      success: true,
      memberName: membership.user.name,
      message: `${membership.user.name}-কে সফলভাবে চাঁদা পরিশোধের তাগিদ পাঠানো হয়েছে`,
      sentAt: now,
    };
  }

  public async sendBulkContributionReminders(
    reviewerId: string,
    data: {
      userIds?: string[];
      memberIds?: string[];
      periodYear?: number;
      year?: number;
      periodMonth?: number;
      month?: number;
      filter?: 'ALL_UNPAID' | 'ONLY_OVERDUE';
      customNote?: string;
    },
  ) {
    const role = await this.getOfficerRole(reviewerId);
    this.requireOfficer(role, ['PRESIDENT', 'TREASURER', 'MODERATOR', 'ADMIN']);

    const periodYear = Number(data.periodYear || data.year || new Date().getFullYear());
    const periodMonth = Number(data.periodMonth || data.month || new Date().getMonth() + 1);

    let targetUserIds = data.userIds || [];

    if (targetUserIds.length === 0) {
      if (data.memberIds && data.memberIds.length > 0) {
        const members = await this.prisma.orgMembership.findMany({
          where: { id: { in: data.memberIds } },
          select: { userId: true },
        });
        targetUserIds = members.map((m) => m.userId);
      } else {
        // Find all active members who are eligible for this target period
        const activeMembers = await this.prisma.orgMembership.findMany({
          where: { status: 'ACTIVE' },
          select: { userId: true, joinedAt: true, createdAt: true },
        });

        const eligibleActive = activeMembers.filter((m) =>
          isMonthEligibleForContribution(periodYear, periodMonth, m.joinedAt, m.createdAt),
        );

        const activeIds = eligibleActive.map((m) => m.userId);
        const verifiedPaid = await this.prisma.contributionPayment.findMany({
          where: {
            userId: { in: activeIds },
            periodYear,
            periodMonth,
            status: 'VERIFIED',
          },
          select: { userId: true },
        });

        const paidSet = new Set(verifiedPaid.map((p) => p.userId));
        targetUserIds = activeIds.filter((id) => !paidSet.has(id));
      }
    }

    let sentCount = 0;
    let skippedAlreadyPaid = 0;
    let skippedCooldown = 0;

    for (const uId of targetUserIds) {
      try {
        await this.sendManualContributionReminder(reviewerId, {
          userId: uId,
          periodYear,
          periodMonth,
          customNote: data.customNote,
        });
        sentCount++;
      } catch (err: any) {
        if (err?.message?.includes('ইতিমধ্যে এই মাসের চাঁদা')) {
          skippedAlreadyPaid++;
        } else if (err?.message?.includes('সম্প্রতি তাগিদ পাঠানো হয়েছে')) {
          skippedCooldown++;
        }
      }
    }

    return {
      targetedMembersCount: targetUserIds.length,
      remindersSent: sentCount,
      skippedCooldownCount: skippedCooldown,
      totalRequested: targetUserIds.length,
      sentCount,
      skippedAlreadyPaid,
      skippedCooldown,
      message: `মোট ${sentCount} জন সদস্যকে সফলভাবে তাগিদ পাঠানো হয়েছে।` +
        (skippedAlreadyPaid > 0 ? ` (${skippedAlreadyPaid} জন ইতিমধ্যে পরিশোধিত)` : '') +
        (skippedCooldown > 0 ? ` (${skippedCooldown} জন কুলডাউন অবস্থায় আছে)` : ''),
    };
  }

  // =========================================================================
  // Dynamic Designation Management (Admin)
  // =========================================================================

  public async getAdminDesignations(reviewerId: string) {
    const role = await this.getOfficerRole(reviewerId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN', 'MODERATOR']);

    const designations = await this.prisma.orgDesignation.findMany({
      orderBy: [{ rank: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            committeeMembers: true,
            memberships: true,
          },
        },
      },
    });

    return designations.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      rank: d.rank,
      description: d.description,
      isActive: d.isActive,
      activeMembersCount: d._count.memberships + d._count.committeeMembers,
      memberCount: d._count.memberships + d._count.committeeMembers,
    }));
  }

  public async createDesignation(
    reviewerId: string,
    data: {
      name: string;
      code?: string;
      rank?: number;
      description?: string;
    },
  ) {
    const role = await this.getOfficerRole(reviewerId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    let code = data.code?.trim().toUpperCase();
    if (!code) {
      code = `DESIG_${Date.now().toString(36).toUpperCase()}`;
    }

    const existing = await this.prisma.orgDesignation.findUnique({
      where: { code },
    });
    if (existing) {
      if (data.code) {
        throw new ConflictError('এই কোডের একটি পদবি ইতিমধ্যে বিদ্যমান রয়েছে');
      } else {
        code = `DESIG_${Date.now().toString(36).toUpperCase()}_${Math.floor(Math.random() * 1000)}`;
      }
    }

    return this.prisma.orgDesignation.create({
      data: {
        name: data.name.trim(),
        code,
        rank: data.rank ?? 10,
        description: data.description?.trim() || null,
        isActive: true,
      },
    });
  }

  public async updateDesignation(
    reviewerId: string,
    designationId: string,
    data: {
      name?: string;
      rank?: number;
      description?: string;
      isActive?: boolean;
    },
  ) {
    const role = await this.getOfficerRole(reviewerId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    const existing = await this.prisma.orgDesignation.findUnique({
      where: { id: designationId },
    });
    if (!existing) {
      throw new NotFoundError('পদবি খুঁজে পাওয়া যায়নি');
    }

    return this.prisma.orgDesignation.update({
      where: { id: designationId },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        rank: data.rank !== undefined ? data.rank : undefined,
        description: data.description !== undefined ? (data.description ? data.description.trim() : null) : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
    });
  }

  // --------------------------------------------------------------------------
  // Monthly Contribution Payment Configs (Admin & Public)
  // --------------------------------------------------------------------------
  public async seedOrgPaymentConfigsIfNeeded() {
    try {
      const count = await this.prisma.orgPaymentConfig.count();
      if (count === 0) {
        for (const cfg of INITIAL_ORG_PAYMENT_CONFIGS) {
          await this.prisma.orgPaymentConfig.create({
            data: cfg,
          });
        }
      }
    } catch {
      // Ignore background seeding errors
    }
  }

  public async getPublicOrgPaymentConfigs() {
    await this.seedOrgPaymentConfigsIfNeeded();
    return this.prisma.orgPaymentConfig.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  public async getAdminOrgPaymentConfigs(userId: string) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'TREASURER', 'ADMIN', 'MODERATOR']);
    await this.seedOrgPaymentConfigsIfNeeded();
    return this.prisma.orgPaymentConfig.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  public async updateOrgPaymentConfig(
    userId: string,
    data: {
      method: string;
      title: string;
      accountNumber: string;
      accountType: string;
      instructions?: string | null;
      qrCodeUrl?: string | null;
      isActive: boolean;
    },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'TREASURER', 'ADMIN']);

    return this.prisma.orgPaymentConfig.upsert({
      where: { method: data.method },
      create: {
        method: data.method,
        title: data.title.trim(),
        accountNumber: data.accountNumber.trim(),
        accountType: data.accountType.trim(),
        instructions: data.instructions?.trim() || null,
        qrCodeUrl: data.qrCodeUrl || null,
        isActive: data.isActive,
      },
      update: {
        title: data.title.trim(),
        accountNumber: data.accountNumber.trim(),
        accountType: data.accountType.trim(),
        instructions: data.instructions?.trim() || null,
        qrCodeUrl: data.qrCodeUrl || null,
        isActive: data.isActive,
      },
    });
  }
}
