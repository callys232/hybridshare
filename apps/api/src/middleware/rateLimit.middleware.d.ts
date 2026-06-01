export declare const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const sensitiveRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const uploadRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const searchRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const aiRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const quizRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const eventRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const webhookRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const apiKeyRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const forumRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const certificateRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare function createRateLimit(opts: {
    windowMs: number;
    max: number;
    prefix: string;
    message?: string;
    keyBy?: 'ip' | 'user';
}): import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimit.middleware.d.ts.map