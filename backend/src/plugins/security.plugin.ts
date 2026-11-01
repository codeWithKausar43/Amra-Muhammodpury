import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import { FastifyPluginAsync } from 'fastify';

const securityPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  });
};

export default fp(securityPlugin, {
  name: 'security-plugin',
});
