import { z } from 'zod';

export const uploadSignatureSchema = z.object({
  resourceType: z.enum(['image', 'video']).default('image'),
  folder: z.enum(['profiles', 'posts', 'media']).default('profiles'),
  isRegistration: z.boolean().optional().default(false),
  tempToken: z.string().optional(),
});

export const uploadConfirmSchema = z.object({
  publicId: z.string().min(1, 'Public ID is required'),
  secureUrl: z.string().url('Invalid secure URL'),
  resourceType: z.enum(['image', 'video']).default('image'),
  format: z.string().min(1),
  bytes: z.number().positive(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  tempToken: z.string().optional(),
});

export const claimMediaSchema = z.object({
  tempToken: z.string().min(10, 'Invalid temporary upload token'),
});

export type UploadSignatureInput = z.infer<typeof uploadSignatureSchema>;
export type UploadConfirmInput = z.infer<typeof uploadConfirmSchema>;
export type ClaimMediaInput = z.infer<typeof claimMediaSchema>;

