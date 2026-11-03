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
  payments: ContributionPayment[];
  calendar: Array<{
    month: number;
    year: number;
    isPaid: boolean;
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
  }>;
  recentPayments?: Array<{
    id: string;
    amount: number;
    periodMonth: number;
    periodYear: number;
    status: string;
    paidAt: string;
    user?: { id?: string; name: string; email: string; image?: string | null };
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
  fund?: {
    name: string;
    code: string;
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
  progress: number;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  isPublic: boolean;
  startDate: string | null;
  endDate: string | null;
  images: string[];
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

