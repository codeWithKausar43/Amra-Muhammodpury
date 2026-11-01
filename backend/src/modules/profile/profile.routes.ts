import { FastifyPluginAsync } from 'fastify';
import { ProfileService } from './profile.service.js';
import { successResponse } from '../../utils/api-response.js';

export const profileRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new ProfileService(fastify.prisma);

  // Get current user profile shortcut
  fastify.get('/profile/me', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const profile = await service.getProfile(session.user.id, session.user.id);
    return reply.send(successResponse(profile, 'Profile retrieved'));
  });

  // Get user profile
  fastify.get('/profile/:userId', async (request, reply) => {
    let currentUserId: string | undefined;
    try {
      const session = await fastify.authenticate(request, reply);
      currentUserId = session.user.id;
    } catch {
      // unauthenticated visitor
    }

    const { userId } = request.params as { userId: string };
    const targetId = userId === 'me' ? currentUserId : userId;
    if (!targetId) {
      return reply.code(401).send({ success: false, message: 'অননুমোদিত অনুরোধ' });
    }

    const profile = await service.getProfile(targetId, currentUserId);
    return reply.send(successResponse(profile, 'Profile retrieved'));
  });

  // Update own profile
  fastify.patch('/profile', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const body = request.body as {
      name?: string;
      email?: string;
      phone?: string;
      bio?: string;
      image?: string;
      coverImage?: string;
    };
    const updated = await service.updateProfile(session.user.id, body);
    return reply.send(successResponse(updated, 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে'));
  });
};
