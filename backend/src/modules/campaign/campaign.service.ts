import crypto from 'crypto';
import { PrismaClient, Prisma } from '../../config/database.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../errors/app-error.js';
import { NotificationService } from '../notifications/notification.service.js';
import { realtimeService } from '../realtime/realtime.service.js';

export const INITIAL_CAMPAIGN_CATEGORIES = [
  { name: 'অসহায় মানুষের পাশে দাঁড়ানো', icon: 'HeartHandshake', description: 'হতদরিদ্র ও অসহায় মানুষদের জরুরি সহায়তা' },
  { name: 'শীতবস্ত্র বিতরণ', icon: 'Snowflake', description: 'শীতকালে শীতার্তদের মাঝে কম্বল ও গরম কাপড় বিতরণ' },
  { name: 'ঈদ বাজার বিতরণ', icon: 'Gift', description: 'সুবিধাবঞ্চিত পরিবারের মাঝে ঈদ খাদ্য সামগ্রী ও উপহার সামগ্রী বিতরণ' },
  { name: 'অসুস্থ মানুষের চিকিৎসা সহায়তা', icon: 'Stethoscope', description: 'দরিদ্র ও সংকটাপন্ন রোগীদের চিকিৎসা ও ঔষধ সহায়তা' },
  { name: 'দরিদ্র শিক্ষার্থীদের শিক্ষা সহায়তা', icon: 'GraduationCap', description: 'মেধাবী ও অসচ্ছল শিক্ষার্থীদের বই, খাতা ও বেতন সহায়তা' },
  { name: 'বন্যা ও প্রাকৃতিক দুর্যোগে সহায়তা', icon: 'ShieldAlert', description: 'দুর্যোগকালীন সময়ে ত্রাণ ও পুনর্বাসন কার্যক্রম' },
  { name: 'খাদ্য বিতরণ', icon: 'Utensils', description: 'ক্ষুধার্ত মানুষের মাঝে পুষ্টিকর রান্না করা খাদ্য ও রেশন বিতরণ' },
  { name: 'মানবিক সহায়তা', icon: 'Smile', description: 'জরুরি মানবিক ও বিপদগ্রস্ত পরিবারের পাশে দাঁড়ানো' },
  { name: 'সামাজিক উন্নয়ন', icon: 'Building2', description: 'এলাকাভিত্তিক অবকাঠামো ও গণকল্যাণমূলক উন্নয়ন উদ্যোগ' },
  { name: 'অন্যান্য', icon: 'FolderHeart', description: 'অন্যান্য সাধারণ জনকল্যাণমূলক কার্যক্রম' },
];

export const INITIAL_PAYMENT_CONFIGS = [
  {
    method: 'BKASH',
    title: 'বিকাশ (মার্চেন্ট)',
    accountNumber: '01711000001',
    accountType: 'মার্চেন্ট অ্যাকাউন্ট (পেমেন্ট)',
    instructions: 'বিকাশ অ্যাপের "Payment" অপশনে গিয়ে নম্বরটি টাইপ করুন অথবা সেন্ড মানি করুন। রেফারেন্সে ক্যাম্পেইনের নাম বা আপনার নাম লিখুন।',
    isActive: true,
  },
  {
    method: 'NAGAD',
    title: 'নগদ (ব্যক্তিগত)',
    accountNumber: '01711000002',
    accountType: 'ব্যক্তিগত অ্যাকাউন্ট (সেন্ড মানি)',
    instructions: 'নগদ অ্যাপ বা ডায়াল করে "Send Money" করুন। ট্রানজেকশন সম্পন্ন হলে প্রাপ্ত TrxID টি ফরমে লিখুন।',
    isActive: true,
  },
  {
    method: 'ROCKET',
    title: 'রকেট',
    accountNumber: '01711000003-8',
    accountType: 'ব্যক্তিগত অ্যাকাউন্ট',
    instructions: 'রকেট থেকে সেন্ড মানি করে ট্রানজেকশন আইডি ও মোবাইল নম্বর সংরক্ষণ করুন।',
    isActive: true,
  },
  {
    method: 'BANK',
    title: 'ব্যাংক হিসাব',
    accountNumber: '১২৩.১০১.৪৫৬৭৮৯ (ডাচ্-বাংলা ব্যাংক)',
    accountType: 'চলতি হিসাব (মোহাম্মদপুর শাখা)',
    instructions: 'ব্যাংক একাউন্টে জমা দিয়ে জমা স্লিপের ছবি বা অনলাইন ট্রানজেকশন রেফারেন্স প্রদান করুন। অ্যাকাউন্ট নাম: মোহাম্মদপুর কমিউনিটি ফাউন্ডেশন।',
    isActive: true,
  },
];

