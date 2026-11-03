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

export class OrganizationService {
  constructor(private readonly prisma: PrismaClient) {}

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
  // Helper: Verify User Officer Role
  // --------------------------------------------------------------------------
  private async getOfficerRole(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === 'ADMIN') return 'PRESIDENT'; // System ADMIN has President privileges

    const membership = await this.prisma.orgMembership.findUnique({
      where: { userId },
      select: { orgRole: true, status: true },
    });
    if (membership && membership.status === 'ACTIVE') {
      return membership.orgRole;
    }
    return null;
  }

  private requireOfficer(role: string | null, allowed: string[] = ['PRESIDENT', 'TREASURER', 'ADMIN']) {
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
      organizationName: 'আমরা মোহাম্মদপুরী নাগরিক উন্নয়ন ও সামাজিক সংগঠন',
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
        user: {
          select: { id: true, name: true, email: true, phone: true, image: true },
        },
      },
    });

    const application = await this.prisma.orgApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const agreement = await this.prisma.contributionAgreement.findFirst({
      where: { userId, isCurrent: true },
    });

    return {
      hasMembership: Boolean(membership),
      membership,
      latestApplication: application,
      currentAgreement: agreement,
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
        await tx.orgMembership.update({
          where: { userId: application.userId },
          data: {
            status: 'APPROVED_PAYMENT_PENDING',
            monthlyContribution: application.monthlyContribution,
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
        await tx.orgMembership.update({
          where: { userId: application.userId },
          data: { status: 'REJECTED' },
        });
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
    const memberNumber = `AMP-${periodYear}-${crypto.randomInt(1000, 9999)}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Record payment
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
          status: 'VERIFIED',
          notes: data.notes || 'সদস্যপদ অ্যাক্টিভেশন ও প্রথম মাসের অনুদান',
        },
      });

      // 2. Activate membership
      const updatedMembership = await tx.orgMembership.update({
        where: { userId },
        data: {
          status: 'ACTIVE',
          memberNumber,
          joinedAt: now,
          lastPaymentDate: now,
        },
      });

      // 3. Credit General Fund
      const generalFund = await tx.orgFund.findUnique({ where: { code: 'GENERAL' } });
      if (generalFund) {
        await tx.orgFund.update({
          where: { id: generalFund.id },
          data: { balance: { increment: amount } },
        });

        await tx.fundTransaction.create({
          data: {
            fundId: generalFund.id,
            type: 'CONTRIBUTION',
            amount,
            title: `নতুন সদস্যপদ ও অনুদান (${memberNumber})`,
            description: `মাসিক চাঁদা পরিশোধ: ${periodMonth}/${periodYear}`,
            category: 'সদস্য চাঁদা',
            referenceId: payment.id,
            performedBy: userId,
          },
        });
      }

      return { payment, membership: updatedMembership };
    });
  }

  public async payMonthlyContribution(
    userId: string,
    data: {
      periodMonth: number;
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

    if (data.amount < membership.monthlyContribution) {
      throw new BadRequestError(`অনুদান আপনার নির্ধারিত মাসিক অনুদান (৳${membership.monthlyContribution}) এর কম হতে পারবে না`);
    }

    // Check duplicate payment for this period
    const existing = await this.prisma.contributionPayment.findFirst({
      where: {
        userId,
        periodMonth: data.periodMonth,
        periodYear: data.periodYear,
        status: { in: ['VERIFIED', 'PENDING'] },
      },
    });

    if (existing) {
      throw new ConflictError(`${data.periodYear} সালের ${data.periodMonth} তম মাসের চাঁদা ইতিমধ্যেই পরিশোধিত বা প্রক্রিয়াদিন`);
    }

    const receiptNumber = `AMP-REC-${data.periodYear}${String(data.periodMonth).padStart(2, '0')}-${crypto.randomInt(1000, 9999)}`;

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.contributionPayment.create({
        data: {
          userId,
          amount: data.amount,
          periodMonth: data.periodMonth,
          periodYear: data.periodYear,
          paymentMethod: data.paymentMethod,
          trxId: data.trxId?.trim() || null,
          senderNumber: data.senderNumber?.trim() || null,
          receiptNumber,
          status: 'VERIFIED',
          notes: data.notes || null,
        },
      });

      await tx.orgMembership.update({
        where: { userId },
        data: { lastPaymentDate: new Date() },
      });

      const generalFund = await tx.orgFund.findUnique({ where: { code: 'GENERAL' } });
      if (generalFund) {
        await tx.orgFund.update({
          where: { id: generalFund.id },
          data: { balance: { increment: data.amount } },
        });

        await tx.fundTransaction.create({
          data: {
            fundId: generalFund.id,
            type: 'CONTRIBUTION',
            amount: data.amount,
            title: `মাসিক চাঁদা পরিশোধ (${data.periodMonth}/${data.periodYear})`,
            description: `রশিদ নম্বর: ${receiptNumber}`,
            category: 'সদস্য চাঁদা',
            referenceId: payment.id,
            performedBy: userId,
          },
        });
      }

      return payment;
    });
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

    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenError('কেবলমাত্র সক্রিয় সদস্যগণ মেম্বার ড্যাশবোর্ড দেখতে পারবেন');
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    const [payments, notices, meetings, upcomingElections] = await Promise.all([
      this.prisma.contributionPayment.findMany({
        where: { userId },
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
        take: 12,
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
    ]);

    // Calculate paid months for current year
    const paidMonthsThisYear = payments
      .filter((p) => p.periodYear === currentYear)
      .map((p) => p.periodMonth);

    return {
      membership,
      currentYear,
      paidMonthsThisYear,
      payments,
      notices,
      meetings,
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
      totalFunds,
      recentTransactions,
      recentPayments,
      fundsList,
      contributionsAgg,
      incomeAgg,
      expenseAgg,
      activeElectionsCount,
    ] = await Promise.all([
      this.prisma.orgMembership.count(),
      this.prisma.orgMembership.count({ where: { status: 'ACTIVE' } }),
      this.prisma.orgApplication.count({ where: { status: 'PENDING' } }),
      this.prisma.orgMembership.count({ where: { status: 'APPROVED_PAYMENT_PENDING' } }),
      this.prisma.orgFund.aggregate({ _sum: { balance: true } }),
      this.prisma.fundTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { fund: { select: { name: true, code: true } } },
      }),
      this.prisma.contributionPayment.findMany({
        orderBy: { paidAt: 'desc' },
        take: 8,
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      }),
      this.prisma.orgFund.findMany({ orderBy: { balance: 'desc' } }),
      this.prisma.contributionPayment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.fundTransaction.aggregate({
        where: { type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.fundTransaction.aggregate({
        where: { type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      this.prisma.election.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    const totalBalance = totalFunds._sum.balance ? Number(totalFunds._sum.balance) : 0;
    const totalContributions = contributionsAgg._sum.amount ? Number(contributionsAgg._sum.amount) : 0;
    const totalIncome = incomeAgg._sum.amount ? Number(incomeAgg._sum.amount) : 0;
    const totalExpense = expenseAgg._sum.amount ? Number(expenseAgg._sum.amount) : 0;
    const financialTrends = await this.calculateFinancialTrends();

    return {
      memberCounts: {
        total: totalMembers,
        active: activeMembers,
        pendingPayment: approvedPaymentPending,
        pendingApplications: pendingApps,
      },
      funds: {
        totalBalance,
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
        totalContributions,
      },
      financialTrends,
      elections: {
        activeElections: activeElectionsCount,
      },
      stats: {
        totalMembers,
        activeMembers,
        pendingApplications: pendingApps,
        approvedPaymentPending,
        totalBalance,
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
    },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'TREASURER', 'ADMIN']);

    const fund = await this.prisma.orgFund.findUnique({ where: { id: data.fundId } });
    if (!fund) throw new NotFoundError('তহবিল পাওয়া যায়নি');

    if (data.type === 'EXPENSE' && fund.balance < data.amount) {
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

      return tx.fundTransaction.create({
        data: {
          fundId: data.fundId,
          type: data.type,
          amount: data.amount,
          title: data.title.trim(),
          description: data.description?.trim(),
          category: data.category?.trim(),
          receiptUrl: data.receiptUrl,
          performedBy: userId,
        },
      });
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

  public async getProjects() {
    return this.prisma.orgProject.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  public async createProject(
    userId: string,
    data: { title: string; description: string; budget?: number; progress?: number; status?: string; isPublic?: boolean; images?: string[] },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN', 'TREASURER']);

    return this.prisma.orgProject.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        budget: data.budget || 0,
        progress: data.progress || 0,
        status: data.status || 'ACTIVE',
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
        images: data.images || [],
      },
    });
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

    if (!membership || membership.status !== 'ACTIVE') {
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

    if (!membership || membership.status !== 'ACTIVE') {
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
}

