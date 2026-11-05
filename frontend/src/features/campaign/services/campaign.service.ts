import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';
import type {
  Campaign,
  CampaignCategory,
  CampaignDonation,
  CampaignExpense,
  CampaignPaymentConfig,
  CampaignAdminOverview,
  CampaignDonationTracking,
} from '../types';

export const campaignService = {
  // --------------------------------------------------------------------------
  // Public APIs
  // --------------------------------------------------------------------------
  async trackDonation(receiptNumber: string) {
    const clean = encodeURIComponent(receiptNumber.trim());
    const res = await apiClient<ApiResponse<CampaignDonationTracking>>(`/campaigns/track/${clean}`);
    return res.data;
  },

  async getPublicCampaigns(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.categoryId) query.set('categoryId', params.categoryId);
    if (params.search) query.set('search', params.search);

    const qs = query.toString();
    const res = await apiClient<ApiResponse<{
      items: Campaign[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>>(`/campaigns${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  async getActivePopupCampaign() {
    const res = await apiClient<ApiResponse<Campaign | null>>('/campaigns/active-popup');
    return res.data;
  },

  async getPublicCampaignDetails(idOrSlug: string) {
    const res = await apiClient<ApiResponse<Campaign>>(`/campaigns/${idOrSlug}`);
    return res.data;
  },

  async getPublicCategories() {
    const res = await apiClient<ApiResponse<CampaignCategory[]>>('/campaigns/categories');
    return res.data || [];
  },

  async getPublicPaymentMethods() {
    const res = await apiClient<ApiResponse<CampaignPaymentConfig[]>>('/campaigns/payment-methods');
    return res.data || [];
  },

  async submitPublicDonation(
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
  ) {
    const res = await apiClient<ApiResponse<{
      donationId: string;
      receiptNumber: string;
      campaignTitle: string;
      amount: number;
      donorName: string;
      status: string;
      submittedAt: string;
      message: string;
    }>>(`/campaigns/${campaignId}/donate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  // --------------------------------------------------------------------------
  // Admin APIs
  // --------------------------------------------------------------------------
  async getAdminOverview() {
    const res = await apiClient<ApiResponse<CampaignAdminOverview>>('/campaigns/admin/overview');
    return res.data;
  },

  async getAdminCampaigns(params: {
    page?: number;
    limit?: number;
    status?: string;
    categoryId?: string;
    search?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.categoryId) query.set('categoryId', params.categoryId);
    if (params.search) query.set('search', params.search);

    const qs = query.toString();
    const res = await apiClient<ApiResponse<{
      items: Campaign[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>>(`/campaigns/admin/list${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  async createCampaign(data: any) {
    const res = await apiClient<ApiResponse<Campaign>>('/campaigns/admin/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateCampaign(id: string, data: any) {
    const res = await apiClient<ApiResponse<Campaign>>(`/campaigns/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateCampaignStatus(id: string, status: string) {
    const res = await apiClient<ApiResponse<Campaign>>(`/campaigns/admin/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  async getAdminCampaignDetails(id: string) {
    const res = await apiClient<ApiResponse<Campaign & {
      analytics: {
        verifiedAmount: number;
        verifiedCount: number;
        pendingAmount: number;
        pendingCount: number;
        rejectedCount: number;
        totalExpense: number;
        remainingBalance: number;
      };
    }>>(`/campaigns/admin/${id}/details`);
    return res.data;
  },

  async getAdminDonations(params: {
    page?: number;
    limit?: number;
    campaignId?: string;
    status?: string;
    paymentMethod?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.campaignId) query.set('campaignId', params.campaignId);
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);
    if (params.search) query.set('search', params.search);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);

    const qs = query.toString();
    const res = await apiClient<ApiResponse<{
      items: CampaignDonation[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>>(`/campaigns/admin/donations${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  async reviewDonation(
    id: string,
    status: 'VERIFIED' | 'REJECTED',
    rejectionReason?: string,
    notes?: string,
  ) {
    const res = await apiClient<ApiResponse<CampaignDonation>>(`/campaigns/admin/donations/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ status, rejectionReason, notes }),
    });
    return res.data;
  },

  async getAdminExpenses(campaignId?: string) {
    const qs = campaignId ? `?campaignId=${campaignId}` : '';
    const res = await apiClient<ApiResponse<CampaignExpense[]>>(`/campaigns/admin/expenses${qs}`);
    return res.data || [];
  },

  async recordExpense(data: {
    campaignId: string;
    amount: number;
    purpose: string;
    description?: string;
    expenseDate?: string;
    voucherUrl?: string;
    performedBy: string;
  }) {
    const res = await apiClient<ApiResponse<CampaignExpense>>('/campaigns/admin/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getAdminCategories() {
    const res = await apiClient<ApiResponse<CampaignCategory[]>>('/campaigns/admin/categories');
    return res.data || [];
  },

  async createCategory(data: { name: string; description?: string; icon?: string; displayOrder?: number }) {
    const res = await apiClient<ApiResponse<CampaignCategory>>('/campaigns/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateCategory(id: string, data: Partial<CampaignCategory>) {
    const res = await apiClient<ApiResponse<CampaignCategory>>(`/campaigns/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getAdminPaymentConfigs() {
    const res = await apiClient<ApiResponse<CampaignPaymentConfig[]>>('/campaigns/admin/payment-configs');
    return res.data || [];
  },

  async updatePaymentConfig(data: CampaignPaymentConfig) {
    const res = await apiClient<ApiResponse<CampaignPaymentConfig>>('/campaigns/admin/payment-configs', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },
};

