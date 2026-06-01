"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const audit_service_1 = require("../services/audit.service");
const analytics_service_1 = require("../services/analytics.service");
const crypto_1 = require("../utils/crypto");
const paginate_1 = require("../utils/paginate");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
exports.adminRouter = router;
router.use(auth_middleware_1.authMiddleware, (0, rbac_middleware_1.requireAdmin)());
const CreateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    role: zod_1.z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER', 'GUEST']).default('MEMBER'),
});
const UpdateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    email: zod_1.z.string().email().optional(),
    role: zod_1.z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER', 'GUEST']).optional(),
    isActive: zod_1.z.boolean().optional(),
    storageQuota: zod_1.z.number().optional(),
});
// Users
router.get('/users', async (req, res) => {
    try {
        const { page, limit, search } = req.query;
        const { skip, take, ...pageMeta } = (0, paginate_1.parsePagination)({ page: parseInt(page ?? '1'), limit: parseInt(limit ?? '20') });
        const where = search
            ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
            : {};
        const [items, total] = await Promise.all([
            database_1.prisma.user.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, storageUsed: true, storageQuota: true, createdAt: true },
            }),
            database_1.prisma.user.count({ where }),
        ]);
        res.status(200).json({ success: true, data: items, error: null, meta: (0, paginate_1.buildMeta)(total, pageMeta.page, pageMeta.limit) });
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.post('/users', async (req, res) => {
    try {
        const input = CreateUserSchema.parse(req.body);
        const existing = await database_1.prisma.user.findUnique({ where: { email: input.email } });
        if (existing) {
            res.status(409).json((0, paginate_1.apiError)('Email already exists'));
            return;
        }
        const user = await database_1.prisma.user.create({
            data: { ...input, password: await (0, crypto_1.hashPassword)(input.password), isEmailVerified: true },
            select: { id: true, name: true, email: true, role: true },
        });
        res.status(201).json((0, paginate_1.apiResponse)(user));
    }
    catch (err) {
        res.status(400).json((0, paginate_1.apiError)(err.message));
    }
});
router.put('/users/:id', async (req, res) => {
    try {
        const input = UpdateUserSchema.parse(req.body);
        const user = await database_1.prisma.user.update({
            where: { id: req.params.id },
            data: { ...input, ...(input.storageQuota ? { storageQuota: BigInt(input.storageQuota) } : {}) },
            select: { id: true, name: true, email: true, role: true, isActive: true },
        });
        res.status(200).json((0, paginate_1.apiResponse)(user));
    }
    catch (err) {
        res.status(400).json((0, paginate_1.apiError)(err.message));
    }
});
router.delete('/users/:id', async (req, res) => {
    try {
        await database_1.prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
        res.status(200).json((0, paginate_1.apiResponse)({ message: 'User deactivated' }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
// Audit
router.get('/audit', async (req, res) => {
    try {
        const query = req.query;
        const result = await audit_service_1.auditService.list({
            page: parseInt(query.page ?? '1'),
            limit: parseInt(query.limit ?? '50'),
            userId: query.userId,
            action: query.action,
            resourceType: query.resourceType,
            dateFrom: query.dateFrom,
            dateTo: query.dateTo,
        });
        res.status(200).json({ success: true, data: result.items, error: null, meta: result.meta });
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.get('/audit/export', async (req, res) => {
    try {
        const query = req.query;
        const csv = await audit_service_1.auditService.exportCsv(query);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit-log-${Date.now()}.csv"`);
        res.send(csv);
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
// Storage
router.get('/storage', async (req, res) => {
    try {
        const data = await analytics_service_1.analyticsService.getStorageBreakdown();
        res.status(200).json((0, paginate_1.apiResponse)(data));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
// Settings
router.put('/settings', async (req, res) => {
    try {
        const settings = req.body;
        const updates = Object.entries(settings).map(([key, value]) => database_1.prisma.systemSetting.upsert({
            where: { key },
            create: { key, value: JSON.stringify(value) },
            update: { value: JSON.stringify(value) },
        }));
        await Promise.all(updates);
        res.status(200).json((0, paginate_1.apiResponse)({ message: 'Settings updated' }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
// Disable connector
router.post('/connectors/:id/disable', async (req, res) => {
    try {
        await database_1.prisma.connector.update({ where: { id: req.params.id }, data: { isEnabled: false } });
        res.status(200).json((0, paginate_1.apiResponse)({ message: 'Connector disabled' }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
//# sourceMappingURL=admin.routes.js.map