'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '../services/organization.service';
import type { AdminUsersQueryParams } from '../types';

// ==========================================
// 1. Stable, Hierarchical Query Keys
// ==========================================
export const orgQueryKeys = {
  overview: ['org', 'overview'] as const,
  membershipStatus: ['org', 'membership', 'status'] as const,
  memberDashboard: ['org', 'member', 'dashboard'] as const,
  memberDirectory: (query?: { search?: string; role?: string; page?: number; limit?: number }) =>
    ['org', 'member', 'directory', query] as const,
  notices: ['org', 'notices'] as const,
  projects: ['org', 'projects'] as const,
  committees: ['org', 'committees'] as const,
  designations: ['org', 'designations'] as const,
  funds: ['org', 'funds'] as const,
  meetings: ['org', 'meetings'] as const,
  documents: ['org', 'documents'] as const,
  paymentConfigs: ['org', 'paymentConfigs'] as const,
  transparency: ['org', 'transparency'] as const,
  adminPaymentConfigs: ['org', 'admin', 'paymentConfigs'] as const,
  votingConfig: ['org', 'voting', 'config'] as const,
  elections: {
    all: ['org', 'elections'] as const,
    detail: (id: string) => ['org', 'elections', id] as const,
    turnout: (id: string) => ['org', 'elections', id, 'turnout'] as const,
    monitoring: (id: string) => ['org', 'elections', id, 'monitoring'] as const,
  },
  admin: {
    stats: ['org', 'admin', 'stats'] as const,
    applications: (status?: string) => ['org', 'admin', 'applications', status ?? 'ALL'] as const,
  },
} as const;

// ==========================================
// 2. Cache Policies
// ==========================================
export const ORG_CACHE_POLICY = {
  overview: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
  },
  membershipStatus: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 15 * 60 * 1000,
  },
  memberDashboard: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 20 * 60 * 1000,
  },
  memberDirectory: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000,
  },
  adminStats: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000,
  },
  elections: {
    staleTime: 20 * 1000, // 20 seconds
    gcTime: 10 * 60 * 1000,
  },
  turnout: {
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 5 * 60 * 1000,
  },
};

// ==========================================
// 3. Query Hooks
// ==========================================

export function useOrgOverviewQuery() {
  return useQuery({
    queryKey: orgQueryKeys.overview,
    queryFn: () => organizationService.getOverview(),
    staleTime: ORG_CACHE_POLICY.overview.staleTime,
    gcTime: ORG_CACHE_POLICY.overview.gcTime,
  });
}

export function useOrgMembershipStatusQuery(enabled = true) {
  return useQuery({
    queryKey: orgQueryKeys.membershipStatus,
    queryFn: () => organizationService.getMembershipStatus(),
    enabled,
    staleTime: ORG_CACHE_POLICY.membershipStatus.staleTime,
    gcTime: ORG_CACHE_POLICY.membershipStatus.gcTime,
  });
}

export function useOrgMemberDashboardQuery(enabled = true) {
  return useQuery({
    queryKey: orgQueryKeys.memberDashboard,
    queryFn: () => organizationService.getMemberDashboard(),
    enabled,
    staleTime: ORG_CACHE_POLICY.memberDashboard.staleTime,
    gcTime: ORG_CACHE_POLICY.memberDashboard.gcTime,
  });
}

export function useOrgMemberDirectoryQuery(
  query?: { search?: string; role?: string; page?: number; limit?: number },
  enabled = true,
) {
  return useQuery({
    queryKey: orgQueryKeys.memberDirectory(query),
    queryFn: () => organizationService.getMemberDirectory(query),
    enabled,
    placeholderData: (previousData) => previousData,
    staleTime: ORG_CACHE_POLICY.memberDirectory.staleTime,
    gcTime: ORG_CACHE_POLICY.memberDirectory.gcTime,
  });
}

export function useOrgElectionsQuery() {
  return useQuery({
    queryKey: orgQueryKeys.elections.all,
    queryFn: () => organizationService.getElections(),
    staleTime: ORG_CACHE_POLICY.elections.staleTime,
    gcTime: ORG_CACHE_POLICY.elections.gcTime,
  });
}

export function useOrgElectionDetailQuery(electionId: string, enabled = true) {
  return useQuery({
    queryKey: orgQueryKeys.elections.detail(electionId),
    queryFn: () => organizationService.getElectionDetail(electionId),
    enabled: Boolean(electionId) && enabled,
    staleTime: ORG_CACHE_POLICY.elections.staleTime,
    gcTime: ORG_CACHE_POLICY.elections.gcTime,
  });
}

export function useOrgTurnoutQuery(electionId: string, enabled = true) {
  return useQuery({
    queryKey: orgQueryKeys.elections.turnout(electionId),
    queryFn: () => organizationService.getTurnout(electionId),
    enabled: Boolean(electionId) && enabled,
    refetchInterval: 10000, // Poll turnout every 10 seconds during voting
    staleTime: ORG_CACHE_POLICY.turnout.staleTime,
  });
}

