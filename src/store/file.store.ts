import { create } from 'zustand';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import type { FileMetadata, UploadProgress } from '@/shared/file';
import { getMockFiles } from '@/mocks';

interface FileState {
  files: FileMetadata[];
  selectedFiles: string[];
  uploadQueue: UploadProgress[];
  viewMode: 'grid' | 'list';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  currentFolderId: string | null;
  currentWorkspaceId: string | null;
  isLoading: boolean;
  error: string | null;

  fetchFiles: (query?: Record<string, string>) => Promise<void>;
  uploadFile: (file: File, options?: Record<string, string>) => Promise<FileMetadata>;
  deleteFile: (fileId: string) => Promise<void>;
  restoreFile: (fileId: string) => Promise<void>;
  permanentDeleteFile: (fileId: string) => Promise<void>;
  toggleStar: (fileId: string) => Promise<void>;
  updateFile: (fileId: string, data: Partial<FileMetadata>) => Promise<void>;
  selectFile: (fileId: string, multi?: boolean) => void;
  clearSelection: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setFolder: (folderId: string | null) => void;
  setWorkspace: (workspaceId: string | null) => void;
  setSortBy: (field: string, order?: 'asc' | 'desc') => void;
  updateUploadProgress: (progress: UploadProgress) => void;
  clearError: () => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  selectedFiles: [],
  uploadQueue: [],
  viewMode: 'grid',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  currentFolderId: null,
  currentWorkspaceId: null,
  isLoading: false,
  error: null,

  fetchFiles: async (query = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams({
        ...query,
        ...(get().currentWorkspaceId ? { workspaceId: get().currentWorkspaceId! } : {}),
        ...(get().currentFolderId ? { folderId: get().currentFolderId! } : {}),
        sortBy: get().sortBy,
        sortOrder: get().sortOrder,
      });

      const response = await api.get<ApiResponse<FileMetadata[]>>(`/files?${params}`);
      set({ files: response.data.data ?? [], isLoading: false });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        set({ files: getMockFiles() as FileMetadata[], isLoading: false, error: null });
      } else {
        const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to load files';
        set({ files: [], isLoading: false, error: msg });
      }
    }
  },

  uploadFile: async (file, options = {}) => {
    const fileId = `upload-${Date.now()}`;
    const progress: UploadProgress = {
      fileId,
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    };

    set((state) => ({ uploadQueue: [...state.uploadQueue, progress] }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      Object.entries(options).forEach(([k, v]) => formData.append(k, v));

      const response = await api.post<ApiResponse<FileMetadata>>('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round(((e.loaded ?? 0) / (e.total ?? 1)) * 100);
          set((state) => ({
            uploadQueue: state.uploadQueue.map((q) =>
              q.fileId === fileId ? { ...q, progress: pct } : q
            ),
          }));
        },
      });

      const uploaded = response.data.data!;
      set((state) => ({
        files: [uploaded, ...state.files],
        uploadQueue: state.uploadQueue.map((q) =>
          q.fileId === fileId ? { ...q, status: 'complete', progress: 100 } : q
        ),
      }));

      setTimeout(() => {
        set((state) => ({
          uploadQueue: state.uploadQueue.filter((q) => q.fileId !== fileId),
        }));
      }, 3000);

      return uploaded;
    } catch (err) {
      set((state) => ({
        uploadQueue: state.uploadQueue.map((q) =>
          q.fileId === fileId ? { ...q, status: 'error', error: getErrorMessage(err) } : q
        ),
      }));
      throw err;
    }
  },

  deleteFile: async (fileId) => {
    await api.delete(`/files/${fileId}`);
    set((state) => ({ files: state.files.filter((f) => f.id !== fileId) }));
  },

  restoreFile: async (fileId) => {
    await api.post(`/files/${fileId}/restore`);
    set((state) => ({
      files: state.files.map((f) =>
        f.id === fileId ? { ...f, status: 'ACTIVE' as never, deletedAt: null } : f
      ),
    }));
  },

  permanentDeleteFile: async (fileId) => {
    await api.delete(`/files/${fileId}/permanent`);
    set((state) => ({ files: state.files.filter((f) => f.id !== fileId) }));
  },

  toggleStar: async (fileId) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === fileId ? { ...f, isStarred: !f.isStarred } : f
      ),
    }));
    try {
      await api.post(`/files/${fileId}/star`);
    } catch {
      set((state) => ({
        files: state.files.map((f) =>
          f.id === fileId ? { ...f, isStarred: !f.isStarred } : f
        ),
      }));
    }
  },

  updateFile: async (fileId, data) => {
    const response = await api.put<ApiResponse<FileMetadata>>(`/files/${fileId}`, data);
    const updated = response.data.data!;
    set((state) => ({
      files: state.files.map((f) => (f.id === fileId ? { ...f, ...updated } : f)),
    }));
  },

  selectFile: (fileId, multi = false) => {
    set((state) => {
      if (multi) {
        const isSelected = state.selectedFiles.includes(fileId);
        return {
          selectedFiles: isSelected
            ? state.selectedFiles.filter((id) => id !== fileId)
            : [...state.selectedFiles, fileId],
        };
      }
      return { selectedFiles: [fileId] };
    });
  },

  clearSelection: () => set({ selectedFiles: [] }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setFolder: (folderId) => {
    set({ currentFolderId: folderId });
    get().fetchFiles();
  },

  setWorkspace: (workspaceId) => {
    set({ currentWorkspaceId: workspaceId, currentFolderId: null });
    get().fetchFiles();
  },

  setSortBy: (field, order = 'desc') => {
    set({ sortBy: field, sortOrder: order });
    get().fetchFiles();
  },

  updateUploadProgress: (progress) => {
    set((state) => ({
      uploadQueue: state.uploadQueue.map((q) =>
        q.fileId === progress.fileId ? progress : q
      ),
    }));
  },

  clearError: () => set({ error: null }),
}));
