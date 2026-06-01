import { Router } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import { apiResponse, apiError } from '../utils/paginate';
import type { AuthRequest } from '../middleware/auth.middleware';
import { CreateFolderSchema, RenameFolderSchema, MoveFolderSchema } from '@hybridshare/shared/schemas/file.schema';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { workspaceId, parentId } = req.query as Record<string, string>;
    const folders = await prisma.folder.findMany({
      where: {
        isDeleted: false,
        ...(workspaceId ? { workspaceId } : {}),
        ...(parentId !== undefined ? { parentId: parentId || null } : { parentId: null }),
      },
      orderBy: { name: 'asc' },
      include: { _count: { select: { files: true, children: true } } },
    });
    res.status(200).json(apiResponse(folders));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const input = CreateFolderSchema.parse(req.body);
    let path = `/${input.name}`;

    if (input.parentId) {
      const parent = await prisma.folder.findUnique({ where: { id: input.parentId } });
      if (parent) path = `${parent.path}/${input.name}`;
    }

    const folder = await prisma.folder.create({
      data: { ...input, createdById: req.user!.id, path },
    });
    res.status(201).json(apiResponse(folder));
  } catch (err) {
    res.status(400).json(apiError((err as Error).message));
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const folder = await prisma.folder.findFirst({
      where: { id: req.params.id, isDeleted: false },
      include: {
        children: { where: { isDeleted: false }, orderBy: { name: 'asc' } },
        files: { where: { status: 'ACTIVE' }, take: 20 },
        _count: { select: { files: true, children: true } },
      },
    });
    if (!folder) {
      res.status(404).json(apiError('Folder not found'));
      return;
    }
    res.status(200).json(apiResponse(folder));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { name } = RenameFolderSchema.parse(req.body);
    const folder = await prisma.folder.update({
      where: { id: req.params.id },
      data: { name },
    });
    res.status(200).json(apiResponse(folder));
  } catch (err) {
    res.status(400).json(apiError((err as Error).message));
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.folder.update({
      where: { id: req.params.id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    res.status(200).json(apiResponse({ message: 'Folder deleted' }));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

router.post('/:id/move', async (req: AuthRequest, res) => {
  try {
    const { parentId } = MoveFolderSchema.parse(req.body);
    const folder = await prisma.folder.update({
      where: { id: req.params.id },
      data: { parentId },
    });
    res.status(200).json(apiResponse(folder));
  } catch (err) {
    res.status(400).json(apiError((err as Error).message));
  }
});

router.get('/:id/breadcrumb', async (req: AuthRequest, res) => {
  try {
    const breadcrumb = [];
    let currentId: string | null = req.params.id;

    while (currentId) {
      const folder = await prisma.folder.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, path: true, parentId: true },
      });
      if (!folder) break;
      breadcrumb.unshift({ id: folder.id, name: folder.name, path: folder.path });
      currentId = folder.parentId;
    }

    res.status(200).json(apiResponse(breadcrumb));
  } catch (err) {
    res.status(500).json(apiError((err as Error).message));
  }
});

export { router as folderRouter };
