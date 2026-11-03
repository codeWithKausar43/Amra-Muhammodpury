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
    periodMonth: number;
    periodYear: number;
    amount: number;
    paymentMethod: string;
    trxId?: string;
    senderNumber?: string;
    notes?: string;
  }): Promise<ContributionPayment> {
    const res = await apiClient<ApiResponse<ContributionPayment>>('/org/contributions/pay', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async getMemberDashboard(): Promise<OrgMemberDashboardData> {
    const res = await apiClient<ApiResponse<OrgMemberDashboardData>>('/org/member/dashboard');
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
  }): Promise<OrgTransaction> {
    const res = await apiClient<ApiResponse<OrgTransaction>>('/org/admin/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
    progress?: number;
    status?: string;
    isPublic?: boolean;
    images?: string[];
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
};
