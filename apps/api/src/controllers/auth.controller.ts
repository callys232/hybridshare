import type { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { apiResponse, apiError } from '../utils/paginate';
import { logger } from '../utils/logger';
import type { AuthRequest } from '../middleware/auth.middleware';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
  TwoFactorVerifySchema,
  RefreshTokenSchema,
  LdapLoginSchema,
} from '@hybridshare/shared/schemas/auth.schema';
import { AuthProvider } from '@hybridshare/shared/types/user';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const input = RegisterSchema.parse(req.body);
      const user = await authService.register(input);
      res.status(201).json(apiResponse({ message: 'Registration successful. Please verify your email.', userId: user.id }));
    } catch (err) {
      const error = err as Error & { statusCode?: number; issues?: unknown[] };
      if (error.issues) {
        res.status(400).json(apiError(error.message));
        return;
      }
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const input = LoginSchema.parse(req.body);
      const result = await authService.login(input);

      if (result.requiresTwoFactor) {
        res.status(200).json(apiResponse({ requiresTwoFactor: true, userId: result.userId }));
        return;
      }

      res.status(200).json(apiResponse({ accessToken: result.accessToken, refreshToken: result.refreshToken, expiresIn: result.expiresIn }));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 401).json(apiError(error.message));
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = RefreshTokenSchema.parse(req.body);
      const tokens = await authService.refreshTokens(refreshToken);
      res.status(200).json(apiResponse(tokens));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 401).json(apiError(error.message));
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.split(' ')[1] ?? '';
      const { refreshToken } = req.body as { refreshToken?: string };

      await authService.logout(accessToken, refreshToken);
      res.status(200).json(apiResponse({ message: 'Logged out successfully' }));
    } catch (err) {
      res.status(500).json(apiError('Logout failed'));
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = VerifyEmailSchema.parse(req.body);
      await authService.verifyEmail(token);
      res.status(200).json(apiResponse({ message: 'Email verified successfully' }));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 400).json(apiError(error.message));
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = ForgotPasswordSchema.parse(req.body);
      await authService.forgotPassword(email);
      res.status(200).json(apiResponse({ message: 'Password reset email sent if the account exists' }));
    } catch {
      res.status(200).json(apiResponse({ message: 'Password reset email sent if the account exists' }));
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = ResetPasswordSchema.parse(req.body);
      await authService.resetPassword(token, password);
      res.status(200).json(apiResponse({ message: 'Password reset successfully' }));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 400).json(apiError(error.message));
    }
  }

  async setupTwoFactor(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await authService.setupTwoFactor(req.user!.id);
      res.status(200).json(apiResponse(result));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 500).json(apiError(error.message));
    }
  }

  async verifyTwoFactor(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { code } = TwoFactorVerifySchema.parse(req.body);
      const backupCodes = await authService.enableTwoFactor(req.user!.id, code);
      res.status(200).json(apiResponse({ message: '2FA enabled successfully', backupCodes }));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 400).json(apiError(error.message));
    }
  }

  async validateTwoFactor(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { code, userId } = req.body as { code: string; userId: string };
      if (!code || !userId) {
        res.status(400).json(apiError('Code and userId are required'));
        return;
      }
      const result = await authService.login({ email: '', password: '', totpCode: code });
      res.status(200).json(apiResponse(result));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 401).json(apiError(error.message));
    }
  }

  googleCallback(req: Request, res: Response): void {
    const user = req.user as { tokens?: { accessToken: string; refreshToken: string } } | undefined;
    if (!user?.tokens) {
      res.redirect(`${process.env.APP_URL}/auth/login?error=oauth_failed`);
      return;
    }
    const { accessToken, refreshToken } = user.tokens;
    res.redirect(`${process.env.APP_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  }

  microsoftCallback(req: Request, res: Response): void {
    this.googleCallback(req, res);
  }

  async ldapLogin(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = LdapLoginSchema.parse(req.body);
      logger.info('LDAP login attempt', { username });
      res.status(501).json(apiError('LDAP authentication requires server configuration'));
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      res.status(error.statusCode ?? 400).json(apiError(error.message));
    }
  }
}

export const authController = new AuthController();
