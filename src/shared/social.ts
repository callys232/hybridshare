export enum SocialPlatform {
  TWITTER = 'TWITTER',
  LINKEDIN = 'LINKEDIN',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  SLACK = 'SLACK',
  TEAMS = 'TEAMS',
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PUBLISHING = 'PUBLISHING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface SocialShare {
  id: string;
  fileId: string | null;
  assetId: string | null;
  userId: string;
  platforms: SocialPlatform[];
  message: string;
  mediaUrls: string[];
  scheduledAt: Date | null;
  publishedAt: Date | null;
  status: PostStatus;
  errorMessage: string | null;
  externalPostIds: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialPost {
  id: string;
  shareId: string;
  platform: SocialPlatform;
  externalPostId: string | null;
  status: PostStatus;
  publishedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}

export interface SocialAnalytics {
  id: string;
  postId: string;
  platform: SocialPlatform;
  impressions: number;
  reach: number;
  clicks: number;
  likes: number;
  shares: number;
  comments: number;
  fetchedAt: Date;
}

export interface ShareComposerData {
  message: string;
  platforms: SocialPlatform[];
  fileIds: string[];
  assetIds: string[];
  scheduledAt: Date | null;
  mediaUrls: string[];
}

export interface ZernioPublishRequest {
  platforms: SocialPlatform[];
  message: string;
  mediaUrls?: string[];
  scheduledAt?: string;
}

export interface ZernioPublishResponse {
  success: boolean;
  postIds: Record<string, string>;
  scheduledAt?: string;
  errors?: Record<string, string>;
}
