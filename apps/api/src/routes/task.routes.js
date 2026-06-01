"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middleware/auth.middleware");
const paginate_1 = require("../utils/paginate");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
exports.taskRouter = router;
router.use(auth_middleware_1.authMiddleware);
const CreateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(2000).optional(),
    workspaceId: zod_1.z.string().uuid().optional(),
    fileId: zod_1.z.string().uuid().optional(),
    dueDate: zod_1.z.string().datetime().optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    status: zod_1.z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']).default('TODO'),
});
router.get('/', async (req, res) => {
    try {
        const { workspaceId, assignee, status, page, limit } = req.query;
        const { skip, take, ...pageMeta } = (0, paginate_1.parsePagination)({ page: parseInt(page ?? '1'), limit: parseInt(limit ?? '20') });
        const where = {
            ...(workspaceId ? { workspaceId } : {}),
            ...(status ? { status } : {}),
            ...(assignee ? { assignees: { some: { userId: assignee } } } : {}),
            OR: [
                { createdById: req.user.id },
                { assignees: { some: { userId: req.user.id } } },
            ],
        };
        const [items, total] = await Promise.all([
            database_1.prisma.task.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } },
                    createdBy: { select: { id: true, name: true, avatar: true } },
                },
            }),
            database_1.prisma.task.count({ where }),
        ]);
        res.status(200).json({ success: true, data: items, error: null, meta: (0, paginate_1.buildMeta)(total, pageMeta.page, pageMeta.limit) });
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.post('/', async (req, res) => {
    try {
        const input = CreateTaskSchema.parse(req.body);
        const task = await database_1.prisma.task.create({
            data: { ...input, createdById: req.user.id, dueDate: input.dueDate ? new Date(input.dueDate) : null },
            include: { assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } } },
        });
        res.status(201).json((0, paginate_1.apiResponse)(task));
    }
    catch (err) {
        res.status(400).json((0, paginate_1.apiError)(err.message));
    }
});
router.put('/:id', async (req, res) => {
    try {
        const input = CreateTaskSchema.partial().parse(req.body);
        const task = await database_1.prisma.task.update({
            where: { id: req.params.id },
            data: { ...input, dueDate: input.dueDate ? new Date(input.dueDate) : undefined },
            include: { assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } } },
        });
        res.status(200).json((0, paginate_1.apiResponse)(task));
    }
    catch (err) {
        res.status(400).json((0, paginate_1.apiError)(err.message));
    }
});
router.delete('/:id', async (req, res) => {
    try {
        await database_1.prisma.task.deleteMany({ where: { id: req.params.id, createdById: req.user.id } });
        res.status(200).json((0, paginate_1.apiResponse)({ message: 'Task deleted' }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.post('/:id/assign', async (req, res) => {
    try {
        const { userId } = req.body;
        const assignment = await database_1.prisma.taskAssignee.upsert({
            where: { taskId_userId: { taskId: req.params.id, userId } },
            create: { taskId: req.params.id, userId },
            update: {},
        });
        res.status(200).json((0, paginate_1.apiResponse)(assignment));
    }
    catch (err) {
        res.status(400).json((0, paginate_1.apiError)(err.message));
    }
});
//# sourceMappingURL=task.routes.js.map