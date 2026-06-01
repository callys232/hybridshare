import type { FileMetadata, Folder, ShareLink } from '@hybridshare/shared/types/file';
import type { Workspace, WorkspaceMember } from '@hybridshare/shared/types/workspace';
import type { User } from '@hybridshare/shared/types/user';
import type { Connector } from '@hybridshare/shared/types/connector';
import type { SocialShare } from '@hybridshare/shared/types/social';
import type { NormalizedAsset } from '@hybridshare/shared/types/connector';

// ─── Users ────────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    email: 'admin@hybridshare.io',
    name: 'Alex Carter',
    avatar: null,
    role: 'ADMIN' as never,
    provider: 'LOCAL' as never,
    isEmailVerified: true,
    isTwoFactorEnabled: false,
    isActive: true,
    lastLoginAt: new Date(),
    storageUsed: 1073741824,
    storageQuota: 10737418240,
    bio: 'Full-stack engineer building scalable platforms.',
    jobTitle: 'Senior Engineer',
    website: 'https://hybridshare.io',
    linkedinUrl: 'alex-carter',
    twitterHandle: 'alexcarter',
    timezone: 'America/New_York',
    language: 'en',
    planType: 'ENTERPRISE' as never,
    subscriptionStatus: 'ACTIVE' as never,
    xpPoints: 0,
    streakDays: 0,
    longestStreak: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'user-2',
    email: 'jane@hybridshare.io',
    name: 'Jane Smith',
    avatar: null,
    role: 'MEMBER' as never,
    provider: 'GOOGLE' as never,
    isEmailVerified: true,
    isTwoFactorEnabled: true,
    isActive: true,
    lastLoginAt: new Date(Date.now() - 3600000),
    storageUsed: 524288000,
    storageQuota: 10737418240,
    bio: null,
    jobTitle: 'UX Designer',
    website: null,
    linkedinUrl: null,
    twitterHandle: null,
    timezone: 'America/Los_Angeles',
    language: 'en',
    planType: 'STARTER' as never,
    subscriptionStatus: 'ACTIVE' as never,
    xpPoints: 0,
    streakDays: 0,
    longestStreak: 14,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
  },
  {
    id: 'user-3',
    email: 'bob@hybridshare.io',
    name: 'Bob Johnson',
    avatar: null,
    role: 'VIEWER' as never,
    provider: 'LOCAL' as never,
    isEmailVerified: true,
    isTwoFactorEnabled: false,
    isActive: true,
    lastLoginAt: new Date(Date.now() - 86400000),
    storageUsed: 209715200,
    storageQuota: 5368709120,
    bio: null,
    jobTitle: 'Data Scientist',
    website: null,
    linkedinUrl: null,
    twitterHandle: null,
    timezone: 'UTC',
    language: 'en',
    planType: 'FREE' as never,
    subscriptionStatus: null,
    xpPoints: 0,
    streakDays: 0,
    longestStreak: 0,
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date(),
  },
];

// ─── Workspaces ───────────────────────────────────────────────────────────────

export const MOCK_WORKSPACES: (Workspace & { memberCount: number; fileCount: number })[] = [
  {
    id: 'ws-1',
    name: 'Marketing Team',
    description: 'Brand assets, campaigns, and creative files',
    type: 'TEAM' as never,
    iconUrl: null,
    color: '#c12129',
    isPublic: false,
    storageQuota: 107374182400,
    storageUsed: 10737418240,
    ownerId: 'user-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    memberCount: 8,
    fileCount: 342,
  },
  {
    id: 'ws-2',
    name: 'Engineering Docs',
    description: 'Technical documentation, specs, and architecture diagrams',
    type: 'DEPARTMENT' as never,
    iconUrl: null,
    color: '#000000',
    isPublic: false,
    storageQuota: 214748364800,
    storageUsed: 32212254720,
    ownerId: 'user-1',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date(),
    memberCount: 15,
    fileCount: 1204,
  },
  {
    id: 'ws-3',
    name: 'Q4 Product Launch',
    description: 'Launch assets, press kit, and campaign materials',
    type: 'PROJECT' as never,
    iconUrl: null,
    color: '#c12129',
    isPublic: false,
    storageQuota: 53687091200,
    storageUsed: 8589934592,
    ownerId: 'user-2',
    createdAt: new Date('2024-09-01'),
    updatedAt: new Date(),
    memberCount: 6,
    fileCount: 89,
  },
];

