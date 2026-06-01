"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceController = exports.WorkspaceController = void 0;
const database_1 = require("../config/database");
const paginate_1 = require("../utils/paginate");
const workspace_1 = require("@hybridshare/shared/types/workspace");
const zod_1 = require("zod");
const CreateWorkspaceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional(),
    type: zod_1.z.enum(['PERSONAL', 'TEAM', 'PROJECT', 'DEPARTMENT']).default('TEAM'),
    isPublic: zod_1.z.boolean().default(false),
    color: zod_1.z.string().default('#c12129'),
    storageQuota: zod_1.z.number().optional(),
});
const UpdateWorkspaceSchema = CreateWorkspaceSchema.partial();
const InviteMemberSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    role: zod_1.z.nativeEnum(workspace_1.WorkspaceRole).default(workspace_1.WorkspaceRole.VIEWER),
});
class WorkspaceController {
    async create(req, res) {
        try {
            const input = CreateWorkspaceSchema.parse(req.body);
            const workspace = await database_1.prisma.workspace.create({
                data: {
                    ...input,
                    ownerId: req.user.id,
                    storageQuota: BigInt(input.storageQuota ?? 107374182400),
                    members: {
                        create: {
                            userId: req.user.id,
                            role: workspace_1.WorkspaceRole.OWNER,
                        },
                    },
                },
                include: {
                    members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
                    _count: { select: { files: true, members: true } },
                },
            });
            res.status(201).json((0, paginate_1.apiResponse)({ ...workspace, storageUsed: Number(workspace.storageUsed), storageQuota: Number(workspace.storageQuota) }));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async list(req, res) {
        try {
            const workspaces = await database_1.prisma.workspace.findMany({
                where: {
                    OR: [
                        { ownerId: req.user.id },
                        { members: { some: { userId: req.user.id } } },
                    ],
                },
                include: {
                    members: {
                        take: 5,
                        include: { user: { select: { id: true, name: true, avatar: true } } },
                    },
                    _count: { select: { files: true, members: true } },
                },
                orderBy: { updatedAt: 'desc' },
            });
            const result = workspaces.map((w) => ({
                ...w,
                storageUsed: Number(w.storageUsed),
                storageQuota: Number(w.storageQuota),
            }));
            res.status(200).json((0, paginate_1.apiResponse)(result));
        }
        catch (err) {
            res.status(500).json((0, paginate_1.apiError)(err.message));
        }
    }
    async get(req, res) {
        try {
            const workspace = await database_1.prisma.workspace.findUnique({
                where: { id: req.params.id },
                include: {
                    members: {
                        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
                    },
                    _count: { select: { files: true, folders: true, members: true } },
                },
            });
            if (!workspace) {
                res.status(404).json((0, paginate_1.apiError)('Workspace not found'));
                return;
            }
            res.status(200).json((0, paginate_1.apiResponse)({
                ...workspace,
                storageUsed: Number(workspace.storageUsed),
                storageQuota: Number(workspace.storageQuota),
            }));
        }
        catch (err) {
            res.status(500).json((0, paginate_1.apiError)(err.message));
        }
    }
    async update(req, res) {
        try {
            const input = UpdateWorkspaceSchema.parse(req.body);
            const workspace = await database_1.prisma.workspace.update({
                where: { id: req.params.id },
                data: {
                    ...input,
                    ...(input.storageQuota ? { storageQuota: BigInt(input.storageQuota) } : {}),
                },
            });
            res.status(200).json((0, paginate_1.apiResponse)({ ...workspace, storageUsed: Number(workspace.storageUsed), storageQuota: Number(workspace.storageQuota) }));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async remove(req, res) {
        try {
            await database_1.prisma.workspace.delete({ where: { id: req.params.id } });
            res.status(200).json((0, paginate_1.apiResponse)({ message: 'Workspace deleted' }));
        }
        catch (err) {
            res.status(500).json((0, paginate_1.apiError)(err.message));
        }
    }
    async inviteMember(req, res) {
        try {
            const { email, role } = InviteMemberSchema.parse(req.body);
            const user = await database_1.prisma.user.findUnique({ where: { email } });
            if (!user) {
                res.status(404).json((0, paginate_1.apiError)('User not found'));
                return;
            }
            const existing = await database_1.prisma.workspaceMember.findUnique({
                where: { workspaceId_userId: { workspaceId: req.params.id, userId: user.id } },
            });
            if (existing) {
                res.status(409).json((0, paginate_1.apiError)('User is already a member'));
                return;
            }
            const member = await database_1.prisma.workspaceMember.create({
                data: {
                    workspaceId: req.params.id,
                    userId: user.id,
                    role,
                    invitedById: req.user.id,
                },
                include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
            });
            res.status(201).json((0, paginate_1.apiResponse)(member));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async updateMember(req, res) {
        try {
            const { role } = req.body;
            const member = await database_1.prisma.workspaceMember.updateMany({
                where: { workspaceId: req.params.id, userId: req.params.userId },
                data: { role },
            });
            res.status(200).json((0, paginate_1.apiResponse)(member));
        }
        catch (err) {
            res.status(500).json((0, paginate_1.apiError)(err.message));
        }
    }
    async removeMember(req, res) {
        try {
            await database_1.prisma.workspaceMember.deleteMany({
                where: { workspaceId: req.params.id, userId: req.params.userId },
            });
            res.status(200).json((0, paginate_1.apiResponse)({ message: 'Member removed' }));
        }
        catch (err) {
            res.status(500).json((0, paginate_1.apiError)(err.message));
        }
    }
    async getActivity(req, res) {
        try {
            const query = req.query;
            const { skip, take, page, limit } = (0, paginate_1.parsePagination)({
                page: parseInt(query.page ?? '1'),
                limit: parseInt(query.limit ?? '20'),
            });
            const [items, total] = await Promise.all([
                database_1.prisma.auditLog.findMany({
                    where: { metadata: { path: ['workspaceId'], equals: req.params.id } },
                    skip,
                    take,
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { id: true, name: true, avatar: true } } },
                }),
                database_1.prisma.auditLog.count({ where: { metadata: { path: ['workspaceId'], equals: req.params.id } } }),
            ]);
            res.status(200).json({ success: true, data: items, error: null, meta: (0, paginate_1.buildMeta)(total, page, limit) });
        }
        catch (err) {
            res.status(500).json((0, paginate_1.apiError)(err.message));
        }
    }
    async getFiles(req, res) {
        try {
            const query = req.query;
            const { skip, take, page, limit } = (0, paginate_1.parsePagination)({
                page: parseInt(query.page ?? '1'),
                limit: parseInt(query.limit ?? '20'),
            });
            const [items, total] = await Promise.all([
                database_1.prisma.file.findMany({
                    where: { workspaceId: req.params.id, status: 'ACTIVE' },
                    skip,
                    take,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        uploadedBy: { select: { id: true, name: true, avatar: true } },
                        tags: true,
                    },
                }),
                database_1.prisma.file.count({ where: { workspaceId: req.params.id, status: 'ACTIVE' } }),
            ]);
            res.status(200).json({ success: true, data: items, error: null, meta: (0, paginate_1.buildMeta)(total, page, limit) });
        }
        catch (err) {
            res.status(500).json((0, paginate_1.apiError)(err.message));
        }
    }
}
exports.WorkspaceController = WorkspaceController;
exports.workspaceController = new WorkspaceController();
//# sourceMappingURL=workspace.controller.js.map