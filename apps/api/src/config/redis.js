"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = getRedis;
exports.checkRedisHealth = checkRedisHealth;
exports.cacheSet = cacheSet;
exports.cacheGet = cacheGet;
exports.cacheDel = cacheDel;
exports.cacheDelPattern = cacheDelPattern;
exports.setBlacklist = setBlacklist;
exports.isBlacklisted = isBlacklisted;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
let redisClient = null;
function getRedis() {
    if (!redisClient) {
        redisClient = new ioredis_1.default(env_1.env.REDIS_URL, {
            password: env_1.env.REDIS_PASSWORD || undefined,
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                if (times > 10) {
                    logger_1.logger.error('Redis connection failed after 10 retries');
                    return null;
                }
                return Math.min(times * 100, 3000);
            },
            enableReadyCheck: true,
            lazyConnect: false,
        });
        redisClient.on('connect', () => logger_1.logger.info('Redis connected'));
        redisClient.on('error', (err) => logger_1.logger.error('Redis error', { error: err.message }));
        redisClient.on('close', () => logger_1.logger.warn('Redis connection closed'));
        redisClient.on('reconnecting', () => logger_1.logger.info('Redis reconnecting'));
    }
    return redisClient;
}
async function checkRedisHealth() {
    try {
        const pong = await getRedis().ping();
        return pong === 'PONG';
    }
    catch {
        return false;
    }
}
async function cacheSet(key, value, ttlSeconds) {
    const redis = getRedis();
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, serialized);
    }
    else {
        await redis.set(key, serialized);
    }
}
async function cacheGet(key) {
    const redis = getRedis();
    const value = await redis.get(key);
    if (!value)
        return null;
    try {
        return JSON.parse(value);
    }
    catch {
        return null;
    }
}
async function cacheDel(key) {
    await getRedis().del(key);
}
async function cacheDelPattern(pattern) {
    const redis = getRedis();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
        await redis.del(...keys);
    }
}
async function setBlacklist(token, ttlSeconds) {
    await getRedis().setex(`blacklist:${token}`, ttlSeconds, '1');
}
async function isBlacklisted(token) {
    const result = await getRedis().exists(`blacklist:${token}`);
    return result === 1;
}
//# sourceMappingURL=redis.js.map