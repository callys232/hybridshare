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
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = require("./app");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const minio_1 = require("./config/minio");
const meilisearch_1 = require("./config/meilisearch");
const socket_1 = require("./config/socket");
const queue_1 = require("./jobs/queue");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const httpServer = (0, http_1.createServer)(app_1.app);
async function bootstrap() {
    logger_1.logger.info('Starting HybridShare API server...');
    await (0, database_1.connectDatabase)();
    (0, redis_1.getRedis)();
    await (0, minio_1.initializeMinio)().catch((err) => {
        logger_1.logger.warn('MinIO initialization failed — continuing without storage', { err });
    });
    await (0, meilisearch_1.initializeMeilisearch)().catch((err) => {
        logger_1.logger.warn('Meilisearch initialization failed — search may be unavailable', { err });
    });
    (0, socket_1.initializeSocket)(httpServer);
    await (0, queue_1.initializeQueues)().catch((err) => {
        logger_1.logger.warn('Queue initialization failed', { err });
    });
    httpServer.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`HybridShare API running on port ${env_1.env.PORT}`, {
            env: env_1.env.NODE_ENV,
            port: env_1.env.PORT,
            appUrl: env_1.env.APP_URL,
        });
    });
}
async function shutdown() {
    logger_1.logger.info('Shutting down gracefully...');
    httpServer.close(async () => {
        const { disconnectDatabase } = await Promise.resolve().then(() => __importStar(require('./config/database')));
        await disconnectDatabase();
        logger_1.logger.info('Server closed');
        process.exit(0);
    });
    setTimeout(() => {
        logger_1.logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error('Unhandled promise rejection', { reason });
});
process.on('uncaughtException', (err) => {
    logger_1.logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
});
bootstrap().catch((err) => {
    logger_1.logger.error('Failed to start server', { error: err.message });
    process.exit(1);
});
//# sourceMappingURL=index.js.map