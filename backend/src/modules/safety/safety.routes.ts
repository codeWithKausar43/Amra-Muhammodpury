import { FastifyPluginAsync } from 'fastify';
import { SafetyService, CreateReportInput } from './safety.service.js';
import { successResponse } from '../../utils/api-response.js';

export const safetyRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new SafetyService(fastify.prisma);

  // Get blocked users
  fastify.get('/safety/blocked', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const blocked = await service.getBlockedUsers(session.user.id);
    return reply.send(successResponse(blocked, 'Blocked users list'));
  });

  // Block a user
  fastify.post('/safety/block/:userId', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { userId } = request.params as { userId: string };
    const result = await service.blockUser(session.user.id, userId);
    return reply.send(successResponse(result, result.message));
  });

  // Unblock a user
  fastify.delete('/safety/unblock/:userId', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { userId } = request.params as { userId: string };
    const result = await service.unblockUser(session.user.id, userId);
    return reply.send(successResponse(result, result.message));
  });

  // Submit a report
  fastify.post('/safety/report', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const body = request.body as CreateReportInput;
    const report = await service.createReport(session.user.id, body);
    return reply.send(successResponse(report, 'রিপোর্টটি গ্রহণ করা হয়েছে। পর্যালোচনা করে ব্যবস্থা নেওয়া হবে।'));
  });
};

