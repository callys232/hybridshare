import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './config/env';
import { logger } from './utils/logger';
import { generalRateLimit, authRateLimit, aiRateLimit } from './middleware/rateLimit.middleware';
import { securityBundle } from './middleware/security.middleware';
import { authRouter } from './routes/auth.routes';
import { fileRouter } from './routes/file.routes';
import { workspaceRouter } from './routes/workspace.routes';

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
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
  })
);

app.use(
  cors({
    origin: env.APP_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(passport.initialize());

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL ?? '/api/auth/oauth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        const { authService } = await import('./services/auth.service');
        try {
          const tokens = await authService.handleOAuthUser({
            email: profile.emails?.[0]?.value ?? '',
            name: profile.displayName,
            provider: 'GOOGLE' as never,
            providerId: profile.id,
            avatar: profile.photos?.[0]?.value,
          });
          done(null, { tokens });
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );
}

// Security bundle: scanner blocking, path traversal, input sanitization, extra headers
app.use(securityBundle);
app.use(generalRateLimit);

app.get('/health', async (req, res) => {
  const { checkDatabaseHealth } = await import('./config/database');
  const { checkRedisHealth } = await import('./config/redis');
  const { checkMinioHealth } = await import('./config/minio');
  const { checkMeilisearchHealth } = await import('./config/meilisearch');

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

app.use('/api/auth', authRateLimit, authRouter);
app.use('/api/files', fileRouter);
app.use('/api/workspaces', workspaceRouter);

app.use('/api/share', async (req, res, next) => {
  const { shareRouter } = await import('./routes/share.routes');
  shareRouter(req, res, next);
});

app.use('/api/search', async (req, res, next) => {
  const { searchRouter } = await import('./routes/search.routes');
  searchRouter(req, res, next);
});

app.use('/api/comments', async (req, res, next) => {
  const { commentRouter } = await import('./routes/comment.routes');
  commentRouter(req, res, next);
});

app.use('/api/tasks', async (req, res, next) => {
  const { taskRouter } = await import('./routes/task.routes');
  taskRouter(req, res, next);
});

app.use('/api/notifications', async (req, res, next) => {
  const { notificationRouter } = await import('./routes/notification.routes');
  notificationRouter(req, res, next);
});

app.use('/api/analytics', async (req, res, next) => {
  const { analyticsRouter } = await import('./routes/analytics.routes');
  analyticsRouter(req, res, next);
});

app.use('/api/social', async (req, res, next) => {
  const { socialRouter } = await import('./routes/social.routes');
  socialRouter(req, res, next);
});

app.use('/api/connectors', async (req, res, next) => {
  const { connectorRouter } = await import('./routes/connector.routes');
  connectorRouter(req, res, next);
});

app.use('/api/assets', async (req, res, next) => {
  const { assetRouter } = await import('./routes/asset.routes');
  assetRouter(req, res, next);
});

app.use('/api/admin', async (req, res, next) => {
  const { adminRouter } = await import('./routes/admin.routes');
  adminRouter(req, res, next);
});

app.use('/api/users', async (req, res, next) => {
  const { userRouter } = await import('./routes/user.routes');
  userRouter(req, res, next);
});

app.use('/api/folders', async (req, res, next) => {
  const { folderRouter } = await import('./routes/folder.routes');
  folderRouter(req, res, next);
});

// ─── LMS Routes ──────────────────────────────────────────────────────────────

app.use('/api/courses', async (req, res, next) => {
  const { courseRouter } = await import('./routes/course.routes');
  courseRouter(req, res, next);
});

app.use('/api/enrollments', async (req, res, next) => {
  const { enrollmentRouter } = await import('./routes/enrollment.routes');
  enrollmentRouter(req, res, next);
});

app.use('/api/gamification', async (req, res, next) => {
  const { gamificationRouter } = await import('./routes/gamification.routes');
  gamificationRouter(req, res, next);
});

app.use('/api/events', async (req, res, next) => {
  const { eventRouter } = await import('./routes/event.routes');
  eventRouter(req, res, next);
});

app.use('/api/payments', async (req, res, next) => {
  const { paymentRouter } = await import('./routes/payment.routes');
  paymentRouter(req, res, next);
});

app.use('/api/ai', aiRateLimit, async (req, res, next) => {
  const { aiRouter } = await import('./routes/ai.routes');
  aiRouter(req, res, next);
});

app.use('/api/certificates', async (req, res, next) => {
  const { certificateRouter } = await import('./routes/certificate.routes');
  certificateRouter(req, res, next);
});

app.use('/api/forums', async (req, res, next) => {
  const { forumRouter } = await import('./routes/forum.routes');
  forumRouter(req, res, next);
});

app.use('/api/live-sessions', async (req, res, next) => {
  const { liveSessionRouter } = await import('./routes/livesession.routes');
  liveSessionRouter(req, res, next);
});

app.use('/api/learning-paths', async (req, res, next) => {
  const { learningPathRouter } = await import('./routes/learningpath.routes');
  learningPathRouter(req, res, next);
});

app.use('/api/organizations', async (req, res, next) => {
  const { organizationRouter } = await import('./routes/organization.routes');
  organizationRouter(req, res, next);
});

app.use('/api/announcements', async (req, res, next) => {
  const { announcementRouter } = await import('./routes/announcement.routes');
  announcementRouter(req, res, next);
});

app.use('/api/scorm', async (req, res, next) => {
  const { scormRouter } = await import('./routes/scorm.routes');
  scormRouter(req, res, next);
});

app.use((req, res) => {
  res.status(404).json({ success: false, data: null, error: `Route ${req.method} ${req.path} not found` });
});

app.use((err: Error & { statusCode?: number }, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { path: req.path, method: req.method, error: err.message, stack: err.stack });
  res.status(err.statusCode ?? 500).json({
    success: false,
    data: null,
    error: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

export { app };
