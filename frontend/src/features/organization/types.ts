export interface OrgOverview {
  organizationName: string;
  tagline: string;
  established: number;
  stats: {
    activeMembers: number;
    activeProjects: number;
    totalFundsCount: number;
  };
  publicNotices: OrgNotice[];
  publicProjects: OrgProject[];
  funds: Array<{
    id: string;
    name: string;
    code: string;
    description: string | null;
  }>;
}

export interface OrgMembership {
  id: string;
  userId: string;
  memberId: string;
  memberNumber?: string | null;
  monthlyContribution?: number;
  orgRole: string; // 'PRESIDENT' | 'VICE_PRESIDENT' | 'GENERAL_SECRETARY' | 'TREASURER' | 'MODERATOR' | 'MEMBER'
  status: 'PENDING' | 'APPROVED_PAYMENT_PENDING' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  joinedAt: string;
  approvedAt: string | null;
  designation?: {
    id: string;
    title: string;
    level: number;
  } | null;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    image: string | null;
  };
}

export interface OrgApplication {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  profession: string;
  monthlyContribution: number;
  agreedToMonthlyFee: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  submittedAt?: string;
  createdAt: string;
  reviewedAt: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    image: string | null;
  };
}

export interface ContributionAgreement {
  id: string;
  userId: string;
  agreedAmount: number;
  effectiveFrom: string;
  isCurrent: boolean;
}

export interface ContributionPayment {
  id: string;
  userId: string;
  fundId?: string;
  amount: number;
  periodMonth: number;
  periodYear: number;
  paymentMethod: string;
  trxId: string | null;
  senderNumber: string | null;
  receiptNumber?: string;
  notes?: string | null;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'VERIFIED' | string;
  paidAt: string;
  createdAt?: string;
  updatedAt?: string;
  fund?: {
    name: string;
    code: string;
  };
}

export interface OrgMembershipStatus {
  hasMembership: boolean;
  membership: OrgMembership | null;
  latestApplication: OrgApplication | null;
  currentAgreement: ContributionAgreement | null;
}

export interface OrgMemberDashboardData {
  membership: OrgMembership;
  agreement: ContributionAgreement | null;
  totalContributed: number;
  pendingDueCount: number;
  totalDueAmount?: number;
  dueBreakdown?: Array<{
    year: number;
    month: number;
    monthName: string;
    amount: number;
    status: 'DUE' | 'PENDING';
  }>;
  pendingReviewCount?: number;
  payments: ContributionPayment[];
  calendar: Array<{
    month: number;
    year: number;
    isPaid: boolean;
    isPending?: boolean;
    isEligible?: boolean;
    status?: 'VERIFIED' | 'PENDING' | 'DUE' | 'NOT_APPLICABLE' | string;
    amount: number;
    paidAt?: string;
  }>;
  upcomingMeetings: OrgMeeting[];
  latestNotices: OrgNotice[];
  activeElectionsCount: number;
}

export interface FinancialTrendPoint {
  label: string;
  fullDate: string;
  dateStr?: string;
  income: number;
  expense: number;
  net: number;
  isToday?: boolean;
  isCurrent?: boolean;
}

export interface FinancialTrendPeriodData {
  subtitle: string;
  points: FinancialTrendPoint[];
  totalIncome: number;
  totalExpense: number;
  netSurplus: number;
}

export interface FundAllocationItem {
  id: string;
  name: string;
  code: string;
  shortName: string;
  balance: number;
  percentage: number;
  color: string;
}

export interface FinancialTrends {
  weekly: FinancialTrendPeriodData;
  monthly: FinancialTrendPeriodData;
  yearly: FinancialTrendPeriodData;
  fundAllocation: {
    fundCount: number;
    isAudited: boolean;
    totalBalance: number;
    funds: FundAllocationItem[];
  };
}

export interface OrgAdminStats {
  memberCounts: {
    total: number;
    active: number;
    pendingPayment: number;
    pendingApplications: number;
  };
  funds: {
    totalBalance: number;
    fundList: Array<{
      id: string;
      name: string;
      code: string;
      currentBalance: number;
      isDefault: boolean;
    }>;
  };
  financialSummary: {
    totalIncome: number;
    totalExpense: number;
    totalContributions: number;
    netBalance?: number;
    totalCampaignDonations?: number;
    totalFundExpenses?: number;
    totalCampaignExpenses?: number;
  };
  financialTrends?: FinancialTrends;
  elections: {
    activeElections: number;
  };
  recentTransactions?: Array<{
    id: string;
    fundId: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'CONTRIBUTION';
    amount: number;
    title: string;
    description?: string | null;
    createdAt: string;
    fund?: { name: string; code: string };
    items?: ExpenseItem[];
  }>;
  recentPayments?: Array<{
    id: string;
    amount: number;
    periodMonth: number;
    periodYear: number;
    paymentMethod?: string;
    trxId?: string | null;
    senderNumber?: string | null;
    receiptNumber?: string;
    status: string;
    notes?: string | null;
    paidAt: string;
    createdAt?: string;
    user?: { id?: string; name: string; email: string; image?: string | null; phone?: string | null };
  }>;
}

