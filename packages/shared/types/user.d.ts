export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    MANAGER = "MANAGER",
    MEMBER = "MEMBER",
    VIEWER = "VIEWER",
    GUEST = "GUEST"
}
export type PlanType = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'PAUSED' | 'EXPIRED';
export declare enum AuthProvider {
    LOCAL = "LOCAL",
    GOOGLE = "GOOGLE",
    MICROSOFT = "MICROSOFT",
    LDAP = "LDAP"
}
export interface User {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    role: UserRole;
    provider: AuthProvider;
    isEmailVerified: boolean;
    isTwoFactorEnabled: boolean;
    isActive: boolean;
    lastLoginAt: Date | null;
    storageUsed: number;
    storageQuota: number;
    bio: string | null;
    jobTitle: string | null;
    website: string | null;
    linkedinUrl: string | null;
    twitterHandle: string | null;
    timezone: string;
    language: string;
    planType: PlanType;
    subscriptionStatus: SubscriptionStatus | null;
    xpPoints: number;
    streakDays: number;
    longestStreak: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserPublic {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: UserRole;
}
export interface Session {
    id: string;
    userId: string;
    token: string;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: Date;
    createdAt: Date;
}
export interface TwoFactorSecret {
    id: string;
    userId: string;
    secret: string;
    isEnabled: boolean;
    backupCodes: string[];
    createdAt: Date;
}
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface LoginRequest {
    email: string;
    password: string;
    totpCode?: string;
}
export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}
export interface StorageQuota {
    id: string;
    userId: string | null;
    workspaceId: string | null;
    quotaBytes: number;
    usedBytes: number;
    updatedAt: Date;
}
//# sourceMappingURL=user.d.ts.map