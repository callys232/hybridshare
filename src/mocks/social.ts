import type { SocialShare } from '@/shared/social';

export const MOCK_SOCIAL_POSTS: (SocialShare & { posts: unknown[] })[] = [
  {
    id: 'social-1',
    fileId: 'file-1',
    assetId: null,
    userId: 'user-1',
    platforms: ['LINKEDIN', 'TWITTER'] as never[],
    message: 'Excited to share our 2024 Brand Guidelines! 🎨 #design #branding',
    mediaUrls: [],
    scheduledAt: null,
    publishedAt: new Date('2024-01-21'),
    status: 'PUBLISHED' as never,
    errorMessage: null,
    externalPostIds: { LINKEDIN: 'li-123', TWITTER: 'tw-456' },
    createdAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-21'),
    posts: [
      { platform: 'LINKEDIN', status: 'PUBLISHED', publishedAt: new Date('2024-01-21') },
      { platform: 'TWITTER', status: 'PUBLISHED', publishedAt: new Date('2024-01-21') },
    ],
  },
];
