import { Router } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import { apiResponse, apiError, parsePagination, buildMeta } from '../utils/paginate';
import type { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  workspaceId: z.string().uuid().optional(),
  fileId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']).default('TODO'),
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { workspaceId, assignee, status, page, limit } = req.query as Record<string, string>;
    const { skip, take, ...pageMeta } = parsePagination({ page: parseInt(page ?? '1'), limit: parseInt(limit ?? '20') });

    const where = {
      ...(workspaceId ? { workspaceId } : {}),
      ...(status ? { status } : {}),
      ...(assignee ? { assignees: { some: { userId: assignee } } } : {}),
      OR: [
        { createdById: req.user!.id },
        { assignees: { some: { userId: req.user!.id } } },
      ],
    };

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } },
          createdBy: { select: { id: true, name: true, avatar: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    res.status(200).json({ success: true, data: items, error: null, meta: buildMeta(total, pageMeta.page, pageMeta.limit) });
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const input = CreateTaskSchema.parse(req.body);
    const task = await prisma.task.create({
      data: { ...input, createdById: req.user!.id, dueDate: input.dueDate ? new Date(input.dueDate) : null },
      include: { assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } } },
    });
    res.status(201).json(apiResponse(task));
  } catch (err) {
    res.status(400).json(apiError((err as Error).message));
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const input = CreateTaskSchema.partial().parse(req.body);
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { ...input, dueDate: input.dueDate ? new Date(input.dueDate) : undefined },
      include: { assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } } },
    });
    res.status(200).json(apiResponse(task));
  } catch (err) {
    res.status(400).json(apiError((err as Error).message));
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.task.deleteMany({ where: { id: req.params.id, createdById: req.user!.id } });
    res.status(200).json(apiResponse({ message: 'Task deleted' }));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.post('/:id/assign', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.body as { userId: string };
    const assignment = await prisma.taskAssignee.upsert({
      where: { taskId_userId: { taskId: req.params.id, userId } },
      create: { taskId: req.params.id, userId },
      update: {},
    });
    res.status(200).json(apiResponse(assignment));
  } catch (err) {
    res.status(400).json(apiError((err as Error).message));
  }
});

export { router as taskRouter };
