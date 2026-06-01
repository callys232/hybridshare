"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const storage_service_1 = require("../services/storage.service");
const crypto_1 = require("../utils/crypto");
const paginate_1 = require("../utils/paginate");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
exports.userRouter = router;
router.use(auth_middleware_1.authMiddleware);
const ME_SELECT = {
    id: true, email: true, name: true, avatar: true, role: true,
    provider: true, isEmailVerified: true, isTwoFactorEnabled: true,
    isActive: true, lastLoginAt: true, storageUsed: true, storageQuota: true,
    bio: true, jobTitle: true, website: true, linkedinUrl: true,
    twitterHandle: true, timezone: true, language: true,
    xpPoints: true, streakDays: true, longestStreak: true,
    createdAt: true, updatedAt: true,
};
router.get('/me', async (req, res) => {
    try {
        const user = await database_1.prisma.user.findUnique({ where: { id: req.user.id }, select: ME_SELECT });
        if (!user) {
            res.status(404).json((0, paginate_1.apiError)('User not found'));
            return;
        }
        res.status(200).json((0, paginate_1.apiResponse)({
            ...user,
            storageUsed: Number(user.storageUsed),
            storageQuota: Number(user.storageQuota),
        }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
const UpdateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    bio: zod_1.z.string().max(500).optional(),
    jobTitle: zod_1.z.string().max(100).optional(),
    website: zod_1.z.string().url().max(200).optional().or(zod_1.z.literal('')),
    linkedinUrl: zod_1.z.string().max(200).optional(),
    twitterHandle: zod_1.z.string().max(50).optional(),
    timezone: zod_1.z.string().max(50).optional(),
    language: zod_1.z.string().max(10).optional(),
});
router.put('/me', async (req, res) => {
    try {
        const data = UpdateProfileSchema.parse(req.body);
        const user = await database_1.prisma.user.update({
            where: { id: req.user.id },
            data,
            select: ME_SELECT,
        });
        res.status(200).json((0, paginate_1.apiResponse)({
            ...user,
            storageUsed: Number(user.storageUsed),
            storageQuota: Number(user.storageQuota),
        }));
    }
    catch (err) {
        res.status(400).json((0, paginate_1.apiError)(err.message));
    }
});
router.post('/me/avatar', upload_middleware_1.uploadAvatar, async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json((0, paginate_1.apiError)('No image provided'));
            return;
        }
        const avatarUrl = await storage_service_1.storageService.uploadAvatar(req.file.buffer, req.user.id);
        const user = await database_1.prisma.user.update({ where: { id: req.user.id }, data: { avatar: avatarUrl } });
        res.status(200).json((0, paginate_1.apiResponse)({ avatar: user.avatar }));
    }
    catch (err) {
        res.status(500).json((0, paginate_1.apiError)(err.message));
    }
});
router.put('/me/password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = zod_1.z.object({
            currentPassword: zod_1.z.string().min(1),
            newPassword: zod_1.z.string().min(8).max(128),
        }).parse(req.body);
        const user = await database_1.prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user?.password) {
            res.status(400).json((0, paginate_1.apiError)('Password change not available for OAuth accounts'));
            return;
        }
        const valid = await (0, crypto_1.verifyPassword)(currentPassword, user.password);
        if (!valid) {
            res.status(401).json((0, paginate_1.apiError)('Current password is incorrect'));
            return;
        }
        await database_1.prisma.user.update({
            where: { id: req.user.id },
            data: { password: await (0, crypto_1.hashPassword)(newPassword) },
        });
        res.status(200).json((0, paginate_1.apiResponse)({ message: 'Password updated successfully' }));
    }
    catch (err) {
        res.status(400).json((0, paginate_1.apiError)(err.message));
    }
});
//# sourceMappingURL=user.routes.js.map