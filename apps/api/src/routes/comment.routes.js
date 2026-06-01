"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middleware/auth.middleware");
const paginate_1 = require("../utils/paginate");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
exports.commentRouter = router;
router.use(auth_middleware_1.authMiddleware);
const CreateCommentSchema = zod_1.z.object({
    fileId: zod_1.z.string().uuid(),
    content: zod_1.z.string().min(1).max(5000),
    parentId: zod_1.z.string().uuid().optional(),
});
router.post('/', async (req, res) => {
    try {
        const { fileId, content, parentId } = CreateCommentSchema.parse(req.body);
        const comment = await database_1.prisma.comment.create({
            data: { fileId, content, userId: req.user.id, parentId: parentId ?? null },
            include: { user: { select: { id: true, name: true, avatar: true } }, reactions: true, _count: { select: { replies: true } } },
        });
        res.status(201).json((0, paginate_1.apiResponse)(comment));
    }
    catch (err) {
        res.status(400).json((0, paginate_1.apiError)(err.message));
    }
});
router.get('/', async (req, res) => {
    try {
        const { fileId } = req.query;
        const { skip, take, page, limit } = (0, paginate_1.parsePagination)({ page: 1, limit: 50 });
        const [items, total] = await Promise.all([
            database_1.prisma.comment.findMany({
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
            database_1.prisma.comment.count({ where: { fileId, parentId: null } }),
        ]);
        res.status(200).json({ success: true, data: items, error: null, meta: (0, paginate_1.buildMeta)(total, page, limit) });
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { content } = req.body;
        const comment = await database_1.prisma.comment.updateMany({
            where: { id: req.params.id, userId: req.user.id },
            data: { content, isEdited: true, editedAt: new Date() },
        });
        res.status(200).json((0, paginate_1.apiResponse)(comment));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.delete('/:id', async (req, res) => {
    try {
        await database_1.prisma.comment.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
        res.status(200).json((0, paginate_1.apiResponse)({ message: 'Comment deleted' }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.post('/:id/react', async (req, res) => {
    try {
        const { emoji } = req.body;
        const existing = await database_1.prisma.commentReaction.findFirst({
            where: { commentId: req.params.id, userId: req.user.id, emoji },
        });
        if (existing) {
            await database_1.prisma.commentReaction.delete({ where: { id: existing.id } });
        }
        else {
            await database_1.prisma.commentReaction.create({ data: { commentId: req.params.id, userId: req.user.id, emoji } });
        }
        res.status(200).json((0, paginate_1.apiResponse)({ toggled: !existing }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.post('/:id/resolve', async (req, res) => {
    try {
        await database_1.prisma.comment.update({
            where: { id: req.params.id },
            data: { isResolved: true, resolvedAt: new Date(), resolvedById: req.user.id },
        });
        res.status(200).json((0, paginate_1.apiResponse)({ resolved: true }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
//# sourceMappingURL=comment.routes.js.map