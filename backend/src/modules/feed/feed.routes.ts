import { FastifyPluginAsync } from 'fastify';
import { FeedController } from './feed.controller.js';

export const feedRoutes: FastifyPluginAsync = async (fastify) => {
  // Feed list (publicly readable, enhanced for authenticated users)
  fastify.get('/feed', FeedController.getFeed);

  // Stories
  fastify.get('/feed/stories', FeedController.getStories);

  // Create post (auth required)
  fastify.post('/feed/posts', FeedController.createPost);

  // Delete post (auth required, ownership checked)
  fastify.delete('/feed/posts/:id', FeedController.deletePost);

  // Toggle Like (auth required)
  fastify.post('/feed/posts/:id/like', FeedController.toggleLike);

  // Comments
  fastify.get('/feed/posts/:id/comments', FeedController.getComments);
  fastify.post('/feed/posts/:id/comments', FeedController.createComment);
};
