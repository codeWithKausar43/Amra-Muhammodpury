import { FastifyPluginAsync } from 'fastify';
import { GroupService, CreateGroupInput } from './group.service.js';
import { successResponse } from '../../utils/api-response.js';

export const groupRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new GroupService(fastify.prisma);

  // Get groups (joined & discover)
  fastify.get('/groups', async (request, reply) => {
    let userId: string | undefined;
    try {
      const session = await fastify.authenticate(request, reply);
      userId = session.user.id;
    } catch {
      // Allow unauthenticated visitors to discover public groups
    }

    const result = await service.getGroups(userId);
    return reply.send(successResponse(result, 'Groups retrieved successfully'));
  });

  // Get group details
  fastify.get('/groups/:groupId', async (request, reply) => {
    let userId: string | undefined;
    try {
      const session = await fastify.authenticate(request, reply);
      userId = session.user.id;
    } catch {
      // visitor
    }

    const { groupId } = request.params as { groupId: string };
    const group = await service.getGroup(groupId, userId);
    return reply.send(successResponse(group, 'Group details retrieved'));
  });

  // Create new group
  fastify.post('/groups', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const body = request.body as CreateGroupInput;
    const group = await service.createGroup(session.user.id, body);
    return reply.send(successResponse(group, 'গ্রুপ সফলভাবে তৈরি করা হয়েছে'));
  });

  // Join group
  fastify.post('/groups/:groupId/join', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { groupId } = request.params as { groupId: string };
    const result = await service.joinGroup(groupId, session.user.id);
    return reply.send(successResponse(result, result.message));
  });

  // Leave group
  fastify.post('/groups/:groupId/leave', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { groupId } = request.params as { groupId: string };
    const result = await service.leaveGroup(groupId, session.user.id);
    return reply.send(successResponse(result, result.message));
  });

  // Get group feed
  fastify.get('/groups/:groupId/posts', async (request, reply) => {
    let userId: string | undefined;
    try {
      const session = await fastify.authenticate(request, reply);
      userId = session.user.id;
    } catch {
      // unauthenticated
    }

    const { groupId } = request.params as { groupId: string };
    const posts = await service.getGroupPosts(groupId, userId);
    return reply.send(successResponse(posts, 'Group posts retrieved'));
  });

  // Create post in group
  fastify.post('/groups/:groupId/posts', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { groupId } = request.params as { groupId: string };
    const body = request.body as { content: string; location?: string; mediaIds?: string[] };
    const post = await service.createGroupPost(groupId, session.user.id, body);
    return reply.send(successResponse(post, 'গ্রুপে পোস্ট সফলভাবে প্রকাশ করা হয়েছে'));
  });

  // Admin: Get membership join requests
  fastify.get('/groups/:groupId/requests', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { groupId } = request.params as { groupId: string };
    const requests = await service.getJoinRequests(groupId, session.user.id);
    return reply.send(successResponse(requests, 'Join requests retrieved'));
  });

  // Admin: Approve membership join request
  fastify.post('/groups/:groupId/requests/:requestId/approve', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { groupId, requestId } = request.params as { groupId: string; requestId: string };
    const result = await service.approveJoinRequest(groupId, requestId, session.user.id);
    return reply.send(successResponse(result, result.message));
  });

  // Admin: Reject membership join request
  fastify.post('/groups/:groupId/requests/:requestId/reject', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { groupId, requestId } = request.params as { groupId: string; requestId: string };
    const result = await service.rejectJoinRequest(groupId, requestId, session.user.id);
    return reply.send(successResponse(result, result.message));
  });
};
