import { FastifyPluginAsync } from 'fastify';
import { MessageService } from './message.service.js';
import { successResponse } from '../../utils/api-response.js';

export const messageRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new MessageService(fastify.prisma);

  // List all conversations for authenticated user
  fastify.get('/messages/conversations', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const conversations = await service.getConversations(session.user.id);
    return reply.send(successResponse(conversations, 'Conversations retrieved'));
  });

  // Get message thread inside a conversation
  fastify.get('/messages/conversations/:conversationId', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { conversationId } = request.params as { conversationId: string };
    const data = await service.getMessages(conversationId, session.user.id);
    return reply.send(successResponse(data, 'Messages retrieved'));
  });

  // Send message
  fastify.post('/messages/send', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { recipientId, content, mediaUrl } = request.body as {
      recipientId: string;
      content: string;
      mediaUrl?: string;
    };
    const message = await service.sendMessage(session.user.id, recipientId, content, mediaUrl);
    return reply.send(successResponse(message, 'বার্তা সফলভাবে পাঠানো হয়েছে'));
  });
};

