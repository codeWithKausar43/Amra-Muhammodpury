export interface AuthorSummary {
  id: string;
  name: string;
  image?: string | null;
  role: string;
  phone?: string | null;
}

export interface PostMedia {
  id: string;
  publicId: string;
  secureUrl: string;
  resourceType: string;
  format: string;
  width?: number | null;
  height?: number | null;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: AuthorSummary;
}

export interface Post {
  id: string;
  content: string;
  location?: string | null;
  category: 'GENERAL' | 'MY_BLOCK' | 'POPULAR' | 'EMERGENCY';
  blockBadge?: string | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  hasLiked: boolean;
  isEmergency: boolean;
  emergencyData?: {
    department?: string;
    hotline?: string;
    badgeText?: string;
  } | null;
  createdAt: string;
  author: AuthorSummary;
  media: PostMedia[];
  recentComments: Comment[];
}

export interface Story {
  id: string;
  title: string;
  mediaUrl?: string | null;
  author: AuthorSummary;
  createdAt: string;
  viewsCount?: number;
}

export interface CreatePostPayload {
  content: string;
  location?: string;
  category?: 'GENERAL' | 'MY_BLOCK' | 'POPULAR' | 'EMERGENCY';
  blockBadge?: string;
  mediaIds?: string[];
  isEmergency?: boolean;
  emergencyData?: {
    department?: string;
    hotline?: string;
    badgeText?: string;
  };
}

