import { prisma } from '../config/database';
import { cacheSet, cacheGet, cacheDel, setBlacklist } from '../config/redis';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateSecureToken,
  hashToken,
  getRefreshTokenExpiry,
} from '../utils/crypto';
import { emailService } from './email.service';
import { logger } from '../utils/logger';
import { UserRole, AuthProvider, AuthTokens } from '@hybridshare/shared/types/user';
import type { RegisterInput, LoginInput } from '@hybridshare/shared/schemas/auth.schema';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { env } from '../config/env';

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
    }

    const passwordHash = await hashPassword(input.password);
    const verifyToken = generateSecureToken();

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        password: passwordHash,
        provider: AuthProvider.LOCAL,
        emailVerifyToken: hashToken(verifyToken),
        role: UserRole.MEMBER,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    await emailService.sendVerificationEmail(user.email, user.name, verifyToken);

    logger.info('User registered', { userId: user.id, email: user.email });
    return user;
  }

  async login(input: LoginInput): Promise<AuthTokens & { requiresTwoFactor?: boolean; userId?: string }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { twoFactorSecret: true },
    });

    if (!user || user.provider !== AuthProvider.LOCAL) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }

    if (!user.password) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }

    if (!user.isActive) {
      throw Object.assign(new Error('Account has been deactivated'), { statusCode: 403 });
    }

    const validPassword = await verifyPassword(input.password, user.password);
    if (!validPassword) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }

    if (user.isTwoFactorEnabled && user.twoFactorSecret?.isEnabled) {
      if (!input.totpCode) {
        return { requiresTwoFactor: true, userId: user.id, accessToken: '', refreshToken: '', expiresIn: 0 };
      }

      const valid = speakeasy.totp.verify({
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

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Fire login event for analytics (non-blocking)
    prisma.eventLog.create({
      data: {
        userId: user.id,
        event: 'user_login',
        category: 'AUTH',
        properties: { provider: user.provider },
        context: {},
        timestamp: new Date(),
      },
    }).catch(() => {});

    // Award daily-login XP and update streak (non-blocking)
    import('./gamification.service').then(({ gamificationService }) => {
      gamificationService.awardXP(user.id, 'DAILY_LOGIN' as never).catch(() => {});
    }).catch(() => {});

    return tokens;
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);

    const cached = await cacheGet<string>(`refresh:${hashToken(refreshToken)}`);
    if (!cached) {
      throw Object.assign(new Error('Refresh token invalid or expired'), { statusCode: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw Object.assign(new Error('User not found'), { statusCode: 401 });
    }

    await cacheDel(`refresh:${hashToken(refreshToken)}`);
    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    const sevenDaysSeconds = 7 * 24 * 60 * 60;
    await setBlacklist(accessToken, sevenDaysSeconds);

    if (refreshToken) {
      await cacheDel(`refresh:${hashToken(refreshToken)}`);
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const hashedToken = hashToken(token);
    const user = await prisma.user.findFirst({ where: { emailVerifyToken: hashedToken } });

    if (!user) {
      throw Object.assign(new Error('Invalid or expired verification token'), { statusCode: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null },
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const token = generateSecureToken();
    const expiry = new Date(Date.now() + 1 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: hashToken(token), passwordResetExpiry: expiry },
    });

    await emailService.sendPasswordResetEmail(user.email, user.name, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = hashToken(token);
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });
  }

  async setupTwoFactor(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    const secret = speakeasy.generateSecret({
      name: `${env.TOTP_ISSUER} (${user.email})`,
      issuer: env.TOTP_ISSUER,
      length: 32,
    });

    await prisma.twoFactorSecret.upsert({
      where: { userId },
      create: { userId, secret: secret.base32, isEnabled: false, backupCodes: [] },
      update: { secret: secret.base32, isEnabled: false },
    });

    const qrCode = await qrcode.toDataURL(secret.otpauth_url!);

    return { secret: secret.base32, qrCode };
  }

  async enableTwoFactor(userId: string, code: string): Promise<string[]> {
    const tfa = await prisma.twoFactorSecret.findUnique({ where: { userId } });
    if (!tfa) throw Object.assign(new Error('2FA not set up'), { statusCode: 400 });

    const valid = speakeasy.totp.verify({
      secret: tfa.secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!valid) throw Object.assign(new Error('Invalid TOTP code'), { statusCode: 400 });

    const backupCodes = Array.from({ length: 8 }, () => generateSecureToken(8));
    const hashedBackups = backupCodes.map((c) => hashToken(c));

    await prisma.$transaction([
      prisma.twoFactorSecret.update({
        where: { userId },
        data: { isEnabled: true, backupCodes: hashedBackups },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { isTwoFactorEnabled: true },
      }),
    ]);

    return backupCodes;
  }

  async handleOAuthUser(profile: {
    email: string;
    name: string;
    provider: AuthProvider;
    providerId: string;
    avatar?: string;
  }): Promise<AuthTokens> {
    let user = await prisma.user.findFirst({
      where: { OR: [{ email: profile.email }, { provider: profile.provider, providerId: profile.providerId }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          provider: profile.provider,
          providerId: profile.providerId,
          avatar: profile.avatar,
          isEmailVerified: true,
          role: UserRole.MEMBER,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatar: profile.avatar, lastLoginAt: new Date() },
      });
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);

    prisma.eventLog.create({
      data: {
        userId: user.id,
        event: 'user_login',
        category: 'AUTH',
        properties: { provider: profile.provider },
        context: {},
        timestamp: new Date(),
      },
    }).catch(() => {});

    import('./gamification.service').then(({ gamificationService }) => {
      gamificationService.awardXP(user.id, 'DAILY_LOGIN' as never).catch(() => {});
    }).catch(() => {});

    return tokens;
  }

  private async issueTokens(userId: string, email: string, role: string): Promise<AuthTokens> {
    const accessToken = signAccessToken({ sub: userId, email, role: role as UserRole });
    const refreshToken = signRefreshToken(userId);
    const ttlSeconds = 7 * 24 * 60 * 60;

    await cacheSet(`refresh:${hashToken(refreshToken)}`, userId, ttlSeconds);

    return { accessToken, refreshToken, expiresIn: 900 };
  }
}

export const authService = new AuthService();
