import { FastifyPluginAsync } from 'fastify';
import { FriendService } from './friend.service.js';
import { successResponse } from '../../utils/api-response.js';

export const friendRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new FriendService(fastify.prisma);

  // Get friends list
  fastify.get('/friends', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const friends = await service.getFriends(session.user.id);
    return reply.send(successResponse(friends, 'Friends retrieved successfully'));
  });

  // Get pending requests (incoming and sent)
  fastify.get('/friends/requests', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const requests = await service.getRequests(session.user.id);
    return reply.send(successResponse(requests, 'Requests retrieved successfully'));
  });

  // Get friend recommendations / suggestions
  fastify.get('/friends/suggestions', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const suggestions = await service.getSuggestions(session.user.id);
    return reply.send(successResponse(suggestions, 'Friend suggestions retrieved'));
  });

  // Get friendship status with another user
  fastify.get('/friends/status/:targetUserId', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { targetUserId } = request.params as { targetUserId: string };
    const status = await service.getStatus(session.user.id, targetUserId);
    return reply.send(successResponse(status, 'Status retrieved'));
  });

  // Send friend request
  fastify.post('/friends/request/:targetUserId', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { targetUserId } = request.params as { targetUserId: string };
    const result = await service.sendRequest(session.user.id, targetUserId);
    return reply.send(successResponse(result, 'ফ্রেন্ড রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে'));
  });

  // Accept friend request
  fastify.post('/friends/requests/:requestId/accept', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { requestId } = request.params as { requestId: string };
    const result = await service.acceptRequest(session.user.id, requestId);
    return reply.send(successResponse(result, result.message));
  });

  // Reject friend request
  fastify.post('/friends/requests/:requestId/reject', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { requestId } = request.params as { requestId: string };
    const result = await service.rejectRequest(session.user.id, requestId);
    return reply.send(successResponse(result, result.message));
  });

  // Cancel sent request
  fastify.post('/friends/requests/:requestId/cancel', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { requestId } = request.params as { requestId: string };
    const result = await service.cancelRequest(session.user.id, requestId);
    return reply.send(successResponse(result, result.message));
  });

  // Remove friend
  fastify.delete('/friends/:friendId', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { friendId } = request.params as { friendId: string };
    const result = await service.removeFriend(session.user.id, friendId);
    return reply.send(successResponse(result, result.message));
  });
};