// ─── Files ────────────────────────────────────────────────────────────────────

export const MOCK_FILES: (FileMetadata & { uploadedBy: { id: string; name: string; avatar: string | null } })[] = [
  {
    id: 'file-1',
    name: 'Brand Guidelines 2024.pdf',
    originalName: 'Brand Guidelines 2024.pdf',
    mimeType: 'application/pdf',
    size: 8388608,
    extension: 'pdf',
    storagePath: 'files/2024/01/user-1/brand-guidelines.pdf',
    thumbnailPath: null,
    checksum: 'abc123',
    status: 'ACTIVE' as never,
    isStarred: true,
    workspaceId: 'ws-1',
    folderId: null,
    uploadedById: 'user-1',
    tags: ['brand', 'guidelines'],
    description: 'Official brand guidelines for 2024',
    versionCount: 3,
    currentVersionId: null,
    deletedAt: null,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-03-15'),
    uploadedBy: { id: 'user-1', name: 'Alex Carter', avatar: null },
  },
  {
    id: 'file-2',
    name: 'Q4 Campaign Assets.zip',
    originalName: 'Q4 Campaign Assets.zip',
    mimeType: 'application/zip',
    size: 52428800,
    extension: 'zip',
    storagePath: 'files/2024/09/user-2/q4-campaign.zip',
    thumbnailPath: null,
    checksum: 'def456',
    status: 'ACTIVE' as never,
    isStarred: false,
    workspaceId: 'ws-3',
    folderId: null,
    uploadedById: 'user-2',
    tags: ['campaign', 'q4'],
    description: null,
    versionCount: 1,
    currentVersionId: null,
    deletedAt: null,
    createdAt: new Date('2024-09-15'),
    updatedAt: new Date('2024-09-15'),
    uploadedBy: { id: 'user-2', name: 'Jane Smith', avatar: null },
  },
  {
    id: 'file-3',
    name: 'Architecture Diagram.png',
    originalName: 'Architecture Diagram.png',
    mimeType: 'image/png',
    size: 2097152,
    extension: 'png',
    storagePath: 'files/2024/02/user-1/arch-diagram.png',
    thumbnailPath: 'thumbnails/user-1/arch-diagram-thumb.jpg',
    checksum: 'ghi789',
    status: 'ACTIVE' as never,
    isStarred: true,
    workspaceId: 'ws-2',
    folderId: null,
    uploadedById: 'user-1',
    tags: ['architecture', 'diagram'],
    description: 'System architecture overview',
    versionCount: 5,
    currentVersionId: null,
    deletedAt: null,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-11-01'),
    uploadedBy: { id: 'user-1', name: 'Alex Carter', avatar: null },
  },
  {
    id: 'file-4',
    name: 'Financial Report Q3.xlsx',
    originalName: 'Financial Report Q3.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 1048576,
    extension: 'xlsx',
    storagePath: 'files/2024/10/user-3/financial-report-q3.xlsx',
    thumbnailPath: null,
    checksum: 'jkl012',
    status: 'ACTIVE' as never,
    isStarred: false,
    workspaceId: 'ws-1',
    folderId: null,
    uploadedById: 'user-3',
    tags: ['financial', 'report'],
    description: 'Q3 financial summary',
    versionCount: 2,
    currentVersionId: null,
    deletedAt: null,
    createdAt: new Date('2024-10-05'),
    updatedAt: new Date('2024-10-20'),
    uploadedBy: { id: 'user-3', name: 'Bob Johnson', avatar: null },
  },
  {
    id: 'file-5',
    name: 'Product Demo Video.mp4',
    originalName: 'Product Demo Video.mp4',
    mimeType: 'video/mp4',
    size: 157286400,
    extension: 'mp4',
    storagePath: 'files/2024/11/user-2/demo-video.mp4',
    thumbnailPath: null,
    checksum: 'mno345',
    status: 'ACTIVE' as never,
    isStarred: false,
    workspaceId: 'ws-3',
    folderId: null,
    uploadedById: 'user-2',
    tags: ['video', 'demo'],
    description: 'Product demo for Q4 launch',
    versionCount: 1,
    currentVersionId: null,
    deletedAt: null,
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-11-01'),
    uploadedBy: { id: 'user-2', name: 'Jane Smith', avatar: null },
  },
];

