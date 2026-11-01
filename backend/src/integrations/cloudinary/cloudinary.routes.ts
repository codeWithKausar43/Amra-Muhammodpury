import { FastifyPluginAsync } from 'fastify';
import { CloudinaryService } from './cloudinary.service.js';
import {
  uploadSignatureSchema,
  uploadConfirmSchema,
  claimMediaSchema,
} from './cloudinary.schema.js';
import { successResponse } from '../../utils/api-response.js';

export const cloudinaryRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new CloudinaryService(fastify.prisma);

  // 1. Generate signed upload parameters
  fastify.post('/uploads/signature', async (request, reply) => {
    const input = uploadSignatureSchema.parse(request.body);

    // If not registration, require authenticated user
    let userId: string | undefined;
    if (!input.isRegistration) {
      const session = await fastify.authenticate(request, reply);
      userId = session.user.id;
    }

    const signatureData = service.generateUploadSignature(input, userId);
    return reply.send(successResponse(signatureData, 'Signed upload authorization generated'));
  });

  // 2. Confirm asset uploaded to Cloudinary
  fastify.post('/uploads/confirm', async (request, reply) => {
    const input = uploadConfirmSchema.parse(request.body);

    let userId: string | undefined;
    if (!input.tempToken) {
      const session = await fastify.authenticate(request, reply);
      userId = session.user.id;
    }

    const media = await service.confirmUpload(input, userId);
    return reply.send(successResponse(media, 'Media upload confirmed and metadata saved'));
  });

  // 3. Claim temporary upload (e.g. after registration completes)
  fastify.post('/uploads/claim', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const input = claimMediaSchema.parse(request.body);

    const media = await service.claimTempUpload(input.tempToken, session.user.id);
    return reply.send(successResponse(media, 'Profile media successfully associated with user'));
  });
};
