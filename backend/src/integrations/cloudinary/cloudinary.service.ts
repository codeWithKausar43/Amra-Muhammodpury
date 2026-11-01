import { PrismaClient } from '@prisma/client';
import { cloudinary } from './cloudinary.config.js';
import { env } from '../../config/env.js';
import { UploadSignatureInput, UploadConfirmInput } from './cloudinary.schema.js';
import { UploadSignatureParams, MediaDto } from './cloudinary.types.js';
import { BadRequestError, NotFoundError } from '../../errors/app-error.js';

export class CloudinaryService {
  constructor(private readonly prisma: PrismaClient) {}

  public generateUploadSignature(
    input: UploadSignatureInput,
    _userId?: string,
  ): UploadSignatureParams {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const targetFolder = `${env.CLOUDINARY_UPLOAD_FOLDER}/${input.folder}`;

    const paramsToSign: Record<string, string | number> = {
      folder: targetFolder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, env.CLOUDINARY_API_SECRET);

    return {
      timestamp,
      folder: targetFolder,
      signature,
      apiKey: env.CLOUDINARY_API_KEY,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      resourceType: input.resourceType,
    };
  }

  public async confirmUpload(input: UploadConfirmInput, userId?: string): Promise<MediaDto> {
    // Validate that publicId starts with the configured folder
    if (!input.publicId.startsWith(env.CLOUDINARY_UPLOAD_FOLDER)) {
      throw new BadRequestError('Invalid asset publicId path');
    }

    // Upsert into database
    const media = await this.prisma.media.upsert({
      where: { publicId: input.publicId },
      update: {
        secureUrl: input.secureUrl,
        resourceType: input.resourceType,
        format: input.format,
        bytes: input.bytes,
        width: input.width ?? null,
        height: input.height ?? null,
        duration: input.duration ?? null,
        ownerId: userId ?? null,
        tempToken: input.tempToken ?? null,
      },
      create: {
        publicId: input.publicId,
        secureUrl: input.secureUrl,
        resourceType: input.resourceType,
        format: input.format,
        bytes: input.bytes,
        width: input.width ?? null,
        height: input.height ?? null,
        duration: input.duration ?? null,
        ownerId: userId ?? null,
        tempToken: input.tempToken ?? null,
      },
    });

    return media;
  }

  public async claimTempUpload(tempToken: string, userId: string): Promise<MediaDto> {
    const media = await this.prisma.media.findFirst({
      where: { tempToken },
    });

    if (!media) {
      throw new NotFoundError('Temporary upload not found or already claimed');
    }

    const updated = await this.prisma.media.update({
      where: { id: media.id },
      data: {
        ownerId: userId,
        tempToken: null,
      },
    });

    // Also update User profile image if it is an image
    if (updated.resourceType === 'image') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { image: updated.secureUrl },
      });
    }

    return updated;
  }

  public async deleteMedia(publicId: string, userId: string): Promise<boolean> {
    const media = await this.prisma.media.findUnique({
      where: { publicId },
    });

    if (!media) {
      throw new NotFoundError('Media asset not found');
    }

    if (media.ownerId && media.ownerId !== userId) {
      throw new BadRequestError('Unauthorized to delete this media asset');
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId, {
      resource_type: media.resourceType as 'image' | 'video',
    });

    // Delete from database
    await this.prisma.media.delete({
      where: { id: media.id },
    });

    return true;
  }
}
