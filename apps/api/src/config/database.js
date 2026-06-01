"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
exports.checkDatabaseHealth = checkDatabaseHealth;
exports.getPrisma = getPrisma;
const client_1 = require("@prisma/client");
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: env_1.env.NODE_ENV === "development"
            ? ["query", "info", "warn", "error"]
            : ["warn", "error"],
        datasources: {
            db: {
                url: env_1.env.DATABASE_URL,
            },
        },
    });
if (env_1.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
async function connectDatabase() {
    try {
        await exports.prisma.$connect();
        logger_1.logger.info("Database connected successfully");
    }
    catch (error) {
        logger_1.logger.error("Failed to connect to database", { error });
        process.exit(1);
    }
}
async function disconnectDatabase() {
    await exports.prisma.$disconnect();
    logger_1.logger.info("Database disconnected");
}
async function checkDatabaseHealth() {
    try {
        await exports.prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch {
        return false;
    }
}
function getPrisma() {
    return exports.prisma;
}
//# sourceMappingURL=database.js.map