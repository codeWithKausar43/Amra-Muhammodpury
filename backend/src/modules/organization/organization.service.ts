import { PrismaClient } from '../../config/database.js';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '../../errors/app-error.js';
import crypto from 'crypto';

export class OrganizationService {
  constructor(private readonly prisma: PrismaClient) {}

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
      tagline: 'মুহাম্মদপুরের উন্নয়ন, নিরাপত্তা ও সামাজিক ঐক্যের মঞ্চ',
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
        include: { user: { select: { name: true, email: true } } },
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
  public async getElections() {
    return this.prisma.election.findMany({
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

    let hasVoted = false;
    let userVoterToken: string | null = null;
    let isEligible = false;

    if (currentUserId) {
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

    return {
      election,
      hasVoted,
      userVoterToken,
      isEligible,
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
        candidatePhoto: data.candidatePhoto,
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
    const membership = await this.prisma.orgMembership.findUnique({
      where: { userId },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenError('কেবলমাত্র অনুমোদিত সক্রিয় সদস্যগণ ভোট দিতে পারেন');
    }

    const election = await this.prisma.election.findUnique({ where: { id: electionId } });
    if (!election) throw new NotFoundError('নির্বাচন পাওয়া যায়নি');

    if (election.status !== 'VOTING_ACTIVE') {
      throw new BadRequestError('ভোটগ্রহণ বর্তমানে সক্রিয় নেই');
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
}

