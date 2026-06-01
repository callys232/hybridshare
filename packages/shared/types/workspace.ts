export enum WorkspaceType {
  PERSONAL = 'PERSONAL',
  TEAM = 'TEAM',
  PROJECT = 'PROJECT',
  DEPARTMENT = 'DEPARTMENT',
}

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
  COMMENTER = 'COMMENTER',
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  type: WorkspaceType;
  iconUrl: string | null;
  color: string;
  isPublic: boolean;
  storageQuota: number;
  storageUsed: number;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount?: number;
  fileCount?: number;
  members?: WorkspaceMember[];
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: Date;
  invitedById: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export interface ActivityEntry {
  id: string;
  workspaceId: string;
  userId: string;
  action: string;
  resourceType: 'file' | 'folder' | 'member' | 'workspace' | 'share' | 'comment';
  resourceId: string;
  resourceName: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export interface WorkspaceStats {
  totalFiles: number;
  totalFolders: number;
  totalMembers: number;
  storageUsed: number;
  storageQuota: number;
  recentActivity: ActivityEntry[];
}

export interface Permission {
  id: string;
  userId: string | null;
  roleId: string | null;
  workspaceId: string | null;
  fileId: string | null;
  folderId: string | null;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
  canManage: boolean;
  createdAt: Date;
}
