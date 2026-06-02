export type FileStatus = 'ACTIVE' | 'DELETED' | 'QUARANTINED' | 'PROCESSING';
export type FileUploadStatus = 'queued' | 'uploading' | 'processing' | 'done' | 'error';

export interface FileUploadJob {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  progress: number;
  status: FileUploadStatus;
  error?: string;
}

export interface FileFilter {
  search?: string;
  mimeType?: string;
  workspaceId?: string;
  folderId?: string;
  isStarred?: boolean;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  uploadedById?: string;
}

export interface BulkFileAction {
  fileIds: string[];
  action: 'move' | 'copy' | 'delete' | 'restore' | 'star' | 'unstar';
  targetFolderId?: string;
  targetWorkspaceId?: string;
}

export interface ShareLinkConfig {
  fileId?: string;
  folderId?: string;
  accessLevel: 'view' | 'comment' | 'edit' | 'download';
  expiresAt?: string;
  password?: string;
  downloadLimit?: number;
}

export type SortField = 'name' | 'size' | 'updatedAt' | 'createdAt' | 'type';
export type SortDir = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';
