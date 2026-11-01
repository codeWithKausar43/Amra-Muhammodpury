import { z } from 'zod';

export const feedQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  category: z.enum(['ALL', 'MY_POSTS', 'MY_BLOCK', 'POPULAR', 'EMERGENCY', 'LIVE']).default('ALL'),
  search: z.string().optional(),
});

export const createPostSchema = z
  .object({
    content: z.string().max(5000).default(''),
    location: z.string().max(100).optional(),
    category: z.enum(['GENERAL', 'MY_POSTS', 'MY_BLOCK', 'POPULAR', 'EMERGENCY']).default('GENERAL'),
    blockBadge: z.string().max(50).optional(),
    blockName: z.string().max(50).optional(),
    privacy: z.enum(['PUBLIC', 'FRIENDS', 'ONLY_ME']).default('PUBLIC'),
    bgColor: z.string().optional(),
    groupId: z.string().optional(),
    sharedPostId: z.string().optional(),
    mediaIds: z.array(z.string()).optional().default([]),
    isEmergency: z.boolean().optional().default(false),
    emergencyData: z
      .object({
        department: z.string().optional(),
        hotline: z.string().optional(),
        badgeText: z.string().optional(),
      })
      .optional(),
  })
  .refine(
    (data) =>
      (data.content && data.content.trim().length > 0) ||
      (data.mediaIds && data.mediaIds.length > 0),
    {
      message: 'পোস্টের বিষয়বস্তু অথবা অন্তত একটি ছবি প্রদান করুন',
      path: ['content'],
    },
  );

export const updatePostSchema = z.object({
  content: z.string().min(1, 'পোস্টের বিষয়বস্তু লিখুন').max(5000).optional(),
  location: z.string().max(100).optional(),
  privacy: z.enum(['PUBLIC', 'FRIENDS', 'ONLY_ME']).optional(),
});

export const sharePostSchema = z.object({
  caption: z.string().max(1000).optional().default(''),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'মন্তব্য লিখুন').max(1000),
  parentId: z.string().optional(),
});

export const createStorySchema = z.object({
  title: z.string().max(200).optional().default(''),
  mediaUrl: z.string().url('বৈধ ছবির লিংক প্রয়োজন'),
});

export type FeedQueryInput = z.infer<typeof feedQuerySchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type SharePostInput = z.infer<typeof sharePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateStoryInput = z.infer<typeof createStorySchema>;
