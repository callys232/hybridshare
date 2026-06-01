"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const crypto_1 = require("../utils/crypto");
const redis_1 = require("../config/redis");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, data: null, error: 'Authorization token required' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const blacklisted = await (0, redis_1.isBlacklisted)(token);
        if (blacklisted) {
            res.status(401).json({ success: false, data: null, error: 'Token has been revoked' });
            return;
        }
        const payload = (0, crypto_1.verifyAccessToken)(token);
        const user = await database_1.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true, isActive: true },
        });
        if (!user || !user.isActive) {
            res.status(401).json({ success: false, data: null, error: 'User not found or deactivated' });
            return;
        }
        req.user = { ...payload, id: user.id };
        next();
    }
    catch (error) {
        logger_1.logger.debug('Auth middleware token verification failed', { error });
        res.status(401).json({ success: false, data: null, error: 'Invalid or expired token' });
    }
}
async function optionalAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        next();
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const blacklisted = await (0, redis_1.isBlacklisted)(token);
        if (!blacklisted) {
            const payload = (0, crypto_1.verifyAccessToken)(token);
            req.user = { ...payload, id: payload.sub };
        }
    }
    catch {
        // Token invalid — treat as unauthenticated
    }
    next();
}
//# sourceMappingURL=auth.middleware.js.map