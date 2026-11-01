import { FastifyReply, FastifyRequest } from 'fastify';
import { successResponse } from '../../utils/api-response.js';

export class HealthController {
  public static async getHealth(_request: FastifyRequest, reply: FastifyReply) {
    const uptime = process.uptime();
    const memory = process.memoryUsage();

    return reply.send(
      successResponse(
        {
          status: 'UP',
          service: 'amra-muhammadpuri-backend',
          timestamp: new Date().toISOString(),
          uptimeSeconds: Math.floor(uptime),
          memoryUsageMb: {
            rss: Math.round(memory.rss / (1024 * 1024)),
            heapTotal: Math.round(memory.heapTotal / (1024 * 1024)),
            heapUsed: Math.round(memory.heapUsed / (1024 * 1024)),
          },
        },
        'Service is operational',
      ),
    );
  }

  public static async getReadiness(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Ping database via prisma
      await request.server.prisma.$queryRaw`SELECT 1`;
      return reply.send(successResponse({ database: 'CONNECTED' }, 'Application is ready'));
    } catch {
      return reply
        .status(503)
        .send(successResponse({ database: 'DISCONNECTED' }, 'Database connection failed'));
    }
  }
}
