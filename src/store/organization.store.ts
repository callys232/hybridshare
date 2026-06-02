import { create } from 'zustand';
import { api, type ApiResponse } from '@/lib/api';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  domain: string | null;
  plan: string;
  memberCount: number;
  createdAt: string;
}

interface OrgMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
}

interface SSOConfig {
  id: string;
  provider: 'SAML' | 'OIDC' | 'LDAP';
  isEnabled: boolean;
  metadataUrl: string | null;
  clientId: string | null;
  domain: string | null;
}

interface WhiteLabel {
  id: string;
  primaryColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  customDomain: string | null;
  emailFromName: string | null;
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  failureCount: number;
  lastTriggeredAt: string | null;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  eventType: string;
  statusCode: number;
  success: boolean;
  durationMs: number;
  attemptNumber: number;
  createdAt: string;
}

interface OrganizationState {
  organization: Organization | null;
  members: OrgMember[];
  ssoConfig: SSOConfig | null;
  whiteLabel: WhiteLabel | null;
  apiKeys: ApiKey[];
  webhooks: Webhook[];
  webhookDeliveries: Record<string, WebhookDelivery[]>;
  isLoading: boolean;
  error: string | null;

  fetchOrganization: () => Promise<void>;
  fetchMembers: () => Promise<void>;
  fetchSSO: () => Promise<void>;
  fetchWhiteLabel: () => Promise<void>;
  fetchApiKeys: () => Promise<void>;
  fetchWebhooks: () => Promise<void>;
  fetchWebhookDeliveries: (webhookId: string) => Promise<void>;

  createOrganization: (data: { name: string; slug: string }) => Promise<void>;
  updateOrganization: (data: Partial<Organization>) => Promise<void>;
  inviteMember: (email: string, role: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: string) => Promise<void>;
  upsertSSO: (data: Partial<SSOConfig>) => Promise<void>;
  upsertWhiteLabel: (data: Partial<WhiteLabel>) => Promise<void>;
  createApiKey: (name: string, scopes: string[], expiresAt?: string) => Promise<{ rawKey: string }>;
  revokeApiKey: (keyId: string) => Promise<void>;
  createWebhook: (data: { url: string; events: string[] }) => Promise<void>;
  updateWebhook: (webhookId: string, data: Partial<Webhook>) => Promise<void>;
  deleteWebhook: (webhookId: string) => Promise<void>;
  clearError: () => void;
}

const MOCK_ORG: Organization = {
  id: 'org-1',
  name: 'HybridShare Academy',
  slug: 'hybridshare',
  logoUrl: null,
  domain: 'hybridshare.io',
  plan: 'ENTERPRISE',
  memberCount: 24,
  createdAt: new Date('2024-01-01').toISOString(),
};

const MOCK_MEMBERS: OrgMember[] = [
  { id: 'om-1', userId: 'user-1', name: 'Alex Carter', email: 'alex@hybridshare.io', avatar: null, role: 'OWNER', joinedAt: new Date('2024-01-01').toISOString() },
  { id: 'om-2', userId: 'user-2', name: 'Jane Smith', email: 'jane@hybridshare.io', avatar: null, role: 'ADMIN', joinedAt: new Date('2024-02-01').toISOString() },
  { id: 'om-3', userId: 'user-3', name: 'Bob Johnson', email: 'bob@hybridshare.io', avatar: null, role: 'MEMBER', joinedAt: new Date('2024-03-01').toISOString() },
];

const MOCK_API_KEYS: ApiKey[] = [
  { id: 'key-1', name: 'Production API', prefix: 'hs_live_abc1', scopes: ['files:read', 'workspaces:read', 'analytics:read'], lastUsedAt: new Date(Date.now() - 3600000).toISOString(), expiresAt: null, createdAt: new Date('2024-01-15').toISOString() },
  { id: 'key-2', name: 'Analytics Integration', prefix: 'hs_live_def2', scopes: ['analytics:read', 'shares:read'], lastUsedAt: new Date(Date.now() - 86400000).toISOString(), expiresAt: new Date('2025-01-01').toISOString(), createdAt: new Date('2024-03-01').toISOString() },
];

