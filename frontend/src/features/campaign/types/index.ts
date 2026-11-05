export interface CampaignCategory {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
  isArchived: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    campaigns: number;
  };
}

export type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export interface Campaign {
  id: string;
  title: string;
  slug?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  category?: {
    id: string;
    name: string;
    icon?: string | null;
  } | null;
  coverImage: string;
  shortDescription: string;
  description?: string;
  goalAmount?: number | null;
  collectedAmount: number;
  startDate: string;
  endDate: string;
  location?: string | null;
  status: CampaignStatus;
  isFeatured: boolean;
  priority: number;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  progressPercent?: number;
  remainingAmount?: number;
  totalVerifiedDonationsCount?: number;
  expenses?: CampaignExpense[];
  _count?: {
    donations: number;
    expenses: number;
  };
}

export type DonationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type PaymentMethod = 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'CASH' | 'OTHER';

export interface CampaignDonation {
  id: string;
  campaignId: string;
  campaign?: {
    id: string;
    title: string;
  };
  donorName: string;
  donorPhone: string;
  donorEmail?: string | null;
  amount: number;
  paymentMethod: PaymentMethod | string;
  trxId?: string | null;
  senderNumber?: string | null;
  receiptUrl?: string | null;
  receiptNumber: string;
  status: DonationStatus;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  notes?: string | null;
  donorNotes?: string | null;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignExpense {
  id: string;
  campaignId: string;
  campaign?: {
    id: string;
    title: string;
  };
  amount: number;
  purpose: string;
  description?: string | null;
  expenseDate: string;
  voucherUrl?: string | null;
  performedBy: string;
  createdAt: string;
}

export interface CampaignPaymentConfig {
  id: string;
  method: string;
  title: string;
  accountNumber: string;
  accountType: string;
  instructions?: string | null;
  qrCodeUrl?: string | null;
  isActive: boolean;
}

export interface CampaignAdminOverview {
  counts: {
    totalCampaigns: number;
    activeCampaigns: number;
    scheduledCampaigns: number;
    completedCampaigns: number;
    pausedCampaigns: number;
    pendingDonations: number;
    verifiedDonations: number;
    rejectedDonations: number;
  };
  financials: {
    totalVerifiedAmount: number;
    totalPendingAmount: number;
    totalExpensesAmount: number;
    netCampaignBalance: number;
  };
  recentDonations: CampaignDonation[];
}

export interface CampaignDonationTracking {
  receiptNumber: string;
  status: DonationStatus;
  donorName: string;
  amount: number;
  paymentMethod: string;
  senderNumber?: string | null;
  submittedAt: string;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  campaign: {
    id: string;
    title: string;
    slug?: string | null;
    goalAmount: number;
    collectedAmount: number;
    progressPercent: number;
    status: CampaignStatus;
    coverImage: string;
  };
}

