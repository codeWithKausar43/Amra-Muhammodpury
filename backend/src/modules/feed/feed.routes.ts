import { FastifyPluginAsync } from 'fastify';
import { FeedController } from './feed.controller.js';

export const feedRoutes: FastifyPluginAsync = async (fastify) => {
  // Feed list (publicly readable, enhanced for authenticated users)
  fastify.get('/feed', FeedController.getFeed);

  // Stories
  fastify.get('/feed/stories', FeedController.getStories);
  fastify.post('/feed/stories', FeedController.createStory);

  // Create post (auth required)
  fastify.post('/feed/posts', FeedController.createPost);

  // Edit post (auth required, ownership checked)
  fastify.patch('/feed/posts/:id', FeedController.editPost);

  // Share post (auth required)
  fastify.post('/feed/posts/:id/share', FeedController.sharePost);

  // Delete post (auth required, ownership checked)
  fastify.delete('/feed/posts/:id', FeedController.deletePost);

  // Toggle Like (auth required)
  fastify.post('/feed/posts/:id/like', FeedController.toggleLike);

  // Comments
  fastify.get('/feed/posts/:id/comments', FeedController.getComments);
  fastify.post('/feed/posts/:id/comments', FeedController.createComment);
  fastify.delete('/feed/comments/:commentId', FeedController.deleteComment);
};