export interface OrgFund {
  id: string;
  name: string;
  code: string;
  description: string | null;
  balance?: number;
  currentBalance?: number;
  isDefault?: boolean;
  createdAt?: string;
  transactions?: OrgTransaction[];
  _count?: { transactions: number };
}

export interface ExpenseItem {
  id: string;
  transactionId?: string | null;
  campaignExpenseId?: string | null;
  projectId?: string | null;
  itemName: string;
  amount: number;
  category?: string | null;
  description?: string | null;
  expenseDate: string;
  responsiblePerson?: string | null;
  receiptUrl?: string | null;
  createdAt?: string;
}

export interface OrgTransaction {
  id: string;
  fundId: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'CONTRIBUTION';
  amount: number;
  title: string;
  description: string | null;
  category: string | null;
  receiptUrl: string | null;
  referenceId: string | null;
  createdAt: string;
  projectId?: string | null;
  campaignId?: string | null;
  items?: ExpenseItem[];
  fund?: {
    name: string;
    code: string;
  };
  project?: {
    id: string;
    title: string;
    category?: string;
  };
  campaign?: {
    id: string;
    title: string;
    slug?: string | null;
  };
  recordedBy?: {
    name: string;
  };
}

export interface OrgCommittee {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  members: Array<{
    id: string;
    userId: string;
    customTitle: string | null;
    user: {
      id: string;
      name: string;
      image: string | null;
      phone: string | null;
    };
    designation: {
      id: string;
      title: string;
      level: number;
    };
  }>;
}

export interface OrgDesignation {
  id: string;
  code: string;
  title: string;
  level: number;
}

export interface OrgMeeting {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string;
  agenda: string | null;
  minutes: string | null;
  attendances?: Array<{
    id: string;
    userId: string;
    attended: boolean;
  }>;
}

export interface OrgNotice {
  id: string;
  title: string;
  content: string;
  priority: 'URGENT' | 'NORMAL' | 'LOW';
  isPinned: boolean;
  isPublic: boolean;
  publishedAt: string;
  expiresAt: string | null;
}

export interface OrgProject {
  id: string;
  title: string;
  description: string;
  budget: number;
  spent?: number;
  progress: number;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  isPublic: boolean;
  startDate: string | null;
  endDate: string | null;
  images: string[];
  category?: 'GENERAL' | 'HUMANITARIAN' | 'TREE_PLANTATION' | string;
  beneficiaryName?: string | null;
  beneficiaryPhone?: string | null;
  beneficiaryAddress?: string | null;
  assistanceType?: string | null;
  consentGiven?: boolean;
  childName?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  birthDate?: string | null;
  birthPlace?: string | null;
  treesPlanted?: string | null;
  plantationLocation?: string | null;
  plantationDate?: string | null;
  fundId?: string | null;
  items?: ExpenseItem[];
}

export interface TransparencySummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalContributions: number;
  totalCampaignDonations: number;
  totalGeneralIncome: number;
  totalFundExpenses: number;
  totalCampaignExpenses: number;
  totalFundsBalance: number;
  humanitarianCount: number;
  treePlantationCount: number;
  completedCampaignsCount: number;
}

export interface TransparencyFund {
  id: string;
  name: string;
  code: string;
  description: string | null;
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
  transactions: OrgTransaction[];
}

export interface TransparencyCampaign {
  id: string;
  title: string;
  slug: string | null;
  coverImage: string;
  goalAmount: number | null;
  collectedAmount: number;
  totalExpenses: number;
  remainingBalance: number;
  status: string;
  startDate: string;
  endDate: string;
  shortDescription: string;
  description: string;
  expenses: Array<{
    id: string;
    amount: number;
    purpose: string;
    description: string | null;
    expenseDate: string;
    voucherUrl: string | null;
    performedBy: string;
    items?: ExpenseItem[];
  }>;
  donationsCount: number;
}

export interface TransparencyIncomeItem {
  id: string;
  date: string;
  amount: number;
  source: 'MEMBERSHIP_CONTRIBUTION' | 'CAMPAIGN_DONATION' | 'GENERAL_FUND_INCOME';
  sourceLabel: string;
  title: string;
  receiptNumber: string | null;
  paymentMethod: string;
}

