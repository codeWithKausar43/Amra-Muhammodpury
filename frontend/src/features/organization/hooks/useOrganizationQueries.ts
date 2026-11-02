'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '../services/organization.service';

// ==========================================
// 1. Stable, Hierarchical Query Keys
// ==========================================
export const orgQueryKeys = {
  overview: ['org', 'overview'] as const,
  membershipStatus: ['org', 'membership', 'status'] as const,
  memberDashboard: ['org', 'member', 'dashboard'] as const,
  notices: ['org', 'notices'] as const,
  projects: ['org', 'projects'] as const,
  committees: ['org', 'committees'] as const,
  designations: ['org', 'designations'] as const,
  funds: ['org', 'funds'] as const,
  meetings: ['org', 'meetings'] as const,
  documents: ['org', 'documents'] as const,
  elections: {
    all: ['org', 'elections'] as const,
    detail: (id: string) => ['org', 'elections', id] as const,
    turnout: (id: string) => ['org', 'elections', id, 'turnout'] as const,
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

export function useOrgMembershipStatusQuery() {
  return useQuery({
    queryKey: orgQueryKeys.membershipStatus,
    queryFn: () => organizationService.getMembershipStatus(),
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
    },
  });

  const reviewApplication = useMutation({
    mutationFn: (vars: { id: string; status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) =>
      organizationService.reviewApplication(vars.id, vars.status, vars.rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'admin', 'applications'] });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.admin.stats });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.membershipStatus });
    },
  });

  const createFund = useMutation({
    mutationFn: organizationService.createFund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.funds });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.admin.stats });
    },
  });

  const recordTransaction = useMutation({
    mutationFn: organizationService.recordTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.funds });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.admin.stats });
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

  const createProject = useMutation({
    mutationFn: organizationService.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.projects });
      queryClient.invalidateQueries({ queryKey: orgQueryKeys.overview });
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

  return {
    applyMembership,
    submitInitialPayment,
    payMonthlyContribution,
    reviewApplication,
    createFund,
    recordTransaction,
    createCommittee,
    assignCommitteeMember,
    createMeeting,
    createNotice,
    createProject,
    createDocument,
    createElection,
    submitNomination,
    reviewNomination,
    castVote,
    finalizeElection,
    updateElectionStatus,
    deleteElection,
  };
}
