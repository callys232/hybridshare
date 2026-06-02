export interface LoginPayload {
  email: string;
  password: string;
  totpCode?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface TwoFactorChallenge {
  requiresTwoFactor: true;
  userId: string;
}

export interface ProfileUpdatePayload {
  name?: string;
  bio?: string;
  jobTitle?: string;
  website?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  timezone?: string;
  language?: string;
}

export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'MICROSOFT' | 'LDAP';
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER' | 'GUEST';
export type PlanType = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
