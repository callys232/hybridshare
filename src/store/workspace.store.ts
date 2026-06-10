import { create } from 'zustand';
import { api, type ApiResponse } from '@/lib/api';
import type { Workspace } from '@/shared/workspace';
import { isMockMode, getMockWorkspaces } from '@/mocks';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;

  fetchWorkspaces: () => Promise<void>;
  fetchWorkspace: (id: string) => Promise<void>;
  createWorkspace: (data: Partial<Workspace>) => Promise<Workspace>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    if (isMockMode()) {
      set({ workspaces: getMockWorkspaces() as unknown as Workspace[], isLoading: false });
      return;
    }
    try {
      const response = await api.get<ApiResponse<Workspace[]>>('/workspaces');
      set({ workspaces: response.data.data ?? [], isLoading: false });
    } catch {
      set({ workspaces: getMockWorkspaces() as unknown as Workspace[], isLoading: false });
    }
  },

  fetchWorkspace: async (id) => {
    set({ isLoading: true });
    if (isMockMode()) {
      const mocked = getMockWorkspaces().find((w) => w.id === id) ?? getMockWorkspaces()[0];
      set({ currentWorkspace: mocked as unknown as Workspace, isLoading: false });
      return;
    }
    try {
      const response = await api.get<ApiResponse<Workspace>>(`/workspaces/${id}`);
      set({ currentWorkspace: response.data.data, isLoading: false });
    } catch {
      const mocked = getMockWorkspaces().find((w) => w.id === id) ?? getMockWorkspaces()[0];
      set({ currentWorkspace: mocked as unknown as Workspace, isLoading: false });
    }
  },

  createWorkspace: async (data) => {
    if (isMockMode()) {
      const workspace = {
        id: `ws-${Date.now()}`, name: data.name ?? 'New Workspace',
        description: data.description ?? null, type: 'TEAM' as never,
        iconUrl: null, color: '#c12129', isPublic: false,
        storageQuota: 10737418240, storageUsed: 0, ownerId: 'user-1',
        createdAt: new Date(), updatedAt: new Date(), ...data,
      } as Workspace;
      set((state) => ({ workspaces: [workspace, ...state.workspaces] }));
      return workspace;
    }
    const response = await api.post<ApiResponse<Workspace>>('/workspaces', data);
    const workspace = response.data.data!;
    set((state) => ({ workspaces: [workspace, ...state.workspaces] }));
    return workspace;
  },

  updateWorkspace: async (id, data) => {
    if (isMockMode()) {
      set((state) => ({
        workspaces: state.workspaces.map((w) => (w.id === id ? { ...w, ...data } : w)),
        currentWorkspace: state.currentWorkspace?.id === id ? { ...state.currentWorkspace, ...data } : state.currentWorkspace,
      }));
      return;
    }
    const response = await api.put<ApiResponse<Workspace>>(`/workspaces/${id}`, data);
    const updated = response.data.data!;
    set((state) => ({
      workspaces: state.workspaces.map((w) => (w.id === id ? { ...w, ...updated } : w)),
      currentWorkspace: state.currentWorkspace?.id === id ? { ...state.currentWorkspace, ...updated } : state.currentWorkspace,
    }));
  },

  deleteWorkspace: async (id) => {
    if (isMockMode()) {
      set((state) => ({
        workspaces: state.workspaces.filter((w) => w.id !== id),
        currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
      }));
      return;
    }
    await api.delete(`/workspaces/${id}`);
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
    }));
  },

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
}));
