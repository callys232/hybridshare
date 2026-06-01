import { z } from 'zod';

export const CreateFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().nullable().optional(),
  workspaceId: z.string().uuid().nullable().optional(),
});

export const RenameFolderSchema = z.object({
  name: z.string().min(1).max(255),
});

export const MoveFolderSchema = z.object({
  parentId: z.string().uuid().nullable(),
});

export const UpdateFileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().uuid().nullable().optional(),
});

export const BulkOperationSchema = z.object({
  fileIds: z.array(z.string().uuid()).min(1),
  operation: z.enum(['move', 'copy', 'delete', 'tag', 'star']),
  targetFolderId: z.string().uuid().nullable().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const CreateShareLinkSchema = z.object({
  fileId: z.string().uuid().nullable().optional(),
  folderId: z.string().uuid().nullable().optional(),
  workspaceId: z.string().uuid().nullable().optional(),
  permissions: z.array(z.enum(['VIEW', 'DOWNLOAD', 'COMMENT', 'EDIT'])).default(['VIEW', 'DOWNLOAD']),
  password: z.string().min(4).max(100).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  maxViews: z.number().int().positive().nullable().optional(),
});

export const VerifySharePasswordSchema = z.object({
  password: z.string().min(1),
});

export const UploadVersionSchema = z.object({
  comment: z.string().max(500).optional(),
});

export type CreateFolderInput = z.infer<typeof CreateFolderSchema>;
export type UpdateFileInput = z.infer<typeof UpdateFileSchema>;
export type BulkOperationInput = z.infer<typeof BulkOperationSchema>;
export type CreateShareLinkInput = z.infer<typeof CreateShareLinkSchema>;
export type VerifySharePasswordInput = z.infer<typeof VerifySharePasswordSchema>;
