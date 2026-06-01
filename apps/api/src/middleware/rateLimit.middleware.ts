import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis } from '../config/redis';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import type { Request, Response, NextFunction } from 'express';

// ─── Redis-backed store factory ───────────────────────────────────────────────
function makeRedisStore(prefix: string) {
  try {
    const client = getRedis();
    return new RedisStore({ sendCommand: (...args: string[]) => client.sendCommand(args), prefix });
  } catch {
    return undefined; // Fallback to memory store
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ipKey = (req: Request) =>
  (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ?? req.ip ?? 'unknown';

const userKey = (req: Request) =>
  (req as Request & { user?: { id: string } }).user?.id ?? ipKey(req);

const respond429 = (msg: string) => ({
  success: false,
  data: null,
  error: msg,
  retryAfter: undefined as number | undefined,
});

// ─── General ──────────────────────────────────────────────────────────────────
export const generalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:general:'),
  message: respond429('Too many requests. Please try again later.'),
  skip: (req) => req.path === '/health',
});

// ─── Auth endpoints — strict ──────────────────────────────────────────────────
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:auth:'),
  keyGenerator: ipKey,
  message: respond429('Too many authentication attempts. Blocked for 15 minutes.'),
  handler: (req, res, next, options) => {
    logger.warn('Auth rate limit hit', { ip: ipKey(req), path: req.path });
    res.status(429).json(options.message);
  },
});

// ─── Password reset / email verify — very strict ─────────────────────────────
export const sensitiveRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:sensitive:'),
  keyGenerator: ipKey,
  message: respond429('Too many attempts. Please try again in 1 hour.'),
  handler: (req, res, next, options) => {
    logger.warn('Sensitive action rate limit hit', { ip: ipKey(req), path: req.path });
    res.status(429).json(options.message);
  },
});

// ─── File uploads ─────────────────────────────────────────────────────────────
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:upload:'),
  message: respond429('Too many upload requests. Please slow down.'),
});

// ─── Search ───────────────────────────────────────────────────────────────────
export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:search:'),
  message: respond429('Search rate limit exceeded. Please slow down.'),
});

// ─── AI generation — expensive compute ───────────────────────────────────────
export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:ai:'),
  keyGenerator: userKey,
  message: respond429('AI rate limit reached. Max 10 requests per minute.'),
});

// ─── Quiz submission — prevent brute-force ────────────────────────────────────
export const quizRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:quiz:'),
  keyGenerator: userKey,
  message: respond429('Too many quiz attempts. Please wait before retrying.'),
});

// ─── Event tracking — allow batches but throttle ─────────────────────────────
export const eventRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:events:'),
  message: respond429('Event tracking rate limit exceeded.'),
});

// ─── Webhook delivery (inbound) ───────────────────────────────────────────────
export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:webhook:'),
  message: respond429('Webhook rate limit exceeded.'),
});

// ─── API key usage — per key ──────────────────────────────────────────────────
export const apiKeyRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:apikey:'),
  keyGenerator: (req) => {
    const key = req.headers['x-api-key'] as string;
    return key ?? ipKey(req);
  },
  message: respond429('API key rate limit exceeded. Upgrade your plan for higher limits.'),
});

// ─── Forum post creation ──────────────────────────────────────────────────────
export const forumRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:forum:'),
  keyGenerator: userKey,
  message: respond429('Posting too fast. Please slow down.'),
});

// ─── Certificate generation ───────────────────────────────────────────────────
export const certificateRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:cert:'),
  keyGenerator: userKey,
  message: respond429('Too many certificate requests. Please wait.'),
});

// ─── Dynamic limiter factory ──────────────────────────────────────────────────
export function createRateLimit(opts: {
  windowMs: number;
  max: number;
  prefix: string;
  message?: string;
  keyBy?: 'ip' | 'user';
}) {
  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRedisStore(`rl:${opts.prefix}:`),
    keyGenerator: opts.keyBy === 'user' ? userKey : ipKey,
    message: respond429(opts.message ?? 'Rate limit exceeded.'),
  });
}
