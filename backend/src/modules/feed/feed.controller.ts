import { FastifyReply, FastifyRequest } from 'fastify';
import { FeedService } from './feed.service.js';
import {
  feedQuerySchema,
  createPostSchema,
  updatePostSchema,
  sharePostSchema,
  createCommentSchema,
  createStorySchema,
} from './feed.schema.js';
import { successResponse } from '../../utils/api-response.js';
import type { ReactionType } from './feed.types.js';

export class FeedController {
  public static async getFeed(request: FastifyRequest, reply: FastifyReply) {
    const query = feedQuerySchema.parse(request.query);
    const service = new FeedService(request.server.prisma);

    let currentUserId: string | undefined;
    try {
      const session = await request.server.authenticate(request, reply);
      currentUserId = session.user.id;
    } catch {
      // Unauthenticated visitor is allowed to view public feed!
    }

    const result = await service.getFeed(query, currentUserId);
    return reply.send(
      successResponse(result.posts, 'Feed posts retrieved', {
        page: result.page,
        limit: query.limit,
        total: result.total,
        totalPages: result.totalPages,
      }),
    );
  }

  public static async createPost(request: FastifyRequest, reply: FastifyReply) {
    const session = await request.server.authenticate(request, reply);
    const input = createPostSchema.parse(request.body);
    const service = new FeedService(request.server.prisma);

    const post = await service.createPost(input, session.user.id);
    return reply.status(201).send(successResponse(post, 'পোস্ট সফলভাবে প্রকাশিত হয়েছে'));
  }

  public static async editPost(request: FastifyRequest, reply: FastifyReply) {
    const session = await request.server.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const input = updatePostSchema.parse(request.body);
    const service = new FeedService(request.server.prisma);

    const updated = await service.editPost(id, session.user.id, input);
    return reply.send(successResponse(updated, 'পোস্ট সফলভাবে আপডেট করা হয়েছে'));
  }

  public static async sharePost(request: FastifyRequest, reply: FastifyReply) {
    const session = await request.server.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const input = sharePostSchema.parse(request.body || {});
    const service = new FeedService(request.server.prisma);

    const shared = await service.sharePost(id, session.user.id, input.caption);
    return reply.send(successResponse(shared, 'পোস্টটি আপনার টাইমলাইনে শেয়ার করা হয়েছে'));
  }

  public static async deletePost(request: FastifyRequest, reply: FastifyReply) {
    const session = await request.server.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const service = new FeedService(request.server.prisma);

    await service.deletePost(id, session.user.id);
    return reply.send(successResponse(null, 'পোস্ট সফলভাবে মুছে ফেলা হয়েছে'));
  }

  public static async toggleDraft(request: FastifyRequest, reply: FastifyReply) {
    const session = await request.server.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const body = (request.body as { status?: 'PUBLISHED' | 'DRAFT' }) || {};
    const service = new FeedService(request.server.prisma);

    const result = await service.togglePostDraft(id, session.user.id, body.status);
    return reply.send(
      successResponse(
        result,
        result.status === 'DRAFT' ? 'পোস্টটি সফলভাবে ড্রাফট করা হয়েছে' : 'পোস্টটি সফলভাবে পুনরায় প্রকাশ করা হয়েছে',
      ),
    );
  }

  public static async toggleLike(request: FastifyRequest, reply: FastifyReply) {
    const session = await request.server.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const body = (request.body as { type?: ReactionType }) || {};
    const service = new FeedService(request.server.prisma);

    const result = await service.toggleLike(id, session.user.id, body.type);
    return reply.send(
      successResponse(result, result.liked ? 'প্রতিক্রিয়া সম্পন্ন হয়েছে' : 'প্রতিক্রিয়া মুছে ফেলা হয়েছে'),
    );
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

  public static async deleteComment(request: FastifyRequest, reply: FastifyReply) {
    const session = await request.server.authenticate(request, reply);
    const { commentId } = request.params as { commentId: string };
    const service = new FeedService(request.server.prisma);

    await service.deleteComment(commentId, session.user.id);
    return reply.send(successResponse(null, 'মন্তব্য সফলভাবে মুছে ফেলা হয়েছে'));
  }

  public static async getStories(request: FastifyRequest, reply: FastifyReply) {
    const service = new FeedService(request.server.prisma);
    const stories = await service.getStories();
    return reply.send(successResponse(stories, 'Stories retrieved'));
  }

  public static async createStory(request: FastifyRequest, reply: FastifyReply) {
    const session = await request.server.authenticate(request, reply);
    const input = createStorySchema.parse(request.body);
    const service = new FeedService(request.server.prisma);

    const story = await service.createStory(input, session.user.id);
    return reply.status(201).send(successResponse(story, 'স্টোরি সফলভাবে যুক্ত হয়েছে'));
  }
}