// ─── Folders ──────────────────────────────────────────────────────────────────

export const MOCK_FOLDERS: Folder[] = [
  {
    id: 'folder-1',
    name: 'Brand Assets',
    parentId: null,
    workspaceId: 'ws-1',
    createdById: 'user-1',
    path: '/Brand Assets',
    isDeleted: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    fileCount: 45,
  },
  {
    id: 'folder-2',
    name: 'Logos',
    parentId: 'folder-1',
    workspaceId: 'ws-1',
    createdById: 'user-1',
    path: '/Brand Assets/Logos',
    isDeleted: false,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date(),
    fileCount: 12,
  },
  {
    id: 'folder-3',
    name: 'Technical Specs',
    parentId: null,
    workspaceId: 'ws-2',
    createdById: 'user-1',
    path: '/Technical Specs',
    isDeleted: false,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date(),
    fileCount: 89,
  },
];

// ─── Connectors ───────────────────────────────────────────────────────────────

export const MOCK_CONNECTORS: Connector[] = [
  {
    id: 'conn-1',
    name: 'Company Drive',
    type: 'GOOGLE_DRIVE' as never,
    category: 'CLOUD' as never,
    status: 'CONNECTED' as never,
    syncMode: 'SCHEDULED' as never,
    syncInterval: 60,
    lastSyncAt: new Date(Date.now() - 3600000),
    nextSyncAt: new Date(Date.now() + 3600000),
    workspaceId: 'ws-1',
    createdById: 'user-1',
    config: {},
    isEnabled: true,
    errorMessage: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'conn-2',
    name: 'S3 Media Bucket',
    type: 'S3' as never,
    category: 'CLOUD' as never,
    status: 'CONNECTED' as never,
    syncMode: 'MANUAL' as never,
    syncInterval: null,
    lastSyncAt: new Date(Date.now() - 86400000),
    nextSyncAt: null,
    workspaceId: 'ws-2',
    createdById: 'user-1',
    config: { bucket: 'media-assets' },
    isEnabled: true,
    errorMessage: null,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
  },
  {
    id: 'conn-3',
    name: 'CRM Database',
    type: 'POSTGRES' as never,
    category: 'DATABASE' as never,
    status: 'ERROR' as never,
    syncMode: 'LIVE' as never,
    syncInterval: null,
    lastSyncAt: new Date(Date.now() - 7200000),
    nextSyncAt: null,
    workspaceId: null,
    createdById: 'user-1',
    config: {},
    isEnabled: false,
    errorMessage: 'Connection timeout',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date(),
  },
  {
    id: 'conn-4',
    name: 'Airtable Projects',
    type: 'AIRTABLE' as never,
    category: 'CRM' as never,
    status: 'CONNECTED' as never,
    syncMode: 'SCHEDULED' as never,
    syncInterval: 30,
    lastSyncAt: new Date(Date.now() - 1800000),
    nextSyncAt: new Date(Date.now() + 1800000),
    workspaceId: 'ws-3',
    createdById: 'user-2',
    config: {},
    isEnabled: true,
    errorMessage: null,
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date(),
  },
];

