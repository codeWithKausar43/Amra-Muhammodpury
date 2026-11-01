import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import { successResponse } from '../../utils/api-response.js';
import { HTTP_STATUS } from '../../constants/status-codes.js';

export class AuthController {
  public static async register(request: FastifyRequest, reply: FastifyReply) {
    const validatedData = registerSchema.parse(request.body);
    const authService = new AuthService(request.server.prisma);

    const user = await authService.register(validatedData);

    return reply
      .status(HTTP_STATUS.CREATED)
      .send(successResponse(user, 'Account successfully created'));
  }

  public static async login(request: FastifyRequest, reply: FastifyReply) {
    const validatedData = loginSchema.parse(request.body);
    const authService = new AuthService(request.server.prisma);

    const result = await authService.login(validatedData);

    return reply.status(HTTP_STATUS.OK).send(successResponse(result, 'Login successful'));
  }
}
