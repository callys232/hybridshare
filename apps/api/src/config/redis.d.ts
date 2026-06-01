import Redis from 'ioredis';
export declare function getRedis(): Redis;
export declare function checkRedisHealth(): Promise<boolean>;
export declare function cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
export declare function cacheGet<T>(key: string): Promise<T | null>;
export declare function cacheDel(key: string): Promise<void>;
export declare function cacheDelPattern(pattern: string): Promise<void>;
export declare function setBlacklist(token: string, ttlSeconds: number): Promise<void>;
export declare function isBlacklisted(token: string): Promise<boolean>;
//# sourceMappingURL=redis.d.ts.map