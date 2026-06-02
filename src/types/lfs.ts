export type FileMime = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'image' | 'video' | 'audio' | 'zip' | 'csv' | 'txt' | 'other';

export type FileStatus = 'ready' | 'uploading' | 'scanning' | 'error' | 'quarantined';

export type PermissionLevel = 'view' | 'comment' | 'edit' | 'download' | 'admin';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export type WorkspacePillar = 'BIZ' | 'HCD' | 'SDC' | 'MARKETPLACE' | 'PERSONAL';

export interface LFSOrg {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  storageUsed: number;
  storageQuota: number;
  tier: 'starter' | 'pro' | 'business' | 'enterprise';
}

export interface LFSWorkspace {
  id: string;
  orgId: string;
  name: string;
  pillar: WorkspacePillar;
  description?: string;
  iconEmoji?: string;
  color?: string;
  memberCount: number;
  libraryCount: number;
  createdAt: string;
}

export interface LFSLibrary {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  fileCount: number;
  storageUsed: number;
  contentType?: string;
  updatedAt: string;
}

export interface LFSFolder {
  id: string;
  libraryId: string;
  parentId?: string;
  name: string;
  fileCount: number;
  createdAt: string;
}

export interface LFSFile {
  id: string;
  libraryId: string;
  folderId?: string;
  name: string;
  extension: string;
  mimeType: string;
  fileType: FileMime;
  sizeBytes: number;
  status: FileStatus;
  thumbnailUrl?: string;
  downloadUrl?: string;
  previewUrl?: string;
  isStarred: boolean;
  isLocked: boolean;
  lockedBy?: string;
  version: number;
  tags: string[];
  metadata: Record<string, string | number | boolean>;
  createdBy: LFSUser;
  updatedBy?: LFSUser;
  createdAt: string;
  updatedAt: string;
}

export interface LFSFileVersion {
  id: string;
  fileId: string;
  version: number;
  label?: string;
  sizeBytes: number;
  createdBy: LFSUser;
  createdAt: string;
  comment?: string;
}

export interface LFSUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
}

export interface LFSShareLink {
  id: string;
  fileId?: string;
  folderId?: string;
  token: string;
  accessLevel: PermissionLevel;
  expiresAt?: string;
  passwordProtected: boolean;
  downloadLimit?: number;
  downloadCount: number;
  createdBy: LFSUser;
  createdAt: string;
}

export interface LFSComment {
  id: string;
  fileId: string;
  parentId?: string;
  content: string;
  author: LFSUser;
  reactions: Record<string, number>;
  isResolved: boolean;
  replies?: LFSComment[];
  createdAt: string;
}

export interface LFSTask {
  id: string;
  fileId?: string;
  title: string;
  assignee?: LFSUser;
  dueDate?: string;
  isComplete: boolean;
  createdAt: string;
}

export interface LFSApproval {
  id: string;
  fileId: string;
  title: string;
  status: ApprovalStatus;
  stages: LFSApprovalStage[];
  currentStage: number;
  requestedBy: LFSUser;
  createdAt: string;
  deadline?: string;
}

export interface LFSApprovalStage {
  id: string;
  order: number;
  approver: LFSUser;
  status: ApprovalStatus;
  comment?: string;
  decidedAt?: string;
}

export interface LFSAuditLog {
  id: string;
  action: string;
  resourceType: 'file' | 'folder' | 'library' | 'workspace' | 'user';
  resourceId: string;
  resourceName: string;
  actor: LFSUser;
  ip?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface LFSUploadJob {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  progress: number;
  status: 'queued' | 'uploading' | 'processing' | 'done' | 'error';
  error?: string;
}

export type LibraryView = 'grid' | 'list';
export type SortField = 'name' | 'size' | 'updatedAt' | 'createdAt' | 'type';
export type SortDir = 'asc' | 'desc';

export interface LibraryFilter {
  search: string;
  type?: FileMime;
  tags: string[];
  dateFrom?: string;
  dateTo?: string;
  createdBy?: string;
}
