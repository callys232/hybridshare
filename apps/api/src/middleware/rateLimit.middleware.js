"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.certificateRateLimit = exports.forumRateLimit = exports.apiKeyRateLimit = exports.webhookRateLimit = exports.eventRateLimit = exports.quizRateLimit = exports.aiRateLimit = exports.searchRateLimit = exports.uploadRateLimit = exports.sensitiveRateLimit = exports.authRateLimit = exports.generalRateLimit = void 0;
exports.createRateLimit = createRateLimit;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = require("rate-limit-redis");
const redis_1 = require("../config/redis");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
// ─── Redis-backed store factory ───────────────────────────────────────────────
function makeRedisStore(prefix) {
    try {
        const client = (0, redis_1.getRedis)();
        return new rate_limit_redis_1.RedisStore({ sendCommand: (...args) => client.sendCommand(args), prefix });
    }
    catch {
        return undefined; // Fallback to memory store
    }
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
const ipKey = (req) => req.headers['x-forwarded-for']?.split(',')[0].trim() ?? req.ip ?? 'unknown';
const userKey = (req) => req.user?.id ?? ipKey(req);
const respond429 = (msg) => ({
    success: false,
    data: null,
    error: msg,
    retryAfter: undefined,
});
// ─── General ──────────────────────────────────────────────────────────────────
exports.generalRateLimit = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRedisStore('rl:general:'),
    message: respond429('Too many requests. Please try again later.'),
    skip: (req) => req.path === '/health',
});
// ─── Auth endpoints — strict ──────────────────────────────────────────────────
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRedisStore('rl:auth:'),
    keyGenerator: ipKey,
    message: respond429('Too many authentication attempts. Blocked for 15 minutes.'),
    handler: (req, res, next, options) => {
        logger_1.logger.warn('Auth rate limit hit', { ip: ipKey(req), path: req.path });
        res.status(429).json(options.message);
    },
});
// ─── Password reset / email verify — very strict ─────────────────────────────
exports.sensitiveRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRedisStore('rl:sensitive:'),
    keyGenerator: ipKey,
    message: respond429('Too many attempts. Please try again in 1 hour.'),
    handler: (req, res, next, options) => {
        logger_1.logger.warn('Sensitive action rate limit hit', { ip: ipKey(req), path: req.path });
        res.status(429).json(options.message);
    },
});
// ─── File uploads ─────────────────────────────────────────────────────────────
exports.uploadRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRedisStore('rl:upload:'),
    message: respond429('Too many upload requests. Please slow down.'),
});
// ─── Search ───────────────────────────────────────────────────────────────────
exports.searchRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRedisStore('rl:search:'),
    message: respond429('Search rate limit exceeded. Please slow down.'),
});
// ─── AI generation — expensive compute ───────────────────────────────────────
exports.aiRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRedisStore('rl:ai:'),
    keyGenerator: userKey,
    message: respond429('AI rate limit reached. Max 10 requests per minute.'),
});
// ─── Quiz submission — prevent brute-force ────────────────────────────────────
exports.quizRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRedisStore('rl:quiz:'),
    keyGenerator: userKey,
    message: respond429('Too many quiz attempts. Please wait before retrying.'),
});
// ─── Event tracking — allow batches but throttle ─────────────────────────────
exports.eventRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRedisStore('rl:events:'),
    message: respond429('Event tracking rate limit exceeded.'),
});
// ─── Webhook delivery (inbound) ───────────────────────────────────────────────
exports.webhookRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRedisStore('rl:webhook:'),
    message: respond429('Webhook rate limit exceeded.'),
});
// ─── API key usage — per key ──────────────────────────────────────────────────
exports.apiKeyRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRedisStore('rl:apikey:'),
    keyGenerator: (req) => {
        const key = req.headers['x-api-key'];
        return key ?? ipKey(req);
    },
    message: respond429('API key rate limit exceeded. Upgrade your plan for higher limits.'),
});
// ─── Forum post creation ──────────────────────────────────────────────────────
exports.forumRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRedisStore('rl:forum:'),
    keyGenerator: userKey,
    message: respond429('Posting too fast. Please slow down.'),
});
// ─── Certificate generation ───────────────────────────────────────────────────
exports.certificateRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRedisStore('rl:cert:'),
    keyGenerator: userKey,
    message: respond429('Too many certificate requests. Please wait.'),
});
// ─── Dynamic limiter factory ──────────────────────────────────────────────────
function createRateLimit(opts) {
    return (0, express_rate_limit_1.default)({
        windowMs: opts.windowMs,
        max: opts.max,
        standardHeaders: true,
        legacyHeaders: false,
        store: makeRedisStore(`rl:${opts.prefix}:`),
        keyGenerator: opts.keyBy === 'user' ? userKey : ipKey,
        message: respond429(opts.message ?? 'Rate limit exceeded.'),
    });
}
//# sourceMappingURL=rateLimit.middleware.js.map