export interface TransparencyExpenseItem {
  id: string;
  date: string;
  amount: number;
  type: 'FUND_EXPENSE' | 'CAMPAIGN_EXPENSE';
  title: string;
  description: string | null;
  category: string;
  fundName: string;
  fundCode: string;
  campaignTitle: string | null;
  projectTitle: string | null;
  receiptUrl: string | null;
  items: ExpenseItem[];
}

export interface FinancialTransparencyData {
  summary: TransparencySummary;
  funds: TransparencyFund[];
  humanitarianActivities: Array<OrgProject & {
    beneficiaryDisplayName: string | null;
    beneficiaryDisplayPhone: string | null;
  }>;
  treePlantations: OrgProject[];
  campaigns: TransparencyCampaign[];
  recentIncomes: TransparencyIncomeItem[];
  recentExpenses: TransparencyExpenseItem[];
}

export interface OrgDocument {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  category: string;
  accessLevel: 'PUBLIC' | 'MEMBERS_ONLY' | 'OFFICERS_ONLY';
  createdAt: string;
}

export interface Election {
  id: string;
  title: string;
  description: string | null;
  status:
    | 'DRAFT'
    | 'UPCOMING'
    | 'NOMINATION_OPEN'
    | 'CANDIDATE_REVIEW'
    | 'CANDIDATES_PUBLISHED'
    | 'VOTING_ACTIVE'
    | 'VOTING_CLOSED'
    | 'COMPLETED'
    | 'RESULTS_REVIEW'
    | 'FINALIZED';
  nominationStartDate: string;
  nominationEndDate: string;
  votingStartDate: string;
  votingEndDate: string;
  rules: string | null;
  positions: ElectionPosition[];
  results?: ElectionResult[];
  hasVoted?: boolean;
  userVoterToken?: string | null;
  isEligible?: boolean;
  totalVotersCount?: number;
  votesCastCount?: number;
  isVotingEnabled?: boolean;
  announcement?: string | null;
  announcements?: { start: string; end: string };
  isLive?: boolean;
  isUpcoming?: boolean;
  isCompleted?: boolean;
}

