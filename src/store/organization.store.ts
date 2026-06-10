import { create } from 'zustand';
import { api, type ApiResponse } from '@/lib/api';
import { isMockMode, MOCK_ORG, MOCK_ORG_MEMBERS, MOCK_API_KEYS, MOCK_WEBHOOKS } from '@/mocks';
import type { MockOrganization, MockOrgMember, MockApiKey, MockWebhook } from '@/mocks';

type Organization    = MockOrganization;
type OrgMember       = MockOrgMember;
type ApiKey          = MockApiKey;
type Webhook         = MockWebhook;

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
    if (isMockMode()) {
      set({ organization: MOCK_ORG, isLoading: false });
      return;
    }
    try {
      const res = await api.get<ApiResponse<Organization>>('/organizations/my');
      set({ organization: res.data.data!, isLoading: false });
    } catch {
      set({ organization: MOCK_ORG, isLoading: false });
    }
  },

  fetchMembers: async () => {
    if (isMockMode()) {
      set({ members: MOCK_ORG_MEMBERS });
      return;
    }
    try {
      const org = get().organization;
      if (!org) return;
      const res = await api.get<ApiResponse<OrgMember[]>>(`/organizations/${org.id}/members`);
      set({ members: res.data.data! });
    } catch {
      set({ members: MOCK_ORG_MEMBERS });
    }
  },

  fetchSSO: async () => {
    if (isMockMode()) {
      set({ ssoConfig: null });
      return;
    }
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
    if (isMockMode()) {
      set({ whiteLabel: null });
      return;
    }
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
    if (isMockMode()) {
      set({ apiKeys: MOCK_API_KEYS });
      return;
    }
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
    if (isMockMode()) {
      set({ webhooks: MOCK_WEBHOOKS });
      return;
    }
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
    if (isMockMode()) return;
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
    if (isMockMode()) {
      set({ organization: { ...MOCK_ORG, ...data } });
      return;
    }
    const res = await api.post<ApiResponse<Organization>>('/organizations', data);
    set({ organization: res.data.data! });
  },

  updateOrganization: async (data) => {
    if (isMockMode()) {
      set((s) => ({ organization: s.organization ? { ...s.organization, ...data } : null }));
      return;
    }
    const org = get().organization;
    if (!org) return;
    const res = await api.put<ApiResponse<Organization>>(`/organizations/${org.id}`, data);
    set({ organization: res.data.data! });
  },

  inviteMember: async (email, role) => {
    if (isMockMode()) {
      const newMember: OrgMember = {
        id: `om-${Date.now()}`, userId: `user-${Date.now()}`,
        name: email.split('@')[0], email, avatar: null,
        role: role as OrgMember['role'], joinedAt: new Date().toISOString(),
      };
      set((s) => ({ members: [...s.members, newMember] }));
      return;
    }
    const org = get().organization;
    if (!org) return;
    const res = await api.post<ApiResponse<OrgMember>>(`/organizations/${org.id}/members`, { email, role });
    set((s) => ({ members: [...s.members, res.data.data!] }));
  },

  removeMember: async (memberId) => {
    if (isMockMode()) {
      set((s) => ({ members: s.members.filter((m) => m.id !== memberId) }));
      return;
    }
    const org = get().organization;
    if (!org) return;
    await api.delete(`/organizations/${org.id}/members/${memberId}`);
    set((s) => ({ members: s.members.filter((m) => m.id !== memberId) }));
  },

  updateMemberRole: async (memberId, role) => {
    if (isMockMode()) {
      set((s) => ({ members: s.members.map((m) => m.id === memberId ? { ...m, role: role as OrgMember['role'] } : m) }));
      return;
    }
    const org = get().organization;
    if (!org) return;
    const res = await api.put<ApiResponse<OrgMember>>(`/organizations/${org.id}/members/${memberId}`, { role });
    set((s) => ({ members: s.members.map((m) => (m.id === memberId ? res.data.data! : m)) }));
  },

  upsertSSO: async (data) => {
    if (isMockMode()) {
      set((s) => ({ ssoConfig: s.ssoConfig ? { ...s.ssoConfig, ...data } : null }));
      return;
    }
    const org = get().organization;
    if (!org) return;
    const res = await api.put<ApiResponse<SSOConfig>>(`/organizations/${org.id}/sso`, data);
    set({ ssoConfig: res.data.data! });
  },

  upsertWhiteLabel: async (data) => {
    if (isMockMode()) {
      set((s) => ({ whiteLabel: s.whiteLabel ? { ...s.whiteLabel, ...data } : null }));
      return;
    }
    const org = get().organization;
    if (!org) return;
    const res = await api.put<ApiResponse<WhiteLabel>>(`/organizations/${org.id}/branding`, data);
    set({ whiteLabel: res.data.data! });
  },

  createApiKey: async (name, scopes, expiresAt) => {
    if (isMockMode()) {
      const key: ApiKey = {
        id: `key-${Date.now()}`, name, prefix: `hs_mock_${Math.random().toString(36).slice(2, 8)}`,
        scopes, lastUsedAt: null, expiresAt: expiresAt ?? null, createdAt: new Date().toISOString(),
      };
      set((s) => ({ apiKeys: [...s.apiKeys, key] }));
      return { rawKey: `hs_mock_${Math.random().toString(36).slice(2, 30)}` };
    }
    const org = get().organization;
    if (!org) throw new Error('No organization');
    const res = await api.post<ApiResponse<ApiKey & { rawKey: string }>>(`/organizations/${org.id}/api-keys`, { name, scopes, expiresAt });
    const { rawKey, ...key } = res.data.data!;
    set((s) => ({ apiKeys: [...s.apiKeys, key] }));
    return { rawKey };
  },

  revokeApiKey: async (keyId) => {
    if (isMockMode()) {
      set((s) => ({ apiKeys: s.apiKeys.filter((k) => k.id !== keyId) }));
      return;
    }
    const org = get().organization;
    if (!org) return;
    await api.delete(`/organizations/${org.id}/api-keys/${keyId}`);
    set((s) => ({ apiKeys: s.apiKeys.filter((k) => k.id !== keyId) }));
  },

  createWebhook: async (data) => {
    if (isMockMode()) {
      const wh: Webhook = {
        id: `wh-${Date.now()}`, url: data.url, events: data.events,
        isActive: true, failureCount: 0, lastTriggeredAt: null, createdAt: new Date().toISOString(),
      };
      set((s) => ({ webhooks: [...s.webhooks, wh] }));
      return;
    }
    const org = get().organization;
    if (!org) return;
    const res = await api.post<ApiResponse<Webhook>>(`/organizations/${org.id}/webhooks`, data);
    set((s) => ({ webhooks: [...s.webhooks, res.data.data!] }));
  },

  updateWebhook: async (webhookId, data) => {
    if (isMockMode()) {
      set((s) => ({ webhooks: s.webhooks.map((w) => w.id === webhookId ? { ...w, ...data } : w) }));
      return;
    }
    const org = get().organization;
    if (!org) return;
    const res = await api.put<ApiResponse<Webhook>>(`/organizations/${org.id}/webhooks/${webhookId}`, data);
    set((s) => ({ webhooks: s.webhooks.map((w) => (w.id === webhookId ? res.data.data! : w)) }));
  },

  deleteWebhook: async (webhookId) => {
    if (isMockMode()) {
      set((s) => ({ webhooks: s.webhooks.filter((w) => w.id !== webhookId) }));
      return;
    }
    const org = get().organization;
    if (!org) return;
    await api.delete(`/organizations/${org.id}/webhooks/${webhookId}`);
    set((s) => ({ webhooks: s.webhooks.filter((w) => w.id !== webhookId) }));
  },

  clearError: () => set({ error: null }),
}));
