export type ReactionType = 'LIKE' | 'LOVE' | 'CARE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export interface AuthorSummary {
  id: string;
  name: string;
  image?: string | null;
  role: string;
  phone?: string | null;
  isOrgMember?: boolean;
}

export interface PostMediaDto {
  id: string;
  publicId: string;
  secureUrl: string;
  resourceType: string;
  format: string;
  width?: number | null;
  height?: number | null;
}

export interface CommentDto {
  id: string;
  content: string;
  parentId?: string | null;
  createdAt: Date;
  author: AuthorSummary;
}

export interface PostDto {
  id: string;
  content: string;
  location?: string | null;
  category: string;
  blockBadge?: string | null;
  privacy?: string;
  bgColor?: string | null;
  groupId?: string | null;
  group?: { id: string; name: string } | null;
  sharedPostId?: string | null;
  sharedPost?: PostDto | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  status?: string;
  hasLiked: boolean;
  userReaction?: ReactionType | null;
  topReactions?: ReactionType[];
  recentLikers?: string[];
  hasSaved?: boolean;
  isEmergency: boolean;
  emergencyData?: unknown;
  createdAt: Date;
  author: AuthorSummary;
  media: PostMediaDto[];
  recentComments: CommentDto[];
}

export interface StoryDto {
  id: string;
  title: string;
  mediaUrl?: string | null;
  author: AuthorSummary;
  createdAt: Date;
}
