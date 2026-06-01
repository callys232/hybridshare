"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const paginate_1 = require("../utils/paginate");
const logger_1 = require("../utils/logger");
const auth_schema_1 = require("@hybridshare/shared/schemas/auth.schema");
class AuthController {
    async register(req, res) {
        try {
            const input = auth_schema_1.RegisterSchema.parse(req.body);
            const user = await auth_service_1.authService.register(input);
            res.status(201).json((0, paginate_1.apiResponse)({ message: 'Registration successful. Please verify your email.', userId: user.id }));
        }
        catch (err) {
            const error = err;
            if (error.issues) {
                res.status(400).json((0, paginate_1.apiError)(error.message));
                return;
            }
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async login(req, res) {
        try {
            const input = auth_schema_1.LoginSchema.parse(req.body);
            const result = await auth_service_1.authService.login(input);
            if (result.requiresTwoFactor) {
                res.status(200).json((0, paginate_1.apiResponse)({ requiresTwoFactor: true, userId: result.userId }));
                return;
            }
            res.status(200).json((0, paginate_1.apiResponse)({ accessToken: result.accessToken, refreshToken: result.refreshToken, expiresIn: result.expiresIn }));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 401).json((0, paginate_1.apiError)(error.message));
        }
    }
    async refresh(req, res) {
        try {
            const { refreshToken } = auth_schema_1.RefreshTokenSchema.parse(req.body);
            const tokens = await auth_service_1.authService.refreshTokens(refreshToken);
            res.status(200).json((0, paginate_1.apiResponse)(tokens));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 401).json((0, paginate_1.apiError)(error.message));
        }
    }
    async logout(req, res) {
        try {
            const authHeader = req.headers.authorization;
            const accessToken = authHeader?.split(' ')[1] ?? '';
            const { refreshToken } = req.body;
            await auth_service_1.authService.logout(accessToken, refreshToken);
            res.status(200).json((0, paginate_1.apiResponse)({ message: 'Logged out successfully' }));
        }
        catch (err) {
            res.status(500).json((0, paginate_1.apiError)('Logout failed'));
        }
    }
    async verifyEmail(req, res) {
        try {
            const { token } = auth_schema_1.VerifyEmailSchema.parse(req.body);
            await auth_service_1.authService.verifyEmail(token);
            res.status(200).json((0, paginate_1.apiResponse)({ message: 'Email verified successfully' }));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 400).json((0, paginate_1.apiError)(error.message));
        }
    }
    async forgotPassword(req, res) {
        try {
            const { email } = auth_schema_1.ForgotPasswordSchema.parse(req.body);
            await auth_service_1.authService.forgotPassword(email);
            res.status(200).json((0, paginate_1.apiResponse)({ message: 'Password reset email sent if the account exists' }));
        }
        catch {
            res.status(200).json((0, paginate_1.apiResponse)({ message: 'Password reset email sent if the account exists' }));
        }
    }
    async resetPassword(req, res) {
        try {
            const { token, password } = auth_schema_1.ResetPasswordSchema.parse(req.body);
            await auth_service_1.authService.resetPassword(token, password);
            res.status(200).json((0, paginate_1.apiResponse)({ message: 'Password reset successfully' }));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 400).json((0, paginate_1.apiError)(error.message));
        }
    }
    async setupTwoFactor(req, res) {
        try {
            const result = await auth_service_1.authService.setupTwoFactor(req.user.id);
            res.status(200).json((0, paginate_1.apiResponse)(result));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 500).json((0, paginate_1.apiError)(error.message));
        }
    }
    async verifyTwoFactor(req, res) {
        try {
            const { code } = auth_schema_1.TwoFactorVerifySchema.parse(req.body);
            const backupCodes = await auth_service_1.authService.enableTwoFactor(req.user.id, code);
            res.status(200).json((0, paginate_1.apiResponse)({ message: '2FA enabled successfully', backupCodes }));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 400).json((0, paginate_1.apiError)(error.message));
        }
    }
    async validateTwoFactor(req, res) {
        try {
            const { code, userId } = req.body;
            if (!code || !userId) {
                res.status(400).json((0, paginate_1.apiError)('Code and userId are required'));
                return;
            }
            const result = await auth_service_1.authService.login({ email: '', password: '', totpCode: code });
            res.status(200).json((0, paginate_1.apiResponse)(result));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 401).json((0, paginate_1.apiError)(error.message));
        }
    }
    googleCallback(req, res) {
        const user = req.user;
        if (!user?.tokens) {
            res.redirect(`${process.env.APP_URL}/auth/login?error=oauth_failed`);
            return;
        }
        const { accessToken, refreshToken } = user.tokens;
        res.redirect(`${process.env.APP_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
    }
    microsoftCallback(req, res) {
        this.googleCallback(req, res);
    }
    async ldapLogin(req, res) {
        try {
            const { username, password } = auth_schema_1.LdapLoginSchema.parse(req.body);
            logger_1.logger.info('LDAP login attempt', { username });
            res.status(501).json((0, paginate_1.apiError)('LDAP authentication requires server configuration'));
        }
        catch (err) {
            const error = err;
            res.status(error.statusCode ?? 400).json((0, paginate_1.apiError)(error.message));
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map