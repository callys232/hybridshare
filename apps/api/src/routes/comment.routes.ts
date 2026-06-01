import { Router } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import { apiResponse, apiError, parsePagination, buildMeta } from '../utils/paginate';
import type { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const CreateCommentSchema = z.object({
  fileId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  parentId: z.string().uuid().optional(),
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { fileId, content, parentId } = CreateCommentSchema.parse(req.body);
    const comment = await prisma.comment.create({
      data: { fileId, content, userId: req.user!.id, parentId: parentId ?? null },
      include: { user: { select: { id: true, name: true, avatar: true } }, reactions: true, _count: { select: { replies: true } } },
    });
    res.status(201).json(apiResponse(comment));
  } catch (err) {
    res.status(400).json(apiError((err as Error).message));
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { fileId } = req.query as { fileId: string };
    const { skip, take, page, limit } = parsePagination({ page: 1, limit: 50 });
    const [items, total] = await Promise.all([
      prisma.comment.findMany({
        where: { fileId, parentId: null },
        skip,
        take,
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          reactions: true,
          replies: {
            include: { user: { select: { id: true, name: true, avatar: true } }, reactions: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.comment.count({ where: { fileId, parentId: null } }),
    ]);
    res.status(200).json({ success: true, data: items, error: null, meta: buildMeta(total, page, limit) });
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { content } = req.body as { content: string };
    const comment = await prisma.comment.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { content, isEdited: true, editedAt: new Date() },
    });
    res.status(200).json(apiResponse(comment));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.comment.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
    res.status(200).json(apiResponse({ message: 'Comment deleted' }));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.post('/:id/react', async (req: AuthRequest, res) => {
  try {
    const { emoji } = req.body as { emoji: string };
    const existing = await prisma.commentReaction.findFirst({
      where: { commentId: req.params.id, userId: req.user!.id, emoji },
    });
    if (existing) {
      await prisma.commentReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.commentReaction.create({ data: { commentId: req.params.id, userId: req.user!.id, emoji } });
    }
    res.status(200).json(apiResponse({ toggled: !existing }));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.post('/:id/resolve', async (req: AuthRequest, res) => {
  try {
    await prisma.comment.update({
      where: { id: req.params.id },
      data: { isResolved: true, resolvedAt: new Date(), resolvedById: req.user!.id },
    });
    res.status(200).json(apiResponse({ resolved: true }));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

export { router as commentRouter };