export class CampaignService {
  private notificationService: NotificationService;

  constructor(private readonly prisma: PrismaClient) {
    this.notificationService = new NotificationService(prisma);
    this.seedDefaultsIfNeeded().catch(() => {});
  }

  // --------------------------------------------------------------------------
  // Seed Default Categories & Payment Configs
  // --------------------------------------------------------------------------
  public async seedDefaultsIfNeeded(): Promise<void> {
    try {
      const catCount = await this.prisma.campaignCategory.count();
      if (catCount === 0) {
        for (let i = 0; i < INITIAL_CAMPAIGN_CATEGORIES.length; i++) {
          const cat = INITIAL_CAMPAIGN_CATEGORIES[i];
          if (!cat) continue;
          await this.prisma.campaignCategory.create({
            data: {
              name: cat.name,
              icon: cat.icon,
              description: cat.description,
              displayOrder: i + 1,
              isActive: true,
            },
          });
        }
      }

      const payCount = await this.prisma.campaignPaymentConfig.count();
      if (payCount === 0) {
        for (const cfg of INITIAL_PAYMENT_CONFIGS) {
          await this.prisma.campaignPaymentConfig.create({
            data: cfg,
          });
        }
      }
    } catch {
      // Ignore background seeding errors
    }
  }

  // --------------------------------------------------------------------------
  // Helper: Verify User Officer Role
  // --------------------------------------------------------------------------
  private async getOfficerRole(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });
    if (user?.role === 'SUPER_ADMIN' || user?.email === 'itskausarprodhan@gmail.com') return 'SUPER_ADMIN';
    if (user?.role === 'ADMIN') return 'PRESIDENT';

    const membership = await this.prisma.orgMembership.findUnique({
      where: { userId },
      select: { orgRole: true, status: true },
    });
    if (membership && membership.status === 'ACTIVE') {
      if (membership.orgRole === 'SUPER_ADMIN') return 'PRESIDENT';
      return membership.orgRole;
    }
    return null;
  }

  private requireOfficer(role: string | null, allowed: string[] = ['PRESIDENT', 'TREASURER', 'MODERATOR', 'ADMIN']) {
    if (!role || (!allowed.includes(role) && role !== 'SUPER_ADMIN' && role !== 'PRESIDENT')) {
      throw new ForbiddenError('ক্যাম্পেইন ব্যবস্থাপনার জন্য প্রয়োজনীয় প্রশাসনিক অনুমতি আপনার নেই');
    }
  }

  // --------------------------------------------------------------------------
  // 1. PUBLIC: List Campaigns
  // --------------------------------------------------------------------------
  public async getPublicCampaigns(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 12));
    const skip = (page - 1) * limit;

    const where: Prisma.CampaignWhereInput = {
      status: 'ACTIVE',
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: 'insensitive' } },
              { shortDescription: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.campaign.count({ where }),
      this.prisma.campaign.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          shortDescription: true,
          goalAmount: true,
          collectedAmount: true,
          startDate: true,
          endDate: true,
          location: true,
          status: true,
          isFeatured: true,
          categoryId: true,
          categoryName: true,
          category: {
            select: { id: true, name: true, icon: true },
          },
        },
        orderBy: [{ isFeatured: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    const sanitizedItems = items.map((c) => {
      const goal = c.goalAmount || 0;
      const collected = c.collectedAmount || 0;
      const progressPercent = goal > 0 ? Math.min(100, Math.round((collected / goal) * 100)) : 0;
      const remainingAmount = goal > 0 ? Math.max(0, goal - collected) : 0;

      return {
        ...c,
        categoryName: c.category?.name || c.categoryName || 'সাধারণ',
        progressPercent,
        remainingAmount,
      };
    });

    return {
      items: sanitizedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // --------------------------------------------------------------------------
  // 2. PUBLIC: Single Active Campaign for App Entry Popup
  // --------------------------------------------------------------------------
  public async getActivePopupCampaign() {
    const now = new Date();
    // Find active campaigns that haven't ended yet
    const activeCampaigns = await this.prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        shortDescription: true,
        goalAmount: true,
        collectedAmount: true,
        startDate: true,
        endDate: true,
        status: true,
        isFeatured: true,
        priority: true,
        categoryName: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ isFeatured: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
      take: 10,
    });

    if (activeCampaigns.length === 0) {
      // Fallback: any active campaign even if dates are not strictly matching
      const fallback = await this.prisma.campaign.findFirst({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          shortDescription: true,
          goalAmount: true,
          collectedAmount: true,
          startDate: true,
          endDate: true,
          status: true,
          isFeatured: true,
          priority: true,
          categoryName: true,
          category: { select: { id: true, name: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
      });
      if (!fallback) return null;
      activeCampaigns.push(fallback);
    }

    // Pick top priority or fair rotation if multiple
    const selected = activeCampaigns[0];
    if (!selected) return null;

    const goal = selected.goalAmount || 0;
    const collected = selected.collectedAmount || 0;
    const progressPercent = goal > 0 ? Math.min(100, Math.round((collected / goal) * 100)) : 0;
    const remainingAmount = goal > 0 ? Math.max(0, goal - collected) : 0;

    return {
      ...selected,
      categoryName: selected.category?.name || selected.categoryName || 'জরুরি ক্যাম্পেইন',
      progressPercent,
      remainingAmount,
    };
  }

  // --------------------------------------------------------------------------
  // 3. PUBLIC: Campaign Details by ID or Slug
  // --------------------------------------------------------------------------
  public async getPublicCampaignDetails(idOrSlug: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        status: { in: ['ACTIVE', 'COMPLETED', 'PAUSED'] },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        shortDescription: true,
        description: true,
        goalAmount: true,
        collectedAmount: true,
        startDate: true,
        endDate: true,
        location: true,
        status: true,
        isFeatured: true,
        categoryName: true,
        category: {
          select: { id: true, name: true, icon: true },
        },
        _count: {
          select: {
            donations: {
              where: { status: 'VERIFIED' },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundError('ক্যাম্পেইনটি খুঁজে পাওয়া যায়নি বা এটি সক্রিয় নেই');
    }

    const goal = campaign.goalAmount || 0;
    const collected = campaign.collectedAmount || 0;
    const progressPercent = goal > 0 ? Math.min(100, Math.round((collected / goal) * 100)) : 0;
    const remainingAmount = goal > 0 ? Math.max(0, goal - collected) : 0;

    return {
      ...campaign,
      categoryName: campaign.category?.name || campaign.categoryName || 'সাধারণ',
      totalVerifiedDonationsCount: campaign._count.donations,
      progressPercent,
      remainingAmount,
    };
  }

  // --------------------------------------------------------------------------
  // 4. PUBLIC: Submit Login-Free Donation
  // --------------------------------------------------------------------------
  public async submitPublicDonation(
    campaignId: string,
    data: {
      donorName: string;
      donorPhone: string;
      donorEmail?: string;
      amount: number;
      paymentMethod: string;
      trxId?: string;
      senderNumber?: string;
      receiptUrl?: string;
      donorNotes?: string;
    },
    ipAddress?: string,
    userId?: string,
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, title: true, status: true },
    });

    if (!campaign) {
      throw new NotFoundError('ক্যাম্পেইন রেকর্ড পাওয়া যায়নি');
    }

    if (campaign.status !== 'ACTIVE') {
      throw new BadRequestError('বর্তমানে এই ক্যাম্পেইনে অনুদান গ্রহণ সাময়িকভাবে স্থগিত রয়েছে');
    }

    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const rand = crypto.randomInt(1000, 9999);
    const receiptNumber = `AMP-DON-${yearMonth}-${rand}`;

    const donation = await this.prisma.campaignDonation.create({
      data: {
        campaignId,
        donorName: data.donorName.trim(),
        donorPhone: data.donorPhone.trim(),
        donorEmail: data.donorEmail?.trim() || null,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        trxId: data.trxId?.trim() || null,
        senderNumber: data.senderNumber?.trim() || null,
        receiptUrl: data.receiptUrl || null,
        receiptNumber,
        status: 'PENDING',
        donorNotes: data.donorNotes?.trim() || null,
        userId: userId || null,
        ipAddress: ipAddress || null,
      },
    });

    // Real-Time WebSocket broadcast to authorized admins immediately
    realtimeService.publishCampaignDonationSubmitted({
      campaignId,
      campaignTitle: campaign.title,
      donationId: donation.id,
      donorName: donation.donorName,
      donorPhone: donation.donorPhone,
      amount: Number(donation.amount),
      paymentMethod: donation.paymentMethod,
      trxId: donation.trxId,
      receiptNumber: donation.receiptNumber,
      status: 'PENDING',
      submittedAt: donation.createdAt.toISOString(),
    });

    // Notify officers and admins of incoming donation
    this.notificationService
      .sendPushToOfficers({
        title: 'নতুন ক্যাম্পেইন অনুদান জমা 🔔',
        body: `"${campaign.title}" ক্যাম্পেইনে ৳${data.amount} টাকার অনুদান জমা দিয়েছেন ${data.donorName} (${data.paymentMethod})। যাচাই প্রয়োজন।`,
        url: '/organization/admin/campaigns',
        sound: '/sounds/notification.wav',
      })
      ?.catch(() => {});

    return {
      success: true,
      donationId: donation.id,
      receiptNumber: donation.receiptNumber,
      campaignTitle: campaign.title,
      amount: donation.amount,
      donorName: donation.donorName,
      status: donation.status,
      submittedAt: donation.createdAt,
      message: 'আপনার অনুদানের তথ্য সফলভাবে জমা হয়েছে। অ্যাডমিন যাচাইয়ের পর এটি অনুমোদিত হবে। ধন্যবাদ!',
    };
  }

  // --------------------------------------------------------------------------
  // 5. PUBLIC: Categories & Payment Methods
  // --------------------------------------------------------------------------
  public async getPublicCategories() {
    return this.prisma.campaignCategory.findMany({
      where: { isActive: true, isArchived: false },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  public async getPublicPaymentMethods() {
    return this.prisma.campaignPaymentConfig.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  public async trackDonationByReceipt(receiptNumber: string) {
    if (!receiptNumber || receiptNumber.trim().length < 5) {
      throw new BadRequestError('অনুগ্রহ করে সঠিক রসিদ নম্বর প্রদান করুন');
    }

    const cleanReceipt = receiptNumber.trim().toUpperCase();

    const donation = await this.prisma.campaignDonation.findFirst({
      where: {
        receiptNumber: { equals: cleanReceipt, mode: 'insensitive' },
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            slug: true,
            goalAmount: true,
            collectedAmount: true,
            status: true,
            coverImage: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!donation) {
      throw new NotFoundError('এই রসিদ নম্বরের বিপরীতে কোনো অনুদানের রেকর্ড পাওয়া যায়নি');
    }

    const target = Number(donation.campaign.goalAmount) || 1;
    const collected = Number(donation.campaign.collectedAmount) || 0;
    const progressPercent = Math.min(100, Math.round((collected / target) * 100));

    return {
      receiptNumber: donation.receiptNumber,
      status: donation.status,
      donorName: donation.donorName,
      amount: Number(donation.amount),
      paymentMethod: donation.paymentMethod,
      senderNumber: donation.senderNumber ? donation.senderNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null,
      submittedAt: donation.createdAt,
      verifiedAt: donation.verifiedAt,
      rejectionReason: donation.status === 'REJECTED' ? donation.rejectionReason : null,
      campaign: {
        id: donation.campaign.id,
        title: donation.campaign.title,
        slug: donation.campaign.slug,
        goalAmount: target,
        collectedAmount: collected,
        progressPercent,
        status: donation.campaign.status,
        coverImage: donation.campaign.coverImage,
      },
    };
  }

  // ==========================================================================
  // ADMIN SECTION
  // ==========================================================================

  // --------------------------------------------------------------------------
  // 6. ADMIN: Overview & Analytics
  // --------------------------------------------------------------------------
  public async getAdminOverview(userId: string) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role);

    const [
      totalCampaigns,
      activeCampaigns,
      scheduledCampaigns,
      completedCampaigns,
      pausedCampaigns,
      totalVerifiedAgg,
      totalPendingAgg,
      pendingCount,
      rejectedCount,
      verifiedCount,
      totalExpensesAgg,
      recentDonations,
    ] = await Promise.all([
      this.prisma.campaign.count(),
      this.prisma.campaign.count({ where: { status: 'ACTIVE' } }),
      this.prisma.campaign.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.campaign.count({ where: { status: 'COMPLETED' } }),
      this.prisma.campaign.count({ where: { status: 'PAUSED' } }),
      this.prisma.campaignDonation.aggregate({
        where: { status: 'VERIFIED' },
        _sum: { amount: true },
      }),
      this.prisma.campaignDonation.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
      this.prisma.campaignDonation.count({ where: { status: 'PENDING' } }),
      this.prisma.campaignDonation.count({ where: { status: 'REJECTED' } }),
      this.prisma.campaignDonation.count({ where: { status: 'VERIFIED' } }),
      this.prisma.campaignExpense.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.campaignDonation.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          campaign: { select: { id: true, title: true } },
        },
      }),
    ]);

    const totalVerifiedAmount = Number(totalVerifiedAgg._sum.amount || 0);
    const totalPendingAmount = Number(totalPendingAgg._sum.amount || 0);
    const totalExpensesAmount = Number(totalExpensesAgg._sum.amount || 0);
    const netCampaignBalance = Math.max(0, totalVerifiedAmount - totalExpensesAmount);

    return {
      counts: {
        totalCampaigns,
        activeCampaigns,
        scheduledCampaigns,
        completedCampaigns,
        pausedCampaigns,
        pendingDonations: pendingCount,
        verifiedDonations: verifiedCount,
        rejectedDonations: rejectedCount,
      },
      financials: {
        totalVerifiedAmount,
        totalPendingAmount,
        totalExpensesAmount,
        netCampaignBalance,
      },
      recentDonations,
    };
  }

  // --------------------------------------------------------------------------
  // 7. ADMIN: Campaigns CRUD
  // --------------------------------------------------------------------------
  public async getAdminCampaigns(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      status?: string;
      categoryId?: string;
      search?: string;
    },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role);

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.CampaignWhereInput = {
      ...(params.status && params.status !== 'ALL' ? { status: params.status } : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: 'insensitive' } },
              { shortDescription: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.campaign.count({ where }),
      this.prisma.campaign.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          _count: {
            select: {
              donations: true,
              expenses: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async createCampaign(
    userId: string,
    data: {
      title: string;
      slug?: string;
      categoryId?: string;
      coverImage: string;
      shortDescription: string;
      description: string;
      goalAmount?: number | null;
      startDate: string;
      endDate: string;
      location?: string;
      status?: string;
      isFeatured?: boolean;
      priority?: number;
    },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN', 'MODERATOR']);

    let categoryName = null;
    if (data.categoryId) {
      const cat = await this.prisma.campaignCategory.findUnique({ where: { id: data.categoryId } });
      if (cat) categoryName = cat.name;
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        title: data.title.trim(),
        slug: data.slug?.trim() || `camp-${Date.now()}`,
        categoryId: data.categoryId || null,
        categoryName,
        coverImage: data.coverImage,
        shortDescription: data.shortDescription.trim(),
        description: data.description.trim(),
        goalAmount: data.goalAmount || null,
        collectedAmount: 0,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        location: data.location?.trim() || null,
        status: data.status || 'DRAFT',
        isFeatured: data.isFeatured || false,
        priority: data.priority || 0,
        createdBy: userId,
      },
    });

    return campaign;
  }

  public async updateCampaign(
    userId: string,
    campaignId: string,
    data: Partial<{
      title: string;
      slug?: string;
      categoryId?: string;
      coverImage: string;
      shortDescription: string;
      description: string;
      goalAmount?: number | null;
      startDate: string;
      endDate: string;
      location?: string;
      status?: string;
      isFeatured?: boolean;
      priority?: number;
    }>,
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN', 'MODERATOR']);

    let categoryName: string | undefined = undefined;
    if (data.categoryId) {
      const cat = await this.prisma.campaignCategory.findUnique({ where: { id: data.categoryId } });
      if (cat) categoryName = cat.name;
    }

    const updated = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.slug !== undefined ? { slug: data.slug?.trim() || null } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId || null } : {}),
        ...(categoryName ? { categoryName } : {}),
        ...(data.coverImage ? { coverImage: data.coverImage } : {}),
        ...(data.shortDescription ? { shortDescription: data.shortDescription.trim() } : {}),
        ...(data.description ? { description: data.description.trim() } : {}),
        ...(data.goalAmount !== undefined ? { goalAmount: data.goalAmount || null } : {}),
        ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
        ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
        ...(data.location !== undefined ? { location: data.location?.trim() || null } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
      },
    });

    return updated;
  }

  public async updateCampaignStatus(userId: string, campaignId: string, status: string) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    const updated = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status },
      select: { id: true, slug: true, collectedAmount: true, goalAmount: true, status: true },
    });

    const col = Number(updated.collectedAmount);
    const goal = updated.goalAmount ? Number(updated.goalAmount) : null;
    const progress = goal && goal > 0 ? Math.min(100, Math.round((col / goal) * 100)) : 0;
    const remaining = goal ? Math.max(0, goal - col) : null;

    realtimeService.publishCampaignProgress({
      campaignId: updated.id,
      slug: updated.slug,
      collectedAmount: col,
      goalAmount: goal,
      progressPercentage: progress,
      remainingAmount: remaining,
      status: updated.status,
      updatedAt: new Date().toISOString(),
    });

    return updated;
  }

  public async getAdminCampaignDetails(userId: string, campaignId: string) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role);

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        category: true,
        expenses: { orderBy: { expenseDate: 'desc' } },
        _count: {
          select: {
            donations: true,
            expenses: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundError('ক্যাম্পেইন রেকর্ড পাওয়া যায়নি');
    }

    const [verifiedAgg, pendingAgg, rejectedCount] = await Promise.all([
      this.prisma.campaignDonation.aggregate({
        where: { campaignId, status: 'VERIFIED' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.campaignDonation.aggregate({
        where: { campaignId, status: 'PENDING' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.campaignDonation.count({
        where: { campaignId, status: 'REJECTED' },
      }),
    ]);

    const totalExpense = campaign.expenses.reduce((sum, e) => sum + e.amount, 0);
    const verifiedCollected = Number(verifiedAgg._sum.amount || 0);
    const remainingBalance = Math.max(0, verifiedCollected - totalExpense);

    return {
      ...campaign,
      analytics: {
        verifiedAmount: verifiedCollected,
        verifiedCount: verifiedAgg._count.id,
        pendingAmount: Number(pendingAgg._sum.amount || 0),
        pendingCount: pendingAgg._count.id,
        rejectedCount,
        totalExpense,
        remainingBalance,
      },
    };
  }

  // --------------------------------------------------------------------------
  // 8. ADMIN: Donations Management & Verification
  // --------------------------------------------------------------------------
  public async getAdminDonations(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      campaignId?: string;
      status?: string;
      paymentMethod?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role);

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 25));
    const skip = (page - 1) * limit;

    const where: Prisma.CampaignDonationWhereInput = {
      ...(params.campaignId ? { campaignId: params.campaignId } : {}),
      ...(params.status && params.status !== 'ALL' ? { status: params.status } : {}),
      ...(params.paymentMethod ? { paymentMethod: params.paymentMethod } : {}),
      ...(params.search
        ? {
            OR: [
              { donorName: { contains: params.search, mode: 'insensitive' } },
              { donorPhone: { contains: params.search, mode: 'insensitive' } },
              { senderNumber: { contains: params.search, mode: 'insensitive' } },
              { receiptNumber: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(params.startDate || params.endDate
        ? {
            createdAt: {
              ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
              ...(params.endDate ? { lte: new Date(params.endDate) } : {}),
            },
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.campaignDonation.count({ where }),
      this.prisma.campaignDonation.findMany({
        where,
        include: {
          campaign: { select: { id: true, title: true } },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async reviewDonation(
    reviewerId: string,
    donationId: string,
    status: 'VERIFIED' | 'REJECTED',
    rejectionReason?: string,
    notes?: string,
  ) {
    const role = await this.getOfficerRole(reviewerId);
    this.requireOfficer(role, ['PRESIDENT', 'TREASURER', 'ADMIN', 'MODERATOR']);

    const donation = await this.prisma.campaignDonation.findUnique({
      where: { id: donationId },
      include: { campaign: { select: { id: true, title: true, collectedAmount: true } } },
    });

    if (!donation) {
      throw new NotFoundError('অনুদান রেকর্ড খুঁজে পাওয়া যায়নি');
    }

    if (donation.status === status) {
      return donation; // Idempotent: already in requested status
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const prevStatus = donation.status;

      const updated = await tx.campaignDonation.update({
        where: { id: donationId },
        data: {
          status,
          verifiedBy: reviewerId,
          verifiedAt: new Date(),
          rejectionReason: status === 'REJECTED' ? rejectionReason || 'যাচাইয়ে অসঙ্গতি পরিলক্ষিত হয়েছে' : null,
          notes: notes ? (donation.notes ? `${donation.notes} | ${notes}` : notes) : donation.notes,
        },
      });

      // Recalculate or atomically adjust campaign.collectedAmount
      if (status === 'VERIFIED' && prevStatus !== 'VERIFIED') {
        await tx.campaign.update({
          where: { id: donation.campaignId },
          data: {
            collectedAmount: { increment: donation.amount },
          },
        });
      } else if (prevStatus === 'VERIFIED' && status === 'REJECTED') {
        await tx.campaign.update({
          where: { id: donation.campaignId },
          data: {
            collectedAmount: { decrement: donation.amount },
          },
        });
      }

      return updated;
    });

    // Real-Time Events (Database transaction completed successfully first)
    // 1. Notify Admin Channel of donation review
    realtimeService.publishCampaignDonationReviewed({
      campaignId: donation.campaignId,
      donationId,
      status,
      amount: Number(donation.amount),
      rejectionReason: status === 'REJECTED' ? rejectionReason || null : null,
      reviewedAt: new Date().toISOString(),
    });

    // 2. If status was updated to/from VERIFIED, fetch updated campaign and broadcast progress to PUBLIC
    const prevStatus = donation.status;
    if ((status === 'VERIFIED' && prevStatus !== 'VERIFIED') || (prevStatus === 'VERIFIED' && status === 'REJECTED')) {
      Promise.resolve(
        this.prisma.campaign?.findUnique?.({
          where: { id: donation.campaignId },
          select: { id: true, slug: true, collectedAmount: true, goalAmount: true, status: true },
        }),
      )
        .then((updatedCamp) => {
          if (updatedCamp) {
            const col = Number(updatedCamp.collectedAmount);
            const goal = updatedCamp.goalAmount ? Number(updatedCamp.goalAmount) : null;
            const progress = goal && goal > 0 ? Math.min(100, Math.round((col / goal) * 100)) : 0;
            const remaining = goal ? Math.max(0, goal - col) : null;

            realtimeService.publishCampaignProgress({
              campaignId: updatedCamp.id,
              slug: updatedCamp.slug,
              collectedAmount: col,
              goalAmount: goal,
              progressPercentage: progress,
              remainingAmount: remaining,
              status: updatedCamp.status,
              updatedAt: new Date().toISOString(),
            });
          }
        })
        .catch(() => {});
    }

    return result;
  }

  // --------------------------------------------------------------------------
  // 9. ADMIN: Campaign Expenses (Separate Financial Ledger)
  // --------------------------------------------------------------------------
  public async recordExpense(
    userId: string,
    data: {
      campaignId: string;
      amount: number;
      purpose: string;
      description?: string;
      expenseDate?: string;
      voucherUrl?: string;
      performedBy: string;
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

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: data.campaignId },
    });
    if (!campaign) {
      throw new NotFoundError('ক্যাম্পেইন রেকর্ড পাওয়া যায়নি');
    }

    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.campaignExpense.create({
        data: {
          campaignId: data.campaignId,
          amount: data.amount,
          purpose: data.purpose.trim(),
          description: data.description?.trim() || null,
          expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
          voucherUrl: data.voucherUrl || null,
          performedBy: data.performedBy.trim(),
        },
      });

      if (data.items && data.items.length > 0) {
        await tx.expenseItem.createMany({
          data: data.items.map((it) => ({
            campaignExpenseId: expense.id,
            itemName: it.itemName.trim(),
            amount: it.amount,
            category: it.category?.trim() || null,
            description: it.description?.trim() || null,
            expenseDate: it.expenseDate ? new Date(it.expenseDate) : (data.expenseDate ? new Date(data.expenseDate) : new Date()),
            responsiblePerson: it.responsiblePerson?.trim() || data.performedBy.trim(),
            receiptUrl: it.receiptUrl || data.voucherUrl || null,
          })),
        });
      }

      if (typeof tx.campaignExpense?.findUnique === 'function') {
        const fullExpense = await tx.campaignExpense.findUnique({
          where: { id: expense.id },
          include: { items: true, campaign: { select: { id: true, title: true } } },
        });
        if (fullExpense) return fullExpense;
      }

      return expense;
    });
  }

  public async getExpenses(userId: string, campaignId?: string) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role);

    return this.prisma.campaignExpense.findMany({
      where: campaignId ? { campaignId } : undefined,
      include: {
        campaign: { select: { id: true, title: true } },
        items: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { expenseDate: 'desc' },
    });
  }

  // --------------------------------------------------------------------------
  // 10. ADMIN: Category Management
  // --------------------------------------------------------------------------
  public async getAdminCategories(userId: string) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role);

    return this.prisma.campaignCategory.findMany({
      orderBy: [{ isArchived: 'asc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { campaigns: true } },
      },
    });
  }

  public async createCategory(
    userId: string,
    data: { name: string; description?: string; icon?: string; displayOrder?: number },
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    const existing = await this.prisma.campaignCategory.findUnique({
      where: { name: data.name.trim() },
    });
    if (existing) {
      if (existing.isArchived) {
        // Unarchive
        return this.prisma.campaignCategory.update({
          where: { id: existing.id },
          data: { isArchived: false, isActive: true },
        });
      }
      throw new BadRequestError('এই নামের ক্যাটাগরি ইতিমধ্যে বিদ্যমান রয়েছে');
    }

    return this.prisma.campaignCategory.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        icon: data.icon?.trim() || 'HeartHandshake',
        displayOrder: data.displayOrder || 0,
        isActive: true,
      },
    });
  }

  public async updateCategory(
    userId: string,
    id: string,
    data: Partial<{ name: string; description: string; icon: string; displayOrder: number; isActive: boolean; isArchived: boolean }>,
  ) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role, ['PRESIDENT', 'ADMIN']);

    return this.prisma.campaignCategory.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
        ...(data.icon !== undefined ? { icon: data.icon?.trim() || null } : {}),
        ...(data.displayOrder !== undefined ? { displayOrder: data.displayOrder } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.isArchived !== undefined ? { isArchived: data.isArchived } : {}),
      },
    });
  }

  // --------------------------------------------------------------------------
  // 11. ADMIN: Payment Configurations
  // --------------------------------------------------------------------------
  public async getAdminPaymentConfigs(userId: string) {
    const role = await this.getOfficerRole(userId);
    this.requireOfficer(role);

    return this.prisma.campaignPaymentConfig.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  public async updatePaymentConfig(
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

    return this.prisma.campaignPaymentConfig.upsert({
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

