export declare const organizationService: {
    createOrg(data: {
        name: string;
        slug: string;
        ownerId: string;
        domain?: string;
        logoUrl?: string;
        primaryColor?: string;
        plan?: string;
    }): Promise<any>;
    getOrg(orgIdOrSlug: string): Promise<any>;
    updateOrg(orgId: string, data: Partial<{
        name: string;
        domain: string;
        logoUrl: string;
        faviconUrl: string;
        description: string;
    }>): Promise<any>;
    listMembers(orgId: string, params?: {
        page?: number;
        limit?: number;
        role?: string;
    }): Promise<{
        items: any;
        meta: {
            total: any;
            page: number;
            limit: number;
        };
    }>;
    inviteMember(orgId: string, inviterId: string, email: string, role: "ADMIN" | "INSTRUCTOR" | "MEMBER"): Promise<any>;
    updateMemberRole(orgId: string, memberId: string, adminId: string, role: string): Promise<any>;
    removeMember(orgId: string, memberId: string, adminId: string): Promise<void>;
    setSSOConfig(orgId: string, data: {
        provider: "SAML" | "OIDC" | "LDAP";
        entityId?: string;
        ssoUrl?: string;
        certificate?: string;
        clientId?: string;
        clientSecret?: string;
        issuer?: string;
        ldapUrl?: string;
        ldapBindDn?: string;
        ldapBindPassword?: string;
        ldapUserBase?: string;
    }): Promise<any>;
    toggleSSO(orgId: string, enabled: boolean): Promise<any>;
    setWhiteLabel(orgId: string, data: {
        brandName?: string;
        primaryColor?: string;
        secondaryColor?: string;
        logoUrl?: string;
        faviconUrl?: string;
        customDomain?: string;
        emailFromName?: string;
        emailFromAddress?: string;
        footerText?: string;
        hideHybridShareBranding?: boolean;
    }): Promise<any>;
    createAPIKey(orgId: string, userId: string, data: {
        name: string;
        scopes: string[];
        expiresInDays?: number;
    }): Promise<any>;
    listAPIKeys(orgId: string): Promise<any>;
    revokeAPIKey(keyId: string, orgId: string): Promise<any>;
    createWebhook(orgId: string, userId: string, data: {
        url: string;
        events: string[];
        description?: string;
    }): Promise<any>;
    listWebhooks(orgId: string): Promise<any>;
    deleteWebhook(webhookId: string, orgId: string): Promise<any>;
    getOrgStats(orgId: string): Promise<{
        members: any;
        courses: any;
        enrollments: any;
    }>;
};
//# sourceMappingURL=organization.service.d.ts.map