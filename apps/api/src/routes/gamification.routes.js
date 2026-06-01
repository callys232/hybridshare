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
exports.gamificationRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const gamification_service_1 = require("../services/gamification.service");
exports.gamificationRouter = (0, express_1.Router)();
const ok = (res, data) => res.json({ success: true, data, error: null });
const uid = (req) => req.user.sub;
// Public leaderboards
exports.gamificationRouter.get('/leaderboard/:period', async (req, res, next) => {
    try {
        const period = req.params.period;
        ok(res, await gamification_service_1.gamificationService.getLeaderboard(period, Number(req.query.limit) || 50));
    }
    catch (e) {
        next(e);
    }
});
exports.gamificationRouter.get('/badges', async (req, res, next) => {
    try {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        ok(res, await prisma.badge.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }));
    }
    catch (e) {
        next(e);
    }
});
// Auth required
exports.gamificationRouter.use(auth_middleware_1.authenticate);
exports.gamificationRouter.get('/me', async (req, res, next) => {
    try {
        ok(res, await gamification_service_1.gamificationService.getUserGamificationProfile(uid(req)));
    }
    catch (e) {
        next(e);
    }
});
exports.gamificationRouter.get('/me/events', async (req, res, next) => {
    try {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        ok(res, await prisma.gamificationEvent.findMany({
            where: { userId: uid(req) },
            orderBy: { createdAt: 'desc' },
            take: 50,
        }));
    }
    catch (e) {
        next(e);
    }
});
exports.gamificationRouter.post('/daily-login', async (req, res, next) => {
    try {
        const userId = uid(req);
        await gamification_service_1.gamificationService.awardXP(userId, 'DAILY_LOGIN');
        await gamification_service_1.gamificationService.updateStreak(userId);
        ok(res, await gamification_service_1.gamificationService.getUserGamificationProfile(userId));
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=gamification.routes.js.map