import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service.js';
import { checkAvailabilitySchema } from './auth.schema.js';
import { successResponse } from '../../utils/api-response.js';

export class AuthController {
  public static async checkAvailability(request: FastifyRequest, reply: FastifyReply) {
    const query = checkAvailabilitySchema.parse(request.query);
    const service = new AuthService(request.server.prisma);

    const result = await service.checkAvailability(query.email, query.phone);
    return reply.send(successResponse(result, 'Credentials are available'));
  }

  public static async getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
    const session = await request.server.authenticate(request, reply);
    const service = new AuthService(request.server.prisma);

    const user = await service.getCurrentUser(session.user.id);
    return reply.send(successResponse(user, 'Current user session profile'));
  }
}