export interface VotingConfig {
  isVotingEnabled: boolean;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface CreateCandidateInput {
  name: string;
  image?: string | null;
  bio?: string | null;
}

export interface CreateVotingPollInput {
  title: string;
  positionName: string;
  description?: string;
  candidates: CreateCandidateInput[];
  votingStartDate: string;
  votingEndDate: string;
  isDraft?: boolean;
}

export interface UpdateVotingScheduleInput {
  votingStartDate: string;
  votingEndDate: string;
  reason?: string;
}

export interface VotingPollMonitoring {
  electionId: string;
  title: string;
  status: string;
  positionName: string;
  totalVotersCount: number;
  votesCastCount: number;
  turnoutPercentage: number;
  candidates: Array<{
    id: string;
    candidateName: string;
    candidatePhoto: string | null;
    voteCount: number;
    votePercentage: number;
  }>;
  voters: Array<{
    userId: string;
    name: string;
    memberNumber: string | null;
    votedAt: string;
  }>;
  notVotedCount: number;
}

export interface ElectionPosition {
  id: string;
  designationId: string;
  maxWinners: number;
  designation: {
    id: string;
    title?: string;
    name?: string;
    code: string;
    level?: number;
    rank?: number;
  };
  nominations: ElectionNomination[];
}

export interface ElectionNomination {
  id: string;
  userId: string;
  electionPositionId?: string;
  positionId?: string;
  candidateName: string;
  candidatePhoto: string | null;
  experience: string | null;
  manifesto: string;
  status?: string;
  reviewNotes?: string | null;
  user?: {
    id: string;
    name: string;
    image: string | null;
  };
}

export interface ElectionResult {
  id: string;
  positionId?: string;
  candidateNominationId?: string;
  voteCount?: number;
  votesCount?: number;
  votePercentage?: number;
  isWinner: boolean;
  candidateName?: string;
  candidatePhoto?: string | null;
  position?: {
    designation: {
      title?: string;
      name?: string;
    };
  };
  candidate?: {
    candidateName: string;
    candidatePhoto: string | null;
  };
}



// ==========================================
// Organization Member Management & Tracking Types
// ==========================================

export interface MemberDirectoryItem {
  id: string;
  userId: string;
  memberNumber: string | null;
  profession: string | null;
  orgRole: string;
  joinedAt: string | null;
  createdAt: string;
  designation: {
    id: string;
    name: string;
    code: string;
    rank: number;
  } | null;
  user: {
    id: string;
    name: string;
    image: string | null;
    phone: string | null;
    email: string | null;
    bio: string | null;
  };
}

export interface MemberDirectoryResult {
  members: MemberDirectoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminMemberSummaryCounts {
  totalRegistered: number;
  totalActive: number;
  pendingApps: number;
  approvedPaymentPending: number;
  suspendedCount: number;
  archivedCount: number;
  paidThisMonth: number;
  unpaidThisMonth: number;
  overdueCount: number;
}

export interface AdminMemberItem {
  id: string;
  userId: string;
  memberNumber: string | null;
  status: 'ACTIVE' | 'APPROVED_PAYMENT_PENDING' | 'SUSPENDED' | 'ARCHIVED';
  joinedAt: string;
  monthlyContribution: number;
  lastReminderSentAt: string | null;
  designationId: string | null;
  designation: {
    id: string;
    name: string;
    code: string;
    rank: number;
  } | null;
  user: {
    id: string;
    name: string;
    phone: string | null;
    image: string | null;
    profession?: string | null;
    email?: string | null;
  };
  committees: Array<{
    committeeId: string;
    committeeName: string;
    customTitle: string | null;
  }>;
  currentMonthStatus: 'PAID' | 'UNPAID' | 'PENDING' | 'OVERDUE' | 'NOT_APPLICABLE';
  currentMonthPaidAmount?: number;
}

export interface AdminMembersResult {
  summary: AdminMemberSummaryCounts;
  members: AdminMemberItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  designations: Array<{ id: string; name: string; code: string; rank: number }>;
  committees: Array<{ id: string; name: string }>;
}

export interface AdminMemberDetails {
  membership: OrgMembership & {
    designation: { id: string; name: string; code: string; rank: number } | null;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    image: string | null;
    profession?: string | null;
    role?: string;
  };
  committees: Array<{
    id: string;
    committeeId: string;
    customTitle: string | null;
    isCurrent: boolean;
    startDate: string;
    endDate: string | null;
    committee: { id: string; name: string };
  }>;
  recentPayments: ContributionPayment[];
  payments?: ContributionPayment[];
  overdueMonths?: OverdueMonthDetail[];
  overdueMonthsCount?: number;
  totalOverdueAmount?: number;
  reminders: Array<{
    id: string;
    slot: string;
    sentAt: string;
    channel: string;
    periodMonth: number;
    periodYear: number;
  }>;
  currentMonthStatus: 'PAID' | 'UNPAID' | 'PENDING' | 'OVERDUE' | 'NOT_APPLICABLE';
}

export interface OverdueMonthDetail {
  year: number;
  month: number;
  monthName: string;
  amount: number;
  status: 'OVERDUE' | 'PENDING';
  formattedPeriod?: string;
}

export interface ContributionTrackingCategoryItem {
  memberId: string;
  userId: string;
  name: string;
  phone: string | null;
  image: string | null;
  memberNumber: string | null;
  agreedAmount: number;
  paidAmount?: number;
  submittedAmount?: number;
  paymentDate?: string;
  submittedAt?: string;
  verificationStatus?: string;
  paymentId?: string;
  trxId?: string | null;
  senderNumber?: string | null;
  receiptNumber?: string | null;
  paymentMethod?: string;
  periodMonth?: number;
  periodYear?: number;
  periodLabel?: string;
  dueMonth?: number;
  dueYear?: number;
  lastReminderSentAt?: string | null;
  designation?: string | null;
  overdueMonths?: OverdueMonthDetail[];
  overdueMonthsCount?: number;
  totalOverdueAmount?: number;
}

export interface ContributionTrackingResult {
  period: {
    year: number;
    month: number;
    monthName: string;
    totalActiveMembers: number;
  };
  counts: {
    paid: number;
    unpaid: number;
    pending: number;
    overdue: number;
  };
  paid: ContributionTrackingCategoryItem[];
  unpaid: ContributionTrackingCategoryItem[];
  pending: ContributionTrackingCategoryItem[];
  overdue: ContributionTrackingCategoryItem[];
}

export interface AdminDesignationItem {
  id: string;
  code: string;
  name: string;
  rank: number;
  description: string | null;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrgPaymentConfig {
  id: string;
  method: string;
  title: string;
  accountNumber: string;
  accountType: string;
  instructions: string | null;
  qrCodeUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
  lastLoginAt: string;
  providers: string[];
  isGoogle: boolean;
  isPassword: boolean;
  isMember: boolean;
  membership: {
    id: string;
    memberNumber: string | null;
    orgRole: string | null;
    joinedAt: string;
    designation: string | null;
    rank: number | null;
  } | null;
  applicationStatus: string | null;
}

export interface AdminUsersQueryParams {
  search?: string;
  type?: 'ALL' | 'GENERAL_USER' | 'MEMBER';
  provider?: 'ALL' | 'google' | 'credential';
  role?: 'ALL' | 'USER' | 'ADMIN';
  page?: number;
  limit?: number;
}

export interface AdminUsersResult {
  users: AdminUserItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    totalUsers: number;
    generalUsers: number;
    members: number;
    googleUsers: number;
  };
}
