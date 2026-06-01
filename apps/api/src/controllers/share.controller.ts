import type { Response } from 'express';
import { shareService } from '../services/share.service';
import { apiResponse, apiError } from '../utils/paginate';
import type { AuthRequest } from '../middleware/auth.middleware';
import { CreateShareLinkSchema } from '@hybridshare/shared/schemas/file.schema';

export class ShareController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const input = CreateShareLinkSchema.parse(req.body);
      const link = await shareService.createShareLink(req.user!.id, input);
      res.status(201).json(apiResponse(link));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 400).json(apiError(error.message));
    }
  }

  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const query = req.query as Record<string, string>;
      const result = await shareService.listShareLinks(req.user!.id, {
        page: parseInt(query.page ?? '1'),
        limit: parseInt(query.limit ?? '20'),
      });
      res.status(200).json({ success: true, data: result.items, error: null, meta: result.meta });
    } catch (err) {
      res.status(500).json(apiError((err as Error).message));
    }
  }

  async resolve(req: AuthRequest, res: Response): Promise<void> {
    try {
      const link = await shareService.resolveShareLink(req.params.token);
      if (!link.hasPassword) {
        await shareService.recordView(
          req.params.token,
          req.ip,
          req.headers['user-agent'],
          req.headers.referer
        );
      }
      res.status(200).json(apiResponse(link));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 404).json(apiError(error.message));
    }
  }

  async listFiles(req: AuthRequest, res: Response): Promise<void> {
    try {
      const link = await shareService.resolveShareLink(req.params.token);
      res.status(200).json(apiResponse({ files: link.file ? [link.file] : [], folder: link.folder }));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 404).json(apiError(error.message));
    }
  }

  async verifyPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { password } = req.body as { password: string };
      await shareService.verifySharePassword(req.params.token, password);
      await shareService.recordView(req.params.token, req.ip, req.headers['user-agent']);
      res.status(200).json(apiResponse({ verified: true }));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 401).json(apiError(error.message));
    }
  }

  async revoke(req: AuthRequest, res: Response): Promise<void> {
    try {
      await shareService.revokeShareLink(req.params.id, req.user!.id);
      res.status(200).json(apiResponse({ message: 'Share link revoked' }));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async getAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const analytics = await shareService.getShareAnalytics(req.params.id, req.user!.id);
      res.status(200).json(apiResponse(analytics));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }
}

export const shareController = new ShareController();
