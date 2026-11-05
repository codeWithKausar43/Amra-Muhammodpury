'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignService } from '../services/campaign.service';

export const campaignQueryKeys = {
  all: ['campaigns'] as const,
  publicList: (params: any) => ['campaigns', 'public', params] as const,
  activePopup: ['campaigns', 'activePopup'] as const,
  publicDetails: (idOrSlug: string) => ['campaigns', 'publicDetails', idOrSlug] as const,
  publicCategories: ['campaigns', 'publicCategories'] as const,
  publicPaymentMethods: ['campaigns', 'publicPaymentMethods'] as const,

  // Admin Keys
  adminOverview: ['campaigns', 'admin', 'overview'] as const,
  adminList: (params: any) => ['campaigns', 'admin', 'list', params] as const,
  adminDetails: (id: string) => ['campaigns', 'admin', 'details', id] as const,
  adminDonations: (params: any) => ['campaigns', 'admin', 'donations', params] as const,
  adminExpenses: (campaignId?: string) => ['campaigns', 'admin', 'expenses', campaignId] as const,
  adminCategories: ['campaigns', 'admin', 'categories'] as const,
  adminPaymentConfigs: ['campaigns', 'admin', 'paymentConfigs'] as const,
};

// --------------------------------------------------------------------------
// Public Hooks
// --------------------------------------------------------------------------
export function usePublicCampaignsQuery(params: {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
} = {}) {
  return useQuery({
    queryKey: campaignQueryKeys.publicList(params),
    queryFn: () => campaignService.getPublicCampaigns(params),
    staleTime: 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useActivePopupCampaignQuery() {
  return useQuery({
    queryKey: campaignQueryKeys.activePopup,
    queryFn: () => campaignService.getActivePopupCampaign(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicCampaignDetailsQuery(idOrSlug: string) {
  return useQuery({
    queryKey: campaignQueryKeys.publicDetails(idOrSlug),
    queryFn: () => campaignService.getPublicCampaignDetails(idOrSlug),
    enabled: Boolean(idOrSlug),
    staleTime: 30 * 1000,
  });
}

export function usePublicCategoriesQuery() {
  return useQuery({
    queryKey: campaignQueryKeys.publicCategories,
    queryFn: () => campaignService.getPublicCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicPaymentMethodsQuery() {
  return useQuery({
    queryKey: campaignQueryKeys.publicPaymentMethods,
    queryFn: () => campaignService.getPublicPaymentMethods(),
    staleTime: 10 * 60 * 1000,
  });
}

// --------------------------------------------------------------------------
// Admin Hooks
// --------------------------------------------------------------------------
export function useCampaignAdminOverviewQuery() {
  return useQuery({
    queryKey: campaignQueryKeys.adminOverview,
    queryFn: () => campaignService.getAdminOverview(),
    staleTime: 15 * 1000,
  });
}

export function useCampaignAdminListQuery(params: {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: string;
  search?: string;
} = {}) {
  return useQuery({
    queryKey: campaignQueryKeys.adminList(params),
    queryFn: () => campaignService.getAdminCampaigns(params),
    staleTime: 15 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useCampaignAdminDetailsQuery(id: string) {
  return useQuery({
    queryKey: campaignQueryKeys.adminDetails(id),
    queryFn: () => campaignService.getAdminCampaignDetails(id),
    enabled: Boolean(id),
    staleTime: 15 * 1000,
  });
}

export function useCampaignAdminDonationsQuery(params: {
  page?: number;
  limit?: number;
  campaignId?: string;
  status?: string;
  paymentMethod?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
} = {}) {
  return useQuery({
    queryKey: campaignQueryKeys.adminDonations(params),
    queryFn: () => campaignService.getAdminDonations(params),
    staleTime: 10 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useCampaignAdminExpensesQuery(campaignId?: string) {
  return useQuery({
    queryKey: campaignQueryKeys.adminExpenses(campaignId),
    queryFn: () => campaignService.getAdminExpenses(campaignId),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useCampaignAdminCategoriesQuery() {
  return useQuery({
    queryKey: campaignQueryKeys.adminCategories,
    queryFn: () => campaignService.getAdminCategories(),
    staleTime: 60 * 1000,
  });
}

export function useCampaignAdminPaymentConfigsQuery() {
  return useQuery({
    queryKey: campaignQueryKeys.adminPaymentConfigs,
    queryFn: () => campaignService.getAdminPaymentConfigs(),
    staleTime: 60 * 1000,
  });
}

// --------------------------------------------------------------------------
// Mutations Hook
// --------------------------------------------------------------------------
export function useCampaignMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: campaignQueryKeys.all });
  };

  const submitDonation = useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: any }) =>
      campaignService.submitPublicDonation(campaignId, data),
    onSuccess: () => {
      invalidateAll();
    },
  });

  const createCampaign = useMutation({
    mutationFn: (data: any) => campaignService.createCampaign(data),
    onSuccess: () => {
      invalidateAll();
    },
  });

  const updateCampaign = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => campaignService.updateCampaign(id, data),
    onSuccess: () => {
      invalidateAll();
    },
  });

  const updateCampaignStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      campaignService.updateCampaignStatus(id, status),
    onSuccess: () => {
      invalidateAll();
    },
  });

  const reviewDonation = useMutation({
    mutationFn: ({
      id,
      status,
      rejectionReason,
      notes,
    }: {
      id: string;
      status: 'VERIFIED' | 'REJECTED';
      rejectionReason?: string;
      notes?: string;
    }) => campaignService.reviewDonation(id, status, rejectionReason, notes),
    onSuccess: () => {
      invalidateAll();
    },
  });

  const recordExpense = useMutation({
    mutationFn: (data: any) => campaignService.recordExpense(data),
    onSuccess: () => {
      invalidateAll();
    },
  });

  const createCategory = useMutation({
    mutationFn: (data: any) => campaignService.createCategory(data),
    onSuccess: () => {
      invalidateAll();
    },
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => campaignService.updateCategory(id, data),
    onSuccess: () => {
      invalidateAll();
    },
  });

  const updatePaymentConfig = useMutation({
    mutationFn: (data: any) => campaignService.updatePaymentConfig(data),
    onSuccess: () => {
      invalidateAll();
    },
  });

  return {
    submitDonation,
    createCampaign,
    updateCampaign,
    updateCampaignStatus,
    reviewDonation,
    recordExpense,
    createCategory,
    updateCategory,
    updatePaymentConfig,
  };
}

