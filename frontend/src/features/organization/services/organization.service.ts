import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';
import {
  OrgOverview,
  OrgMembershipStatus,
  OrgApplication,
  OrgMembership,
  OrgMemberDashboardData,
  OrgAdminStats,
  FinancialTrends,
  OrgFund,
  OrgTransaction,
  OrgCommittee,
  OrgDesignation,
  OrgMeeting,
  OrgNotice,
  OrgProject,
  OrgDocument,
  Election,
  ElectionNomination,
  ContributionPayment,
  VotingConfig,
  CreateVotingPollInput,
  UpdateVotingScheduleInput,
  VotingPollMonitoring,
  AdminMembersResult,
  AdminMemberDetails,
  ContributionTrackingResult,
  AdminDesignationItem,
  OrgPaymentConfig,
  FinancialTransparencyData,
  MemberDirectoryResult,
  AdminUsersQueryParams,
  AdminUsersResult,
} from '../types';

export const organizationService = {
  // Public
  async getOverview(): Promise<OrgOverview> {
    const res = await apiClient<ApiResponse<OrgOverview>>('/org/overview');
    return res.data!;
  },

  async getNotices(): Promise<OrgNotice[]> {
    const res = await apiClient<ApiResponse<OrgNotice[]>>('/org/notices');
    return res.data!;
  },

  async getProjects(): Promise<OrgProject[]> {
    const res = await apiClient<ApiResponse<OrgProject[]>>('/org/projects');
    return res.data!;
  },

  async getCommittees(): Promise<OrgCommittee[]> {
    const res = await apiClient<ApiResponse<OrgCommittee[]>>('/org/committees');
    return res.data!;
  },

  async getDesignations(): Promise<OrgDesignation[]> {
    const res = await apiClient<ApiResponse<OrgDesignation[]>>('/org/designations');
    return res.data!;
  },

  async getFunds(): Promise<OrgFund[]> {
    const res = await apiClient<ApiResponse<OrgFund[]>>('/org/funds');
    return res.data!;
  },

  // Member & Application
  async getMembershipStatus(): Promise<OrgMembershipStatus> {
    const res = await apiClient<ApiResponse<OrgMembershipStatus>>('/org/membership/status');
    return res.data!;
  },

  async applyMembership(data: {
    fullName: string;
    phone: string;
    profession: string;
    monthlyContribution: number;
    agreedToMonthlyFee: boolean;
  }): Promise<OrgApplication> {
    const res = await apiClient<ApiResponse<OrgApplication>>('/org/membership/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async submitInitialPayment(data: {
    paymentMethod: string;
    trxId?: string;
    senderNumber?: string;
    notes?: string;
  }): Promise<OrgMembership> {
    const res = await apiClient<ApiResponse<OrgMembership>>('/org/membership/initial-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async payMonthlyContribution(data: {
    periodMonth?: number;
    months?: number[];
    periodYear: number;
    amount: number;
    paymentMethod: string;
    trxId?: string;
    senderNumber?: string;
    notes?: string;
  }): Promise<ContributionPayment | any> {
    const res = await apiClient<ApiResponse<any>>('/org/contributions/pay', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async updateMonthlyContribution(data: {
    newAmount: number;
    reason?: string;
  }): Promise<any> {
    const res = await apiClient<ApiResponse<any>>('/org/membership/monthly-contribution', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async getContributionHistory(): Promise<any> {
    const res = await apiClient<ApiResponse<any>>('/org/membership/contribution-history');
    return res.data!;
  },

  async getMemberDashboard(): Promise<OrgMemberDashboardData> {
    const res = await apiClient<ApiResponse<OrgMemberDashboardData>>('/org/member/dashboard');
    return res.data!;
  },

  async getMemberDirectory(query?: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<MemberDirectoryResult> {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.role) params.append('role', query.role);
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    const qs = params.toString();
    const url = `/org/member/directory${qs ? `?${qs}` : ''}`;
    const res = await apiClient<ApiResponse<MemberDirectoryResult>>(url);
    return res.data!;
  },

  async getMeetings(): Promise<OrgMeeting[]> {
    const res = await apiClient<ApiResponse<OrgMeeting[]>>('/org/meetings');
    return res.data!;
  },

  async getDocuments(): Promise<OrgDocument[]> {
    const res = await apiClient<ApiResponse<OrgDocument[]>>('/org/documents');
    return res.data!;
  },

  // Digital Election
  async getElections(): Promise<Election[]> {
    const res = await apiClient<ApiResponse<Election[]>>('/org/elections');
    return res.data!;
  },

  async getElectionDetail(id: string): Promise<Election> {
    const res = await apiClient<ApiResponse<any>>(`/org/elections/${id}`);
    const data = res.data;
    if (data && typeof data === 'object' && data.election) {
      return {
        ...data.election,
        ...data,
      };
    }
    return data!;
  },

  async submitNomination(
    electionId: string,
    data: {
      positionId: string;
      candidateName: string;
      candidatePhoto?: string;
      experience?: string;
      manifesto: string;
    },
  ): Promise<ElectionNomination> {
    const res = await apiClient<ApiResponse<ElectionNomination>>(
      `/org/elections/${electionId}/nominate`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
    return res.data!;
  },

  async castVote(
    electionId: string,
    ballots: Array<{ positionId: string; candidateNominationId: string }>,
  ): Promise<{ success: boolean; receiptToken: string; message: string }> {
    const res = await apiClient<
      ApiResponse<{ success: boolean; receiptToken: string; message: string }>
    >(`/org/elections/${electionId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ ballots }),
    });
    return res.data!;
  },

  async getTurnout(
    electionId: string,
  ): Promise<{ totalEligible: number; votesCast: number; turnoutPercentage: number }> {
    const res = await apiClient<
      ApiResponse<{ totalEligible: number; votesCast: number; turnoutPercentage: number }>
    >(`/org/elections/${electionId}/turnout`);
    return res.data!;
  },

  // Officer / Admin
  async getAdminStats(): Promise<OrgAdminStats> {
    const res = await apiClient<ApiResponse<OrgAdminStats>>('/org/admin/stats');
    return res.data!;
  },

  async getFinancialTrends(): Promise<FinancialTrends> {
    const res = await apiClient<ApiResponse<FinancialTrends>>('/org/admin/financial/trends');
    return res.data!;
  },

  async getApplications(status?: string): Promise<OrgApplication[]> {
    const query = status ? `?status=${status}` : '';
    const res = await apiClient<ApiResponse<OrgApplication[]>>(`/org/admin/applications${query}`);
    return res.data!;
  },

  async reviewApplication(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    rejectionReason?: string,
  ): Promise<OrgApplication> {
    const res = await apiClient<ApiResponse<OrgApplication>>(`/org/admin/applications/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, rejectionReason }),
    });
    return res.data!;
  },

  async reviewPayment(
    id: string,
    status: 'VERIFIED' | 'REJECTED',
    notes?: string,
  ): Promise<any> {
    const res = await apiClient<ApiResponse<any>>(`/org/admin/payments/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    });
    return res.data!;
  },

  async createFund(data: {
    name: string;
    code: string;
    description?: string;
    openingBalance?: number;
  }): Promise<OrgFund> {
    const res = await apiClient<ApiResponse<OrgFund>>('/org/admin/funds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async recordTransaction(data: {
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
  }): Promise<OrgTransaction> {
    const res = await apiClient<ApiResponse<OrgTransaction>>('/org/admin/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async updateTransaction(
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
  ): Promise<OrgTransaction> {
    const res = await apiClient<ApiResponse<OrgTransaction>>(`/org/admin/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async deleteTransaction(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient<ApiResponse<{ success: boolean; message: string }>>(`/org/admin/transactions/${id}`, {
      method: 'DELETE',
    });
    return res.data!;
  },

  async getTransparency(): Promise<FinancialTransparencyData> {
    const res = await apiClient<ApiResponse<FinancialTransparencyData>>('/org/transparency');
    return res.data!;
  },

  async createCommittee(data: {
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
  }): Promise<OrgCommittee> {
    const res = await apiClient<ApiResponse<OrgCommittee>>('/org/admin/committees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async assignCommitteeMember(data: {
    committeeId: string;
    userId: string;
    designationId: string;
    customTitle?: string;
  }): Promise<any> {
    const res = await apiClient<ApiResponse<any>>('/org/admin/committees/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async createMeeting(data: {
    title: string;
    description?: string;
    date: string;
    location: string;
    agenda?: string;
  }): Promise<OrgMeeting> {
    const res = await apiClient<ApiResponse<OrgMeeting>>('/org/admin/meetings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async createNotice(data: {
    title: string;
    content: string;
    priority: 'URGENT' | 'NORMAL' | 'LOW';
    isPinned: boolean;
    isPublic: boolean;
    expiresAt?: string;
  }): Promise<OrgNotice> {
    const res = await apiClient<ApiResponse<OrgNotice>>('/org/admin/notices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async updateNotice(
    noticeId: string,
    data: Partial<{
      title: string;
      content: string;
      priority: 'URGENT' | 'NORMAL' | 'LOW';
      isPinned: boolean;
      isPublic: boolean;
      expiresAt?: string | null;
    }>
  ): Promise<OrgNotice> {
    const res = await apiClient<ApiResponse<OrgNotice>>(`/org/admin/notices/${noticeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async deleteNotice(noticeId: string): Promise<void> {
    await apiClient<ApiResponse<null>>(`/org/admin/notices/${noticeId}`, {
      method: 'DELETE',
    });
  },

  async createProject(data: {
    title: string;
    description: string;
    budget?: number;
    spent?: number;
    progress?: number;
    status?: string;
    isPublic?: boolean;
    images?: string[];
    category?: 'GENERAL' | 'HUMANITARIAN' | 'TREE_PLANTATION';
    beneficiaryName?: string;
    beneficiaryPhone?: string;
    beneficiaryAddress?: string;
    assistanceType?: string;
    consentGiven?: boolean;
    childName?: string;
    fatherName?: string;
    birthPlace?: string;
    treesPlanted?: string;
    plantationLocation?: string;
    plantationDate?: string;
    fundId?: string;
    items?: Array<{ itemName: string; amount: number; category?: string; description?: string }>;
  }): Promise<OrgProject> {
    const res = await apiClient<ApiResponse<OrgProject>>('/org/admin/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async createDocument(data: {
    title: string;
    description?: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
    category: string;
    accessLevel: string;
  }): Promise<OrgDocument> {
    const res = await apiClient<ApiResponse<OrgDocument>>('/org/admin/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async createElection(data: {
    title: string;
    description?: string;
    nominationStartDate: string;
    nominationEndDate: string;
    votingStartDate: string;
    votingEndDate: string;
    rules?: string;
    positions: Array<{ designationId: string; maxWinners: number }>;
  }): Promise<Election> {
    const res = await apiClient<ApiResponse<Election>>('/org/admin/elections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async reviewNomination(
    nominationId: string,
    status: 'APPROVED' | 'REJECTED',
    reviewNotes?: string,
  ): Promise<ElectionNomination> {
    const res = await apiClient<ApiResponse<ElectionNomination>>(
      `/org/admin/elections/nominations/${nominationId}/review`,
      {
        method: 'POST',
        body: JSON.stringify({ status, reviewNotes }),
      },
    );
    return res.data!;
  },

  async finalizeElection(electionId: string): Promise<Election> {
    const res = await apiClient<ApiResponse<Election>>(`/org/admin/elections/${electionId}/finalize`, {
      method: 'POST',
    });
    return res.data!;
  },

  async updateElectionStatus(electionId: string, status: string): Promise<Election> {
    const res = await apiClient<ApiResponse<Election>>(`/org/admin/elections/${electionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data!;
  },

  async deleteElection(electionId: string): Promise<void> {
    await apiClient<ApiResponse<null>>(`/org/admin/elections/${electionId}`, {
      method: 'DELETE',
    });
  },

  async getVotingConfig(): Promise<VotingConfig> {
    const res = await apiClient<ApiResponse<VotingConfig>>('/org/voting/config');
    return res.data!;
  },

  async updateVotingConfig(isVotingEnabled: boolean): Promise<VotingConfig> {
    const res = await apiClient<ApiResponse<VotingConfig>>('/org/admin/voting/config', {
      method: 'PUT',
      body: JSON.stringify({ isVotingEnabled }),
    });
    return res.data!;
  },

  async createVotingPoll(data: CreateVotingPollInput): Promise<Election> {
    const res = await apiClient<ApiResponse<Election>>('/org/admin/voting/polls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async updateVotingSchedule(
    electionId: string,
    data: UpdateVotingScheduleInput
  ): Promise<Election> {
    const res = await apiClient<ApiResponse<Election>>(
      `/org/admin/elections/${electionId}/schedule`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return res.data!;
  },

  async getVotingPollMonitoring(electionId: string): Promise<VotingPollMonitoring> {
    const res = await apiClient<ApiResponse<VotingPollMonitoring>>(
      `/org/admin/elections/${electionId}/monitoring`
    );
    return res.data!;
  },

  // ==========================================
  // Member Management & Contribution Tracking
  // ==========================================

  async getAdminUsers(query?: AdminUsersQueryParams): Promise<AdminUsersResult> {
    const params = new URLSearchParams();
    if (query?.search) params.set('search', query.search);
    if (query?.type) params.set('type', query.type);
    if (query?.provider) params.set('provider', query.provider);
    if (query?.role) params.set('role', query.role);
    if (query?.page) params.set('page', query.page.toString());
    if (query?.limit) params.set('limit', query.limit.toString());

    const qs = params.toString();
    const res = await apiClient<ApiResponse<AdminUsersResult>>(
      `/org/admin/users${qs ? '?' + qs : ''}`
    );
    return res.data!;
  },

  async toggleUserSystemRole(
    userId: string,
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  ): Promise<{ id: string; name: string; role: string }> {
    const res = await apiClient<ApiResponse<{ id: string; name: string; role: string }>>(
      `/org/admin/users/${userId}/role`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }
    );
    return res.data!;
  },

  async suspendUser(
    userId: string,
    isSuspended: boolean,
    reason?: string
  ): Promise<{ id: string; name: string; isSuspended: boolean }> {
    const res = await apiClient<ApiResponse<{ id: string; name: string; isSuspended: boolean }>>(
      `/org/admin/users/${userId}/suspend`,
      {
        method: 'PATCH',
        body: JSON.stringify({ isSuspended, reason }),
      }
    );
    return res.data!;
  },

  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient<ApiResponse<{ success: boolean; message: string }>>(
      `/org/admin/users/${userId}`,
      {
        method: 'DELETE',
      }
    );
    return res.data!;
  },

  async appointPresident(userId: string): Promise<any> {
    const res = await apiClient<ApiResponse<any>>(
      `/org/admin/users/${userId}/appoint-president`,
      {
        method: 'POST',
      }
    );
    return res.data!;
  },

  async getAdminMembers(query?: {
    search?: string;
    status?: string;
    designationId?: string;
    committeeId?: string;
    paymentStatus?: string;
    year?: number;
    month?: number;
    page?: number;
    limit?: number;
  }): Promise<AdminMembersResult> {
    const params = new URLSearchParams();
    if (query?.search) params.set('search', query.search);
    if (query?.status) params.set('status', query.status);
    if (query?.designationId) params.set('designationId', query.designationId);
    if (query?.committeeId) params.set('committeeId', query.committeeId);
    if (query?.paymentStatus) params.set('paymentStatus', query.paymentStatus);
    if (query?.year) params.set('year', query.year.toString());
    if (query?.month) params.set('month', query.month.toString());
    if (query?.page) params.set('page', query.page.toString());
    if (query?.limit) params.set('limit', query.limit.toString());

    const qs = params.toString();
    const res = await apiClient<ApiResponse<AdminMembersResult>>(
      `/org/admin/members${qs ? '?' + qs : ''}`
    );
    return res.data!;
  },

  async getAdminMemberDetails(id: string): Promise<AdminMemberDetails> {
    const res = await apiClient<ApiResponse<AdminMemberDetails>>(`/org/admin/members/${id}`);
    return res.data!;
  },

  async updateMemberStatus(
    id: string,
    data: {
      status: 'ACTIVE' | 'APPROVED_PAYMENT_PENDING' | 'SUSPENDED' | 'ARCHIVED';
      notes?: string;
    }
  ): Promise<OrgMembership> {
    const res = await apiClient<ApiResponse<OrgMembership>>(`/org/admin/members/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async assignMemberDesignation(
    id: string,
    data: {
      designationId?: string | null;
      committeeId?: string | null;
      customTitle?: string | null;
      startDate?: string | null;
    }
  ): Promise<OrgMembership> {
    const res = await apiClient<ApiResponse<OrgMembership>>(
      `/org/admin/members/${id}/designation`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
    return res.data!;
  },

  async getContributionTracking(query?: {
    year?: number;
    month?: number;
  }): Promise<ContributionTrackingResult> {
    const params = new URLSearchParams();
    if (query?.year) params.set('year', query.year.toString());
    if (query?.month) params.set('month', query.month.toString());

    const qs = params.toString();
    const res = await apiClient<ApiResponse<ContributionTrackingResult>>(
      `/org/admin/contributions/tracking${qs ? '?' + qs : ''}`
    );
    return res.data!;
  },

  async sendManualContributionReminder(data: {
    memberId?: string;
    userId?: string;
    year?: number;
    periodYear?: number;
    month?: number;
    periodMonth?: number;
    channel?: string;
    customNote?: string;
  }): Promise<{ reminder?: any; notification?: any; memberName?: string; message?: string }> {
    const res = await apiClient<ApiResponse<{ reminder: any; notification: any; memberName: string }>>(
      '/org/admin/contributions/remind',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return res.data!;
  },

  async sendBulkContributionReminders(data: {
    year?: number;
    periodYear?: number;
    month?: number;
    periodMonth?: number;
    userIds?: string[];
    memberIds?: string[];
    filter?: 'ALL_UNPAID' | 'ONLY_OVERDUE';
    customNote?: string;
  }): Promise<{
    targetedMembersCount: number;
    remindersSent: number;
    skippedCooldownCount: number;
    details: Array<{ memberId: string; name: string; status: string; reason?: string }>;
  }> {
    const res = await apiClient<ApiResponse<{
      targetedMembersCount: number;
      remindersSent: number;
      skippedCooldownCount: number;
      details: Array<{ memberId: string; name: string; status: string; reason?: string }>;
    }>>('/org/admin/contributions/bulk-remind', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async getAdminDesignations(): Promise<AdminDesignationItem[]> {
    const res = await apiClient<ApiResponse<AdminDesignationItem[]>>('/org/admin/designations');
    return res.data!;
  },

  async createDesignation(data: {
    code?: string;
    name: string;
    rank?: number;
    description?: string;
  }): Promise<AdminDesignationItem> {
    const res = await apiClient<ApiResponse<AdminDesignationItem>>('/org/admin/designations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async updateDesignation(
    id: string,
    data: {
      name?: string;
      rank?: number;
      description?: string;
      isActive?: boolean;
    }
  ): Promise<AdminDesignationItem> {
    const res = await apiClient<ApiResponse<AdminDesignationItem>>(
      `/org/admin/designations/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return res.data!;
  },

  // Monthly Contribution Payment Configs
  async getPaymentConfigs(): Promise<OrgPaymentConfig[]> {
    const res = await apiClient<ApiResponse<OrgPaymentConfig[]>>('/org/payment-configs');
    return res.data || [];
  },

  async getAdminPaymentConfigs(): Promise<OrgPaymentConfig[]> {
    const res = await apiClient<ApiResponse<OrgPaymentConfig[]>>('/org/admin/payment-configs');
    return res.data || [];
  },

  async updatePaymentConfig(data: Partial<OrgPaymentConfig>): Promise<OrgPaymentConfig> {
    const res = await apiClient<ApiResponse<OrgPaymentConfig>>('/org/admin/payment-configs', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

};
