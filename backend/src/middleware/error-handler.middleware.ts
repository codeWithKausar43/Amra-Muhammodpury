import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { errorResponse } from '../utils/api-response.js';
import { HTTP_STATUS } from '../constants/status-codes.js';

export const errorHandler = (
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  request.log.error(error);

  // 1. Zod schema validation errors
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return reply
      .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
      .send(errorResponse('Validation failed', 'VALIDATION_ERROR', formattedErrors));
  }

  // 2. Custom operational application errors
  if (error instanceof AppError) {
    return reply
      .status(error.statusCode)
      .send(errorResponse(error.message, 'APPLICATION_ERROR', error.details));
  }

  // 3. Fastify built-in HTTP errors (e.g., 404, schema validation)
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    return reply.status(error.statusCode).send(errorResponse(error.message, 'HTTP_ERROR'));
  }

  // 4. Uncaught server exceptions
  return reply
    .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .send(
      errorResponse(
        process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        'INTERNAL_SERVER_ERROR',
      ),
    );
};
