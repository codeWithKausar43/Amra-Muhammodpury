import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../config/database.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (server) => {
    await server.prisma.$disconnect();
  });
};

export default fp(prismaPlugin, {
  name: 'prisma-plugin',
});
