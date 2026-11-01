export type MediaResourceType = 'image' | 'video';

export interface UploadSignatureParams {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
  resourceType: MediaResourceType;
}

export interface MediaDto {
  id: string;
  publicId: string;
  secureUrl: string;
  resourceType: string;
  format: string;
  bytes: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  ownerId?: string | null;
  createdAt: Date;
}

