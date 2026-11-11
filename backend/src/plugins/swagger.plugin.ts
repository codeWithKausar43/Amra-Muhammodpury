import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { FastifyPluginAsync } from 'fastify';

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'মোহাম্মদপুর কমিউনিটি API',
        description: 'REST API service for the Amra Muhammadpuri community platform',
        version: '1.0.0',
        contact: {
          name: 'API Support Team',
          email: 'support@amra-muhammadpuri.org',
        },
      },
      servers: [
        {
          url: 'http://localhost:5000',
          description: 'Local Development Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'System', description: 'System health & operational endpoints' },
        { name: 'Auth', description: 'Authentication and authorization endpoints' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
};

export default fp(swaggerPlugin, {
  name: 'swagger-plugin',
});
