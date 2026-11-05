import { FastifyPluginAsync } from 'fastify';
import { CampaignService } from './campaign.service.js';
import {
  PublicCampaignQuerySchema,
  PublicDonationSubmitSchema,
  CreateCampaignSchema,
  UpdateCampaignSchema,
  UpdateCampaignStatusSchema,
  AdminCampaignQuerySchema,
  AdminDonationQuerySchema,
  ReviewDonationSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  CreateExpenseSchema,
  UpdatePaymentConfigSchema,
} from './campaign.schema.js';
import { successResponse } from '../../utils/api-response.js';

export const campaignRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new CampaignService(fastify.prisma);

  // ==========================================================================
  // Public Endpoints (Accessible without login)
  // ==========================================================================

  // 1. List Active Campaigns
  fastify.get('/', async (request, reply) => {
    const query = PublicCampaignQuerySchema.parse(request.query);
    const result = await service.getPublicCampaigns(query);
    return reply.send(successResponse(result, 'ক্যাম্পেইন তালিকা সফলভাবে পাওয়া গেছে'));
  });

  // 2. Active Campaign for App-entry Popup
  fastify.get('/active-popup', async (_request, reply) => {
    const campaign = await service.getActivePopupCampaign();
    return reply.send(successResponse(campaign, 'পপ-আপ ক্যাম্পেইন তথ্য পাওয়া গেছে'));
  });

  // 3. Public Categories
  fastify.get('/categories', async (_request, reply) => {
    const categories = await service.getPublicCategories();
    return reply.send(successResponse(categories, 'ক্যাটাগরি তালিকা সফলভাবে পাওয়া গেছে'));
  });

  // 4. Public Payment Methods & Instructions
  fastify.get('/payment-methods', async (_request, reply) => {
    const methods = await service.getPublicPaymentMethods();
    return reply.send(successResponse(methods, 'পেমেন্ট নির্দেশনাবলী পাওয়া গেছে'));
  });

  // 5. Track Donation Status & Campaign Progress by Receipt Number
  fastify.get('/track/:receiptNumber', async (request, reply) => {
    const { receiptNumber } = request.params as { receiptNumber: string };
    const tracking = await service.trackDonationByReceipt(receiptNumber);
    return reply.send(successResponse(tracking, 'অনুদান ট্র্যাকিং তথ্য পাওয়া গেছে'));
  });

  // 6. Campaign Details
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const campaign = await service.getPublicCampaignDetails(id);
    return reply.send(successResponse(campaign, 'ক্যাম্পেইনের বিস্তারিত তথ্য পাওয়া গেছে'));
  });

  // 6. Submit Login-Free Donation
  fastify.post('/:id/donate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = PublicDonationSubmitSchema.parse(request.body);

    // Optional user ID if session exists
    let userId: string | undefined;
    try {
      const session = await fastify.authenticate(request, reply);
      userId = session.user.id;
    } catch {
      // Guest donor - completely supported!
    }

    const ip = request.ip || (request.headers['x-forwarded-for'] as string) || undefined;
    const result = await service.submitPublicDonation(id, body, ip, userId);
    return reply.status(201).send(successResponse(result, 'অনুদান সফলভাবে জমা হয়েছে'));
  });

  // ==========================================================================
  // Admin Endpoints (Require Officer Authentication)
  // ==========================================================================

  // 7. Admin Overview & Stats
  fastify.get('/admin/overview', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const overview = await service.getAdminOverview(session.user.id);
    return reply.send(successResponse(overview, 'ক্যাম্পেইন ওভারভিউ পাওয়া গেছে'));
  });

  // 8. Admin Campaigns List
  fastify.get('/admin/list', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const query = AdminCampaignQuerySchema.parse(request.query);
    const result = await service.getAdminCampaigns(session.user.id, query);
    return reply.send(successResponse(result, 'প্রশাসনিক ক্যাম্পেইন তালিকা পাওয়া গেছে'));
  });

  // 9. Create Campaign
  fastify.post('/admin/create', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const body = CreateCampaignSchema.parse(request.body);
    const campaign = await service.createCampaign(session.user.id, body);
    return reply.status(201).send(successResponse(campaign, 'ক্যাম্পেইন সফলভাবে তৈরি হয়েছে'));
  });

  // 10. Update Campaign
  fastify.put('/admin/:id', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const body = UpdateCampaignSchema.parse(request.body);
    const campaign = await service.updateCampaign(session.user.id, id, body);
    return reply.send(successResponse(campaign, 'ক্যাম্পেইন সফলভাবে হালনাগাদ হয়েছে'));
  });

  // 11. Update Campaign Status
  fastify.patch('/admin/:id/status', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const body = UpdateCampaignStatusSchema.parse(request.body);
    const campaign = await service.updateCampaignStatus(session.user.id, id, body.status);
    return reply.send(successResponse(campaign, 'ক্যাম্পেইন স্ট্যাটাস হালনাগাদ হয়েছে'));
  });

  // 12. Admin Campaign Details & Analytics
  fastify.get('/admin/:id/details', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const details = await service.getAdminCampaignDetails(session.user.id, id);
    return reply.send(successResponse(details, 'ক্যাম্পেইনের অভ্যন্তরীণ বিবরণ পাওয়া গেছে'));
  });

  // 13. Admin Donations List
  fastify.get('/admin/donations', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const query = AdminDonationQuerySchema.parse(request.query);
    const result = await service.getAdminDonations(session.user.id, query);
    return reply.send(successResponse(result, 'অনুদান তালিকা সফলভাবে পাওয়া গেছে'));
  });

  // 14. Review / Verify Donation
  fastify.post('/admin/donations/:id/verify', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const body = ReviewDonationSchema.parse(request.body);
    const result = await service.reviewDonation(
      session.user.id,
      id,
      body.status,
      body.rejectionReason,
      body.notes,
    );
    return reply.send(successResponse(result, 'অনুদানের স্ট্যাটাস সফলভাবে যাচাই হয়েছে'));
  });

  // 15. Admin Expenses
  fastify.get('/admin/expenses', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { campaignId } = request.query as { campaignId?: string };
    const expenses = await service.getExpenses(session.user.id, campaignId);
    return reply.send(successResponse(expenses, 'ক্যাম্পেইন খরচের তালিকা পাওয়া গেছে'));
  });

  fastify.post('/admin/expenses', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const body = CreateExpenseSchema.parse(request.body);
    const expense = await service.recordExpense(session.user.id, body);
    return reply.status(201).send(successResponse(expense, 'ক্যাম্পেইন খরচ সফলভাবে অন্তর্ভুক্ত হয়েছে'));
  });

  // 16. Admin Categories
  fastify.get('/admin/categories', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const categories = await service.getAdminCategories(session.user.id);
    return reply.send(successResponse(categories, 'সকল ক্যাটাগরি পাওয়া গেছে'));
  });

  fastify.post('/admin/categories', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const body = CreateCategorySchema.parse(request.body);
    const category = await service.createCategory(session.user.id, body);
    return reply.status(201).send(successResponse(category, 'নতুন ক্যাটাগরি তৈরি হয়েছে'));
  });

  fastify.put('/admin/categories/:id', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const body = UpdateCategorySchema.parse(request.body);
    const category = await service.updateCategory(session.user.id, id, body);
    return reply.send(successResponse(category, 'ক্যাটাগরি তথ্য হালনাগাদ হয়েছে'));
  });

  // 17. Admin Payment Configs
  fastify.get('/admin/payment-configs', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const configs = await service.getAdminPaymentConfigs(session.user.id);
    return reply.send(successResponse(configs, 'পেমেন্ট কনফিগারেশন তালিকা পাওয়া গেছে'));
  });

  fastify.put('/admin/payment-configs', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const body = UpdatePaymentConfigSchema.parse(request.body);
    const config = await service.updatePaymentConfig(session.user.id, body);
    return reply.send(successResponse(config, 'পেমেন্ট কনফিগারেশন সফলভাবে হালনাগাদ হয়েছে'));
  });
};