// ─── Assets ───────────────────────────────────────────────────────────────────

export const MOCK_ASSETS: NormalizedAsset[] = [
  {
    id: 'asset-1',
    connectorId: 'conn-1',
    externalId: 'gdrive-file-1',
    name: 'Company Presentation.pptx',
    type: 'file',
    mimeType: 'application/vnd.ms-powerpoint',
    size: 5242880,
    path: '/Presentations/Company Presentation.pptx',
    url: null,
    thumbnailUrl: null,
    metadata: {},
    tags: ['presentation', 'company'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-11-01'),
    fetchedAt: new Date(),
  },
  {
    id: 'asset-2',
    connectorId: 'conn-4',
    externalId: 'airtable-rec-1',
    name: 'Project Alpha',
    type: 'record',
    mimeType: null,
    size: null,
    path: '/Projects/Project Alpha',
    url: null,
    thumbnailUrl: null,
    metadata: { status: 'In Progress', priority: 'High', owner: 'Jane Smith' },
    tags: ['project', 'alpha'],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-11-10'),
    fetchedAt: new Date(),
  },
];

// ─── Analytics ────────────────────────────────────────────────────────────────

export const MOCK_STORAGE_DATA = {
  total: 53687091200,
  byWorkspace: [
    { id: 'ws-1', name: 'Marketing Team', storageUsed: 10737418240, storageQuota: 107374182400 },
    { id: 'ws-2', name: 'Engineering Docs', storageUsed: 32212254720, storageQuota: 214748364800 },
    { id: 'ws-3', name: 'Q4 Product Launch', storageUsed: 8589934592, storageQuota: 53687091200 },
  ],
  byMimeType: [
    { mimeType: 'video/mp4', size: 21474836480, count: 45 },
    { mimeType: 'application/pdf', size: 10737418240, count: 234 },
    { mimeType: 'image/png', size: 8589934592, count: 890 },
    { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 5368709120, count: 156 },
    { mimeType: 'application/zip', size: 7516192768, count: 23 },
  ],
};

export const MOCK_ACTIVITY_TIMELINE = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split('T')[0],
    uploads: Math.floor(Math.random() * 25) + 5,
    bytes: Math.floor(Math.random() * 1073741824) + 104857600,
  };
});

export const MOCK_SYSTEM_STATS = {
  users: 47,
  files: 3842,
  workspaces: 12,
  storageUsed: 107374182400,
};

// ─── Social ───────────────────────────────────────────────────────────────────

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

// ─── Notifications ────────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'file.shared',
    title: 'File shared with you',
    message: 'Jane Smith shared "Q4 Campaign Assets.zip" with you',
    resourceType: 'file',
    resourceId: 'file-2',
    isRead: false,
    readAt: null,
    metadata: {},
    createdAt: new Date(Date.now() - 1800000),
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    type: 'workspace.invite',
    title: 'Workspace invitation',
    message: 'You were added to "Q4 Product Launch" workspace',
    resourceType: 'workspace',
    resourceId: 'ws-3',
    isRead: false,
    readAt: null,
    metadata: {},
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'notif-3',
    userId: 'user-1',
    type: 'comment.new',
    title: 'New comment',
    message: 'Bob Johnson commented on "Brand Guidelines 2024.pdf"',
    resourceType: 'file',
    resourceId: 'file-1',
    isRead: true,
    readAt: new Date(Date.now() - 43200000),
    metadata: {},
    createdAt: new Date(Date.now() - 172800000),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getMockUser(): User {
  return MOCK_USERS[0];
}

export function getMockWorkspaces() {
  return MOCK_WORKSPACES;
}

export function getMockFiles() {
  return MOCK_FILES;
}

export function getMockConnectors() {
  return MOCK_CONNECTORS;
}

export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_MODE === 'true' || process.env.NODE_ENV === 'development';
}

