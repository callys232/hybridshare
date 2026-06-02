import type { Workspace } from '@/shared/workspace';

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

export function getMockWorkspaces() {
  return MOCK_WORKSPACES;
}
