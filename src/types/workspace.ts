export type WorkspaceType = 'PERSONAL' | 'TEAM' | 'PROJECT' | 'DEPARTMENT';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'COMMENTER' | 'VIEWER';

export interface WorkspacePermissions {
  canUpload: boolean;
  canDelete: boolean;
  canShare: boolean;
  canInvite: boolean;
  canManageSettings: boolean;
}

export interface WorkspaceCreatePayload {
  name: string;
  description?: string;
  type: WorkspaceType;
  color?: string;
  iconUrl?: string;
  isPublic?: boolean;
}

export interface WorkspaceInvitePayload {
  email: string;
  role: WorkspaceRole;
}

export interface WorkspaceStats {
  fileCount: number;
  memberCount: number;
  storageUsed: number;
  storageQuota: number;
  lastActivityAt?: string;
}
