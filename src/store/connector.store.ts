import { create } from 'zustand';
import { api, type ApiResponse } from '@/lib/api';
import type { Connector, NormalizedAsset } from '@/shared/connector';
import { isMockMode, getMockConnectors, MOCK_ASSETS } from '@/mocks';

interface ConnectorState {
  connectors: Connector[];
  activeConnectorId: string | null;
  assets: NormalizedAsset[];
  isLoading: boolean;
  isSyncing: Record<string, boolean>;
  error: string | null;

  fetchConnectors: () => Promise<void>;
  createConnector: (data: Partial<Connector>, credentials: Record<string, unknown>) => Promise<Connector>;
  updateConnector: (id: string, data: Partial<Connector>) => Promise<void>;
  deleteConnector: (id: string) => Promise<void>;
  testConnector: (id: string) => Promise<{ healthy: boolean; message: string }>;
  syncConnector: (id: string) => Promise<void>;
  fetchAssets: (connectorId: string, path?: string) => Promise<void>;
  setActiveConnector: (id: string | null) => void;
}

export const useConnectorStore = create<ConnectorState>((set, get) => ({
  connectors: [],
  activeConnectorId: null,
  assets: [],
  isLoading: false,
  isSyncing: {},
  error: null,

  fetchConnectors: async () => {
    set({ isLoading: true });
    if (isMockMode()) {
      set({ connectors: getMockConnectors() as Connector[], isLoading: false });
      return;
    }
    try {
      const response = await api.get<ApiResponse<Connector[]>>('/connectors');
      set({ connectors: response.data.data ?? [], isLoading: false });
    } catch {
      set({ connectors: getMockConnectors() as Connector[], isLoading: false });
    }
  },

  createConnector: async (data, credentials) => {
    const response = await api.post<ApiResponse<Connector>>('/connectors', { ...data, credentials });
    const connector = response.data.data!;
    set((state) => ({ connectors: [connector, ...state.connectors] }));
    return connector;
  },

  updateConnector: async (id, data) => {
    const response = await api.put<ApiResponse<Connector>>(`/connectors/${id}`, data);
    const updated = response.data.data!;
    set((state) => ({
      connectors: state.connectors.map((c) => (c.id === id ? { ...c, ...updated } : c)),
    }));
  },

  deleteConnector: async (id) => {
    await api.delete(`/connectors/${id}`);
    set((state) => ({ connectors: state.connectors.filter((c) => c.id !== id) }));
  },

  testConnector: async (id) => {
    const response = await api.post<ApiResponse<{ healthy: boolean; message: string }>>(`/connectors/${id}/test`);
    return response.data.data!;
  },

  syncConnector: async (id) => {
    set((state) => ({ isSyncing: { ...state.isSyncing, [id]: true } }));
    try {
      await api.post(`/connectors/${id}/sync`);
      set((state) => ({
        connectors: state.connectors.map((c) =>
          c.id === id ? { ...c, lastSyncAt: new Date() } : c
        ),
      }));
    } finally {
      set((state) => ({ isSyncing: { ...state.isSyncing, [id]: false } }));
    }
  },

  fetchAssets: async (connectorId, path) => {
    set({ isLoading: true });
    try {
      const params = path ? `?path=${encodeURIComponent(path)}` : '';
      const response = await api.get<ApiResponse<NormalizedAsset[]>>(`/assets?connectorId=${connectorId}${params}`);
      set({ assets: response.data.data ?? [], isLoading: false });
    } catch {
      const mocked = MOCK_ASSETS.filter((a) => a.connectorId === connectorId);
      set({ assets: mocked, isLoading: false });
    }
  },

  setActiveConnector: (id) => set({ activeConnectorId: id }),
}));
