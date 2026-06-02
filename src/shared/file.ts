export enum FileType {
  FILE = 'FILE',
  FOLDER = 'FOLDER',
}

export enum FileStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
  PROCESSING = 'PROCESSING',
  INFECTED = 'INFECTED',
}

export interface FileMetadata {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  extension: string;
  storagePath: string;
  thumbnailPath: string | null;
  checksum: string;
  status: FileStatus;
  isStarred: boolean;
  workspaceId: string | null;
  folderId: string | null;
  uploadedById: string;
  tags: string[];
  description: string | null;
  versionCount: number;
  currentVersionId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileVersion {
  id: string;
  fileId: string;
  version: number;
  storagePath: string;
  size: number;
  checksum: string;
  uploadedById: string;
  comment: string | null;
  createdAt: Date;
}

export interface FileTag {
  id: string;
  name: string;
  color: string;
  workspaceId: string | null;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  workspaceId: string | null;
  createdById: string;
  path: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  children?: Folder[];
  fileCount?: number;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export interface BulkOperation {
  fileIds: string[];
  operation: 'move' | 'copy' | 'delete' | 'tag' | 'star';
  targetFolderId?: string;
  tagIds?: string[];
}

export interface ShareLink {
  id: string;
  token: string;
  fileId: string | null;
  folderId: string | null;
  workspaceId: string | null;
  createdById: string;
  permissions: SharePermission[];
  passwordHash: string | null;
  expiresAt: Date | null;
  maxViews: number | null;
  viewCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum SharePermission {
  VIEW = 'VIEW',
  DOWNLOAD = 'DOWNLOAD',
  COMMENT = 'COMMENT',
  EDIT = 'EDIT',
}

export interface ShareLinkView {
  id: string;
  shareLinkId: string;
  ipAddress: string | null;
  userAgent: string | null;
  referrer: string | null;
  viewedAt: Date;
}

export interface PreviewData {
  type: 'pdf' | 'image' | 'video' | 'audio' | 'spreadsheet' | 'document' | 'text' | 'unsupported';
  url?: string;
  content?: string;
}
