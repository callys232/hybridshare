"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = auditLog;
exports.auditMiddleware = auditMiddleware;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
function auditLog(options) {
    return (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            const response = body;
            if (response?.success !== false) {
                const resourceId = options.getResourceId?.(req) || req.params.id || 'unknown';
                const metadata = options.getMetadata?.(req) || {};
                database_1.prisma.auditLog
                    .create({
                    data: {
                        userId: req.user?.id || null,
                        action: options.action,
                        resourceType: options.resourceType,
                        resourceId,
                        resourceName: options.getResourceName?.(req, res),
                        ipAddress: req.ip || req.headers['x-forwarded-for']?.toString(),
                        userAgent: req.headers['user-agent'],
                        metadata,
                    },
                })
                    .catch((err) => logger_1.logger.error('Audit log write failed', { err }));
            }
            return originalJson(body);
        };
        next();
    };
}
function auditMiddleware(req, res, next) {
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!mutatingMethods.includes(req.method)) {
        next();
        return;
    }
    const originalJson = res.json.bind(res);
    res.json = function (body) {
        const response = body;
        if (response?.success !== false && req.user) {
            const resourceType = req.path.split('/')[1] || 'unknown';
            const resourceId = req.params.id || 'unknown';
            database_1.prisma.auditLog
                .create({
                data: {
                    userId: req.user.id,
                    action: `${req.method} ${req.path}`,
                    resourceType,
                    resourceId,
                    ipAddress: req.ip || req.headers['x-forwarded-for']?.toString(),
                    userAgent: req.headers['user-agent'],
                    metadata: { body: req.body, query: req.query },
                },
            })
                .catch((err) => logger_1.logger.error('Audit middleware write failed', { err }));
        }
        return originalJson(body);
    };
    next();
}
//# sourceMappingURL=audit.middleware.js.map