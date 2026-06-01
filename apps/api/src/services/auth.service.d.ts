import { AuthProvider, AuthTokens } from '@hybridshare/shared/types/user';
import type { RegisterInput, LoginInput } from '@hybridshare/shared/schemas/auth.schema';
export declare class AuthService {
    register(input: RegisterInput): Promise<any>;
    login(input: LoginInput): Promise<AuthTokens & {
        requiresTwoFactor?: boolean;
        userId?: string;
    }>;
    refreshTokens(refreshToken: string): Promise<AuthTokens>;
    logout(accessToken: string, refreshToken?: string): Promise<void>;
    verifyEmail(token: string): Promise<void>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    setupTwoFactor(userId: string): Promise<{
        secret: string;
        qrCode: string;
    }>;
    enableTwoFactor(userId: string, code: string): Promise<string[]>;
    handleOAuthUser(profile: {
        email: string;
        name: string;
        provider: AuthProvider;
        providerId: string;
        avatar?: string;
    }): Promise<AuthTokens>;
    private issueTokens;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map