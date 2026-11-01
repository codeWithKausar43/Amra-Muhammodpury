export interface AuthorSummary {
  id: string;
  name: string;
  image?: string | null;
  role: string;
  phone?: string | null;
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
  createdAt: Date;
  author: AuthorSummary;
}

export interface PostDto {
  id: string;
  content: string;
  location?: string | null;
  category: string;
  blockBadge?: string | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  hasLiked: boolean;
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
