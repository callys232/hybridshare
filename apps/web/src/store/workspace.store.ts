import { create } from 'zustand';
import { api, type ApiResponse } from '@/lib/api';
import type { Workspace } from '@hybridshare/shared/types/workspace';
import { getMockWorkspaces } from '@/mocks';

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

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiResponse<Workspace[]>>('/workspaces');
      set({ workspaces: response.data.data ?? [], isLoading: false });
    } catch {
      const mocked = getMockWorkspaces() as unknown as Workspace[];
      set({ workspaces: mocked, isLoading: false });
    }
  },

  fetchWorkspace: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get<ApiResponse<Workspace>>(`/workspaces/${id}`);
      set({ currentWorkspace: response.data.data, isLoading: false });
    } catch {
      const mocked = getMockWorkspaces().find((w) => w.id === id) ?? getMockWorkspaces()[0];
      set({ currentWorkspace: mocked as unknown as Workspace, isLoading: false });
    }
  },

  createWorkspace: async (data) => {
    const response = await api.post<ApiResponse<Workspace>>('/workspaces', data);
    const workspace = response.data.data!;
    set((state) => ({ workspaces: [workspace, ...state.workspaces] }));
    return workspace;
  },

  updateWorkspace: async (id, data) => {
    const response = await api.put<ApiResponse<Workspace>>(`/workspaces/${id}`, data);
    const updated = response.data.data!;
    set((state) => ({
      workspaces: state.workspaces.map((w) => (w.id === id ? { ...w, ...updated } : w)),
      currentWorkspace: state.currentWorkspace?.id === id ? { ...state.currentWorkspace, ...updated } : state.currentWorkspace,
    }));
  },

  deleteWorkspace: async (id) => {
    await api.delete(`/workspaces/${id}`);
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
    }));
  },

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
}));