const MOCK_WEBHOOKS: Webhook[] = [
  { id: 'wh-1', url: 'https://hooks.zapier.com/hooks/catch/12345', events: ['file.uploaded', 'file.shared', 'workspace.created'], isActive: true, failureCount: 0, lastTriggeredAt: new Date(Date.now() - 7200000).toISOString(), createdAt: new Date('2024-02-01').toISOString() },
  { id: 'wh-2', url: 'https://api.slack.com/webhooks/T123/B456/xyz', events: ['file.uploaded', 'connector.error'], isActive: true, failureCount: 2, lastTriggeredAt: new Date(Date.now() - 3600000).toISOString(), createdAt: new Date('2024-03-15').toISOString() },
];

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  organization: null,
  members: [],
  ssoConfig: null,
  whiteLabel: null,
  apiKeys: [],
  webhooks: [],
  webhookDeliveries: {},
  isLoading: false,
  error: null,

  fetchOrganization: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<ApiResponse<Organization>>('/organizations/my');
      set({ organization: res.data.data!, isLoading: false });
    } catch {
      set({ organization: MOCK_ORG, isLoading: false });
    }
  },

  fetchMembers: async () => {
    try {
      const org = get().organization;
      if (!org) return;
      const res = await api.get<ApiResponse<OrgMember[]>>(`/organizations/${org.id}/members`);
      set({ members: res.data.data! });
    } catch {
      set({ members: MOCK_MEMBERS });
    }
  },

  fetchSSO: async () => {
    try {
      const org = get().organization;
      if (!org) return;
      const res = await api.get<ApiResponse<SSOConfig>>(`/organizations/${org.id}/sso`);
      set({ ssoConfig: res.data.data! });
    } catch {
      set({ ssoConfig: null });
    }
  },

  fetchWhiteLabel: async () => {
    try {
      const org = get().organization;
      if (!org) return;
      const res = await api.get<ApiResponse<WhiteLabel>>(`/organizations/${org.id}/branding`);
      set({ whiteLabel: res.data.data! });
    } catch {
      set({ whiteLabel: null });
    }
  },

  fetchApiKeys: async () => {
    try {
      const org = get().organization;
      if (!org) return;
      const res = await api.get<ApiResponse<ApiKey[]>>(`/organizations/${org.id}/api-keys`);
      set({ apiKeys: res.data.data! });
    } catch {
      set({ apiKeys: MOCK_API_KEYS });
    }
  },

  fetchWebhooks: async () => {
    try {
      const org = get().organization;
      if (!org) return;
      const res = await api.get<ApiResponse<Webhook[]>>(`/organizations/${org.id}/webhooks`);
      set({ webhooks: res.data.data! });
    } catch {
      set({ webhooks: MOCK_WEBHOOKS });
    }
  },

  fetchWebhookDeliveries: async (webhookId) => {
    try {
      const org = get().organization;
      if (!org) return;
      const res = await api.get<ApiResponse<WebhookDelivery[]>>(`/organizations/${org.id}/webhooks/${webhookId}/deliveries`);
      set((s) => ({ webhookDeliveries: { ...s.webhookDeliveries, [webhookId]: res.data.data! } }));
    } catch {
      // ignore
    }
  },

  createOrganization: async (data) => {
    const res = await api.post<ApiResponse<Organization>>('/organizations', data);
    set({ organization: res.data.data! });
  },

  updateOrganization: async (data) => {
    const org = get().organization;
    if (!org) return;
    const res = await api.put<ApiResponse<Organization>>(`/organizations/${org.id}`, data);
    set({ organization: res.data.data! });
  },

  inviteMember: async (email, role) => {
    const org = get().organization;
    if (!org) return;
    const res = await api.post<ApiResponse<OrgMember>>(`/organizations/${org.id}/members`, { email, role });
    set((s) => ({ members: [...s.members, res.data.data!] }));
  },

  removeMember: async (memberId) => {
    const org = get().organization;
    if (!org) return;
    await api.delete(`/organizations/${org.id}/members/${memberId}`);
    set((s) => ({ members: s.members.filter((m) => m.id !== memberId) }));
  },

  updateMemberRole: async (memberId, role) => {
    const org = get().organization;
    if (!org) return;
    const res = await api.put<ApiResponse<OrgMember>>(`/organizations/${org.id}/members/${memberId}`, { role });
    set((s) => ({ members: s.members.map((m) => (m.id === memberId ? res.data.data! : m)) }));
  },

  upsertSSO: async (data) => {
    const org = get().organization;
    if (!org) return;
    const res = await api.put<ApiResponse<SSOConfig>>(`/organizations/${org.id}/sso`, data);
    set({ ssoConfig: res.data.data! });
  },

  upsertWhiteLabel: async (data) => {
    const org = get().organization;
    if (!org) return;
    const res = await api.put<ApiResponse<WhiteLabel>>(`/organizations/${org.id}/branding`, data);
    set({ whiteLabel: res.data.data! });
  },

  createApiKey: async (name, scopes, expiresAt) => {
    const org = get().organization;
    if (!org) throw new Error('No organization');
    const res = await api.post<ApiResponse<ApiKey & { rawKey: string }>>(`/organizations/${org.id}/api-keys`, { name, scopes, expiresAt });
    const { rawKey, ...key } = res.data.data!;
    set((s) => ({ apiKeys: [...s.apiKeys, key] }));
    return { rawKey };
  },

  revokeApiKey: async (keyId) => {
    const org = get().organization;
    if (!org) return;
    await api.delete(`/organizations/${org.id}/api-keys/${keyId}`);
    set((s) => ({ apiKeys: s.apiKeys.filter((k) => k.id !== keyId) }));
  },

  createWebhook: async (data) => {
    const org = get().organization;
    if (!org) return;
    const res = await api.post<ApiResponse<Webhook>>(`/organizations/${org.id}/webhooks`, data);
    set((s) => ({ webhooks: [...s.webhooks, res.data.data!] }));
  },

  updateWebhook: async (webhookId, data) => {
    const org = get().organization;
    if (!org) return;
    const res = await api.put<ApiResponse<Webhook>>(`/organizations/${org.id}/webhooks/${webhookId}`, data);
    set((s) => ({ webhooks: s.webhooks.map((w) => (w.id === webhookId ? res.data.data! : w)) }));
  },

  deleteWebhook: async (webhookId) => {
    const org = get().organization;
    if (!org) return;
    await api.delete(`/organizations/${org.id}/webhooks/${webhookId}`);
    set((s) => ({ webhooks: s.webhooks.filter((w) => w.id !== webhookId) }));
  },

  clearError: () => set({ error: null }),
}));
