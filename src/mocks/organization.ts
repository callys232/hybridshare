export interface MockOrganization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  domain: string | null;
  plan: string;
  memberCount: number;
  createdAt: string;
}

export interface MockOrgMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
}

export interface MockApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface MockWebhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  failureCount: number;
  lastTriggeredAt: string | null;
  createdAt: string;
}

export const MOCK_ORG: MockOrganization = {
  id: 'org-1',
  name: 'HybridShare Academy',
  slug: 'hybridshare',
  logoUrl: null,
  domain: 'hybridshare.io',
  plan: 'ENTERPRISE',
  memberCount: 24,
  createdAt: new Date('2024-01-01').toISOString(),
};

export const MOCK_ORG_MEMBERS: MockOrgMember[] = [
  { id: 'om-1', userId: 'user-1', name: 'Alex Carter',  email: 'alex@hybridshare.io',  avatar: null, role: 'OWNER',  joinedAt: new Date('2024-01-01').toISOString() },
  { id: 'om-2', userId: 'user-2', name: 'Jane Smith',   email: 'jane@hybridshare.io',  avatar: null, role: 'ADMIN',  joinedAt: new Date('2024-02-01').toISOString() },
  { id: 'om-3', userId: 'user-3', name: 'Bob Johnson',  email: 'bob@hybridshare.io',   avatar: null, role: 'MEMBER', joinedAt: new Date('2024-03-01').toISOString() },
  { id: 'om-4', userId: 'user-4', name: 'Amara Okonkwo',email: 'amara@hybridshare.io', avatar: null, role: 'MEMBER', joinedAt: new Date('2024-04-01').toISOString() },
];

export const MOCK_API_KEYS: MockApiKey[] = [
  {
    id: 'key-1',
    name: 'Production API',
    prefix: 'hs_live_abc1',
    scopes: ['files:read', 'workspaces:read', 'analytics:read'],
    lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
    expiresAt: null,
    createdAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'key-2',
    name: 'Analytics Integration',
    prefix: 'hs_live_def2',
    scopes: ['analytics:read', 'shares:read'],
    lastUsedAt: new Date(Date.now() - 86400000).toISOString(),
    expiresAt: new Date('2025-01-01').toISOString(),
    createdAt: new Date('2024-03-01').toISOString(),
  },
];

export const MOCK_WEBHOOKS: MockWebhook[] = [
  {
    id: 'wh-1',
    url: 'https://hooks.zapier.com/hooks/catch/12345',
    events: ['file.uploaded', 'file.shared', 'workspace.created'],
    isActive: true,
    failureCount: 0,
    lastTriggeredAt: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date('2024-02-01').toISOString(),
  },
  {
    id: 'wh-2',
    url: 'https://api.slack.com/webhooks/T123/B456/xyz',
    events: ['file.uploaded', 'connector.error'],
    isActive: true,
    failureCount: 2,
    lastTriggeredAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date('2024-03-15').toISOString(),
  },
];
