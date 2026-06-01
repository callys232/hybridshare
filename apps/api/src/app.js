"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
const security_middleware_1 = require("./middleware/security.middleware");
const auth_routes_1 = require("./routes/auth.routes");
const file_routes_1 = require("./routes/file.routes");
const workspace_routes_1 = require("./routes/workspace.routes");
const app = (0, express_1.default)();
exports.app = app;
app.set('trust proxy', 1);
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
        },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    xFrameOptions: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use((0, cors_1.default)({
    origin: env_1.env.APP_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
app.use(passport_1.default.initialize());
if (env_1.env.GOOGLE_CLIENT_ID && env_1.env.GOOGLE_CLIENT_SECRET) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: env_1.env.GOOGLE_CLIENT_ID,
        clientSecret: env_1.env.GOOGLE_CLIENT_SECRET,
        callbackURL: env_1.env.GOOGLE_CALLBACK_URL ?? '/api/auth/oauth/google/callback',
    }, async (accessToken, refreshToken, profile, done) => {
        const { authService } = await Promise.resolve().then(() => __importStar(require('./services/auth.service')));
        try {
            const tokens = await authService.handleOAuthUser({
                email: profile.emails?.[0]?.value ?? '',
                name: profile.displayName,
                provider: 'GOOGLE',
                providerId: profile.id,
                avatar: profile.photos?.[0]?.value,
            });
            done(null, { tokens });
        }
        catch (err) {
            done(err);
        }
    }));
}
// Security bundle: scanner blocking, path traversal, input sanitization, extra headers
app.use(security_middleware_1.securityBundle);
app.use(rateLimit_middleware_1.generalRateLimit);
app.get('/health', async (req, res) => {
    const { checkDatabaseHealth } = await Promise.resolve().then(() => __importStar(require('./config/database')));
    const { checkRedisHealth } = await Promise.resolve().then(() => __importStar(require('./config/redis')));
    const { checkMinioHealth } = await Promise.resolve().then(() => __importStar(require('./config/minio')));
    const { checkMeilisearchHealth } = await Promise.resolve().then(() => __importStar(require('./config/meilisearch')));
    const [db, redis, minio, search] = await Promise.allSettled([
        checkDatabaseHealth(),
        checkRedisHealth(),
        checkMinioHealth(),
        checkMeilisearchHealth(),
    ]);
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version ?? '1.0.0',
        services: {
            database: db.status === 'fulfilled' && db.value ? 'healthy' : 'unhealthy',
            redis: redis.status === 'fulfilled' && redis.value ? 'healthy' : 'unhealthy',
            minio: minio.status === 'fulfilled' && minio.value ? 'healthy' : 'unhealthy',
            search: search.status === 'fulfilled' && search.value ? 'healthy' : 'unhealthy',
        },
    };
    const allHealthy = Object.values(health.services).every((s) => s === 'healthy');
    res.status(allHealthy ? 200 : 503).json(health);
});
app.use('/api/auth', rateLimit_middleware_1.authRateLimit, auth_routes_1.authRouter);
app.use('/api/files', file_routes_1.fileRouter);
app.use('/api/workspaces', workspace_routes_1.workspaceRouter);
app.use('/api/share', async (req, res, next) => {
    const { shareRouter } = await Promise.resolve().then(() => __importStar(require('./routes/share.routes')));
    shareRouter(req, res, next);
});
app.use('/api/search', async (req, res, next) => {
    const { searchRouter } = await Promise.resolve().then(() => __importStar(require('./routes/search.routes')));
    searchRouter(req, res, next);
});
app.use('/api/comments', async (req, res, next) => {
    const { commentRouter } = await Promise.resolve().then(() => __importStar(require('./routes/comment.routes')));
    commentRouter(req, res, next);
});
app.use('/api/tasks', async (req, res, next) => {
    const { taskRouter } = await Promise.resolve().then(() => __importStar(require('./routes/task.routes')));
    taskRouter(req, res, next);
});
app.use('/api/notifications', async (req, res, next) => {
    const { notificationRouter } = await Promise.resolve().then(() => __importStar(require('./routes/notification.routes')));
    notificationRouter(req, res, next);
});
app.use('/api/analytics', async (req, res, next) => {
    const { analyticsRouter } = await Promise.resolve().then(() => __importStar(require('./routes/analytics.routes')));
    analyticsRouter(req, res, next);
});
app.use('/api/social', async (req, res, next) => {
    const { socialRouter } = await Promise.resolve().then(() => __importStar(require('./routes/social.routes')));
    socialRouter(req, res, next);
});
app.use('/api/connectors', async (req, res, next) => {
    const { connectorRouter } = await Promise.resolve().then(() => __importStar(require('./routes/connector.routes')));
    connectorRouter(req, res, next);
});
app.use('/api/assets', async (req, res, next) => {
    const { assetRouter } = await Promise.resolve().then(() => __importStar(require('./routes/asset.routes')));
    assetRouter(req, res, next);
});
app.use('/api/admin', async (req, res, next) => {
    const { adminRouter } = await Promise.resolve().then(() => __importStar(require('./routes/admin.routes')));
    adminRouter(req, res, next);
});
app.use('/api/users', async (req, res, next) => {
    const { userRouter } = await Promise.resolve().then(() => __importStar(require('./routes/user.routes')));
    userRouter(req, res, next);
});
app.use('/api/folders', async (req, res, next) => {
    const { folderRouter } = await Promise.resolve().then(() => __importStar(require('./routes/folder.routes')));
    folderRouter(req, res, next);
});
// ─── LMS Routes ──────────────────────────────────────────────────────────────
app.use('/api/courses', async (req, res, next) => {
    const { courseRouter } = await Promise.resolve().then(() => __importStar(require('./routes/course.routes')));
    courseRouter(req, res, next);
});
app.use('/api/enrollments', async (req, res, next) => {
    const { enrollmentRouter } = await Promise.resolve().then(() => __importStar(require('./routes/enrollment.routes')));
    enrollmentRouter(req, res, next);
});
app.use('/api/gamification', async (req, res, next) => {
    const { gamificationRouter } = await Promise.resolve().then(() => __importStar(require('./routes/gamification.routes')));
    gamificationRouter(req, res, next);
});
app.use('/api/events', async (req, res, next) => {
    const { eventRouter } = await Promise.resolve().then(() => __importStar(require('./routes/event.routes')));
    eventRouter(req, res, next);
});
app.use('/api/payments', async (req, res, next) => {
    const { paymentRouter } = await Promise.resolve().then(() => __importStar(require('./routes/payment.routes')));
    paymentRouter(req, res, next);
});
app.use('/api/ai', rateLimit_middleware_1.aiRateLimit, async (req, res, next) => {
    const { aiRouter } = await Promise.resolve().then(() => __importStar(require('./routes/ai.routes')));
    aiRouter(req, res, next);
});
app.use('/api/certificates', async (req, res, next) => {
    const { certificateRouter } = await Promise.resolve().then(() => __importStar(require('./routes/certificate.routes')));
    certificateRouter(req, res, next);
});
app.use('/api/forums', async (req, res, next) => {
    const { forumRouter } = await Promise.resolve().then(() => __importStar(require('./routes/forum.routes')));
    forumRouter(req, res, next);
});
app.use('/api/live-sessions', async (req, res, next) => {
    const { liveSessionRouter } = await Promise.resolve().then(() => __importStar(require('./routes/livesession.routes')));
    liveSessionRouter(req, res, next);
});
app.use('/api/learning-paths', async (req, res, next) => {
    const { learningPathRouter } = await Promise.resolve().then(() => __importStar(require('./routes/learningpath.routes')));
    learningPathRouter(req, res, next);
});
app.use('/api/organizations', async (req, res, next) => {
    const { organizationRouter } = await Promise.resolve().then(() => __importStar(require('./routes/organization.routes')));
    organizationRouter(req, res, next);
});
app.use('/api/announcements', async (req, res, next) => {
    const { announcementRouter } = await Promise.resolve().then(() => __importStar(require('./routes/announcement.routes')));
    announcementRouter(req, res, next);
});
app.use('/api/scorm', async (req, res, next) => {
    const { scormRouter } = await Promise.resolve().then(() => __importStar(require('./routes/scorm.routes')));
    scormRouter(req, res, next);
});
app.use((req, res) => {
    res.status(404).json({ success: false, data: null, error: `Route ${req.method} ${req.path} not found` });
});
app.use((err, req, res, _next) => {
    logger_1.logger.error('Unhandled error', { path: req.path, method: req.method, error: err.message, stack: err.stack });
    res.status(err.statusCode ?? 500).json({
        success: false,
        data: null,
        error: env_1.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
});
//# sourceMappingURL=app.js.map