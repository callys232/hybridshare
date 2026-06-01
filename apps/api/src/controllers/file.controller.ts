import type { Response } from 'express';
import { fileService } from '../services/file.service';
import { versionService } from '../services/version.service';
import { apiResponse, apiError } from '../utils/paginate';
import type { AuthRequest } from '../middleware/auth.middleware';
import { UpdateFileSchema, BulkOperationSchema } from '@hybridshare/shared/schemas/file.schema';

export class FileController {
  async upload(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json(apiError('No file provided'));
        return;
      }

      const { workspaceId, folderId, description, tags } = req.body as Record<string, string>;

      const file = await fileService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.user!.id,
        {
          workspaceId: workspaceId || undefined,
          folderId: folderId || undefined,
          description: description || undefined,
          tags: tags ? JSON.parse(tags) as string[] : undefined,
        }
      );

      res.status(201).json(apiResponse(file));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async getFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const file = await fileService.getFile(req.params.id, req.user!.id);
      res.status(200).json(apiResponse(file));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async download(req: AuthRequest, res: Response): Promise<void> {
    try {
      const url = await fileService.getDownloadUrl(req.params.id, req.user!.id);
      res.status(200).json(apiResponse({ url }));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async preview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await fileService.getPreviewUrl(req.params.id, req.user!.id);
      res.status(200).json(apiResponse(result));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async updateFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = UpdateFileSchema.parse(req.body);
      const file = await fileService.updateFile(req.params.id, req.user!.id, input);
      res.status(200).json(apiResponse(file));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async deleteFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      await fileService.softDeleteFile(req.params.id, req.user!.id);
      res.status(200).json(apiResponse({ message: 'File moved to recycle bin' }));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async restoreFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const file = await fileService.restoreFile(req.params.id, req.user!.id);
      res.status(200).json(apiResponse(file));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async permanentDelete(req: AuthRequest, res: Response): Promise<void> {
    try {
      await fileService.permanentDeleteFile(req.params.id, req.user!.id);
      res.status(200).json(apiResponse({ message: 'File permanently deleted' }));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async listFiles(req: AuthRequest, res: Response): Promise<void> {
    try {
      const query = req.query as Record<string, string>;
      const result = await fileService.listFiles(req.user!.id, {
        page: parseInt(query.page ?? '1'),
        limit: parseInt(query.limit ?? '20'),
        workspaceId: query.workspaceId,
        folderId: query.folderId,
        mimeType: query.mimeType,
        search: query.search,
        starred: query.starred === 'true',
        deleted: query.deleted === 'true',
      });
      res.status(200).json({ success: true, data: result.items, error: null, meta: result.meta });
    } catch (err) {
      const error = err as Error;
      res.status(500).json(apiError(error.message));
    }
  }

  async toggleStar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const file = await fileService.toggleStar(req.params.id, req.user!.id);
      res.status(200).json(apiResponse(file));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async bulkOperation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = BulkOperationSchema.parse(req.body);
      const result = await fileService.bulkOperation(req.user!.id, input);
      res.status(200).json(apiResponse(result));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async recycleBin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const query = req.query as Record<string, string>;
      const result = await fileService.getRecycleBin(req.user!.id, {
        page: parseInt(query.page ?? '1'),
        limit: parseInt(query.limit ?? '20'),
      });
      res.status(200).json({ success: true, data: result.items, error: null, meta: result.meta });
    } catch (err) {
      const error = err as Error;
      res.status(500).json(apiError(error.message));
    }
  }

  async listVersions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const versions = await versionService.listVersions(req.params.id);
      res.status(200).json(apiResponse(versions));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async uploadVersion(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json(apiError('No file provided'));
        return;
      }

      const { comment } = req.body as { comment?: string };
      const version = await versionService.uploadVersion(
        req.params.id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.user!.id,
        comment
      );

      res.status(201).json(apiResponse(version));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async restoreVersion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const file = await versionService.restoreVersion(req.params.id, req.params.versionId, req.user!.id);
      res.status(200).json(apiResponse(file));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }
}

export const fileController = new FileController();
