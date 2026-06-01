"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.folderRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middleware/auth.middleware");
const paginate_1 = require("../utils/paginate");
const file_schema_1 = require("@hybridshare/shared/schemas/file.schema");
const router = (0, express_1.Router)();
exports.folderRouter = router;
router.use(auth_middleware_1.authMiddleware);
router.get('/', async (req, res) => {
    try {
        const { workspaceId, parentId } = req.query;
        const folders = await database_1.prisma.folder.findMany({
            where: {
                isDeleted: false,
                ...(workspaceId ? { workspaceId } : {}),
                ...(parentId !== undefined ? { parentId: parentId || null } : { parentId: null }),
            },
            orderBy: { name: 'asc' },
            include: { _count: { select: { files: true, children: true } } },
        });
        res.status(200).json((0, paginate_1.apiResponse)(folders));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.post('/', async (req, res) => {
    try {
        const input = file_schema_1.CreateFolderSchema.parse(req.body);
        let path = `/${input.name}`;
        if (input.parentId) {
            const parent = await database_1.prisma.folder.findUnique({ where: { id: input.parentId } });
            if (parent)
                path = `${parent.path}/${input.name}`;
        }
        const folder = await database_1.prisma.folder.create({
            data: { ...input, createdById: req.user.id, path },
        });
        res.status(201).json((0, paginate_1.apiResponse)(folder));
    }
    catch (err) {
        res.status(400).json((0, paginate_1.apiError)(err.message));
    }
});
router.get('/:id', async (req, res) => {
    try {
        const folder = await database_1.prisma.folder.findFirst({
            where: { id: req.params.id, isDeleted: false },
            include: {
                children: { where: { isDeleted: false }, orderBy: { name: 'asc' } },
                files: { where: { status: 'ACTIVE' }, take: 20 },
                _count: { select: { files: true, children: true } },
            },
        });
        if (!folder) {
            res.status(404).json((0, paginate_1.apiError)('Folder not found'));
            return;
        }
        res.status(200).json((0, paginate_1.apiResponse)(folder));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { name } = file_schema_1.RenameFolderSchema.parse(req.body);
        const folder = await database_1.prisma.folder.update({
            where: { id: req.params.id },
            data: { name },
        });
        res.status(200).json((0, paginate_1.apiResponse)(folder));
    }
    catch (err) {
        res.status(400).json((0, paginate_1.apiError)(err.message));
    }
});
router.delete('/:id', async (req, res) => {
    try {
        await database_1.prisma.folder.update({
            where: { id: req.params.id },
            data: { isDeleted: true, deletedAt: new Date() },
        });
        res.status(200).json((0, paginate_1.apiResponse)({ message: 'Folder deleted' }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.post('/:id/move', async (req, res) => {
    try {
        const { parentId } = file_schema_1.MoveFolderSchema.parse(req.body);
        const folder = await database_1.prisma.folder.update({
            where: { id: req.params.id },
            data: { parentId },
        });
        res.status(200).json((0, paginate_1.apiResponse)(folder));
    }
    catch (err) {
        res.status(400).json((0, paginate_1.apiError)(err.message));
    }
});
router.get('/:id/breadcrumb', async (req, res) => {
    try {
        const breadcrumb = [];
        let currentId = req.params.id;
        while (currentId) {
            const folder = await database_1.prisma.folder.findUnique({
                where: { id: currentId },
                select: { id: true, name: true, path: true, parentId: true },
            });
            if (!folder)
                break;
            breadcrumb.unshift({ id: folder.id, name: folder.name, path: folder.path });
            currentId = folder.parentId;
        }
        res.status(200).json((0, paginate_1.apiResponse)(breadcrumb));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
//# sourceMappingURL=folder.routes.js.map