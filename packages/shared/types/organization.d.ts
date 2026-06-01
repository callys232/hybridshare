export type PlanType = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';
export type OrgRole = 'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'LEARNER' | 'GUEST';
export interface Organization {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    logoUrl?: string;
    primaryColor: string;
    accentColor: string;
    plan: PlanType;
    isActive: boolean;
    maxMembers: number;
    maxStorage: number;
    maxCourses: number;
    allowCustomDomain: boolean;
    allowSSO: boolean;
    allowAPIAccess: boolean;
    allowWhiteLabel: boolean;
    trialEndsAt?: string;
    settings: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    memberCount?: number;
    courseCount?: number;
}
export interface OrgMember {
    id: string;
    organizationId: string;
    userId: string;
    role: OrgRole;
    joinedAt: string;
    invitedById?: string;
    isActive: boolean;
    user?: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
        lastLoginAt?: string;
    };
}
export interface SSOConfig {
    id: string;
    organizationId: string;
    provider: 'saml' | 'oidc' | 'ldap';
    entryPoint?: string;
    issuer?: string;
    cert?: string;
    clientId?: string;
    clientSecret?: string;
    discoveryUrl?: string;
    ldapUrl?: string;
    ldapBindDn?: string;
    ldapSearchBase?: string;
    ldapSearchFilter?: string;
    attributeMap: Record<string, string>;
    isEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface OrgWhiteLabel {
    id: string;
    organizationId: string;
    appName?: string;
    faviconUrl?: string;
    customCss?: string;
    customJs?: string;
    hideHybridBrand: boolean;
    footerText?: string;
    supportEmail?: string;
    privacyUrl?: string;
    termsUrl?: string;
}
export interface Plan {
    id: string;
    name: string;
    type: PlanType;
    description?: string;
    monthlyPrice: number;
    yearlyPrice: number;
    currency: string;
    maxMembers: number;
    maxStorage: number;
    maxCourses: number;
    maxStudents: number;
    features: PlanFeature[];
    isActive: boolean;
}
export interface PlanFeature {
    key: string;
    label: string;
    included: boolean;
    limit?: number;
}
export interface APIKey {
    id: string;
    userId: string;
    organizationId?: string;
    name: string;
    keyPrefix: string;
    scopes: string[];
    expiresAt?: string;
    lastUsedAt?: string;
    usageCount: number;
    isActive: boolean;
    ipWhitelist: string[];
    rateLimit: number;
    createdAt: string;
}
export interface Webhook {
    id: string;
    organizationId?: string;
    name: string;
    url: string;
    events: string[];
    isActive: boolean;
    failureCount: number;
    lastTriggeredAt?: string;
    createdAt: string;
    updatedAt: string;
}
export interface OrgStats {
    totalMembers: number;
    activeMembers: number;
    totalCourses: number;
    publishedCourses: number;
    totalEnrollments: number;
    activeEnrollments: number;
    completionRate: number;
    storageUsed: number;
    storageQuota: number;
    monthlyActiveUsers: number;
    revenueThisMonth: number;
    revenueTotal: number;
}
//# sourceMappingURL=organization.d.ts.map