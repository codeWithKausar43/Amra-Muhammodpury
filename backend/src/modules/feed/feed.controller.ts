import { FastifyReply, FastifyRequest } from 'fastify';
import { FeedService } from './feed.service.js';
import { feedQuerySchema, createPostSchema, createCommentSchema } from './feed.schema.js';
import { successResponse } from '../../utils/api-response.js';

export class FeedController {
  public static async getFeed(request: FastifyRequest, reply: FastifyReply) {
    const query = feedQuerySchema.parse(request.query);
    const service = new FeedService(request.server.prisma);

    // Optional user session for hasLiked check
    let currentUserId: string | undefined;
    try {
      const session = await request.server.authenticate(request, reply);
      currentUserId = session.user.id;
    } catch {
      // Unauthenticated visitor is allowed to view public feed!
    }

    const result = await service.getFeed(query, currentUserId);
    return reply.send(successResponse(result.posts, 'Feed posts retrieved', {
      page: result.page,
      limit: query.limit,
      total: result.total,
      totalPages: result.totalPages,
    }));
  }

  public static async createPost(request: FastifyRequest, reply: FastifyReply) {
    const session = await request.server.authenticate(request, reply);
    const input = createPostSchema.parse(request.body);
    const service = new FeedService(request.server.prisma);

    const post = await service.createPost(input, session.user.id);
    return reply.status(201).send(successResponse(post, 'পোস্ট সফলভাবে প্রকাশিত হয়েছে'));
  }

  public static async deletePost(request: FastifyRequest, reply: FastifyReply) {
    const session = await request.server.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const service = new FeedService(request.server.prisma);

    await service.deletePost(id, session.user.id);
    return reply.send(successResponse(null, 'পোস্ট সফলভাবে মুছে ফেলা হয়েছে'));
  }

  public static async toggleLike(request: FastifyRequest, reply: FastifyReply) {
    const session = await request.server.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const service = new FeedService(request.server.prisma);

    const result = await service.toggleLike(id, session.user.id);
    return reply.send(successResponse(result, result.liked ? 'পছন্দ করা হয়েছে' : 'পছন্দ বাতিল করা হয়েছে'));
  }

  public static async getComments(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const service = new FeedService(request.server.prisma);

    const comments = await service.getComments(id);
    return reply.send(successResponse(comments, 'Comments retrieved'));
  }

  public static async createComment(request: FastifyRequest, reply: FastifyReply) {
    const session = await request.server.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const input = createCommentSchema.parse(request.body);
    const service = new FeedService(request.server.prisma);

    const comment = await service.createComment(id, session.user.id, input);
    return reply.status(201).send(successResponse(comment, 'মন্তব্য যোগ করা হয়েছে'));
  }

  public static async getStories(request: FastifyRequest, reply: FastifyReply) {
    const service = new FeedService(request.server.prisma);
    const stories = await service.getStories();
    return reply.send(successResponse(stories, 'Stories retrieved'));
  }
}
