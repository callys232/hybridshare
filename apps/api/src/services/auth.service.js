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
exports.authService = exports.AuthService = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const crypto_1 = require("../utils/crypto");
const email_service_1 = require("./email.service");
const logger_1 = require("../utils/logger");
const user_1 = require("@hybridshare/shared/types/user");
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const env_1 = require("../config/env");
class AuthService {
    async register(input) {
        const existing = await database_1.prisma.user.findUnique({ where: { email: input.email } });
        if (existing) {
            throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
        }
        const passwordHash = await (0, crypto_1.hashPassword)(input.password);
        const verifyToken = (0, crypto_1.generateSecureToken)();
        const user = await database_1.prisma.user.create({
            data: {
                email: input.email,
                name: input.name,
                password: passwordHash,
                provider: user_1.AuthProvider.LOCAL,
                emailVerifyToken: (0, crypto_1.hashToken)(verifyToken),
                role: user_1.UserRole.MEMBER,
            },
            select: { id: true, email: true, name: true, role: true },
        });
        await email_service_1.emailService.sendVerificationEmail(user.email, user.name, verifyToken);
        logger_1.logger.info('User registered', { userId: user.id, email: user.email });
        return user;
    }
    async login(input) {
        const user = await database_1.prisma.user.findUnique({
            where: { email: input.email },
            include: { twoFactorSecret: true },
        });
        if (!user || user.provider !== user_1.AuthProvider.LOCAL) {
            throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
        }
        if (!user.password) {
            throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
        }
        if (!user.isActive) {
            throw Object.assign(new Error('Account has been deactivated'), { statusCode: 403 });
        }
        const validPassword = await (0, crypto_1.verifyPassword)(input.password, user.password);
        if (!validPassword) {
            throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
        }
        if (user.isTwoFactorEnabled && user.twoFactorSecret?.isEnabled) {
            if (!input.totpCode) {
                return { requiresTwoFactor: true, userId: user.id, accessToken: '', refreshToken: '', expiresIn: 0 };
            }
            const valid = speakeasy_1.default.totp.verify({
                secret: user.twoFactorSecret.secret,
                encoding: 'base32',
                token: input.totpCode,
                window: 2,
            });
            if (!valid) {
                throw Object.assign(new Error('Invalid 2FA code'), { statusCode: 401 });
            }
        }
        const tokens = await this.issueTokens(user.id, user.email, user.role);
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        // Fire login event for analytics (non-blocking)
        database_1.prisma.eventLog.create({
            data: {
                userId: user.id,
                event: 'user_login',
                category: 'AUTH',
                properties: { provider: user.provider },
                context: {},
                timestamp: new Date(),
            },
        }).catch(() => { });
        // Award daily-login XP and update streak (non-blocking)
        Promise.resolve().then(() => __importStar(require('./gamification.service'))).then(({ gamificationService }) => {
            gamificationService.awardXP(user.id, 'DAILY_LOGIN').catch(() => { });
        }).catch(() => { });
        return tokens;
    }
    async refreshTokens(refreshToken) {
        const payload = (0, crypto_1.verifyRefreshToken)(refreshToken);
        const cached = await (0, redis_1.cacheGet)(`refresh:${(0, crypto_1.hashToken)(refreshToken)}`);
        if (!cached) {
            throw Object.assign(new Error('Refresh token invalid or expired'), { statusCode: 401 });
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true, isActive: true },
        });
        if (!user || !user.isActive) {
            throw Object.assign(new Error('User not found'), { statusCode: 401 });
        }
        await (0, redis_1.cacheDel)(`refresh:${(0, crypto_1.hashToken)(refreshToken)}`);
        return this.issueTokens(user.id, user.email, user.role);
    }
    async logout(accessToken, refreshToken) {
        const sevenDaysSeconds = 7 * 24 * 60 * 60;
        await (0, redis_1.setBlacklist)(accessToken, sevenDaysSeconds);
        if (refreshToken) {
            await (0, redis_1.cacheDel)(`refresh:${(0, crypto_1.hashToken)(refreshToken)}`);
        }
    }
    async verifyEmail(token) {
        const hashedToken = (0, crypto_1.hashToken)(token);
        const user = await database_1.prisma.user.findFirst({ where: { emailVerifyToken: hashedToken } });
        if (!user) {
            throw Object.assign(new Error('Invalid or expired verification token'), { statusCode: 400 });
        }
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { isEmailVerified: true, emailVerifyToken: null },
        });
    }
    async forgotPassword(email) {
        const user = await database_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return;
        const token = (0, crypto_1.generateSecureToken)();
        const expiry = new Date(Date.now() + 1 * 60 * 60 * 1000);
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { passwordResetToken: (0, crypto_1.hashToken)(token), passwordResetExpiry: expiry },
        });
        await email_service_1.emailService.sendPasswordResetEmail(user.email, user.name, token);
    }
    async resetPassword(token, newPassword) {
        const hashedToken = (0, crypto_1.hashToken)(token);
        const user = await database_1.prisma.user.findFirst({
            where: {
                passwordResetToken: hashedToken,
                passwordResetExpiry: { gt: new Date() },
            },
        });
        if (!user) {
            throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 });
        }
        const passwordHash = await (0, crypto_1.hashPassword)(newPassword);
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: {
                password: passwordHash,
                passwordResetToken: null,
                passwordResetExpiry: null,
            },
        });
    }
    async setupTwoFactor(userId) {
        const user = await database_1.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (!user)
            throw Object.assign(new Error('User not found'), { statusCode: 404 });
        const secret = speakeasy_1.default.generateSecret({
            name: `${env_1.env.TOTP_ISSUER} (${user.email})`,
            issuer: env_1.env.TOTP_ISSUER,
            length: 32,
        });
        await database_1.prisma.twoFactorSecret.upsert({
            where: { userId },
            create: { userId, secret: secret.base32, isEnabled: false, backupCodes: [] },
            update: { secret: secret.base32, isEnabled: false },
        });
        const qrCode = await qrcode_1.default.toDataURL(secret.otpauth_url);
        return { secret: secret.base32, qrCode };
    }
    async enableTwoFactor(userId, code) {
        const tfa = await database_1.prisma.twoFactorSecret.findUnique({ where: { userId } });
        if (!tfa)
            throw Object.assign(new Error('2FA not set up'), { statusCode: 400 });
        const valid = speakeasy_1.default.totp.verify({
            secret: tfa.secret,
            encoding: 'base32',
            token: code,
            window: 2,
        });
        if (!valid)
            throw Object.assign(new Error('Invalid TOTP code'), { statusCode: 400 });
        const backupCodes = Array.from({ length: 8 }, () => (0, crypto_1.generateSecureToken)(8));
        const hashedBackups = backupCodes.map((c) => (0, crypto_1.hashToken)(c));
        await database_1.prisma.$transaction([
            database_1.prisma.twoFactorSecret.update({
                where: { userId },
                data: { isEnabled: true, backupCodes: hashedBackups },
            }),
            database_1.prisma.user.update({
                where: { id: userId },
                data: { isTwoFactorEnabled: true },
            }),
        ]);
        return backupCodes;
    }
    async handleOAuthUser(profile) {
        let user = await database_1.prisma.user.findFirst({
            where: { OR: [{ email: profile.email }, { provider: profile.provider, providerId: profile.providerId }] },
        });
        if (!user) {
            user = await database_1.prisma.user.create({
                data: {
                    email: profile.email,
                    name: profile.name,
                    provider: profile.provider,
                    providerId: profile.providerId,
                    avatar: profile.avatar,
                    isEmailVerified: true,
                    role: user_1.UserRole.MEMBER,
                },
            });
        }
        else {
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: { avatar: profile.avatar, lastLoginAt: new Date() },
            });
        }
        const tokens = await this.issueTokens(user.id, user.email, user.role);
        database_1.prisma.eventLog.create({
            data: {
                userId: user.id,
                event: 'user_login',
                category: 'AUTH',
                properties: { provider: profile.provider },
                context: {},
                timestamp: new Date(),
            },
        }).catch(() => { });
        Promise.resolve().then(() => __importStar(require('./gamification.service'))).then(({ gamificationService }) => {
            gamificationService.awardXP(user.id, 'DAILY_LOGIN').catch(() => { });
        }).catch(() => { });
        return tokens;
    }
    async issueTokens(userId, email, role) {
        const accessToken = (0, crypto_1.signAccessToken)({ sub: userId, email, role: role });
        const refreshToken = (0, crypto_1.signRefreshToken)(userId);
        const ttlSeconds = 7 * 24 * 60 * 60;
        await (0, redis_1.cacheSet)(`refresh:${(0, crypto_1.hashToken)(refreshToken)}`, userId, ttlSeconds);
        return { accessToken, refreshToken, expiresIn: 900 };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map