export function useOrgVotingConfigQuery() {
  return useQuery({
    queryKey: orgQueryKeys.votingConfig,
    queryFn: () => organizationService.getVotingConfig(),
    staleTime: 10 * 1000,
  });
}

export function useOrgVotingPollMonitoringQuery(electionId: string, enabled = true) {
  return useQuery({
    queryKey: orgQueryKeys.elections.monitoring(electionId),
    queryFn: () => organizationService.getVotingPollMonitoring(electionId),
    enabled: Boolean(electionId) && enabled,
    refetchInterval: 5000,
    staleTime: 5000,
  });
}

export function useOrgAdminStatsQuery(enabled = true) {
  return useQuery({
    queryKey: orgQueryKeys.admin.stats,
    queryFn: () => organizationService.getAdminStats(),
    enabled,
    staleTime: ORG_CACHE_POLICY.adminStats.staleTime,
    gcTime: ORG_CACHE_POLICY.adminStats.gcTime,
  });
}

export function useOrgApplicationsQuery(status?: string, enabled = true) {
  return useQuery({
    queryKey: orgQueryKeys.admin.applications(status),
    queryFn: () => organizationService.getApplications(status),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useOrgFundsQuery() {
  return useQuery({
    queryKey: orgQueryKeys.funds,
    queryFn: () => organizationService.getFunds(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useOrgTransparencyQuery(enabled = true) {
  return useQuery({
    queryKey: orgQueryKeys.transparency,
    queryFn: () => organizationService.getTransparency(),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useOrgCommitteesQuery() {
  return useQuery({
    queryKey: orgQueryKeys.committees,
    queryFn: () => organizationService.getCommittees(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useOrgDesignationsQuery() {
  return useQuery({
    queryKey: orgQueryKeys.designations,
    queryFn: () => organizationService.getDesignations(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useOrgMeetingsQuery() {
  return useQuery({
    queryKey: orgQueryKeys.meetings,
    queryFn: () => organizationService.getMeetings(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useOrgNoticesQuery() {
  return useQuery({
    queryKey: orgQueryKeys.notices,
    queryFn: () => organizationService.getNotices(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useOrgProjectsQuery() {
  return useQuery({
    queryKey: orgQueryKeys.projects,
    queryFn: () => organizationService.getProjects(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useOrgDocumentsQuery() {
  return useQuery({
    queryKey: orgQueryKeys.documents,
    queryFn: () => organizationService.getDocuments(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useOrgPaymentConfigsQuery(enabled = true) {
  return useQuery({
    queryKey: orgQueryKeys.paymentConfigs,
    queryFn: () => organizationService.getPaymentConfigs(),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useOrgAdminPaymentConfigsQuery(enabled = true) {
  return useQuery({
    queryKey: orgQueryKeys.adminPaymentConfigs,
    queryFn: () => organizationService.getAdminPaymentConfigs(),
    enabled,
    staleTime: 30 * 1000,
  });
}

// ==========================================
// 4. Background Prefetching Helper
// ==========================================
export function prefetchOrgTabData(queryClient: ReturnType<typeof useQueryClient>) {
  // Low-priority background prefetch
  const runPrefetch = () => {
    queryClient.prefetchQuery({
      queryKey: orgQueryKeys.overview,
      queryFn: () => organizationService.getOverview(),
      staleTime: ORG_CACHE_POLICY.overview.staleTime,
    });
    queryClient.prefetchQuery({
      queryKey: orgQueryKeys.elections.all,
      queryFn: () => organizationService.getElections(),
      staleTime: ORG_CACHE_POLICY.elections.staleTime,
    });
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runPrefetch, { timeout: 4000 });
  } else {
    setTimeout(runPrefetch, 1000);
  }
}

// ==========================================
// 5. Mutation Hooks
// ==========================================

// ==========================================
// Admin Member Management & Tracking Hooks
// ==========================================

export function useAdminUsersQuery(query?: AdminUsersQueryParams) {
  return useQuery({
    queryKey: ['org', 'admin', 'users', query],
    queryFn: () => organizationService.getAdminUsers(query),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminMembersQuery(query?: {
  search?: string;
  status?: string;
  designationId?: string;
  committeeId?: string;
  paymentStatus?: string;
  year?: number;
  month?: number;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['org', 'admin', 'members', query],
    queryFn: () => organizationService.getAdminMembers(query),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminMemberDetailsQuery(memberId: string | null) {
  return useQuery({
    queryKey: ['org', 'admin', 'members', 'detail', memberId],
    queryFn: () => organizationService.getAdminMemberDetails(memberId!),
    enabled: Boolean(memberId),
  });
}

export function useContributionTrackingQuery(query?: { year?: number; month?: number }) {
  return useQuery({
    queryKey: ['org', 'admin', 'contributions', 'tracking', query?.year, query?.month],
    queryFn: () => organizationService.getContributionTracking(query),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminDesignationsQuery() {
  return useQuery({
    queryKey: ['org', 'admin', 'designations'],
    queryFn: () => organizationService.getAdminDesignations(),
    staleTime: 60 * 1000,
  });
}

export function useOrgMutations() {
  const queryClient = useQueryClient();

  const applyMembership = useMutation({
    mutationFn: organizationService.applyMembership,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.membershipStatus });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'applications'] });
    },
  });

  const submitInitialPayment = useMutation({
    mutationFn: organizationService.submitInitialPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.membershipStatus });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.memberDashboard });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.admin.stats });
    },
  });

  const payMonthlyContribution = useMutation({
    mutationFn: organizationService.payMonthlyContribution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.memberDashboard });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.funds });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'contributions'] });
    },
  });

  const updateMonthlyContribution = useMutation({
    mutationFn: organizationService.updateMonthlyContribution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.memberDashboard });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.membershipStatus });
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'contributions'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'members'] });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.admin.stats });
    },
  });

  const reviewApplication = useMutation({
    mutationFn: (vars: { id: string; status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) =>
      organizationService.reviewApplication(vars.id, vars.status, vars.rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'applications'] });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.membershipStatus });
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'contributions'] });
    },
  });

  const reviewPayment = useMutation({
    mutationFn: (vars: { id: string; status: 'VERIFIED' | 'REJECTED'; notes?: string }) =>
      organizationService.reviewPayment(vars.id, vars.status, vars.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'contributions'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'members'] });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.funds });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.memberDashboard });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.membershipStatus });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.overview });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.transparency });
    },
  });

  const createFund = useMutation({
    mutationFn: organizationService.createFund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.funds });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.transparency });
    },
  });

  const recordTransaction = useMutation({
    mutationFn: organizationService.recordTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.funds });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.transparency });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.projects });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.overview });
    },
  });

  const createCommittee = useMutation({
    mutationFn: organizationService.createCommittee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.committees });
    },
  });

  const assignCommitteeMember = useMutation({
    mutationFn: organizationService.assignCommitteeMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.committees });
    },
  });

  const createMeeting = useMutation({
    mutationFn: organizationService.createMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.meetings });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.memberDashboard });
    },
  });

  const createNotice = useMutation({
    mutationFn: organizationService.createNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.notices });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.overview });
    },
  });

  const updateNotice = useMutation({
    mutationFn: (vars: { noticeId: string; data: any }) =>
      organizationService.updateNotice(vars.noticeId, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.notices });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.overview });
    },
  });

  const deleteNotice = useMutation({
    mutationFn: (vars: { noticeId: string }) => organizationService.deleteNotice(vars.noticeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.notices });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.overview });
    },
  });

  const createProject = useMutation({
    mutationFn: organizationService.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.projects });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.overview });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.transparency });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.funds });
    },
  });

  const createDocument = useMutation({
    mutationFn: organizationService.createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.documents });
    },
  });

  const createElection = useMutation({
    mutationFn: organizationService.createElection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.elections.all });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.admin.stats });
    },
  });

  const submitNomination = useMutation({
    mutationFn: (vars: { electionId: string; data: any }) =>
      organizationService.submitNomination(vars.electionId, vars.data),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.elections.detail(vars.electionId) });
    },
  });

  const reviewNomination = useMutation({
    mutationFn: (vars: { nominationId: string; status: 'APPROVED' | 'REJECTED'; reviewNotes?: string; electionId: string }) =>
      organizationService.reviewNomination(vars.nominationId, vars.status, vars.reviewNotes),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.elections.detail(vars.electionId) });
    },
  });

  const castVote = useMutation({
    mutationFn: (vars: { electionId: string; ballots: Array<{ positionId: string; candidateNominationId: string }> }) =>
      organizationService.castVote(vars.electionId, vars.ballots),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.elections.detail(vars.electionId) });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.elections.turnout(vars.electionId) });
    },
  });

  const finalizeElection = useMutation({
    mutationFn: (vars: { electionId: string }) => organizationService.finalizeElection(vars.electionId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.elections.all });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.elections.detail(vars.electionId) });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.committees });
    },
  });

  const updateElectionStatus = useMutation({
    mutationFn: (vars: { electionId: string; status: string }) =>
      organizationService.updateElectionStatus(vars.electionId, vars.status),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.elections.all });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.elections.detail(vars.electionId) });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.overview });
    },
  });

  const deleteElection = useMutation({
    mutationFn: (vars: { electionId: string }) => organizationService.deleteElection(vars.electionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.elections.all });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.overview });
    },
  });

  const updateVotingConfig = useMutation({
    mutationFn: (vars: { isVotingEnabled: boolean }) =>
      organizationService.updateVotingConfig(vars.isVotingEnabled),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: orgQueryKeys.votingConfig });
      const prev = queryClient.getQueryData(orgQueryKeys.votingConfig);
      queryClient.setQueryData(orgQueryKeys.votingConfig, (old: any) => ({
        ...old,
        isVotingEnabled: vars.isVotingEnabled,
        updatedAt: new Date().toISOString(),
      }));
      return { prev };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.prev) {
        queryClient.setQueryData(orgQueryKeys.votingConfig, context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.votingConfig });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.elections.all });
    },
  });

  const createVotingPoll = useMutation({
    mutationFn: organizationService.createVotingPoll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.elections.all });
    },
  });

  const updateVotingSchedule = useMutation({
    mutationFn: (vars: { electionId: string; data: any }) =>
      organizationService.updateVotingSchedule(vars.electionId, vars.data),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.elections.all });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.elections.detail(vars.electionId) });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.elections.monitoring(vars.electionId) });
    },
  });


  const updateMemberStatus = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        status: 'ACTIVE' | 'APPROVED_PAYMENT_PENDING' | 'SUSPENDED' | 'ARCHIVED';
        notes?: string;
      };
    }) => organizationService.updateMemberStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'members'] });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.admin.stats });
    },
  });

  const assignMemberDesignation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        designationId?: string | null;
        committeeId?: string | null;
        customTitle?: string | null;
        startDate?: string | null;
      };
    }) => organizationService.assignMemberDesignation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'members'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'designations'] });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.committees });
      queryClient.invalidateQueries({ queryKey: ['org', 'member', 'directory'] });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.designations });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.overview });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.memberDashboard });
    },
  });

  const sendManualReminder = useMutation({
    mutationFn: (data: {
      memberId?: string;
      userId?: string;
      year?: number;
      periodYear?: number;
      month?: number;
      periodMonth?: number;
      channel?: string;
      customNote?: string;
    }) => organizationService.sendManualContributionReminder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'contributions', 'tracking'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'members'] });
    },
  });

  const sendBulkReminders = useMutation({
    mutationFn: (data: {
      year?: number;
      periodYear?: number;
      month?: number;
      periodMonth?: number;
      userIds?: string[];
      memberIds?: string[];
      filter?: 'ALL_UNPAID' | 'ONLY_OVERDUE';
      customNote?: string;
    }) => organizationService.sendBulkContributionReminders(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'contributions', 'tracking'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'members'] });
    },
  });

  const createDesignation = useMutation({
    mutationFn: (data: {
      code?: string;
      name: string;
      rank?: number;
      description?: string;
    }) => organizationService.createDesignation(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'designations'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'members'] });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.designations });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.committees });
    },
  });

  const updateDesignation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        rank?: number;
        description?: string;
        isActive?: boolean;
      };
    }) => organizationService.updateDesignation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'designations'] });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.designations });
    },
  });

  const updatePaymentConfig = useMutation({
    mutationFn: (data: Parameters<typeof organizationService.updatePaymentConfig>[0]) =>
      organizationService.updatePaymentConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.paymentConfigs });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.adminPaymentConfigs });
    },
  });

  const toggleUserSystemRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' }) =>
      organizationService.toggleUserSystemRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'members'] });
    },
  });

  const suspendUser = useMutation({
    mutationFn: ({ userId, isSuspended, reason }: { userId: string; isSuspended: boolean; reason?: string }) =>
      organizationService.suspendUser(userId, isSuspended, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'members'] });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.memberDirectory() });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) => organizationService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'members'] });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.memberDirectory() });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.membershipStatus });
    },
  });

  const appointPresident = useMutation({
    mutationFn: (userId: string) => organizationService.appointPresident(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'members'] });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.committees });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.membershipStatus });
    },
  });

  return {
    applyMembership,
    submitInitialPayment,
    payMonthlyContribution,
    updateMonthlyContribution,
    reviewApplication,
    reviewPayment,
    updatePaymentConfig,
    toggleUserSystemRole,
    suspendUser,
    deleteUser,
    appointPresident,
    createFund,
    recordTransaction,
    createCommittee,
    assignCommitteeMember,
    createMeeting,
    createNotice,
    updateNotice,
    deleteNotice,
    createProject,
    createDocument,
    createElection,
    createVotingPoll,
    updateVotingSchedule,
    updateVotingConfig,
    submitNomination,
    reviewNomination,
    castVote,
    finalizeElection,
    updateElectionStatus,
    deleteElection,
    updateMemberStatus,
    assignMemberDesignation,
    sendManualReminder,
    sendBulkReminders,
    createDesignation,
    updateDesignation,
  };
}
